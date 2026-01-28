# Schema Audit Report - Phos CRM

**Date:** 2026-01-26
**Workspace:** Phos Industries (572a2b40-3011-4a15-bff4-376f817b88e7)
**Schema:** workspace_55rtvgt6kptd0ioln5lvjh33b

---

## Executive Summary

**Custom Objects Created:** 5 (Project, Expense, Quote, Invoice, SupportTicket)
**Custom Fields on Opportunity:** 3 (daysInStage, leadSource, salesGuidance)
**Workflows Active:** 2 (Quick Lead, Email to Opportunity)
**Data Present:** 1 Project, 1 Expense (empty), 2 Opportunities

---

## Current Schema Status

### ✅ Custom Objects (Created via Metadata API)

| Object | Status | Relations | Notes |
|--------|--------|-----------|-------|
| Project | ✅ Created | company, expenses, attachments, favorites, notes, tasks, timeline | Working - has 1 record |
| Expense | ✅ Created | project, company, attachments, favorites, notes, tasks, timeline | Working - has 1 empty record |
| Quote | ✅ Created | company, invoices, attachments, favorites, notes, tasks, timeline | Working - no records |
| Invoice | ✅ Created | quote, company, attachments, favorites, notes, tasks, timeline | Working - no records |
| SupportTicket | ✅ Created | company, attachments, favorites, notes, tasks, timeline | Working - no records |

### ✅ Opportunity Custom Fields (Priority 1 Complete)

| Field | Type | Status | Notes |
|-------|------|--------|-------|
| daysInStage | NUMBER | ✅ Created | Default 0, writable via GraphQL |
| leadSource | SELECT | ✅ Created | 7 options: LINKEDIN, REFERRAL, WEBSITE, EMAIL, COLD_OUTREACH, EVENT, OTHER |
| salesGuidance | RICH_TEXT | ✅ Created | Read-only via API, editable in UI |

### ✅ Workflows

| Workflow | Status | Purpose |
|----------|--------|---------|
| Quick Lead | Active | Quick lead capture |
| Email to Opportunity | Active | Email → Opportunity conversion |

---

## Gap Analysis vs PRD Requirements

### Epic 001: Foundation Objects

#### Project Object
**Current Fields:**
- id, name, createdAt, updatedAt, deletedAt, position, searchVector
- startDate (DATE), endDate (DATE)
- budget (CURRENCY - amountMicros, currencyCode)
- description (RICH_TEXT)
- status (SELECT)
- companyId (RELATION)

**Missing per PRD (Story 1.1):**
- ❌ priority (SELECT) - not found
- ❌ actualCost (CURRENCY) - not found
- ❌ progressPercentage (NUMBER 0-100) - not found
- ❌ projectType (SELECT) - not found
- ❌ projectManager (RELATION → WorkspaceMember) - not found
- ❌ teamMembers (RELATION → WorkspaceMember many-to-many) - not found

#### Project Milestone & Deliverable Objects
**Status:** ❌ NOT CREATED
- ProjectMilestone object not found
- ProjectDeliverable object not found

#### Expense Object
**Current Fields:**
- id, name, createdAt, updatedAt, deletedAt, position, searchVector
- amount (CURRENCY)
- expenseDate (DATE)
- receiptNumber (TEXT)
- vendor (TEXT)
- notes (RICH_TEXT)
- taxDeductible (BOOLEAN)
- category (SELECT)
- projectId (RELATION)
- companyId (RELATION)

**Missing per PRD (Story 1.3):**
- ❌ paymentMethod (SELECT) - not found
- ❌ billable (BOOLEAN) - not found
- ❌ status (SELECT: Draft/Submitted/Approved/Rejected/Paid) - not found
- ❌ submittedBy (RELATION → WorkspaceMember) - not found
- ❌ approvedBy (RELATION → WorkspaceMember) - not found
- ❌ mileage (NUMBER) - PRD Priority 2 field for tax tracking

#### ExpenseCategory Object
**Status:** ❌ NOT CREATED (currently using SELECT field on Expense)

#### Quote Object
**Current Fields:**
- id, name, createdAt, updatedAt, deletedAt, position, searchVector
- quoteNumber (TEXT)
- quoteDate (DATE)
- validUntil (DATE)
- totalAmount (CURRENCY)
- terms (RICH_TEXT)
- notes (RICH_TEXT)
- status (SELECT)
- companyId (RELATION)

**Missing per PRD (Story 1.4):**
- ❌ subtotal (CURRENCY) - not found
- ❌ discountPercentage (NUMBER) - not found
- ❌ discountAmount (CURRENCY) - not found
- ❌ taxPercentage (NUMBER) - not found
- ❌ taxAmount (CURRENCY) - not found
- ❌ internalNotes (RICH_TEXT) - not found
- ❌ version (NUMBER) - not found
- ❌ personId/contactId (RELATION → Person) - not found
- ❌ projectId (RELATION → Project) - not found

#### QuoteLineItem Object
**Status:** ❌ NOT CREATED

#### Invoice Object
**Current Fields:**
- id, name, createdAt, updatedAt, deletedAt, position, searchVector
- invoiceNumber (TEXT)
- invoiceDate (DATE)
- dueDate (DATE)
- totalAmount (CURRENCY)
- amountPaid (CURRENCY)
- stripePaymentId (TEXT)
- paymentMethod (TEXT)
- notes (RICH_TEXT)
- status (SELECT)
- quoteId (RELATION)
- companyId (RELATION)

**Missing per PRD (Story 1.5):**
- ❌ subtotal (CURRENCY) - not found
- ❌ discountPercentage (NUMBER) - not found
- ❌ discountAmount (CURRENCY) - not found
- ❌ taxPercentage (NUMBER) - not found
- ❌ taxAmount (CURRENCY) - not found
- ❌ balanceDue (CURRENCY - computed) - not found
- ❌ terms (RICH_TEXT) - not found
- ❌ stripeInvoiceId (TEXT) - not found
- ❌ stripePaymentStatus (TEXT) - not found
- ❌ stripePaymentLink (TEXT) - not found
- ❌ personId/contactId (RELATION → Person) - not found
- ❌ projectId (RELATION → Project) - not found

#### InvoiceLineItem Object
**Status:** ❌ NOT CREATED

#### Payment Object
**Status:** ❌ NOT CREATED

---

## Priority Implementation Order

### Phase 1: Complete Epic 001 Foundation (Current Sprint)

1. **Add missing Project fields:**
   - priority, actualCost, progressPercentage, projectType
   - projectManager relation to WorkspaceMember

2. **Add missing Expense fields:**
   - paymentMethod, billable, status
   - mileage (for tax write-off tracking)
   - submittedBy, approvedBy relations

3. **Add missing Quote fields:**
   - Financial calculation fields (subtotal, discount, tax)
   - Contact and Project relations

4. **Add missing Invoice fields:**
   - Financial calculation fields
   - Stripe integration fields
   - Contact and Project relations

5. **Create missing objects:**
   - QuoteLineItem (for line items)
   - InvoiceLineItem (for line items)
   - Payment (for payment tracking)
   - ProjectMilestone (for project tracking)
   - ProjectDeliverable (for deliverables)
   - ExpenseCategory (optional - could use SELECT)

### Phase 2: Days-in-Stage Automation

- Create serverless function or workflow to auto-calculate daysInStage
- Trigger on stage change to reset counter
- Nightly cron to increment all opportunities

---

## Views Status

| View | Object | Type | Status |
|------|--------|------|--------|
| All {objectLabelPlural} | expense | TABLE | ⚠️ Label not rendered |
| All {objectLabelPlural} | invoice | TABLE | ⚠️ Label not rendered |
| All {objectLabelPlural} | project | TABLE | ⚠️ Label not rendered |
| Kanban | project | KANBAN | ✅ Working |
| All {objectLabelPlural} | quote | TABLE | ⚠️ Label not rendered |
| All {objectLabelPlural} | supportTicket | TABLE | ⚠️ Label not rendered |
| All Opportunities | opportunity | TABLE | ✅ Working |
| By Stage | opportunity | KANBAN | ✅ Working |

**Note:** View labels showing `{objectLabelPlural}` instead of actual names indicates view metadata needs refresh.

---

## API Access

**API Key:** crm-forge (expires 2126)
**Token stored in:** `_bmad-output/bmb-creations/twenty-crm-builder/twenty-crm-builder-sidecar/memories.md`

---

## Recommended Next Steps

1. ✅ Schema audit complete
2. → Add missing fields to existing objects via metadata API
3. → Create missing objects (LineItems, Payment, Milestones)
4. → Fix view labels
5. → Implement Days-in-Stage automation
6. → Build Quote/Invoice UI components
