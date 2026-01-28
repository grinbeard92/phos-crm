# Epic: Object Navigation Hierarchy & Categories

## Overview

Add UI-only parent/child relationships and named categories for objects in the sidebar navigation. Admins configure the layout in a new **Settings > Layout Model** page. The hierarchy is purely presentational — no impact on data model, database relationships, GraphQL schema, or permissions.

**Feature Flag**: `IS_NAVIGATION_HIERARCHY_ENABLED`

## Problem

The sidebar currently shows all objects in a flat list under a single "Workspace" heading with hardcoded ordering. As the number of custom objects grows (MileageLogs, ProjectMilestones, ProjectDeliverables, Expenses, Invoices, etc.), the list becomes unwieldy and lacks organizational context.

Users cannot tell at a glance which objects are conceptually related (e.g., Project → Milestones → Assignees) or which business area they belong to (Accounting, Projects, Sales).

## Core Concepts

### 1. Navigation Category

A named section heading in the sidebar. Replaces the single hardcoded "Workspace" heading with admin-defined groups.

Examples: "Projects", "Accounting", "Sales", "Workspace"

Each workspace gets a **default category** (initially "Workspace") that acts as the fallback — objects without an explicit category assignment appear here. The default category can be renamed but not deleted.

### 2. UI Parent/Child

A declaration that Object A is the "UI parent of" Object B. Rules:

- **One parent max**: Each object can have at most one UI parent (or none = top-level)
- **Many children**: An object can be UI parent of many objects
- **Recursive**: Children can themselves have children (e.g., Project → Milestone → Assignee)
- **Display only**: No database foreign keys, no data relationships, no GraphQL changes
- **Expandable**: Parent objects render with a chevron; expanding shows children indented

### 3. Settings > Layout Model

A dedicated admin page for managing navigation layout, separate from Data Model. This separation:
- Keeps "what data exists" (Data Model) distinct from "how it's presented" (Layout Model)
- Provides a home for future layout features (dashboard arrangements, record page sections, etc.)
- Makes it clear these changes are cosmetic, not structural

### 4. Sidebar Behavior

- Child objects appear **nested under their parent only** (not in the top-level list)
- Users can still pin any object (parent or child) to Favorites for quick access
- Objects with no layout config fall into the default category as top-level items
- When feature flag is off, sidebar renders exactly as it does today

## Data Model

Two new entities in the `core` schema. Pure metadata — no workspace data tables affected.

### `NavigationCategory`

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `id` | uuid | generated | Primary key |
| `workspaceId` | uuid | required | FK to workspace |
| `name` | string | required | Display name ("Projects", "Sales") |
| `icon` | string \| null | null | Optional icon identifier |
| `position` | number | required | Sort order in sidebar |
| `isDefault` | boolean | false | Fallback category (one per workspace) |
| `createdAt` | timestamp | now | |
| `updatedAt` | timestamp | now | |

**Constraints**:
- Unique `(workspaceId, name)` — no duplicate category names
- Exactly one `isDefault = true` per workspace
- `isDefault` category cannot be deleted (can be renamed)

### `ObjectLayoutConfig`

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `id` | uuid | generated | Primary key |
| `workspaceId` | uuid | required | FK to workspace |
| `objectMetadataId` | uuid | required | FK to objectMetadata |
| `categoryId` | uuid \| null | null | FK to NavigationCategory. Null = default category |
| `uiParentObjectMetadataId` | uuid \| null | null | FK to objectMetadata. Null = top-level |
| `positionInCategory` | number | 0 | Sort order among top-level siblings in category |
| `positionUnderParent` | number | 0 | Sort order among siblings under same parent |
| `createdAt` | timestamp | now | |
| `updatedAt` | timestamp | now | |

**Constraints**:
- Unique `(workspaceId, objectMetadataId)` — one config per object per workspace
- `uiParentObjectMetadataId` must reference an object in the same workspace
- No circular parent chains (validated at write time via ancestor traversal)
- An object with `uiParentObjectMetadataId` set inherits its parent's category (ignores own `categoryId`)

### Migration

- Additive only — new tables, no modifications to existing tables
- Seed default category per workspace on first access (lazy creation)
- No ObjectLayoutConfig rows needed initially — absence = "default category, top-level, ordered by existing logic"

## Sidebar Rendering

### Current Flow

```
NavigationDrawerSectionForObjectMetadataItems
  → "Workspace" heading
  → Flat list: ORDERED_FIRST objects → custom objects → ORDERED_LAST objects
```

### New Flow

```
NavigationDrawerCategorizedSections
  → For each NavigationCategory (ordered by position):
    → Render category heading with icon
    → For each top-level object in this category (no uiParent, ordered by positionInCategory):
      → Render NavigationDrawerItemForObjectMetadataItem
      → If object has children:
        → Render with expand chevron
        → On expand: render children indented (ordered by positionUnderParent)
          → Recursive: children may have their own children
  → Objects with no ObjectLayoutConfig → default category, top-level, original sort order
```

### Expand/Collapse State

- Stored in Recoil per user session (not persisted to backend)
- Default: collapsed
- Parent objects show child count badge when collapsed
- Expanding reveals children with subtle indentation (12-16px)

### Fallback Behavior

When `IS_NAVIGATION_HIERARCHY_ENABLED` is off:
- `NavigationDrawerSectionForObjectMetadataItems` renders as today
- No categories, no hierarchy, no layout config reads
- Zero overhead

When enabled but no layout config exists:
- Single "Workspace" default category
- All objects top-level
- Visually identical to current state until admin configures layout

## Settings > Layout Model

### Page: `/settings/layout-model`

Admin-only page with two sections:

#### Section 1: Categories

- List of categories with drag handles for reordering
- Each row: icon picker + editable name + object count badge
- "Add category" button
- Default category marked with badge (renameable, not deletable)
- Delete non-default category: moves contained objects to default category

#### Section 2: Object Hierarchy

Visual tree editor:

```
┌─────────────────────────────────────────────┐
│ Projects                              [Edit] │
│  ├── Project                    [top-level]  │
│  │   ├── ProjectMilestone         [child]    │
│  │   │   └── MilestoneAssignee    [child]    │
│  │   └── ProjectDeliverable       [child]    │
│  └── Task                       [top-level]  │
│                                              │
│ Accounting                            [Edit] │
│  ├── Expense                    [top-level]  │
│  ├── Invoice                    [top-level]  │
│  └── MileageLog                 [top-level]  │
│                                              │
│ Workspace (default)                   [Edit] │
│  ├── Person                     [top-level]  │
│  ├── Company                    [top-level]  │
│  ├── Opportunity                [top-level]  │
│  └── ...                                     │
└─────────────────────────────────────────────┘
```

Interactions:
- **Drag object** between categories → updates `categoryId`
- **Drag object** under another object → sets `uiParentObjectMetadataId`
- **Drag child out** to category level → clears `uiParentObjectMetadataId`
- **Reorder** within category/parent → updates position fields
- Circular parent detection: if dragging A under B would create a cycle, show error toast and reject

#### Data Persistence

- Changes save on drop (optimistic update with rollback on error)
- GraphQL mutations for NavigationCategory CRUD and ObjectLayoutConfig upsert
- Batch position updates when reordering (single mutation for all affected positions)

## API

### GraphQL Mutations

```graphql
# Categories
createNavigationCategory(input: { name: String!, icon: String, position: Int }): NavigationCategory
updateNavigationCategory(id: ID!, input: { name: String, icon: String, position: Int }): NavigationCategory
deleteNavigationCategory(id: ID!): Boolean
reorderNavigationCategories(ids: [ID!]!): [NavigationCategory!]!

# Object Layout
upsertObjectLayoutConfig(input: {
  objectMetadataId: ID!
  categoryId: ID
  uiParentObjectMetadataId: ID
  positionInCategory: Int
  positionUnderParent: Int
}): ObjectLayoutConfig

batchUpdateObjectLayoutPositions(updates: [{
  objectMetadataId: ID!
  positionInCategory: Int
  positionUnderParent: Int
}]): [ObjectLayoutConfig!]!

removeObjectLayoutConfig(objectMetadataId: ID!): Boolean
```

### GraphQL Queries

```graphql
# Fetched once on app load, cached in Recoil
navigationCategories: [NavigationCategory!]!
objectLayoutConfigs: [ObjectLayoutConfig!]!
```

## Implementation Phases

### Phase 1: Backend — Entities & API

**Files**:
- `NavigationCategoryEntity` — new entity in core schema
- `ObjectLayoutConfigEntity` — new entity in core schema
- NestJS module + resolver + service for each
- TypeORM migration — new tables
- Circular parent validation utility
- Feature flag: `IS_NAVIGATION_HIERARCHY_ENABLED`

**Stories**:
1. Create `NavigationCategoryEntity` with TypeORM definition
2. Create `ObjectLayoutConfigEntity` with TypeORM definition
3. Generate migration (additive — new tables only)
4. Implement NavigationCategory CRUD resolver + service
5. Implement ObjectLayoutConfig upsert/batch resolver + service
6. Add circular parent chain validation
7. Add feature flag `IS_NAVIGATION_HIERARCHY_ENABLED`

### Phase 2: Frontend — Data Layer

**Files**:
- Recoil atoms for categories and layout configs
- GraphQL queries + mutations (generated types)
- `useNavigationHierarchy()` hook — builds tree from flat data
- `useObjectLayoutConfig()` hook — CRUD operations

**Stories**:
1. Define GraphQL operations and generate types
2. Create Recoil atoms: `navigationCategoriesState`, `objectLayoutConfigsState`
3. Create `useNavigationHierarchy()` — fetches data, builds category→object tree
4. Create `useObjectLayoutConfig()` — mutation hooks for admin operations
5. Bootstrap data fetch on app load (alongside existing metadata fetch)

### Phase 3: Sidebar Rendering

**Files**:
- `NavigationDrawerCategorizedSections.tsx` (NEW) — replaces flat section
- `NavigationDrawerObjectTreeItem.tsx` (NEW) — recursive expandable item
- `NavigationDrawerSectionForObjectMetadataItems.tsx` (MODIFY) — feature flag gate
- `MainNavigationDrawerScrollableItems.tsx` (MODIFY) — route to new component

**Stories**:
1. Build `NavigationDrawerObjectTreeItem` — expandable parent with indented children
2. Build `NavigationDrawerCategorizedSections` — renders categories with tree items
3. Add expand/collapse Recoil state (per-session, not persisted)
4. Feature flag gate in `MainNavigationDrawerScrollableItems`
5. Fallback: no config = single "Workspace" category with original ordering

### Phase 4: Settings > Layout Model

**Files**:
- `/settings/layout-model` page route (NEW)
- `SettingsLayoutModelPage.tsx` (NEW)
- `SettingsLayoutModelCategoryList.tsx` (NEW) — draggable category management
- `SettingsLayoutModelObjectTree.tsx` (NEW) — visual tree editor with drag-and-drop
- Navigation sidebar settings section (MODIFY) — add Layout Model link

**Stories**:
1. Create page route and layout
2. Build category list with drag-to-reorder, add/rename/delete
3. Build object hierarchy tree editor with drag-and-drop
4. Wire drag actions to GraphQL mutations (optimistic updates)
5. Add circular parent detection with user-facing error toast
6. Add Settings nav item for Layout Model (admin-only visibility)

### Phase 5: Polish

**Stories**:
1. Seed default "Workspace" category on first feature flag enable
2. Child count badge on collapsed parents
3. Smooth expand/collapse animations
4. Keyboard navigation for tree items
5. Mobile-responsive tree editor in Settings

## Risk Assessment

| Risk | Severity | Mitigation |
|------|----------|------------|
| Drag-and-drop complexity in tree editor | Medium | Use proven library (dnd-kit or react-beautiful-dnd, match existing Twenty patterns). Start with simple move-to-category/parent dropdowns as fallback. |
| Circular parent chains | Low | Server-side validation traverses ancestor chain before saving. Max depth limit (e.g., 5 levels) prevents deep nesting. |
| Performance with many objects | Low | Object count per workspace is typically <100. Tree computation is trivial. |
| Migration conflicts with upstream Twenty | Low | New tables only, no modifications to existing tables or entities. |
| Feature flag cleanup | Low | Single flag gates sidebar rendering path. Clean boundary. |
| Interaction with Navigation Menu Items / Favorites | Low | These systems are orthogonal. Favorites pin specific objects/views regardless of hierarchy. Navigation hierarchy controls the "Workspace" section only. |

## Relationship to Existing Systems

| System | Relationship |
|--------|-------------|
| **Data Model** | Completely independent. Layout Model is display-only metadata. |
| **Navigation Menu Items** | Orthogonal. Menu items are user-specific favorites/shortcuts. Hierarchy is workspace-wide admin config. |
| **Favorites** | Users can favorite any object regardless of hierarchy position. |
| **Object Metadata** | Read-only consumer. Layout config references objectMetadataId but doesn't modify object metadata. |
| **Permissions** | Categories and hierarchy don't affect data access. If a user can't see an object via permissions, it won't appear in the sidebar regardless of layout config. |

## Future Extensions (Out of POC Scope)

- **Per-user category overrides** — Users reorder or hide categories for personal preference
- **Category icons** — Visual distinction between categories
- **Record page sections** — Layout Model could define how fields are grouped on record detail pages
- **Dashboard layout** — Layout Model could define default dashboard arrangements
- **Conditional categories** — Show/hide categories based on user role

## Success Criteria

1. Admin can create/rename/reorder/delete navigation categories in Settings > Layout Model
2. Admin can assign objects to categories and set UI parent/child relationships
3. Sidebar renders objects grouped by category with expandable parent/child tree
4. Child objects appear nested under parents, not in the top-level list
5. Users can favorite/pin any object regardless of hierarchy position
6. Feature flag off = sidebar renders identically to current behavior
7. No changes to data model, GraphQL schema, or database relationships
8. No circular parent chains possible (server-validated)
9. Layout configuration is workspace-wide (all users see the same hierarchy)
