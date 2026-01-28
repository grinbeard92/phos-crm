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

## Debug Results (2026-01-28)

### Confirmed Root Cause: Missing Feature Flag

Debug logging with `[ReactivityDebugging]` prefix was added to `workspace-event-emitter.service.ts`. Workflow trigger produced:

```
[ReactivityDebugging] publishToEventStreams called — event: mileageLog.created, workspaceId: 6fc09637-5c6b-4931-b8ec-9dedb26dcef4, eventCount: 1
[ReactivityDebugging] activeStreamIds: 0
[ReactivityDebugging] No active streams — events will be dropped
```

**Root cause**: `IS_SSE_DB_EVENTS_ENABLED` feature flag was **not set** for the Phos workspace.

Database query confirmed only 3 flags existed:
- `IS_CALCULATED_FIELD_ENABLED` (true)
- `IS_EMAIL_COMPOSER_ENABLED` (true)
- `IS_TIMELINE_ACTIVITY_MIGRATED` (true)

The flag is seeded by Twenty's dev-seeder (`seed-feature-flags.util.ts:80`) but only for the dev seed workspace. The Phos phos-seeder did not include it.

### Fix Applied

1. **Immediate**: Inserted `IS_SSE_DB_EVENTS_ENABLED = true` into `core.featureFlag` for workspace `6fc09637-5c6b-4931-b8ec-9dedb26dcef4`
2. **Permanent**: Added `FeatureFlagKey.IS_SSE_DB_EVENTS_ENABLED` to phos-seeder's `requiredFeatureFlags` array

### Why This Caused the Issue

Without the flag:
1. `SSEProvider.tsx` checks `useIsFeatureEnabled('IS_SSE_DB_EVENTS_ENABLED')`
2. Returns `false` → SSEProvider renders null context
3. `SSEEventStreamEffect` never subscribes to GraphQL `OnEventSubscription`
4. `onEventSubscription` resolver never called → `EventStreamService.createEventStream()` never called
5. Redis `workspace:${workspaceId}:activeStreams` set remains empty
6. `publishToEventStreams()` finds 0 active streams → all events dropped
7. Table views never receive SSE updates → no reactivity

### Verification

After enabling the flag, a **full page reload** is required for the frontend to pick up the new flag value and establish the SSE subscription. Then workflow-triggered mutations should produce:
```
[ReactivityDebugging] activeStreamIds: 1  (or more, one per browser tab)
[ReactivityDebugging] Processing stream ... — queries: N
[ReactivityDebugging] Publishing N matched events to stream ...
```

### Status: RESOLVED

Not a Twenty platform bug — a missing feature flag for our workspace. The phos-seeder now includes it for future deployments.

## Files Involved

| File | Role |
|------|------|
| `packages/twenty-server/src/engine/workspace-event-emitter/workspace-event-emitter.service.ts` | Event delivery service — debug logging confirmed 0 active streams |
| `packages/twenty-front/src/modules/sse-db-event/components/SSEProvider.tsx` | Gates SSE subscription on `IS_SSE_DB_EVENTS_ENABLED` flag |
| `packages/twenty-front/src/modules/sse-db-event/hooks/useSubscribeToSseEventStream.ts` | Establishes GraphQL SSE subscription |
| `packages/twenty-server/src/engine/workspace-event-emitter/workspace-event-emitter.resolver.ts` | `onEventSubscription` — registers stream in Redis |
| `packages/twenty-server/src/engine/subscriptions/event-stream.service.ts` | Redis-based active stream registry |
| `packages/twenty-server/src/engine/workspace-manager/phos-seeder/services/phos-seeder.service.ts` | Added IS_SSE_DB_EVENTS_ENABLED to requiredFeatureFlags |
