# Epic 002: Quoting & Billing - UI and PDF Generation

**Epic ID**: EPIC-002
**Phase**: Phase 2 (Weeks 3-4)
**Priority**: P0 (Critical)
**Status**: Ready for Development
**Owner**: TBD
**Created**: 2026-01-24
**Updated**: 2026-01-28 (Developer specs added)
**Target Completion**: Week 4

---

## Pre-Requisites Completed

✅ **Data Model (Epic 001 - phos-seeder)**:
- `quote` object with fields: quoteNumber, quoteDate, expiryDate, status, subtotal, discountPercentage, discountAmount, taxPercentage, taxAmount, total, notes, internalNotes, terms, version
- `quoteLineItem` object with fields: quantity, unitPrice, subtotal, serviceCategory, sortOrder
- `invoice` object with fields: invoiceNumber, invoiceDate, dueDate, status, subtotal/discount/tax/total, paidAmount, balanceDue, stripeInvoiceId, stripePaymentStatus, stripePaymentLink
- `invoiceLineItem` object with same structure as quoteLineItem
- `payment` object for tracking payments against invoices

✅ **Email Composer (Epic 000)**:
- Email sending infrastructure working
- Email templates with variable substitution
- Can send from connected Gmail account

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
- **Blocked By**:
  - Epic 001 (Foundation) - requires Quote, Invoice, Payment objects
  - Epic 000 (Email Composer) - integration for sending documents
- **Integrates With**:
  - Epic 000 (Email Composer) - modular template/variable extension
  - Epic 009 (Inventory) - future product picker in line items

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

---

#### Developer Specification

**File Structure**:
```
packages/twenty-front/src/modules/quotes/
├── components/
│   ├── QuoteForm.tsx                    # Main form component
│   ├── QuoteLineItemEditor.tsx          # Line items table with add/remove
│   ├── QuoteLineItemRow.tsx             # Single line item row
│   ├── QuoteSummary.tsx                 # Subtotal/discount/tax/total display
│   └── QuoteStatusBadge.tsx             # Status indicator
├── hooks/
│   ├── useQuoteForm.ts                  # Form state management (Recoil)
│   ├── useQuoteLineItems.ts             # Line item CRUD operations
│   ├── useQuoteCalculations.ts          # Auto-calculate subtotals/totals
│   └── useQuoteNumberGenerator.ts       # Q-YYYY-NNN format generation
├── states/
│   ├── quoteFormState.ts                # Recoil atoms for form
│   └── quoteLineItemsState.ts           # Recoil atoms for line items
├── types/
│   └── quote.types.ts                   # TypeScript interfaces
└── graphql/
    ├── createQuote.ts                   # GraphQL mutation
    ├── updateQuote.ts                   # GraphQL mutation
    └── createQuoteLineItem.ts           # GraphQL mutation
```

**Key Implementation Details**:

1. **Quote Number Generation** (Backend):
   ```typescript
   // packages/twenty-server/src/modules/quotes/services/quote-number.service.ts
   async generateQuoteNumber(workspaceId: string): Promise<string> {
     const year = new Date().getFullYear();
     const prefix = 'Q';
     // Use atomic counter or sequence per workspace per year
     const sequence = await this.getNextSequence(workspaceId, year);
     return `${prefix}-${year}-${sequence.toString().padStart(3, '0')}`;
   }
   ```

2. **Line Item Calculations** (Frontend):
   ```typescript
   // useQuoteCalculations.ts
   const calculateLineItemSubtotal = (qty: number, unitPrice: number) => {
     return Number((qty * unitPrice).toFixed(2));
   };

   const calculateQuoteTotals = (lineItems, discountPct, taxPct) => {
     const subtotal = lineItems.reduce((sum, item) => sum + item.subtotal, 0);
     const discountAmount = subtotal * (discountPct / 100);
     const taxableAmount = subtotal - discountAmount;
     const taxAmount = taxableAmount * (taxPct / 100);
     const total = taxableAmount + taxAmount;
     return { subtotal, discountAmount, taxAmount, total };
   };
   ```

3. **GraphQL Mutations**:
   - Use Twenty's standard `createOneRecord` and `createManyRecords` for quote + line items
   - Transaction: Create quote first, then create line items with `quoteId` relation

4. **Relations** (Already in phos-seeder):
   - Quote → Company (many-to-one)
   - Quote → Person (many-to-one, contact)
   - Quote → Project (many-to-one, optional)
   - QuoteLineItem → Quote (many-to-one)

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

**Testing Requirements**:
- Unit test: `useQuoteCalculations` with edge cases (0 qty, negative, decimals)
- Integration test: Create quote with 5 line items, verify totals
- E2E test: Full quote creation flow via UI

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

---

#### Developer Specification

**File Structure**:
```
packages/twenty-server/src/modules/pdf-generation/
├── pdf-generation.module.ts
├── pdf-generation.controller.ts         # REST endpoints for PDF download
├── services/
│   ├── pdf-generation.service.ts        # Core PDF generation logic
│   └── pdf-template.service.ts          # Template rendering
├── templates/
│   ├── QuotePdfTemplate.tsx             # React-PDF quote template
│   ├── InvoicePdfTemplate.tsx           # React-PDF invoice template
│   └── components/
│       ├── PdfHeader.tsx                # Company logo/info header
│       ├── PdfLineItemsTable.tsx        # Line items table
│       ├── PdfTotalsSection.tsx         # Subtotal/discount/tax/total
│       └── PdfFooter.tsx                # Company contact footer
├── types/
│   └── pdf.types.ts
└── constants/
    └── pdf-styles.ts                    # Shared styles for PDF
```

**Key Implementation Details**:

1. **PDF Library**: Use `@react-pdf/renderer` (server-side rendering)
   ```bash
   yarn add @react-pdf/renderer
   ```

2. **REST Endpoint** (not GraphQL for binary download):
   ```typescript
   // pdf-generation.controller.ts
   @Controller('pdf')
   export class PdfGenerationController {
     @Get('quote/:quoteId')
     @UseGuards(AuthGuard)
     async downloadQuotePdf(
       @Param('quoteId') quoteId: string,
       @Res() res: Response,
     ) {
       const pdf = await this.pdfService.generateQuotePdf(quoteId);
       res.set({
         'Content-Type': 'application/pdf',
         'Content-Disposition': `attachment; filename="Quote-${quoteNumber}.pdf"`,
       });
       res.send(pdf);
     }
   }
   ```

3. **React-PDF Template**:
   ```tsx
   // templates/QuotePdfTemplate.tsx
   import { Document, Page, Text, View, Image, StyleSheet } from '@react-pdf/renderer';

   export const QuotePdfTemplate = ({ quote, company, lineItems }) => (
     <Document>
       <Page size="LETTER" style={styles.page}>
         <PdfHeader company={company} documentType="QUOTE" documentNumber={quote.quoteNumber} />
         <PdfBillTo customer={quote.company} contact={quote.person} />
         <PdfLineItemsTable items={lineItems} />
         <PdfTotalsSection
           subtotal={quote.subtotal}
           discountPct={quote.discountPercentage}
           discountAmt={quote.discountAmount}
           taxPct={quote.taxPercentage}
           taxAmt={quote.taxAmount}
           total={quote.total}
         />
         <PdfNotes notes={quote.notes} terms={quote.terms} />
         <PdfFooter company={company} />
       </Page>
     </Document>
   );
   ```

4. **Company Branding & Template Customization**:

   **IMPORTANT**: PDF templates must be modular and customizable per workspace, similar to email templates. Sensible defaults with room for customization.

   ```typescript
   // Custom object: pdfTemplate (via phos-seeder)
   // Allows workspaces to customize their document templates
   {
     nameSingular: 'pdfTemplate',
     fields: [
       { name: 'name', type: 'TEXT' },           // "Default Quote", "Minimal Invoice"
       { name: 'templateType', type: 'SELECT' }, // QUOTE, INVOICE
       { name: 'isDefault', type: 'BOOLEAN' },   // Default template for type
       { name: 'logoUrl', type: 'LINKS' },       // Company logo
       { name: 'primaryColor', type: 'TEXT' },   // Hex color for headers
       { name: 'companyName', type: 'TEXT' },
       { name: 'companyAddress', type: 'TEXT' },
       { name: 'companyPhone', type: 'TEXT' },
       { name: 'companyEmail', type: 'TEXT' },
       { name: 'companyWebsite', type: 'TEXT' },
       { name: 'footerText', type: 'TEXT' },     // Custom footer message
       { name: 'showPaymentTerms', type: 'BOOLEAN' },
       { name: 'customCss', type: 'TEXT' },      // Advanced: custom styling
     ]
   }
   ```

   **Default Phos Industries Template**:
   ```typescript
   {
     name: 'Phos Industries Default',
     templateType: 'QUOTE',
     isDefault: true,
     logoUrl: 'https://media.phos-ind.com/assets/PhosLogo.png',
     primaryColor: '#0066cc',
     companyName: 'Phos Industries',
     companyAddress: '123 Main St, City, State 12345',
     companyPhone: '555-123-4567',
     companyEmail: 'ben@phos-ind.com',
     companyWebsite: 'https://phos.solutions',
     footerText: 'Thank you for your business!',
     showPaymentTerms: true,
   }
   ```

   **Template Selection in PDF Generation**:
   ```typescript
   async generateQuotePdf(quoteId: string, templateId?: string) {
     // Use specified template or workspace default
     const template = templateId
       ? await this.getTemplate(templateId)
       : await this.getDefaultTemplate(workspaceId, 'QUOTE');

     return this.renderPdf(quote, template);
   }
   ```

5. **Frontend Integration**:
   ```typescript
   // hooks/useDownloadQuotePdf.ts
   export const useDownloadQuotePdf = () => {
     const downloadPdf = async (quoteId: string, quoteNumber: string) => {
       const response = await fetch(`/api/pdf/quote/${quoteId}`, {
         headers: { Authorization: `Bearer ${token}` },
       });
       const blob = await response.blob();
       const url = window.URL.createObjectURL(blob);
       const a = document.createElement('a');
       a.href = url;
       a.download = `Quote-${quoteNumber}.pdf`;
       a.click();
     };
     return { downloadPdf };
   };
   ```

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

**Testing Requirements**:
- Unit test: PDF generation with mock data
- Integration test: Generate PDF for real quote, verify file size > 0
- Manual test: Visual inspection of PDF layout in Chrome, Preview, Adobe Reader

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

---

#### Developer Specification

**Approach**: Leverage existing Email Composer (Epic 000) with pre-filled context and PDF attachment.

**File Structure**:
```
packages/twenty-front/src/modules/quotes/
├── components/
│   └── QuoteSendEmailButton.tsx         # Opens email composer with quote context
└── hooks/
    └── useSendQuoteEmail.ts             # Pre-fill composer + attach PDF

packages/twenty-front/src/modules/invoices/
├── components/
│   └── InvoiceSendEmailButton.tsx       # Opens email composer with invoice context
└── hooks/
    └── useSendInvoiceEmail.ts           # Pre-fill composer + attach PDF

packages/twenty-server/src/modules/pdf-generation/
└── services/
    └── pdf-attachment.service.ts        # Generate PDF and return as attachment
```

**Key Implementation Details**:

1. **Reuse Email Composer**:
   ```typescript
   // useSendQuoteEmail.ts
   export const useSendQuoteEmail = () => {
     const { openEmailComposer } = useEmailComposer();

     const sendQuoteEmail = async (quote: Quote, contact: Person) => {
       // Generate PDF first
       const pdfBlob = await fetch(`/api/pdf/quote/${quote.id}`).then(r => r.blob());
       const pdfFile = new File([pdfBlob], `Quote-${quote.quoteNumber}.pdf`, { type: 'application/pdf' });

       openEmailComposer({
         defaultTo: contact.emails?.primaryEmail ?? '',
         defaultSubject: `Quote ${quote.quoteNumber} from Phos Industries`,
         defaultBody: getQuoteEmailTemplate(quote, contact),
         context: {
           personFirstName: contact.name?.firstName ?? '',
           companyName: quote.company?.name ?? '',
         },
         attachments: [pdfFile],
       });
     };

     return { sendQuoteEmail };
   };
   ```

2. **Default Email Template** (in frontend):
   ```typescript
   const getQuoteEmailTemplate = (quote: Quote, contact: Person) => `
   Hi ${contact.name?.firstName || 'there'},

   Thank you for your interest! Please find attached our quote.

   Quote Details:
   • Quote Number: ${quote.quoteNumber}
   • Date: ${formatDate(quote.quoteDate)}
   • Valid Until: ${formatDate(quote.expiryDate)}
   • Total: ${formatCurrency(quote.total)}

   Please review and let us know if you have any questions.

   Best regards,
   Phos Industries
   `;
   ```

3. **PDF Attachment Support**:
   - Modify `EmailComposeModal` to support file attachments
   - Add `attachments` field to `EmailComposeModalOptions`
   - Upload attachments to Twenty's file storage before sending

4. **Quote Status Update**:
   - After successful email send, update quote.status to 'SENT'
   - Use `onSendSuccess` callback from email composer

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

**Testing Requirements**:
- Integration test: Send quote email, verify PDF attachment
- E2E test: Full flow - create quote, click send, verify email sent
- **CRITICAL**: Test email recipients must be @phos-ind.com or @phos.solutions only

---

### Story 2.5.1: Email Composer Integration for Quotes/Invoices

**Story ID**: STORY-2.5.1
**Priority**: P0
**Estimate**: 4 hours
**Status**: Not Started

**As a** sales representative
**I want** quote and invoice email templates integrated with the email composer
**So that** I have a unified email experience with document-specific templates

**Acceptance Criteria**:
- [ ] Quote/Invoice email templates appear in Email Composer template selector
- [ ] Templates only visible when `IS_QUOTING_BILLING_ENABLED` feature flag is on
- [ ] Email composer Settings page shows Quote/Invoice template section (gated by feature flag)
- [ ] Default templates: "Send Quote", "Send Invoice", "Quote Follow-up", "Payment Reminder"
- [ ] Templates use document-specific variables: `{{quote.number}}`, `{{invoice.total}}`, etc.
- [ ] "Send Quote" / "Send Invoice" buttons use email composer with pre-selected template
- [ ] PDF auto-attached when sending from quote/invoice detail page

---

#### Developer Specification

**Modular Architecture**:
```
Email Composer (Epic 000)           Quoting/Billing (Epic 002)
┌─────────────────────────┐        ┌─────────────────────────┐
│ Core Email Composer     │        │ Quote/Invoice Module    │
│ - Base templates        │◄───────│ - Document templates    │
│ - Variable system       │        │ - PDF attachment        │
│ - Template settings     │        │ - Document variables    │
└─────────────────────────┘        └─────────────────────────┘
         ▲                                    │
         │                                    │
         └────────────────────────────────────┘
              Feature flag gated integration
```

**1. Template Category Extension**:
```typescript
// Update emailComposerSettingsState.ts
export type LocalEmailTemplate = {
  // ... existing fields
  category: 'GENERAL' | 'SALES' | 'SUPPORT' | 'FOLLOW_UP' | 'QUOTE' | 'INVOICE'; // Extended
  /** Module that owns this template - for feature flag gating */
  moduleSource?: 'core' | 'quoting-billing' | 'inventory';
};
```

**2. Feature Flag Gating in Template Selector**:
```typescript
// EmailTemplateSelector.tsx
export const EmailTemplateSelector = () => {
  const isQuotingBillingEnabled = useIsFeatureEnabled(
    FeatureFlagKey.IS_QUOTING_BILLING_ENABLED
  );

  const filteredTemplates = useMemo(() => {
    return templates.filter(template => {
      // Hide quoting/billing templates if module disabled
      if (template.moduleSource === 'quoting-billing' && !isQuotingBillingEnabled) {
        return false;
      }
      return true;
    });
  }, [templates, isQuotingBillingEnabled]);

  // ... render
};
```

**3. Email Composer Settings Extension**:
```typescript
// SettingsAccountsEmailComposerSettings.tsx
export const SettingsAccountsEmailComposerSettings = () => {
  const isQuotingBillingEnabled = useIsFeatureEnabled(
    FeatureFlagKey.IS_QUOTING_BILLING_ENABLED
  );

  return (
    <>
      {/* Core email settings - always shown */}
      <Section>
        <H2Title title="General Templates" />
        <TemplateList category={['GENERAL', 'SALES', 'SUPPORT', 'FOLLOW_UP']} />
      </Section>

      {/* Quoting/Billing templates - gated */}
      {isQuotingBillingEnabled && (
        <Section>
          <H2Title
            title="Quote & Invoice Templates"
            description="Templates for sending quotes and invoices"
          />
          <TemplateList category={['QUOTE', 'INVOICE']} />
        </Section>
      )}
    </>
  );
};
```

**4. Document-Specific Variables**:
```typescript
// Add to BUILT_IN_VARIABLES in emailComposerSettingsState.ts
export const QUOTE_INVOICE_VARIABLES = [
  // Quote variables
  { key: 'quote.number', label: 'Quote Number', moduleSource: 'quoting-billing' },
  { key: 'quote.date', label: 'Quote Date', moduleSource: 'quoting-billing' },
  { key: 'quote.expiryDate', label: 'Quote Expiry', moduleSource: 'quoting-billing' },
  { key: 'quote.total', label: 'Quote Total', moduleSource: 'quoting-billing' },
  { key: 'quote.subtotal', label: 'Quote Subtotal', moduleSource: 'quoting-billing' },

  // Invoice variables
  { key: 'invoice.number', label: 'Invoice Number', moduleSource: 'quoting-billing' },
  { key: 'invoice.date', label: 'Invoice Date', moduleSource: 'quoting-billing' },
  { key: 'invoice.dueDate', label: 'Invoice Due Date', moduleSource: 'quoting-billing' },
  { key: 'invoice.total', label: 'Invoice Total', moduleSource: 'quoting-billing' },
  { key: 'invoice.balanceDue', label: 'Balance Due', moduleSource: 'quoting-billing' },
  { key: 'invoice.paymentLink', label: 'Payment Link', moduleSource: 'quoting-billing' },
];

// Filter variables by enabled modules
export const useAvailableVariables = () => {
  const isQuotingBillingEnabled = useIsFeatureEnabled(
    FeatureFlagKey.IS_QUOTING_BILLING_ENABLED
  );

  return useMemo(() => {
    const variables = [...BUILT_IN_VARIABLES];
    if (isQuotingBillingEnabled) {
      variables.push(...QUOTE_INVOICE_VARIABLES);
    }
    return variables;
  }, [isQuotingBillingEnabled]);
};
```

**5. Default Quote/Invoice Templates**:
```typescript
// Add to DEFAULT_EMAIL_TEMPLATES (gated by moduleSource)
export const QUOTE_INVOICE_DEFAULT_TEMPLATES: Omit<LocalEmailTemplate, 'id' | 'createdAt' | 'updatedAt'>[] = [
  {
    name: 'Send Quote',
    subject: 'Quote {{quote.number}} from {{myCompany.name}}',
    body: `<p>Hi {{person.firstName}},</p>
<p>Thank you for your interest! Please find attached our quote.</p>
<p><strong>Quote Details:</strong></p>
<ul>
  <li>Quote Number: {{quote.number}}</li>
  <li>Date: {{quote.date}}</li>
  <li>Valid Until: {{quote.expiryDate}}</li>
  <li>Total: {{quote.total}}</li>
</ul>
<p>Please review and let us know if you have any questions.</p>
<p>Best regards,<br>{{sender.firstName}}</p>`,
    bodyFormat: 'html',
    category: 'QUOTE',
    moduleSource: 'quoting-billing',
    isActive: true,
  },
  {
    name: 'Send Invoice',
    subject: 'Invoice {{invoice.number}} from {{myCompany.name}}',
    body: `<p>Hi {{person.firstName}},</p>
<p>Please find attached your invoice.</p>
<p><strong>Invoice Details:</strong></p>
<ul>
  <li>Invoice Number: {{invoice.number}}</li>
  <li>Date: {{invoice.date}}</li>
  <li>Due Date: {{invoice.dueDate}}</li>
  <li>Amount Due: {{invoice.balanceDue}}</li>
</ul>
<p>{{invoice.paymentLink}}</p>
<p>Thank you for your business!</p>
<p>Best regards,<br>{{sender.firstName}}</p>`,
    bodyFormat: 'html',
    category: 'INVOICE',
    moduleSource: 'quoting-billing',
    isActive: true,
  },
  {
    name: 'Quote Follow-up',
    subject: 'Following up on Quote {{quote.number}}',
    body: `<p>Hi {{person.firstName}},</p>
<p>I wanted to follow up on the quote I sent over recently.</p>
<p>The quote ({{quote.number}}) for {{quote.total}} is valid until {{quote.expiryDate}}.</p>
<p>Do you have any questions I can help answer?</p>
<p>Best regards,<br>{{sender.firstName}}</p>`,
    bodyFormat: 'html',
    category: 'QUOTE',
    moduleSource: 'quoting-billing',
    isActive: true,
  },
  {
    name: 'Payment Reminder',
    subject: 'Payment Reminder: Invoice {{invoice.number}}',
    body: `<p>Hi {{person.firstName}},</p>
<p>This is a friendly reminder that invoice {{invoice.number}} for {{invoice.balanceDue}} is due on {{invoice.dueDate}}.</p>
<p>If you've already sent payment, please disregard this message.</p>
<p>{{invoice.paymentLink}}</p>
<p>Please let me know if you have any questions.</p>
<p>Best regards,<br>{{sender.firstName}}</p>`,
    bodyFormat: 'html',
    category: 'INVOICE',
    moduleSource: 'quoting-billing',
    isActive: true,
  },
];
```

**6. Send Quote/Invoice with Email Composer**:
```typescript
// useSendQuoteEmail.ts - Updated to use composer properly
export const useSendQuoteEmail = () => {
  const { openEmailComposer } = useEmailComposer();
  const { data: templates } = useEmailTemplates();

  const sendQuoteEmail = async (quote: Quote, contact: Person) => {
    // Find default "Send Quote" template
    const quoteTemplate = templates?.find(
      t => t.category === 'QUOTE' && t.name === 'Send Quote'
    );

    // Generate PDF for attachment
    const pdfBlob = await fetch(`/api/pdf/quote/${quote.id}`).then(r => r.blob());
    const pdfFile = new File(
      [pdfBlob],
      `Quote-${quote.quoteNumber}.pdf`,
      { type: 'application/pdf' }
    );

    openEmailComposer({
      defaultTo: contact.emails?.primaryEmail ?? '',
      defaultSubject: quoteTemplate?.subject ?? `Quote ${quote.quoteNumber}`,
      defaultBody: quoteTemplate?.body,
      templateId: quoteTemplate?.id,
      context: {
        // Person context
        personFirstName: contact.name?.firstName ?? '',
        personLastName: contact.name?.lastName ?? '',
        companyName: quote.company?.name ?? '',
        // Quote-specific context
        'quote.number': quote.quoteNumber,
        'quote.date': formatDate(quote.quoteDate),
        'quote.expiryDate': formatDate(quote.expiryDate),
        'quote.total': formatCurrency(quote.total),
        'quote.subtotal': formatCurrency(quote.subtotal),
      },
      attachments: [pdfFile],
      onSendSuccess: () => {
        // Update quote status to SENT
        updateQuoteStatus(quote.id, 'SENT');
      },
    });
  };

  return { sendQuoteEmail };
};
```

**File Structure**:
```
packages/twenty-front/src/modules/email-composer/
├── constants/
│   └── quoteInvoiceVariables.ts          # Document-specific variables
├── hooks/
│   ├── useAvailableVariables.ts          # Filter by enabled modules
│   └── useModuleTemplates.ts             # Get templates by module
└── utils/
    └── templateModuleFilter.ts           # Feature flag filtering logic

packages/twenty-front/src/modules/quotes/
└── hooks/
    └── useSendQuoteEmail.ts              # Quote-specific email sending

packages/twenty-front/src/modules/invoices/
└── hooks/
    └── useSendInvoiceEmail.ts            # Invoice-specific email sending
```

**Testing Requirements**:
- Unit test: Template filtering by feature flag
- Unit test: Variable availability by module
- Integration test: Send quote email with all variables substituted
- E2E test: Disable feature flag, verify quote templates hidden

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

---

#### Developer Specification

**File Structure**:
```
packages/twenty-server/src/modules/invoice-conversion/
├── invoice-conversion.module.ts
├── invoice-conversion.resolver.ts
└── services/
    └── invoice-conversion.service.ts

packages/twenty-front/src/modules/quotes/
├── components/
│   └── QuoteConvertToInvoiceButton.tsx
└── hooks/
    └── useConvertQuoteToInvoice.ts
```

**Key Implementation Details**:

1. **GraphQL Mutation**:
   ```graphql
   type Mutation {
     convertQuoteToInvoice(quoteId: ID!): Invoice!
   }
   ```

2. **Backend Service**:
   ```typescript
   // invoice-conversion.service.ts
   @Injectable()
   export class InvoiceConversionService {
     async convertQuoteToInvoice(
       workspaceId: string,
       quoteId: string,
     ): Promise<Invoice> {
       // 1. Fetch quote with line items
       const quote = await this.quoteRepo.findOne({
         where: { id: quoteId },
         relations: ['lineItems', 'company', 'person', 'project'],
       });

       if (!quote) throw new NotFoundException('Quote not found');
       if (quote.status !== 'ACCEPTED') {
         throw new BadRequestException('Only accepted quotes can be converted');
       }

       // 2. Generate invoice number
       const invoiceNumber = await this.invoiceNumberService.generate(workspaceId);

       // 3. Create invoice
       const invoice = await this.invoiceRepo.save({
         invoiceNumber,
         invoiceDate: new Date(),
         dueDate: addDays(new Date(), 30), // Default Net 30
         status: 'DRAFT',
         company: quote.company,
         person: quote.person,
         project: quote.project,
         quote: quote, // Link back to quote
         subtotal: quote.subtotal,
         discountPercentage: quote.discountPercentage,
         discountAmount: quote.discountAmount,
         taxPercentage: quote.taxPercentage,
         taxAmount: quote.taxAmount,
         total: quote.total,
         paidAmount: { amountMicros: 0, currencyCode: 'USD' },
         balanceDue: quote.total,
         notes: quote.notes,
         terms: quote.terms,
       });

       // 4. Copy line items
       const invoiceLineItems = quote.lineItems.map(li => ({
         invoice: invoice,
         name: li.name,
         quantity: li.quantity,
         unitPrice: li.unitPrice,
         subtotal: li.subtotal,
         serviceCategory: li.serviceCategory,
         sortOrder: li.sortOrder,
       }));
       await this.invoiceLineItemRepo.save(invoiceLineItems);

       // 5. Update quote status to CONVERTED
       await this.quoteRepo.update(quoteId, { status: 'CONVERTED' });

       return invoice;
     }
   }
   ```

3. **Frontend Hook**:
   ```typescript
   // useConvertQuoteToInvoice.ts
   export const useConvertQuoteToInvoice = () => {
     const [convertMutation, { loading }] = useConvertQuoteToInvoiceMutation();
     const navigate = useNavigate();
     const { enqueueSuccessSnackBar } = useSnackBar();

     const convertQuoteToInvoice = async (quoteId: string) => {
       const { data } = await convertMutation({ variables: { quoteId } });
       if (data?.convertQuoteToInvoice) {
         enqueueSuccessSnackBar({ message: 'Invoice created from quote' });
         // Navigate to new invoice for review
         navigate(`/objects/invoice/${data.convertQuoteToInvoice.id}`);
       }
     };

     return { convertQuoteToInvoice, loading };
   };
   ```

4. **Button Component**:
   ```tsx
   // QuoteConvertToInvoiceButton.tsx
   export const QuoteConvertToInvoiceButton = ({ quote }) => {
     const { convertQuoteToInvoice, loading } = useConvertQuoteToInvoice();

     if (quote.status !== 'ACCEPTED') return null;

     return (
       <Button
         Icon={IconFileInvoice}
         title="Convert to Invoice"
         onClick={() => convertQuoteToInvoice(quote.id)}
         disabled={loading}
       />
     );
   };
   ```

**Testing Requirements**:
- Unit test: Conversion service with mock data
- Integration test: Full conversion flow, verify all fields copied
- Edge case: Prevent double conversion (quote already converted)

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

### Story 2.8: Build PDF Template Management System

**Story ID**: STORY-2.8
**Priority**: P1
**Estimate**: 5 hours
**Status**: Not Started

**As an** administrator
**I want** to customize PDF templates for quotes and invoices
**So that** documents match our company branding and other companies can customize theirs

**Acceptance Criteria**:
- [ ] PdfTemplate custom object created via phos-seeder
- [ ] Settings page for managing PDF templates
- [ ] Can create multiple templates per type (quote/invoice)
- [ ] Can set default template per type
- [ ] Templates include customizable: logo, colors, company info, footer
- [ ] Preview mode shows template with sample data
- [ ] Template selection available when generating PDF
- [ ] Default templates seeded on workspace creation

---

#### Developer Specification

**Data Model** (add to phos-seeder):
```typescript
// custom-objects/pdf-template-custom-object-seed.constant.ts
export const PDF_TEMPLATE_CUSTOM_OBJECT_SEED: ObjectMetadataSeed = {
  labelPlural: 'PDF Templates',
  labelSingular: 'PDF Template',
  namePlural: 'pdfTemplates',
  nameSingular: 'pdfTemplate',
  icon: 'IconFileDescription',
  description: 'Customizable templates for quotes and invoices',
};

// custom-fields/pdf-template-custom-field-seeds.constant.ts
export const PDF_TEMPLATE_CUSTOM_FIELD_SEEDS: FieldMetadataSeed[] = [
  { name: 'templateType', type: 'SELECT', options: [
    { label: 'Quote', value: 'QUOTE' },
    { label: 'Invoice', value: 'INVOICE' },
  ]},
  { name: 'isDefault', type: 'BOOLEAN', defaultValue: false },
  { name: 'logoUrl', type: 'LINKS' },
  { name: 'primaryColor', type: 'TEXT', defaultValue: '#0066cc' },
  { name: 'secondaryColor', type: 'TEXT', defaultValue: '#333333' },
  { name: 'companyName', type: 'TEXT' },
  { name: 'companyAddress', type: 'RICH_TEXT' },
  { name: 'companyPhone', type: 'PHONES' },
  { name: 'companyEmail', type: 'EMAILS' },
  { name: 'companyWebsite', type: 'LINKS' },
  { name: 'footerText', type: 'TEXT' },
  { name: 'showPaymentTerms', type: 'BOOLEAN', defaultValue: true },
  { name: 'showNotes', type: 'BOOLEAN', defaultValue: true },
  { name: 'termsAndConditions', type: 'RICH_TEXT' },
];
```

**File Structure**:
```
packages/twenty-front/src/modules/settings/pdf-templates/
├── components/
│   ├── SettingsPdfTemplatesPage.tsx      # List of templates
│   ├── SettingsPdfTemplateForm.tsx       # Create/edit form
│   ├── SettingsPdfTemplatePreview.tsx    # Live preview panel
│   └── PdfTemplateSelector.tsx           # Dropdown for selecting template
└── hooks/
    ├── usePdfTemplates.ts                # Fetch templates
    └── useDefaultPdfTemplate.ts          # Get default by type
```

**Default Templates** (seed on workspace creation):
```typescript
const DEFAULT_PDF_TEMPLATES = [
  {
    name: 'Professional Quote',
    templateType: 'QUOTE',
    isDefault: true,
    primaryColor: '#0066cc',
    showPaymentTerms: true,
    footerText: 'Thank you for your business!',
  },
  {
    name: 'Professional Invoice',
    templateType: 'INVOICE',
    isDefault: true,
    primaryColor: '#0066cc',
    showPaymentTerms: true,
    footerText: 'Payment due within terms. Thank you!',
  },
];
```

**Integration with PDF Generation**:
```typescript
// Updated pdf-generation.service.ts
async generateQuotePdf(quoteId: string, templateId?: string) {
  const quote = await this.fetchQuote(quoteId);

  // Get template - specified, or workspace default, or system default
  const template = templateId
    ? await this.getTemplate(templateId)
    : await this.getDefaultTemplate(quote.workspaceId, 'QUOTE');

  return this.renderPdf(QuotePdfTemplate, { quote, template });
}
```

**Testing Requirements**:
- Unit test: Template CRUD operations
- Integration test: PDF generation with custom template
- E2E test: Create template, generate PDF, verify branding applied

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

---

## Implementation Order

**Recommended sequence for development**:

1. **Story 2.1** - Quote Creation UI (5h)
   - Core UI component, establishes patterns for invoices
   - No backend dependencies beyond existing GraphQL

2. **Story 2.2** - Invoice Creation UI (4h)
   - Reuse components from 2.1
   - Same patterns, different object

3. **Story 2.3** - Quote PDF Generation (6h)
   - Backend REST endpoint for PDF download
   - React-PDF templates

4. **Story 2.4** - Invoice PDF Generation (4h)
   - Reuse PDF infrastructure from 2.3
   - Different template, same patterns

5. **Story 2.5** - Email Sending Basics (5h)
   - Depends on: 2.3, 2.4 (PDFs for attachments)
   - Leverages existing Email Composer (Epic 000)

5.1. **Story 2.5.1** - Email Composer Integration (4h)
   - Modular integration with feature flag gating
   - Quote/Invoice templates and variables
   - Settings page extension

6. **Story 2.6** - Quote-to-Invoice Conversion (3h)
   - Depends on: 2.1, 2.2 (both UIs must exist)
   - Backend mutation with transaction

7. **Story 2.7** - Payment Tracking UI (4h)
   - Depends on: 2.2 (Invoice UI)
   - Adds payment section to invoice detail page

8. **Story 2.8** - PDF Template Management (5h)
   - Can be developed in parallel with 2.3/2.4
   - Enables workspace customization of branding

**Total Estimate**: ~40 hours

---

## Modular Architecture

The Quoting & Billing module is designed to be **fully modular** and **feature flag gated**:

```
┌─────────────────────────────────────────────────────────────────┐
│                    Twenty CRM Core                               │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
│  │  Email Composer │  │   PDF Engine    │  │  Settings UI    │  │
│  │   (Epic 000)    │  │                 │  │                 │  │
│  └────────▲────────┘  └────────▲────────┘  └────────▲────────┘  │
│           │                    │                    │           │
│           │    Feature Flag: IS_QUOTING_BILLING_ENABLED         │
│           │                    │                    │           │
│  ┌────────┴────────────────────┴────────────────────┴────────┐  │
│  │              Quoting & Billing Module (Epic 002)          │  │
│  │  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐  │  │
│  │  │Quote/Invoice  │  │ PDF Templates │  │ Email         │  │  │
│  │  │Templates      │  │ (Branding)    │  │ Templates     │  │  │
│  │  │& Variables    │  │               │  │ (Quote/Inv)   │  │  │
│  │  └───────────────┘  └───────────────┘  └───────────────┘  │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                  │
│           │    Feature Flag: IS_INVENTORY_ENABLED               │
│           │                    │                    │           │
│  ┌────────┴────────────────────┴────────────────────┴────────┐  │
│  │              Inventory Module (Epic 009 - Future)          │  │
│  │  ┌───────────────┐  ┌───────────────┐                     │  │
│  │  │Product Picker │  │ Inventory     │                     │  │
│  │  │in Line Items  │  │ Variables     │                     │  │
│  │  └───────────────┘  └───────────────┘                     │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

**Key Principles**:
1. **Feature Flag Gating**: All module-specific UI hidden when flag disabled
2. **Template Modularity**: Each module contributes templates to shared systems
3. **Variable Namespacing**: Module variables prefixed (`quote.*`, `invoice.*`, `inventory.*`)
4. **Settings Extensibility**: Settings pages show/hide sections based on enabled modules
5. **Graceful Degradation**: Core functionality works without optional modules

---

## Feature Flags

```typescript
// Add to packages/twenty-server/src/engine/core-modules/feature-flag/enums/feature-flag-key.enum.ts
IS_QUOTING_BILLING_ENABLED = 'IS_QUOTING_BILLING_ENABLED',
```

Enable via SQL:
```sql
INSERT INTO core."featureFlag" ("key", "value", "workspaceId")
VALUES ('IS_QUOTING_BILLING_ENABLED', true, '6fc09637-5c6b-4931-b8ec-9dedb26dcef4');
```
