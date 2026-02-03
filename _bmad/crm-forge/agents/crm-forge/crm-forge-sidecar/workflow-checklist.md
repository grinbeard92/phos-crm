# Quote-to-Invoice Workflow Implementation Checklist

## User Workflow Requirements

### Complete Flow
1. **Opportunity Creation** → Meeting/call/conference
2. **Opportunity Stage Change** → "Customer" stage
   - **AUTO-TRIGGER**: Create Quote record
   - Link: Company, Contact (from Opportunity)
   - Line items: Empty initially
   - **AUTO-TRIGGER**: Create Stripe Quote
   - **AUTO-TRIGGER**: Create Stripe Customer (if not exists)
   - **AUTO-TRIGGER**: Create Stripe Contact (if not exists)
   - Establish **two-way sync**: Twenty Quote ↔ Stripe Quote

3. **Quote Definition** → User adds line items, description, memo
   - **AUTO-SYNC**: Line items → Stripe Quote
   - Save quote

4. **Quote Email** → Send quote PDF to contact
   - Email compose with **PDF attachment**
   - Professional CRM formatting
   - Quote number (not ID) in subject

5. **Service Completion** → Job done, product shipped
   - **USER ACTION**: Convert Quote to Invoice
   - **AUTO-TRIGGER**: Finalize Stripe Quote → Stripe Invoice
   - **AUTO-SYNC**: Two-way sync: Twenty Invoice ↔ Stripe Invoice
   - **AUTO-GENERATE**: Stripe payment link

6. **Invoice Email** → Send invoice PDF with payment link
   - Email compose with **PDF attachment**
   - **Include**: Stripe payment link
   - Professional CRM formatting

## Implementation Tasks

### Task #10: ✅ Fix PDF generation for Quotes and Invoices
**Status**: COMPLETED
- PDF backend compiles without errors
- Dependencies installed (@react-pdf/renderer)
- All required files present

### Task #11: 🔄 Fix email attachments - attach PDFs to emails
**Status**: IN PROGRESS - BLOCKED
- **Issue**: Twenty's email composer doesn't support attachments
- **Options**:
  1. Extend email composer to support file attachments
  2. Use different email approach
- **Current**: Email actions reference quote/invoice numbers (not IDs)
- **Next**: Need to add attachment support to EmailComposeModalOptions

### Task #12: 📋 Build Stripe Quote creation API integration
**Status**: PENDING - Lower priority (invoices working)
- When Quote created in CRM → Auto-create Stripe Quote
- Include Customer and line items sync
- Store Stripe Quote ID in CRM

### Task #13: ✅ Auto-create Stripe Customer and sync to CRM
**Status**: COMPLETED
- ✅ CustomerBillingApiController now fetches real invoice data from CRM (not mock)
- ✅ Service auto-creates Stripe Customer if doesn't exist
- ✅ Stores stripeCustomerId in CRM Company record after invoice creation
- ✅ Stores stripeInvoiceId and stripePaymentLink in Invoice record
- ✅ Webhook handlers update CRM when payments succeed/fail/refund
- ✅ Payment records created automatically from webhooks
- ✅ Invoice status synced (PAID, REFUNDED) from Stripe events

### Task #14: 📋 Opportunity workflow trigger - auto-create Quote
**Status**: PENDING
- Listen for Opportunity stage change
- When stage = "Customer" → Create Quote record
- Link Quote to Company and Contact from Opportunity
- Trigger Stripe Quote creation (Task #12)

### Task #15: 📋 Quote to Invoice conversion with Stripe finalization
**Status**: PENDING
- Convert Quote → Invoice in CRM
- Finalize Stripe Quote → Stripe Invoice
- Generate Stripe payment link
- Store payment link in Invoice record

### Task #16: 📋 Two-way sync service for Quote/Invoice updates
**Status**: PENDING
- **CRM → Stripe**: Line item changes sync to Stripe
- **Stripe → CRM**: Status updates via webhooks
- Webhook handler for Stripe events:
  - invoice.paid
  - invoice.payment_failed
  - quote.accepted
  - quote.canceled

### Task #17: 📋 Stripe configuration UI with sandbox mode
**Status**: PENDING
- Settings page: Settings > Phos > Stripe Configuration
- Toggle: Sandbox Mode (on/off)
- When Sandbox ON:
  - Input: Publishable Key (pk_test_...)
  - Input: Secret Key (sk_test_...)
- When Sandbox OFF:
  - Input: Publishable Key (pk_live_...)
  - Input: Secret Key (sk_live_...)
- Store in workspace settings or environment

## Key Technical Requirements

### Database Fields Needed
**Company Table:**
- `stripeCustomerId` (string, nullable)

**Person Table:**
- `stripeContactId` (string, nullable)

**Quote Table:**
- `stripeQuoteId` (string, nullable)

**Invoice Table:**
- `stripeInvoiceId` (string, nullable)
- `stripePaymentLink` (string, nullable)

### Stripe API Calls Required
1. **Customer Management**
   - `stripe.customers.create()`
   - `stripe.customers.search()` - find by email
   - `stripe.customers.update()`

2. **Quote Management**
   - `stripe.quotes.create()`
   - `stripe.quotes.update()` - line items
   - `stripe.quotes.finalizeQuote()` - convert to invoice

3. **Invoice Management**
   - `stripe.invoices.retrieve()`
   - `stripe.invoices.update()`
   - Invoice is auto-created when quote finalized

4. **Webhook Events**
   - `invoice.paid`
   - `invoice.payment_failed`
   - `quote.accepted`
   - `quote.canceled`

## Current State

### What Works
- ✅ PDF backend service (compiles, has all dependencies)
- ✅ PDF controller endpoints (`/pdf/quotes/:id`, `/pdf/invoices/:id`)
- ✅ Action components (fixed to trigger on click, not mount)
- ✅ Stripe backend service skeleton

### What's Broken
- ❌ Email attachments (Twenty doesn't support attachments yet)
- ❌ No Stripe integration (no actual API calls)
- ❌ No workflow triggers (no automation)
- ❌ No two-way sync

### Next Steps (After Stripe MCP Added)
1. Use Stripe MCP to build Quote/Invoice sync
2. Implement auto-create Customer/Contact in Stripe
3. Build webhook handlers for Stripe events
4. Add Opportunity workflow trigger
5. Extend email composer for PDF attachments
6. Build Stripe settings UI

## Notes
- User confirmed: "This is not weeks of work. Begin attacking incrementally."
- Stripe MCP will be added for better DX
- Focus on getting end-to-end flow working, then polish
- Two-way sync is critical for data integrity
