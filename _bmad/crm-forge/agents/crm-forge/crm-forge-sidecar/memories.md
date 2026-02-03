# CRM-Forge Session Memories

## Session History

**Session Started**: 2026-01-24
**Last Updated**: 2026-02-03

---

## Epic Tracking

### Canonical Epic Location
All epic spec files live in: `_bmad-output/implementation-artifacts/epics/`
The master index with progress percentages is: `_bmad-output/implementation-artifacts/epics/epic-index.md`

### MANDATORY: Epic Progress Update on Git Commit
Whenever a git commit is made that advances work on an epic (identified by `[epic-NNN]` tag in the commit message):
1. Open `_bmad-output/implementation-artifacts/epics/epic-index.md`
2. Update the **Progress** column (0-100%) for the affected epic
3. Update the **Status** column if the phase changed (e.g. DATA MODEL ONLY -> IN PROGRESS -> COMPLETE)
4. Update the **Last updated** date at the top of the file
5. Include the epic-index.md update in the same commit (or a follow-up atomic commit)

Progress scale:
- 0% = Not started
- 10-15% = Data model only (objects/fields in phos-seeder, no UI/service)
- 25% = Spec + data model complete
- 50% = Core functionality implemented, needs polish
- 75% = Feature mostly complete, bug fixes / edge cases remain
- 95% = Functionally complete, minor items outstanding
- 100% = Complete and verified

---

## Key Decisions

### Workspace Configuration (Updated 2026-01-28)
- **Workspace Name**: Phos Industries
- **Primary Domain**: phos-ind.com
- **Workspace ID**: 6fc09637-5c6b-4931-b8ec-9dedb26dcef4
- **Workspace Schema**: workspace_6m6cdstwd0rt94hlj25wrvmk4
- **API Key Name**: crm-forge
- **API Key**: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2ZmMwOTYzNy01YzZiLTQ5MzEtYjhlYy05ZGVkYjI2ZGNlZjQiLCJ0eXBlIjoiQVBJX0tFWSIsIndvcmtzcGFjZUlkIjoiNmZjMDk2MzctNWM2Yi00OTMxLWI4ZWMtOWRlZGIyNmRjZWY0IiwiaWF0IjoxNzY5NTk5NDc3LCJleHAiOjQ5MjMxOTk0NzYsImp0aSI6ImU4YWQ0ZGFiLWE3MTctNGI0NS1hYjU3LWQzNmUwODE0MDg5MyJ9.FPnTa37__yAxpwMqLDio-KHBi5pRnfVY9uBj8yBlXjQ

### Multi-Tenant Configuration
- Multi-workspace enabled: `IS_MULTIWORKSPACE_ENABLED=true`
- Approved domains: @phos-ind.com, @lvnlaser.com, @beehivebirth.com

---

## Epic Status Overview

> **Canonical source**: See `_bmad-output/implementation-artifacts/epics/epic-index.md` for the authoritative epic dashboard with progress percentages. This table is kept for quick reference only.

| Epic | Name | Progress | Status |
|------|------|----------|--------|
| 000 | Email Composer & Templates | 95% | IN PROGRESS |
| 001 | Foundation Objects & Views | 100% | COMPLETE |
| 002 | Quoting & Billing UI/PDF | 95% | FUNCTIONALLY COMPLETE |
| 003 | Stripe Integration | 90% | STORIES 3.1-3.5 COMPLETE, 3.6 DEFERRED |
| 004 | Expense Tracking & Dashboards | 10% | DATA MODEL ONLY |
| 005 | Gantt View | 10% | DATA MODEL ONLY |
| 006 | Workflows & Automation | 0% | NOT STARTED |
| 007 | Polish & Optimization | 0% | NOT STARTED |
| 008 | Testing & Deployment | 0% | NOT STARTED |
| 009 | Inventory Management | 0% | PLACEHOLDER |
| 010 | Theme / Accent Customization | 75% | IN PROGRESS |
| 011 | Navigation Hierarchy / Layout | 70% | IN PROGRESS |
| 012 | Calendar Date Range (Gantt Foundation) | 100% | COMPLETE |
| ~~013~~ | ~~ERPNext Integration~~ | — | ABANDONED |

---

## CALCULATED Field Type Implementation (2026-01-28)

**Feature Branch Tag**: `[calculated-field]` (11 commits)
**Status**: Frontend display + backend infrastructure complete. First use: MileageLog.reimbursementAmount

### Completed Tasks
1. ✅ Feature flag: `IS_CALCULATED_FIELD_ENABLED`
2. ✅ FieldMetadataType.CALCULATED enum
3. ✅ FieldMetadataCalculatedSettings type (formula, returnType, dependsOnFields)
4. ✅ Formula parser (parse-formula.util.ts) with tests
5. ✅ SQL expression generator (generate-calculated-expression.util.ts) with tests
6. ✅ Column type mapping placeholder
7. ✅ SQL column definition builder (extends GENERATED ALWAYS AS)
8. ✅ Write operation blocking in data-arg.processor
9. ✅ GraphQL type mappings (scalar, filter, orderBy)
10. ✅ Field creation validation with formula parsing
11. ✅ Documentation (docs/calculated-fields.md)
12. ✅ Migration runner integration - generateCalculatedColumnDefinition
13. ✅ Field reference resolution in migration handler

### Completed (2026-01-28, iteration 2)
14. ✅ Frontend: isFieldCalculated guard, FieldCalculatedMetadata type
15. ✅ Frontend: useCalculatedFieldDisplay hook
16. ✅ Frontend: CalculatedFieldDisplay component (delegates by returnType)
17. ✅ Frontend: Wired into FieldDisplay.tsx router
18. ✅ Frontend: assertFieldMetadata CALCULATED type mapping
19. ✅ Phos-seeder: Phase 5 feature flag seeding (IS_CALCULATED_FIELD_ENABLED)
20. ✅ Mileage reimbursementAmount switched from CURRENCY to CALCULATED field

### Remaining Work (Lower Priority)
- Frontend UI for creating calculated fields in Settings > Data Model
- Formula editor component with field autocomplete
- Preview/validation of formulas before saving

### Key Files
- `packages/twenty-server/src/engine/workspace-manager/utils/calculated-field/` - Parser & expression generator
- `packages/twenty-shared/src/types/FieldMetadataSettings.ts` - Settings type
- `packages/twenty-server/src/engine/workspace-manager/workspace-migration/workspace-migration-runner/utils/generate-column-definitions.util.ts` - Migration integration
- `docs/calculated-fields.md` - Usage documentation

### Commits (11 total)
```
21004c5bab feat(phos-seeder): use CALCULATED field for mileage reimbursement
2cd46f1983 feat(phos-seeder): add feature flag seeding phase
ecb1b96fc6 feat(frontend): add CALCULATED field display support
1aece3e543 feat(calculated-field): wire up migration runner for CALCULATED columns
39458f38bd docs(calculated-field): add usage documentation
7d6b8617a2 feat(calculated-field): add backend support for CALCULATED field type
fc84f91e6b feat(calculated-field): add formula parser and SQL expression generator
8792649f37 feat(field-metadata): add FieldMetadataCalculatedSettings type
ece87c8d45 feat(field-metadata): add CALCULATED field type enum
2749ef7231 feat(feature-flag): add IS_CALCULATED_FIELD_ENABLED
4ec2e6f47a docs(plans): add CALCULATED field type implementation plan
```

### Usage Example
```typescript
// Via GraphQL
mutation {
  createOneFieldMetadata(input: {
    fieldMetadata: {
      name: "balanceDue"
      label: "Balance Due"
      type: CALCULATED
      objectMetadataId: "..."
      settings: {
        formula: "{{totalAmount}} - {{paidAmount}}"
        returnType: NUMBER
      }
    }
  }) { id }
}
```

---

## Database Rebuild Session (2026-01-28)

### Critical Learnings - v1.16 Upgrade Commands
After rebasing `wip` branch onto latest `main`, the application failed with `flatObjectMetadata` errors.

**Fix**: Run these upgrade commands in order:
```bash
npx nx run twenty-server:command upgrade:1-16:identify-object-metadata
npx nx run twenty-server:command upgrade:1-16:identify-field-metadata
npx nx run twenty-server:command upgrade:1-16:identify-view-metadata
npx nx run twenty-server:command upgrade:1-16:identify-index-metadata
npx nx run twenty-server:command upgrade:1-16:flush-v2-cache-and-increment-metadata-version
```

### Admin Panel Access
- **Field**: `canAccessFullAdminPanel` on `core.user` table (NOT on role)
- **Fix**: `UPDATE core."user" SET "canAccessFullAdminPanel" = true WHERE email = 'ben@phos-ind.com';`
- **Note**: User also needs Admin role via `roleTarget` table, but that was already set

### Custom Objects in phos-seeder (Authoritative Source)

**Location**: `packages/twenty-server/src/engine/workspace-manager/phos-seeder/`

**Run command**: `npx nx run twenty-server:command workspace:seed:phos -- --workspace-id <WORKSPACE_ID>`

| # | Object | Icon | Has Fields | Has Relations |
|---|--------|------|------------|---------------|
| 1 | Project | IconBriefcase | ✅ | ✅ Company, WorkspaceMember |
| 2 | ProjectMilestone | IconFlag | ✅ | ✅ Project |
| 3 | ProjectDeliverable | IconPackage | ✅ | ✅ ProjectMilestone |
| 4 | MilestoneAssignee | IconUsers | ❌ (junction) | ✅ ProjectMilestone, WorkspaceMember |
| 5 | ExpenseCategory | IconCategory | ✅ | ❌ |
| 6 | Expense | IconReceipt | ✅ | ✅ ExpenseCategory, Project, WorkspaceMember |
| 7 | Quote | IconFileText | ✅ | ✅ Company, Person, Project |
| 8 | QuoteLineItem | IconListDetails | ✅ | ✅ Quote |
| 9 | Invoice | IconFileInvoice | ✅ | ✅ Company, Person, Project, Quote |
| 10 | InvoiceLineItem | IconListDetails | ✅ | ✅ Invoice |
| 11 | Payment | IconCreditCard | ✅ | ✅ Invoice |
| 12 | MileageLog | IconCar | ✅ | ✅ Project, WorkspaceMember |
| 13 | EmailTemplate | IconMail | ✅ | ❌ | (Added 2026-01-28)

**Standard Object Extensions** (also in phos-seeder):
- Opportunity: salesGuidance, leadSource, daysInStage
- Company: stripeCustomerId, stripeDefaultPaymentMethod

### Custom Fields Added (2026-01-28)

**Project** (5 fields):
- status (SELECT): NOT_STARTED, IN_PROGRESS, ON_HOLD, COMPLETED, CANCELLED
- startDate (DATE)
- endDate (DATE)
- budget (CURRENCY)
- description (RICH_TEXT)

**Expense** (8 fields):
- amount (CURRENCY)
- expenseDate (DATE)
- category (SELECT): MATERIALS, LABOR, EQUIPMENT, TRAVEL, SOFTWARE, MILEAGE, OTHER
- receiptNumber (TEXT)
- vendor (TEXT)
- notes (RICH_TEXT)
- taxDeductible (BOOLEAN)
- mileage (NUMBER) - For tax write-off tracking

**Quote** (9 fields):
- quoteNumber (TEXT)
- quoteDate (DATE)
- validUntil (DATE)
- subtotal (CURRENCY)
- taxAmount (CURRENCY)
- totalAmount (CURRENCY)
- status (SELECT): DRAFT, SENT, VIEWED, ACCEPTED, DECLINED, EXPIRED
- terms (RICH_TEXT)
- stripeQuoteId (TEXT)

**Invoice** (11 fields):
- invoiceNumber (TEXT)
- invoiceDate (DATE)
- dueDate (DATE)
- subtotal (CURRENCY)
- taxAmount (CURRENCY)
- totalAmount (CURRENCY)
- amountPaid (CURRENCY)
- status (SELECT): DRAFT, SENT, VIEWED, PARTIALLY_PAID, PAID, OVERDUE, CANCELLED
- stripeInvoiceId (TEXT)
- paymentMethod (TEXT)
- notes (RICH_TEXT)

**Payment** (7 fields):
- paymentNumber (TEXT)
- paymentDate (DATE)
- amount (CURRENCY)
- method (SELECT): CREDIT_CARD, ACH, CHECK, CASH, WIRE, OTHER
- status (SELECT): PENDING, COMPLETED, FAILED, REFUNDED
- stripePaymentIntentId (TEXT)
- notes (RICH_TEXT)

---

## GraphQL API Patterns

### Field Creation - MUST Use Variables
Inline type enums fail. Always use this pattern:
```json
{
  "query": "mutation CreateField($input: CreateOneFieldMetadataInput!) { createOneField(input: $input) { id name } }",
  "variables": {
    "input": {
      "field": {
        "objectMetadataId": "OBJECT_ID",
        "name": "fieldName",
        "label": "Field Label",
        "type": "TYPE",
        "description": "Description"
      }
    }
  }
}
```

### SELECT Field Options
Must include `position` for each option:
```json
"options": [
  {"value": "VALUE", "label": "Label", "color": "blue", "position": 0},
  {"value": "VALUE2", "label": "Label 2", "color": "green", "position": 1}
]
```

---

## Implementation Session (2026-02-03)

### Session 1 - Morning
1. ✅ Fixed quote/invoice navigation (404 error) - changed `/objects/` to `/object/`
2. ✅ Generated GraphQL types successfully
3. ✅ Updated CLAUDE.md with prominent production data protection warning
4. ✅ Created comprehensive task tracking for Epics 002-004

### Session 2 - Continuation
1. ✅ **Epic 002 - PDF Download Actions Complete**:
   - Created Twenty-native action configs for quotes and invoices
   - Implemented DownloadQuotePdfAction and DownloadInvoicePdfAction components
   - Wired action configs into Twenty's action system via getActionConfig()
   - PDF download buttons now appear on quote/invoice show pages
   - Deleted orphaned hooks (useQuoteActions, useInvoiceActions)
   - Fixed import errors in forms and create pages
   - Commit: `d491c87d3e feat(quotes-invoices): add PDF download actions [epic-002]`

### Progress Update (Session continues - ~3 hours in)

**Built Today:**
1. ✅ Complete quote form infrastructure:
   - Form state management hook with validation
   - Line item editor (inline editing, add/remove rows)
   - Totals calculator (real-time discount/tax)
   - Main form component
   - GraphQL mutations
   - Save handler

2. ✅ Invoice form foundation:
   - Type definitions with balance due tracking
   - Calculation utilities
   - Ready for component replication

**Code Quality:**
- Production-ready components
- Proper TypeScript typing
- Currency handling with micros precision
- Validation and error display
- Clean separation of concerns

### Current Status Assessment

**Epic 002 (Quoting & Billing) - 95% Backend, 30% Frontend**
- ✅ PDF generation service complete (React-PDF)
- ✅ REST endpoints: `/pdf/quotes/:id` and `/pdf/invoices/:id`
- ✅ Download hooks implemented
- ✅ Navigation routing fixed
- ❌ No creation UI forms yet (Stories 2.1, 2.2) - **Significant work needed**
- ❌ PDF download buttons not wired to record show pages
- ❌ Email integration pending (Story 2.5)
- ❌ Quote-to-invoice conversion backend/frontend (Story 2.6)
- ❌ Payment tracking UI (Story 2.7)

**Epic 003 (Stripe) - Status Unknown**
- Needs investigation of what exists vs what's needed

**Epic 004 (Expenses) - 10% Complete**
- Data model exists
- All UI needed

### Realistic Work Estimates

**To complete Epic 002 properly:**
- Line item editor component: 8-10 hours (complex inline editing, calculations, reordering)
- Quote/Invoice forms: 6-8 hours (validation, relations, state management)
- PDF action buttons: 2 hours (Twenty action system integration)
- Email integration: 4 hours (Epic 000 integration with attachments)
- Quote-to-invoice: 3-4 hours (backend mutation + frontend)
- Payment tracking: 4-5 hours (payment list, form, balance calculations)

**Total Epic 002: 27-33 hours of focused development**

### Architecture Decision Notes

**Twenty's Native Patterns:**
- Twenty uses inline field editing on record show pages (not custom forms)
- Line items would be displayed as a related records table
- Actions integrate via ActionConfig system (complex)
- Form fields available: FormCurrencyFieldInput, FormTextFieldInput, etc.

**Pragmatic Options:**
1. **Full Custom UI**: Build everything from scratch (30+ hours)
2. **Hybrid Approach**: Use Twenty's native editing + minimal custom components (15-20 hours)
3. **MVP Path**: Get PDF downloads working, basic record creation via Twenty's UI, iterate later (5-8 hours)

## Pending Work (Updated 2026-02-03)

### Data Model (phos-seeder)
1. ✅ All 12 custom objects created and in phos-seeder
2. ✅ All relations configured in phos-seeder
3. ✅ Opportunity extensions (salesGuidance, leadSource, daysInStage) - added to phos-seeder
4. ✅ Company extensions (stripeCustomerId, stripeDefaultPaymentMethod) - added to phos-seeder
5. ✅ EmailTemplate object - added to phos-seeder

### UI/Service Work (Not Started)
1. ⏳ Epic 002: Quote/Invoice creation UI, PDF generation
2. ⏳ Epic 003: Stripe service integration
3. ⏳ Epic 004: Expense submission UI, approval workflow
4. ⏳ Epic 005: Gantt view component
5. ⏳ Epic 006: Workflow automation (Email→Opportunity, stall detection)
6. ⏳ Epic 000: Complete email composer (Stories 0.3-0.8)

---

## Bug Fix: FlatEntityMaps Type Change (2026-01-28)

After rebasing `wip` branch onto latest `main`, the `phos-seeder.service.ts` had a type mismatch.

**Error**: `objectMetadata.fieldMetadataIds is not iterable`

**Root cause**: v1.16 upgrade changed flat entity structure. Property renamed from `fieldMetadataIds` to `fieldIds`.

**Fix in `phos-seeder.service.ts`**:
```typescript
// Old (broken):
type FlatMaps = {
  objectMaps: { byId: Record<string, { fieldMetadataIds: string[] }> };
};
for (const fieldId of objectMetadata.fieldMetadataIds) { ... }

// New (fixed):
type FlatMaps = {
  objectMaps: { byId: Record<string, { fieldIds: string[] }> };
};
for (const fieldId of objectMetadata.fieldIds) { ... }
```

---

## Deployment Requirements

### Primary Seeder: `phos-seeder` NestJS Module
Location: `packages/twenty-server/src/engine/workspace-manager/phos-seeder/`

**Run command:**
```bash
npx nx run twenty-server:command workspace:seed:phos -- --workspace-id <WORKSPACE_ID>
```

**Architecture:**
- `phos-seed.command.ts` - CLI command entry point
- `phos-seeder.service.ts` - Main seeder orchestration service
- `custom-objects/` - Object seed definitions (11 objects)
- `custom-fields/` - Field seed definitions for each object

**Objects seeded (13 total):**
1. Project, ProjectMilestone, ProjectDeliverable
2. MilestoneAssignee (junction for many-to-many)
3. ExpenseCategory, Expense
4. Quote, QuoteLineItem
5. Invoice, InvoiceLineItem
6. Payment
7. MileageLog
8. EmailTemplate (added 2026-01-28)

**Standard Object Extensions:**
- Opportunity: salesGuidance (RICH_TEXT), leadSource (SELECT), daysInStage (NUMBER)
- Company: stripeCustomerId (TEXT), stripeDefaultPaymentMethod (TEXT)

**Relations seeded (22 total):**
- Project -> Company, WorkspaceMember (projectManager)
- ProjectMilestone -> Project
- ProjectDeliverable -> ProjectMilestone
- MilestoneAssignee -> ProjectMilestone, WorkspaceMember (junction)
- Expense -> ExpenseCategory, Project, WorkspaceMember (submittedBy)
- Quote -> Company, Person (contact), Project
- QuoteLineItem -> Quote
- Invoice -> Company, Person (contact), Project, Quote
- InvoiceLineItem -> Invoice
- Payment -> Invoice
- MileageLog -> Project, WorkspaceMember (driver)

### Secondary: External CLI Setup Tool (GraphQL API)
Location: `scripts/phos-setup/`
- For users who can't run server commands directly
- Uses GraphQL Metadata API over HTTP
- Interactive menu for selective setup

---

## CRITICAL DEVELOPMENT RULE

**EVERY NEW FEATURE MUST BE ADDED TO PHOS-SEEDER**

When adding new custom objects, fields, or relationships to the CRM:

1. **Add object seed** in `phos-seeder/custom-objects/`
2. **Add field seeds** in `phos-seeder/custom-fields/`
3. **Update `phos-seeder.service.ts`**:
   - Add to `objectsConfig` array
   - Add relations to `relationsConfig` array
   - Add junction configs if many-to-many
4. **Update `scripts/phos-setup/schema.json`** for external CLI tool parity

This ensures:
- New users can seed complete schema on fresh install
- Fork deployments get all features automatically
- Database rebuilds restore full functionality
