# Epic 002: Quoting & Billing - UI and PDF Generation

**Epic ID**: EPIC-002
**Phase**: Phase 2 (Weeks 3-4)
**Priority**: P0 (Critical)
**Status**: Not Started
**Owner**: TBD
**Created**: 2026-01-24
**Target Completion**: Week 4

## Epic Overview

Build the user interface and business logic for creating professional quotes and invoices, including PDF generation and email delivery. This epic transforms the data model from Epic 001 into a functional quoting and billing system.

## Business Value

- Enables professional quote and invoice generation
- Reduces manual work in creating customer documents
- Provides email delivery for quotes and invoices
- Supports quote-to-invoice conversion workflow
- Tracks payment status on invoices

## Success Criteria

- [ ] Can create professional PDF quotes with company branding
- [ ] Can send quotes via email to customers
- [ ] Can convert accepted quotes to invoices with one click
- [ ] Can create standalone invoices (not from quotes)
- [ ] Can track invoice payments manually
- [ ] Quote and invoice numbering works automatically
- [ ] All calculations (subtotal, tax, total) compute correctly

## Dependencies

- **Blocks**: Epic 003 (Stripe Integration) - needs invoice UI and PDF generation
- **Blocked By**: Epic 001 (Foundation) - requires Quote, Invoice, Payment objects

---

## User Stories

### Story 2.1: Build Quote Creation UI with Line Item Editor

**Story ID**: STORY-2.1
**Priority**: P0
**Estimate**: 5 hours
**Status**: Not Started

**As a** sales representative
**I want** a user-friendly form to create quotes with multiple line items
**So that** I can quickly generate quotes for customers

**Acceptance Criteria**:
- [ ] Quote creation form accessible from main navigation
- [ ] Form includes all quote fields: customer (Company), contact (Person), date, expiry date, terms
- [ ] Line item editor allows adding/removing/reordering line items
- [ ] Each line item has: description, quantity, unit price, service category
- [ ] Subtotal auto-calculates for each line item (quantity * unitPrice)
- [ ] Quote-level discount (percentage or fixed amount) applies to subtotal
- [ ] Tax percentage field auto-calculates tax amount
- [ ] Total field shows final amount (subtotal - discount + tax)
- [ ] Can save quote as Draft or mark as Sent
- [ ] Validation: required fields, positive numbers, expiry date after date

**Technical Notes**:
- Location: `/packages/twenty-front/src/modules/quotes/components/`
- Components: `QuoteForm.tsx`, `QuoteLineItemEditor.tsx`, `LineItemRow.tsx`
- Use Twenty-UI components for consistency
- Use Recoil for form state management
- GraphQL mutation: `createQuote`, `updateQuote`

**UI/UX Design**:
```
┌─────────────────────────────────────────┐
│ Create Quote                       [X]  │
├─────────────────────────────────────────┤
│ Customer: [Company Dropdown ▼]          │
│ Contact:  [Person Dropdown ▼]           │
│ Project:  [Project Dropdown ▼] Optional │
│ Date:     [2024-01-24] Expiry: [______] │
├─────────────────────────────────────────┤
│ Line Items:                   [+ Add]   │
│ ┌───┬─────────────┬────┬────┬──────┐   │
│ │ # │ Description │ Qty│Rate│Total │   │
│ ├───┼─────────────┼────┼────┼──────┤   │
│ │ 1 │ [_________] │[_] │[__]│$1000 │[x]│
│ │ 2 │ [_________] │[_] │[__]│$500  │[x]│
│ └───┴─────────────┴────┴────┴──────┘   │
│                     Subtotal:  $1,500   │
│           Discount (10%):    -$150      │
│                  Tax (8%):    +$108     │
│                  ──────────────────     │
│                       Total:  $1,458    │
├─────────────────────────────────────────┤
│ Notes: [________________]               │
│ Terms: [________________]               │
├─────────────────────────────────────────┤
│        [Save Draft] [Save & Send PDF]   │
└─────────────────────────────────────────┘
```

---

### Story 2.2: Build Invoice Creation UI

**Story ID**: STORY-2.2
**Priority**: P0
**Estimate**: 4 hours
**Status**: Not Started

**As an** accountant
**I want** a user-friendly form to create invoices
**So that** I can bill customers for completed work

**Acceptance Criteria**:
- [ ] Invoice creation form accessible from main navigation
- [ ] Form includes all invoice fields: customer, contact, date, due date, payment terms
- [ ] Line item editor similar to quote line items
- [ ] Can specify payment terms (Net 15, Net 30, etc.) which auto-sets due date
- [ ] All calculations working (subtotal, discount, tax, total, balance due)
- [ ] Can save invoice as Draft or mark as Sent
- [ ] Shows invoice number automatically (INV-2024-001 format)
- [ ] Validation: required fields, positive numbers, due date after invoice date

**Technical Notes**:
- Location: `/packages/twenty-front/src/modules/invoices/components/`
- Components: `InvoiceForm.tsx`, `InvoiceLineItemEditor.tsx`
- Reuse line item editor components from quotes where possible
- GraphQL mutation: `createInvoice`, `updateInvoice`

---

### Story 2.3: Implement PDF Generation for Quotes

**Story ID**: STORY-2.3
**Priority**: P0
**Estimate**: 6 hours
**Status**: Not Started

**As a** sales representative
**I want** to generate professional PDF quotes with company branding
**So that** I can send polished documents to customers

**Acceptance Criteria**:
- [ ] PDF generation works for any quote
- [ ] PDF includes company logo and branding
- [ ] PDF shows all quote details: customer, contact, date, quote number
- [ ] PDF displays line items in a clean table format
- [ ] PDF shows subtotal, discount, tax, total with clear formatting
- [ ] PDF includes payment terms and notes sections
- [ ] PDF footer includes company contact information
- [ ] PDF can be downloaded from quote detail page
- [ ] PDF generation completes in < 5 seconds

**Technical Notes**:
- Location: `/packages/twenty-server/src/modules/pdf-generation/`
- Use **react-pdf** library for PDF generation
- Create template: `QuoteTemplate.tsx`
- Service: `PdfGenerationService.ts` with method `generateQuotePdf(quoteId: string): Promise<Buffer>`
- API endpoint: `/api/quotes/:id/pdf` (REST endpoint for file download)
- Store company logo in workspace settings or environment variable

**PDF Template Layout**:
```
┌──────────────────────────────────────────┐
│ [LOGO]              QUOTE                │
│ Phos Industries                          │
│ 123 Main St                  Quote #: Q-001│
│ City, State 12345            Date: 1/24/24│
│                        Valid Until: 2/24/24│
├──────────────────────────────────────────┤
│ Bill To:                                 │
│ Customer Name                            │
│ Contact Person                           │
│ Company Address                          │
├──────────────────────────────────────────┤
│ Item │ Description    │ Qty│Rate │Total  │
│──────┼────────────────┼────┼─────┼───────│
│  1   │ Consulting Hrs │ 10 │$100 │$1,000 │
│  2   │ Equipment      │  1 │$500 │  $500 │
│                          Subtotal: $1,500 │
│                       Discount 10%: -$150 │
│                            Tax 8%: +$108  │
│                            ─────────────  │
│                             Total: $1,458 │
├──────────────────────────────────────────┤
│ Payment Terms: Net 30                    │
│ Notes: [Customer notes]                  │
├──────────────────────────────────────────┤
│ Footer: Phos Industries | phos.solutions│
│         ben@phos.solutions | 555-1234    │
└──────────────────────────────────────────┘
```

---

### Story 2.4: Implement PDF Generation for Invoices

**Story ID**: STORY-2.4
**Priority**: P0
**Estimate**: 4 hours
**Status**: Not Started

**As an** accountant
**I want** to generate professional PDF invoices
**So that** I can send official bills to customers

**Acceptance Criteria**:
- [ ] PDF generation works for any invoice
- [ ] PDF includes company logo and branding
- [ ] PDF shows all invoice details: customer, invoice number, date, due date
- [ ] PDF displays line items in a clean table format
- [ ] PDF shows subtotal, discount, tax, total, paid amount, balance due
- [ ] PDF includes payment instructions (bank details, Stripe link later)
- [ ] PDF can be downloaded from invoice detail page
- [ ] PDF generation completes in < 5 seconds

**Technical Notes**:
- Reuse PDF infrastructure from Story 2.3
- Create template: `InvoiceTemplate.tsx`
- Method: `generateInvoicePdf(invoiceId: string): Promise<Buffer>`
- API endpoint: `/api/invoices/:id/pdf`

---

### Story 2.5: Create Email Templates and Sending Functionality

**Story ID**: STORY-2.5
**Priority**: P0
**Estimate**: 5 hours
**Status**: Not Started

**As a** sales representative
**I want** to send quotes and invoices via email
**So that** customers receive documents immediately

**Acceptance Criteria**:
- [ ] Email template for quotes with professional design
- [ ] Email template for invoices with professional design
- [ ] "Send Email" button on quote detail page
- [ ] "Send Email" button on invoice detail page
- [ ] Email includes PDF attachment
- [ ] Email body has customizable message with defaults
- [ ] Email uses workspace email settings (SMTP or service integration)
- [ ] Sent emails logged in timeline activities
- [ ] Error handling for failed email sends
- [ ] Testing mode: emails only go to @phos.solutions addresses

**Technical Notes**:
- Location: `/packages/twenty-emails/src/templates/`
- Use React Email for email templates
- Templates: `QuoteEmail.tsx`, `InvoiceEmail.tsx`
- Service: `EmailService.ts` with methods `sendQuoteEmail(quoteId, recipientEmail, message)`, `sendInvoiceEmail(invoiceId, recipientEmail, message)`
- CRITICAL: Testing email constrained to @phos.solutions domain only
- Use existing Twenty email infrastructure (MessageChannel)

**Email Template (Quote)**:
```
Subject: Quote Q-001 from Phos Industries

Hi [Contact Name],

Thank you for your interest! Please find attached our quote for [Project Name].

[Custom message from user]

Quote Details:
- Quote Number: Q-001
- Date: January 24, 2024
- Valid Until: February 24, 2024
- Total: $1,458

Please review and let us know if you have any questions.

Best regards,
Phos Industries
ben@phos.solutions
https://phos.solutions

[Attachment: Quote-Q-001.pdf]
```

---

### Story 2.6: Build Quote-to-Invoice Conversion Workflow

**Story ID**: STORY-2.6
**Priority**: P0
**Estimate**: 3 hours
**Status**: Not Started

**As a** sales representative
**I want** to convert an accepted quote to an invoice with one click
**So that** I don't have to re-enter all the line items

**Acceptance Criteria**:
- [ ] "Convert to Invoice" button appears on quote detail page when status is "Accepted"
- [ ] Click button opens invoice creation form pre-filled with quote data
- [ ] All line items copied from quote to invoice
- [ ] Customer, contact, project copied from quote
- [ ] Discount and tax percentages copied
- [ ] Invoice date set to today, due date calculated from payment terms
- [ ] Invoice linked to original quote (invoice.quote relation)
- [ ] Can edit invoice before saving
- [ ] Saving invoice marks quote as "Converted"

**Technical Notes**:
- GraphQL mutation: `convertQuoteToInvoice(quoteId: string): Promise<Invoice>`
- Backend logic: Copy all quote data, create new invoice with status "Draft", link to quote
- Update quote status to prevent double conversion
- Location: `/packages/twenty-server/src/modules/invoices/services/invoice-conversion.service.ts`

---

### Story 2.7: Build Invoice Payment Tracking UI

**Story ID**: STORY-2.7
**Priority**: P0
**Estimate**: 4 hours
**Status**: Not Started

**As an** accountant
**I want** to record payments received for invoices
**So that** I can track which invoices are paid and which are outstanding

**Acceptance Criteria**:
- [ ] Invoice detail page shows "Payments" section
- [ ] "Add Payment" button opens payment entry form
- [ ] Payment form includes: date, amount, payment method, reference number, notes
- [ ] Payments table shows all payments for invoice with dates and amounts
- [ ] Invoice balance due updates automatically (total - sum of payments)
- [ ] Invoice status updates automatically (Paid when balanceDue = 0, Partial when balanceDue > 0)
- [ ] Can edit or delete payments (soft delete)
- [ ] Validation: payment amount cannot exceed balance due

**Technical Notes**:
- Location: `/packages/twenty-front/src/modules/invoices/components/`
- Components: `InvoicePaymentSection.tsx`, `PaymentForm.tsx`, `PaymentList.tsx`
- GraphQL mutations: `createPayment`, `updatePayment`, `deletePayment`
- Use GraphQL subscriptions or refetch to update invoice status in real-time

---

## Technical Risks

1. **PDF Generation Performance**: Large invoices with many line items may be slow
   - Mitigation: Implement background job for PDF generation if needed, cache generated PDFs

2. **Email Delivery Reliability**: Email may fail due to SMTP configuration or spam filters
   - Mitigation: Implement retry logic, log all email attempts, provide manual PDF download

3. **Number Collision**: Quote/invoice numbering may have race conditions
   - Mitigation: Use database sequences or optimistic locking

4. **Calculation Accuracy**: Floating-point arithmetic may cause rounding errors
   - Mitigation: Use Decimal type for currency, round to 2 decimal places consistently

## Testing Strategy

1. **Unit Tests**: Test calculation functions (subtotal, tax, total, balance due)
2. **Integration Tests**: Test quote-to-invoice conversion, payment recording
3. **E2E Tests**: Full workflow - create quote, send email, convert to invoice, record payment
4. **Manual Testing**: Generate PDFs, send test emails to @phos.solutions addresses
5. **Edge Cases**: Test with large line item counts (50+), extreme values, $0 invoices

## Documentation Needs

- [ ] User guide: How to create quotes and invoices
- [ ] User guide: How to send quotes via email
- [ ] User guide: How to convert quotes to invoices
- [ ] User guide: How to record payments
- [ ] Admin guide: Email configuration (SMTP settings)
- [ ] Admin guide: Customizing PDF templates (logo, branding)

---

## Notes

This epic delivers core revenue-generating functionality. PDF quality and email reliability are critical for professional appearance to customers.

**CRITICAL REMINDERS**:
- Testing email must only go to @phos.solutions addresses
- PDF templates should use company branding (logo, colors)
- All currency calculations must be precise (use Decimal type)
