# Fix: Frontend Reactivity for Workflow-Driven Record Mutations

## Problem

When workflows execute record mutations (create, update, delete), the data persists correctly in PostgreSQL but the frontend table views do not update reactively. Users must manually refresh the page to see changes made by workflows.

This affects all workflow-triggered record operations across the entire platform.

## Root Cause

Twenty's SSE event delivery has two paths in `WorkspaceEventEmitterService.publish()`:

1. **Legacy channel** (`onDbEvent`) — Publishes to `SubscriptionChannel.DATABASE_EVENT_CHANNEL` unconditionally for every event. Used by `ListenRecordUpdatesEffect` for individual record detail views.

2. **Event streams** (`publishToEventStreams`) — Delivers events to per-subscriber SSE streams with RLS permission filtering. Used by `SSEEventStreamEffect` → `useSubscribeToSseEventStream` → browser events → `RecordTableVirtualizedDataChangedEffect` for table view updates.

The table virtualization system depends on **path 2** (event streams). The blocking code is in:

**File**: `packages/twenty-server/src/engine/workspace-event-emitter/workspace-event-emitter.service.ts`, lines 133-136

```typescript
private async processStreamEvents(...): Promise<void> {
  const { userWorkspaceId } = streamData.authContext;

  if (!isDefined(userWorkspaceId)) {
    return; // ← ALL workflow events silently dropped
  }

  const roleId = permissionsContext.userWorkspaceRoleMap[userWorkspaceId];

  if (!isDefined(roleId)) {
    return; // ← Secondary blocker
  }
  // ... RLS filtering, event matching, publishing to Redis pub/sub
}
```

Workflows execute with `buildSystemAuthContext(workspaceId)` which sets `userWorkspaceId: undefined`. When events from workflow mutations reach `processStreamEvents`, they fail the `isDefined(userWorkspaceId)` check at line 135 and are silently dropped. Events never reach Redis pub/sub, the frontend SSE subscription receives nothing, and tables don't refresh.

**File**: `packages/twenty-server/src/engine/twenty-orm/utils/build-system-auth-context.util.ts`

```typescript
export const buildSystemAuthContext = (workspaceId: string): WorkspaceAuthContext => {
  return {
    user: null,
    workspace: { id: workspaceId },
    workspaceMemberId: undefined,
    userWorkspaceId: undefined,  // ← No user identity
    apiKey: null,
  };
};
```

## Why UI-Driven Mutations Work

When a user performs a mutation through the UI:
1. The GraphQL request carries auth context with a real `userWorkspaceId`
2. Events flow through both paths
3. `processStreamEvents` finds the roleId, applies RLS filtering, and publishes to Redis
4. Frontend SSE receives the event and dispatches browser events
5. `RecordTableVirtualizedDataChangedEffect` picks up the browser event and resets table virtualization

## Proposed Fix

### Approach: Broadcast Workflow Events to All Active Streams

When `processStreamEvents` encounters an event batch with no `userWorkspaceId` (system/workflow context), instead of dropping it, broadcast to all active stream subscribers in the workspace — but still apply each subscriber's own RLS permissions for filtering.

### File to Modify

**`packages/twenty-server/src/engine/workspace-event-emitter/workspace-event-emitter.service.ts`**

#### Change 1: `processStreamEvents` — Handle system context events

Replace the early return at line 135 with logic that resolves the subscriber's own permissions. The `streamData.authContext` represents the *subscriber* (the logged-in user who opened the SSE connection), not the *actor* who triggered the event. The current code conflates these:

- `streamData.authContext.userWorkspaceId` is the **subscriber's** identity
- The event batch's auth context (from the workflow) has no user identity

The check at line 133-136 reads the **subscriber's** `userWorkspaceId` from the stream data, which should always be defined for legitimate SSE connections (users must be logged in to subscribe). If it's somehow undefined, the stream is invalid and should be cleaned up rather than silently skipping.

**Wait** — re-reading the code more carefully:

```typescript
const { userWorkspaceId } = streamData.authContext;
```

This gets the `userWorkspaceId` from the **stream's** auth context (the subscriber), NOT from the event/workflow auth context. If the subscriber is a logged-in user, this should always be defined.

This means the early return would only trigger if the SSE stream itself was established without a user (which shouldn't happen in normal operation since `onEventSubscription` requires auth).

Let me re-examine: the issue may not be in `processStreamEvents` but earlier in `publishToEventStreams` or in how the event batch is constructed from workflow context.

### Revised Investigation Needed

Before implementing, verify:

1. **Is `streamData.authContext.userWorkspaceId` actually undefined?** Add logging in `processStreamEvents` to confirm. The stream auth context comes from when the user subscribed (not from the workflow), so it should have a valid `userWorkspaceId`.

2. **Is the event batch `workspaceId` correct?** Workflows use `buildSystemAuthContext(workspaceId)` — verify the workspace ID matches the one used by active streams.

3. **Is `publishToEventStreams` even being called?** The `EntityEventsToDbListener` calls `WorkspaceEventEmitterService.publish()`. Verify workflow mutations go through this listener.

4. **Are there active streams?** Check `eventStreamService.getActiveStreamIds(workspaceId)` returns non-empty for the workspace when the issue occurs.

### Debug Steps

Add temporary logging to these locations:

```typescript
// workspace-event-emitter.service.ts, line 66
console.log('[SSE-DEBUG] publishToEventStreams called for:', workspaceEventBatch.name);

// workspace-event-emitter.service.ts, line 74-78
console.log('[SSE-DEBUG] activeStreamIds:', activeStreamIds.length);

// workspace-event-emitter.service.ts, line 133-136
console.log('[SSE-DEBUG] processStreamEvents - streamData.authContext.userWorkspaceId:', userWorkspaceId);

// workspace-event-emitter.service.ts, line 139-142
console.log('[SSE-DEBUG] roleId for userWorkspaceId:', roleId);
```

Then trigger a workflow that updates a record and check server logs.

### Implementation (After Debug Confirms Root Cause)

**If the stream's `userWorkspaceId` IS defined** (subscriber is authenticated) but events still don't arrive — the issue is elsewhere (event batch construction, workspace ID mismatch, or the listener not catching workflow events).

**If the stream's `userWorkspaceId` IS undefined** (unexpected) — investigate why SSE subscriptions are being created without auth context.

**If `publishToEventStreams` is never called** — the issue is in `EntityEventsToDbListener` not receiving workflow mutation events, which would point to the workflow entity manager not emitting `DatabaseBatchEvent`.

**If `activeStreamIds` is empty** — the SSE feature flag (`IS_SSE_DB_EVENTS_ENABLED`) may be disabled for the workspace, or the frontend SSE client isn't establishing connections.

## Risk Assessment

- **Low risk**: Adding debug logging is non-destructive
- **Medium risk**: Modifying `processStreamEvents` to broadcast system-context events requires careful RLS handling to avoid leaking data to unauthorized subscribers
- **Consideration**: This is a Twenty platform bug that affects all installations, not just ours. Any fix should be upstreamable.

## Files Involved

| File | Role |
|------|------|
| `packages/twenty-server/src/engine/workspace-event-emitter/workspace-event-emitter.service.ts` | Event delivery service — contains the blocking check |
| `packages/twenty-server/src/engine/twenty-orm/utils/build-system-auth-context.util.ts` | System auth context builder — no `userWorkspaceId` |
| `packages/twenty-server/src/engine/api/graphql/workspace-query-runner/listeners/entity-events-to-db.listener.ts` | Catches all database events, calls `publish()` |
| `packages/twenty-server/src/engine/subscriptions/event-stream.service.ts` | Manages active SSE stream state in cache |
| `packages/twenty-server/src/engine/subscriptions/subscription.service.ts` | Redis pub/sub for SSE delivery |
| `packages/twenty-front/src/modules/sse-db-event/hooks/useSubscribeToSseEventStream.ts` | Frontend SSE subscription |
| `packages/twenty-front/src/modules/object-record/record-table/virtualization/components/RecordTableVirtualizedDataChangedEffect.tsx` | Table refresh on browser events |

## Next Step

Add debug logging, trigger a workflow, and confirm exactly where events are dropped before writing the fix.
