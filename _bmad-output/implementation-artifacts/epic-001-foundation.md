# Epic 001: Foundation - Custom Objects & Basic Views

**Epic ID**: EPIC-001
**Phase**: Phase 1 (Weeks 1-2)
**Priority**: P0 (Critical)
**Status**: Not Started
**Owner**: TBD
**Created**: 2026-01-24
**Target Completion**: Week 2

## Epic Overview

Set up all custom objects and basic table views required for the Phos Industries CRM. This epic establishes the foundational data model that all subsequent features will build upon.

## Business Value

- Enables tracking of projects, expenses, quotes, and invoices
- Provides the data foundation for all financial and project management features
- Allows immediate CRUD operations on core business entities

## Success Criteria

- [ ] All custom objects created and visible in Twenty UI
- [ ] Basic table views functional for all new objects
- [ ] Object relations properly established and working
- [ ] Data persists correctly across server restarts
- [ ] Can create/edit/delete all custom objects via UI
- [ ] GraphQL API endpoints functional for all objects

## Technical Architecture Reference

See [Technical Architecture - Section 3.2](../../prd/technical-architecture.md#32-custom-object-data-model) for complete data model specifications.

---

## User Stories

### Story 1.1: Create Project Custom Object

**Story ID**: STORY-1.1
**Priority**: P0
**Estimate**: 3 hours
**Status**: Not Started

**As a** project manager
**I want** to create and manage Project records
**So that** I can track all projects for my consulting business

**Acceptance Criteria**:
- [ ] Project object created with all fields from technical spec (Section 3.2.1)
- [ ] Relations to Company, WorkspaceMember, Task established
- [ ] Table view displays all project fields correctly
- [ ] Can create new projects via UI
- [ ] Can edit existing projects
- [ ] Can delete projects (soft delete)
- [ ] Validation works (required fields, date ranges)

**Technical Notes**:
- Use Twenty's custom object creation system
- Fields: name (TEXT), description (RICH_TEXT_V2), status (SELECT), priority (SELECT), startDate, endDate (DATE_TIME), budget, actualCost (CURRENCY), progressPercentage (NUMBER 0-100), projectType (SELECT)
- Relations: company → Company, projectManager → WorkspaceMember, teamMembers → WorkspaceMember (many-to-many)

---

### Story 1.2: Create ProjectMilestone and ProjectDeliverable Objects

**Story ID**: STORY-1.2
**Priority**: P0
**Estimate**: 2 hours
**Status**: Not Started

**As a** project manager
**I want** to track project milestones and deliverables
**So that** I can monitor project progress and client commitments

**Acceptance Criteria**:
- [ ] ProjectMilestone object created with all fields
- [ ] ProjectDeliverable object created with all fields
- [ ] Relations to Project working correctly
- [ ] Table views functional
- [ ] Can create milestones linked to projects
- [ ] Can create deliverables linked to milestones
- [ ] Attachment support working on deliverables

**Technical Notes**:
- ProjectMilestone fields: name, description, dueDate, completedDate, status
- ProjectDeliverable fields: name, description, deliveryDate, approvalStatus, version
- Relation: milestone → project (many-to-one), deliverable → milestone (many-to-one)

---

### Story 1.3: Create Expense and ExpenseCategory Objects

**Story ID**: STORY-1.3
**Priority**: P0
**Estimate**: 2.5 hours
**Status**: Not Started

**As an** accountant
**I want** to record and categorize business expenses
**So that** I can track costs and prepare tax reports

**Acceptance Criteria**:
- [ ] Expense object created with all fields
- [ ] ExpenseCategory object created with all fields
- [ ] Relations to Project, WorkspaceMember, ExpenseCategory working
- [ ] Table views functional
- [ ] Can create expense categories with tax classifications
- [ ] Can create expenses linked to projects and categories
- [ ] Receipt attachment support working
- [ ] Expense approval workflow fields functional

**Technical Notes**:
- Expense fields: date, amount (CURRENCY), description, vendor, paymentMethod (SELECT), taxDeductible (BOOLEAN), billable (BOOLEAN), status (SELECT)
- ExpenseCategory fields: name, description, taxCategory, color, isActive
- Relations: expense → project, expense → category, expense → submittedBy, expense → approvedBy

---

### Story 1.4: Create Quote and QuoteLineItem Objects

**Story ID**: STORY-1.4
**Priority**: P0
**Estimate**: 3 hours
**Status**: Not Started

**As a** sales representative
**I want** to create quotes with line items
**So that** I can send professional quotes to customers

**Acceptance Criteria**:
- [ ] Quote object created with all fields including computed fields
- [ ] QuoteLineItem object created with all fields
- [ ] Relations to Company, Person, Project working
- [ ] One-to-many relationship: Quote → QuoteLineItems functional
- [ ] Table views functional
- [ ] Can create quotes with multiple line items
- [ ] Subtotal, tax, and total calculations working
- [ ] Quote numbering auto-generation working (Q-2024-001 format)

**Technical Notes**:
- Quote fields: quoteNumber (auto-generated), date, expiryDate, status (SELECT), subtotal, discountPercentage, discountAmount, taxPercentage, taxAmount, total (computed), notes, internalNotes, terms, version
- QuoteLineItem fields: description, quantity, unitPrice, subtotal (computed), serviceCategory, sortOrder
- Implement auto-numbering: PREFIX-YEAR-SEQUENCE

---

### Story 1.5: Create Invoice, InvoiceLineItem, and Payment Objects

**Story ID**: STORY-1.5
**Priority**: P0
**Estimate**: 3.5 hours
**Status**: Not Started

**As an** accountant
**I want** to create invoices and track payments
**So that** I can bill customers and monitor accounts receivable

**Acceptance Criteria**:
- [ ] Invoice object created with all fields including Stripe integration fields
- [ ] InvoiceLineItem object created with all fields
- [ ] Payment object created with all fields
- [ ] Relations between Invoice, InvoiceLineItem, Payment working
- [ ] Relations to Company, Person, Project, Quote working
- [ ] Table views functional
- [ ] Can create invoices with multiple line items
- [ ] Can record payments against invoices
- [ ] Balance due calculation working (total - paidAmount)
- [ ] Invoice numbering auto-generation working (INV-2024-001 format)

**Technical Notes**:
- Invoice fields: invoiceNumber (auto-generated), date, dueDate, status (SELECT), subtotal, discountPercentage, discountAmount, taxPercentage, taxAmount, total (computed), paidAmount, balanceDue (computed), notes, terms, stripeInvoiceId, stripePaymentStatus, stripePaymentLink
- Payment fields: date, amount, paymentMethod, referenceNumber, notes, stripePaymentId, stripeChargeId
- Relations: invoice → company, invoice → quote, payment → invoice

---

### Story 1.6: Configure Object Relations and Test GraphQL API

**Story ID**: STORY-1.6
**Priority**: P0
**Estimate**: 2 hours
**Status**: Not Started

**As a** developer
**I want** to verify all object relations and GraphQL endpoints
**So that** I can ensure the data model is correctly implemented

**Acceptance Criteria**:
- [ ] All object-to-object relations tested and working
- [ ] Can query related objects via GraphQL
- [ ] Can create objects with relations via GraphQL mutations
- [ ] Can update relations via GraphQL mutations
- [ ] Can delete objects and verify cascade behavior
- [ ] Automatic fields (createdAt, updatedAt, createdBy, noteTargets, taskTargets, favorites, attachments, timelineActivities) working on all objects
- [ ] GraphQL schema documentation generated

**Technical Notes**:
- Test queries: getProject with nested company, getInvoice with nested lineItems and payments
- Test mutations: createProject with teamMembers, createQuote with lineItems
- Verify cascade deletes where appropriate
- Document GraphQL schema for frontend team

---

## Dependencies

- None (this is the foundation epic)

## Blocked By

- None

## Blocks

- Epic 002: Quoting & Billing (needs Quote and Invoice objects)
- Epic 003: Stripe Integration (needs Invoice and Payment objects)
- Epic 004: Expense Tracking (needs Expense objects)
- Epic 005: Gantt View (needs Project object)

## Technical Risks

1. **Object Creation Complexity**: Twenty's custom object system may have limitations
   - Mitigation: Review Twenty documentation thoroughly, test with simple object first

2. **Computed Fields**: Subtotal/total calculations may need custom resolvers
   - Mitigation: Implement GraphQL field resolvers for computed fields

3. **Auto-numbering**: Sequential number generation needs to be thread-safe
   - Mitigation: Use database sequences or atomic counters

## Testing Strategy

1. **Unit Tests**: Test GraphQL resolvers for each object
2. **Integration Tests**: Test object relations and cascade behavior
3. **Manual Testing**: Create, edit, delete each object type via UI
4. **Performance Testing**: Verify queries perform well with 1000+ records

## Documentation Needs

- [ ] Object schema documentation
- [ ] GraphQL API documentation
- [ ] Relation diagram showing all object connections
- [ ] User guide for creating/managing each object type

---

## Notes

This epic is the critical foundation for the entire project. All subsequent epics depend on these objects being correctly implemented. Take time to ensure data model is correct before proceeding to Phase 2.

**CRITICAL**: Review the existing data model error in prd.md before starting:
```
WorkspaceMigrationException [Error]: Cannot convert FILES to column type.
```
This suggests there may be an existing issue with the Twenty workspace that needs to be resolved first.
