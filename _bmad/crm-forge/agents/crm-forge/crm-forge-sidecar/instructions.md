# CRM-Forge Operational Instructions

Startup protocols, operational guidelines, and domain boundaries for CRM-Forge.

## Startup Protocol

1. Load memories.md for session context
2. Load this instructions file for operational guidelines
3. Load knowledge/patterns.md for Twenty architecture patterns
4. Always print condensed epic status table from memories.md (Epic | Name | Progress | Status — one line per epic)
5. Greet user and surface relevant context from past sessions

## Epic Tracking (MANDATORY)

**Epic index**: `_bmad-output/implementation-artifacts/epics/epic-index.md`
**Epic specs**: `_bmad-output/implementation-artifacts/epics/epic-NNN-*.md`

After every git commit tagged with `[epic-NNN]`:
1. Update the progress % and status in `epic-index.md`
2. Include the update in the same commit or an immediate follow-up commit
3. Use the 0-100% scale defined in memories.md

## Operational Guidelines

### Code Quality Standards

- **Functional components only** (no class components)
- **Named exports only** (no default exports)
- **Types over interfaces** (except when extending third-party)
- **String literals over enums** (except GraphQL enums)
- **No 'any' type allowed**
- **Event handlers preferred over useEffect** for state updates

### Twenty Architecture Principles

1. **Nx Workspace Structure**: Respect monorepo boundaries
2. **NestJS Modules**: Follow dependency injection patterns
3. **TypeORM**: Proper entity relationships and migrations
4. **GraphQL**: Code-first approach with proper resolvers
5. **React**: Recoil for state, Emotion for styling, functional components
6. **Testing**: Unit tests with Jest, integration tests, E2E with Playwright

### Production Readiness Checklist

- [ ] Error handling implemented
- [ ] Data validation in place
- [ ] Database migrations with rollback strategy
- [ ] Tests written (unit, integration)
- [ ] GraphQL schema backward compatible
- [ ] Code follows Twenty standards
- [ ] Documentation updated

### Domain Boundaries

**File Access:**
- Sidecar files: ONLY read/write within `{project-root}/_bmad/_memory/twenty-crm-builder-sidecar/`
- Project files: Full access to Twenty CRM codebase
- No restrictions on reading/writing project code

**Operational Scope:**
- Primary: Twenty CRM development and customization
- Secondary: Architecture guidance and best practices
- Out of scope: Non-Twenty CRM projects (unless user explicitly requests)

## Communication Style

- Be concise and technical
- Explain complexity simply
- Skip formalities, get to work
- Share trade secrets and gotchas
- Reference past implementations naturally
- Use earthier craftsman language, not corporate speak

## Memory Management

### What to Remember
- Feature implementations and their patterns
- Architecture decisions and rationale
- Configuration choices
- Integration approaches
- Gotchas and edge cases
- User preferences

### What to Save to memories.md
- After each significant implementation
- When discovering new patterns
- When making architecture decisions
- After solving complex problems

### What to Save to knowledge/patterns.md
- Reusable architectural patterns
- Best practices for Twenty development
- Common gotchas and solutions
- Integration templates

## Phos Feature Flag Checklist (MANDATORY)

When adding a **new** Phos feature flag, you MUST update all three locations:

1. **Backend enum**: `packages/twenty-server/src/engine/core-modules/feature-flag/enums/feature-flag-key.enum.ts`
2. **Phos-seeder** `requiredFeatureFlags` array: `packages/twenty-server/src/engine/workspace-manager/phos-seeder/services/phos-seeder.service.ts`
3. **Frontend constant**: `packages/twenty-front/src/modules/settings/phos/constants/PhosFeatureFlags.ts` — add the key, label, and description

The **Phos Settings** page (`Settings > Other > Phos Settings`) auto-renders all flags listed in the frontend constant. No additional wiring is needed — just add the entry to `PHOS_FEATURE_FLAGS` and it appears in the UI with a toggle.

Also follow the existing Feature Flag Checklist from CLAUDE.md:
4. Add to `workspace-entity-manager.spec.ts` test mock
5. Run `npx nx typecheck twenty-front && npx nx typecheck twenty-server` to verify

### CRITICAL: Phos Settings Toggle State Management

**SettingsPhosContent.tsx** uses an optimistic update pattern for toggling flags.
The `updateLocalFeatureFlag` function MUST handle flags that don't yet exist in
`currentWorkspace.featureFlags` (because the seeder hasn't run or the flag is new).

**Rule**: When modifying `updateLocalFeatureFlag`, always check whether the flag
exists in the array first. If it doesn't exist, **append** a new entry instead
of relying on `.map()` alone (which is a no-op for missing keys).

**Bug pattern to avoid** (broken twice already):
```typescript
// BAD — .map() is a no-op if flag doesn't exist in array
featureFlags.map(flag => flag.key === key ? { ...flag, value } : flag)

// GOOD — check existence, append if missing
const exists = flags.some(f => f.key === key);
exists ? flags.map(...) : [...flags, { key, value, id: key }]
```

### CRITICAL: NestJS TypeORM Repository Injection

When injecting TypeORM repositories in NestJS services, **NEVER** pass a named
datasource (`'core'`) to `@InjectRepository` or `TypeOrmModule.forFeature`.
The Twenty core datasource is registered as the **default** (unnamed) datasource.

```typescript
// BAD — 'core' is not a registered named datasource
@InjectRepository(KeyValuePairEntity, 'core')
TypeOrmModule.forFeature([KeyValuePairEntity], 'core')

// GOOD — use default datasource (matches Twenty's TypeOrmModule.forRoot())
@InjectRepository(KeyValuePairEntity)
TypeOrmModule.forFeature([KeyValuePairEntity])
```
