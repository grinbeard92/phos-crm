# Story 1.1: Create Project Custom Object

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **business owner**,
I want **a Project custom object in the CRM**,
so that **I can track consulting projects with budget, status, and relationships to customers and team members**.

## Acceptance Criteria

1. **Object Creation**
   - [ ] Project object created with nameSingular: "project", namePlural: "projects"
   - [ ] Object labels: "Project" (singular), "Projects" (plural)
   - [ ] Icon set to "IconTarget" or similar project-related icon
   - [ ] Object is custom (isCustom: true) and active

2. **Core Fields Implemented**
   - [ ] name: TEXT (required, auto-created)
   - [ ] description: RICH_TEXT_V2 (nullable)
   - [ ] status: SELECT ['Planning', 'Active', 'On Hold', 'Completed', 'Cancelled']
   - [ ] priority: SELECT ['Low', 'Medium', 'High', 'Critical']
   - [ ] startDate: DATE_TIME (nullable)
   - [ ] endDate: DATE_TIME (nullable)
   - [ ] budget: CURRENCY (nullable)
   - [ ] actualCost: CURRENCY (nullable, will be computed from expenses later)
   - [ ] progressPercentage: NUMBER (0-100, nullable)
   - [ ] projectType: SELECT ['Consulting', 'Implementation', 'Support', 'Training', 'Other']

3. **Relations Configured**
   - [ ] company: RELATION → Company (MANY_TO_ONE) - required customer link
   - [ ] projectManager: RELATION → WorkspaceMember (MANY_TO_ONE) - nullable
   - [ ] teamMembers: RELATION → WorkspaceMember (MANY_TO_MANY) - optional team assignment

4. **Automatic Features Working**
   - [ ] Default system fields present: id, createdAt, updatedAt, deletedAt, createdBy, updatedBy
   - [ ] Default table view created: "All Projects"
   - [ ] Object appears in navigation menu
   - [ ] Can create/read/update/delete projects via UI
   - [ ] Can create/read/update/delete projects via GraphQL API

5. **GraphQL API Validated**
   - [ ] Query: `projects` returns list of projects
   - [ ] Query: `project(id: UUID)` returns single project
   - [ ] Mutation: `createProject` creates new project
   - [ ] Mutation: `updateProject` updates existing project
   - [ ] Mutation: `deleteProject` soft-deletes project
   - [ ] Relations are queryable (company, projectManager, teamMembers)

## Tasks / Subtasks

- [ ] Task 1: Create Project object metadata (AC: #1, #2, #4)
  - [ ] 1.1: Use GraphQL mutation `createOneObject` with proper input
  - [ ] 1.2: Verify object appears in workspace metadata
  - [ ] 1.3: Verify default view "All Projects" is created
  - [ ] 1.4: Verify object appears in navigation

- [ ] Task 2: Create core scalar fields (AC: #2)
  - [ ] 2.1: Create description field (RICH_TEXT_V2)
  - [ ] 2.2: Create status field (SELECT with 5 options)
  - [ ] 2.3: Create priority field (SELECT with 4 options)
  - [ ] 2.4: Create startDate field (DATE_TIME)
  - [ ] 2.5: Create endDate field (DATE_TIME)
  - [ ] 2.6: Create budget field (CURRENCY)
  - [ ] 2.7: Create actualCost field (CURRENCY)
  - [ ] 2.8: Create progressPercentage field (NUMBER, 0-100 range)
  - [ ] 2.9: Create projectType field (SELECT with 5 options)

- [ ] Task 3: Create relationship fields (AC: #3)
  - [ ] 3.1: Create company relation (MANY_TO_ONE to Company)
  - [ ] 3.2: Create projectManager relation (MANY_TO_ONE to WorkspaceMember)
  - [ ] 3.3: Create teamMembers relation (MANY_TO_MANY to WorkspaceMember)
  - [ ] 3.4: Verify reverse relations created on target objects

- [ ] Task 4: Test GraphQL API operations (AC: #5)
  - [ ] 4.1: Test `projects` query with filters
  - [ ] 4.2: Test `project(id)` query with relations
  - [ ] 4.3: Test `createProject` mutation
  - [ ] 4.4: Test `updateProject` mutation
  - [ ] 4.5: Test `deleteProject` mutation (soft delete)
  - [ ] 4.6: Verify relations are queryable and navigable

- [ ] Task 5: Test UI CRUD operations (AC: #4)
  - [ ] 5.1: Create a project via UI
  - [ ] 5.2: Edit project fields via UI
  - [ ] 5.3: Delete project via UI
  - [ ] 5.4: View project list in table view
  - [ ] 5.5: Navigate to project detail page

## Dev Notes

### Twenty Custom Object Architecture

**Metadata-Driven System**: Twenty uses a runtime metadata system where objects and fields are defined in database tables (ObjectMetadataEntity, FieldMetadataEntity) rather than code. This enables dynamic schema changes without deployments.

**Key Implementation Files**:
- Object creation: `/packages/twenty-server/src/engine/metadata-modules/object-metadata/object-metadata.service.ts`
- Field creation: `/packages/twenty-server/src/engine/metadata-modules/field-metadata/field-metadata.service.ts`
- GraphQL generation: `/packages/twenty-server/src/engine/api/graphql/workspace-schema-builder/`

**GraphQL Mutations Required**:

1. **Create Object**:
```graphql
mutation CreateProjectObject {
  createOneObject(input: {
    object: {
      nameSingular: "project"
      namePlural: "projects"
      labelSingular: "Project"
      labelPlural: "Projects"
      icon: "IconTarget"
      description: "Customer projects with budget and timeline tracking"
    }
  }) {
    id
    nameSingular
    namePlural
  }
}
```

2. **Create Field** (example for status):
```graphql
mutation CreateProjectStatusField($objectId: UUID!) {
  createOneField(input: {
    field: {
      name: "status"
      label: "Status"
      type: SELECT
      objectMetadataId: $objectId
      description: "Current project status"
      defaultValue: "'Planning'"
      options: [
        { label: "Planning", value: "Planning", color: "blue" }
        { label: "Active", value: "Active", color: "green" }
        { label: "On Hold", value: "On Hold", color: "yellow" }
        { label: "Completed", value: "Completed", color: "purple" }
        { label: "Cancelled", value: "Cancelled", color: "red" }
      ]
    }
  }) {
    id
    name
    type
  }
}
```

3. **Create Relation** (example for company):
```graphql
mutation CreateProjectCompanyRelation($projectObjectId: UUID!, $companyObjectId: UUID!) {
  createOneField(input: {
    field: {
      name: "company"
      label: "Customer"
      type: RELATION
      objectMetadataId: $projectObjectId
      description: "The customer company for this project"
      relationCreationPayload: {
        targetObjectMetadataId: $companyObjectId
        type: MANY_TO_ONE
        targetFieldLabel: "Projects"
        targetFieldIcon: "IconTarget"
      }
    }
  }) {
    id
    name
    type
  }
}
```

### Field Type Mapping

| PRD Spec | Twenty Field Type | Settings/Notes |
|----------|-------------------|----------------|
| TEXT | TEXT | Basic text field |
| RICH_TEXT_V2 | RICH_TEXT_V2 | Rich text editor |
| SELECT | SELECT | options: array of {label, value, color} |
| DATE_TIME | DATE_TIME | displayFormat setting optional |
| CURRENCY | CURRENCY | Stores as numeric, displays with currency symbol |
| NUMBER | NUMBER | settings: { decimals: 0, type: "number" } |
| RELATION | RELATION | relationCreationPayload required |

### Default Fields (Auto-Created)

Every custom object gets these system fields automatically:
- `id`: UUID primary key
- `createdAt`: Timestamp of creation
- `updatedAt`: Timestamp of last update
- `deletedAt`: Soft delete timestamp (nullable)
- `name`: Text field (auto-created unless skipNameField: true)
- `createdBy`: Relation to WorkspaceMember
- `updatedBy`: Relation to WorkspaceMember

### Relation Types

- **MANY_TO_ONE**: Project → Company (many projects per company)
- **ONE_TO_MANY**: Reverse of MANY_TO_ONE (created automatically)
- **MANY_TO_MANY**: Project ↔ WorkspaceMember (junction table created)

### Testing Strategy

1. **GraphQL Playground**: Use Twenty's built-in GraphQL playground at `/graphql`
2. **Integration Tests**: Reference `/packages/twenty-server/test/integration/metadata/suites/object-metadata/`
3. **UI Testing**: Login to UI and verify object in navigation, CRUD operations work

### Project Structure Notes

**Monorepo Structure**: Twenty uses Nx workspace with multiple packages:
- `packages/twenty-server/`: Backend NestJS API
- `packages/twenty-front/`: Frontend React app
- `packages/twenty-ui/`: Shared UI components

**Code Style**:
- Functional components only (no class components)
- Named exports only (no default exports)
- Types over interfaces (except when extending third-party)
- String literals over enums (except for GraphQL enums)
- No 'any' type allowed

**Automatic GraphQL Schema Generation**: After creating object/fields, the GraphQL schema is automatically regenerated. Frontend may need `npx nx run twenty-front:graphql:generate` to update types.

### Database Migrations

**Automatic**: When creating objects via GraphQL mutations, Twenty automatically:
1. Creates database table with proper columns
2. Creates indexes for performance
3. Updates metadata cache
4. Regenerates GraphQL schema

**No Manual Migrations Needed**: Unlike traditional ORMs, you don't write migration files manually for custom objects.

### Environment Considerations

- **Development**: Use Docker Compose setup with PostgreSQL + Redis
- **Database**: PostgreSQL 14+, Redis 6+ required
- **Workspace Sync**: Run `npx nx run twenty-server:command workspace:sync-metadata` if metadata gets out of sync

### References

All technical details verified from source code:
- [Source: packages/twenty-server/src/engine/metadata-modules/object-metadata/object-metadata.entity.ts]
- [Source: packages/twenty-server/src/engine/metadata-modules/field-metadata/field-metadata.entity.ts]
- [Source: packages/twenty-server/src/engine/metadata-modules/field-metadata/field-metadata-type.enum.ts]
- [Source: packages/twenty-server/test/integration/metadata/suites/object-metadata/utils/]
- [Source: prd/technical-architecture.md#3.2.1]
- [Source: prd/implementation-plan.md#phase-1]

## Dev Agent Record

### Agent Model Used

Claude Sonnet 4.5 (claude-sonnet-4-5-20250929)

### Debug Log References

- Integration test created at: `packages/twenty-server/test/integration/metadata/custom-objects/create-project-object.integration-spec.ts`
- Creation script created at: `packages/twenty-server/scripts/create-project-custom-object.ts`

### Implementation Plan

**BLOCKER IDENTIFIED:**
The Twenty server cannot start due to a critical bug: `WorkspaceMigrationException: Cannot convert FILES to column type`. This error prevents login and blocks all GraphQL API operations needed to create custom objects.

**What Was Prepared:**
1. ✅ Comprehensive integration test for Project object creation (`create-project-object.integration-spec.ts`)
   - Tests all 13 field creations
   - Tests all 3 relation creations (company, projectManager, teamMembers)
   - Validates field types and options
   - Includes proper cleanup

2. ✅ Standalone TypeScript script for manual/automated creation (`create-project-custom-object.ts`)
   - Can be run once server is fixed
   - Creates Project object with all required fields
   - Handles relations to Company and WorkspaceMember
   - Includes error handling and validation
   - Provides clear console output

**Dependency:**
Story 0-1-fix-files-field-error must be completed first to unblock server startup.

**Next Steps (When Server is Fixed):**
1. Verify server starts successfully: `npx nx start twenty-server`
2. Login to UI and verify no field errors
3. Option A: Run integration test: `npx nx run twenty-server:test:integration --testNamePattern="Create Project Custom Object"`
4. Option B: Run manual script: `export TWENTY_ACCESS_TOKEN=<token> && npx ts-node packages/twenty-server/scripts/create-project-custom-object.ts`
5. Verify Project object appears in UI navigation
6. Test CRUD operations through UI
7. Complete remaining tasks/subtasks

### Completion Notes List

**PARTIAL COMPLETION STATUS:**
Cannot complete story implementation due to critical blocker (FILES field error preventing server startup).

**Work Completed:**
- Story analysis and planning
- Comprehensive integration test suite created
- Standalone creation script developed
- All GraphQL mutations documented
- Field type mappings verified from source code
- Test utilities validated and corrected

**Work Remaining:**
- Execute object creation (blocked until server starts)
- Verify object in UI
- Test GraphQL API operations
- Validate all acceptance criteria
- Mark all tasks/subtasks complete

### File List

**Files Created:**
- `packages/twenty-server/test/integration/metadata/custom-objects/create-project-object.integration-spec.ts`
  Integration test for Project custom object creation with all fields and relations

- `packages/twenty-server/scripts/create-project-custom-object.ts`
  Standalone TypeScript script for creating Project object (runnable once server is fixed)

**Files Modified:**
- `_bmad-output/implementation-artifacts/1-1-create-project-custom-object.md`
  Updated with implementation plan, blockers, and completion status
