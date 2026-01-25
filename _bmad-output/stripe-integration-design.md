# Stripe Integration Design Document
## Phos Industries CRM - Stripe Billing Integration

**Created**: 2026-01-25
**Stripe Account**: Phos Industries LLC sandbox (acct_1SeiWc2NWOUJvz6f)
**Status**: Design Phase

---

## Executive Summary

This document outlines the Stripe data model and proposes how to align our Twenty CRM custom objects (Quotes, Invoices) with Stripe's billing infrastructure. The more aligned our data model is with Stripe's native structures, the simpler and more reliable the integration will be.

---

## Stripe Core Objects Overview

### 1. Customer Object
**Purpose**: Represents a customer in Stripe's system
**Key Fields**:
- `id` (cus_xxx): Unique customer identifier
- `email`: Customer email
- `name`: Customer name (individual or company)
- `description`: Optional description/notes
- `metadata`: Up to 50 key-value pairs (500 chars each)
- `invoice_settings`: Default payment method, custom fields
- `shipping`: Default shipping address
- `address`: Default billing address

**CRM Alignment**:
- Maps 1:1 with Twenty's **Company** object
- Store Stripe Customer ID in Company metadata or custom field
- Sync: Company name → `name`, Company email → `email`
- Use `metadata` to store CRM Company ID: `{crm_company_id: "92d5b2cc-..."}`

---

### 2. Product Object
**Purpose**: Represents goods or services offered
**Key Fields**:
- `id` (prod_xxx): Unique product identifier
- `name`: Product name
- `description`: Product description
- `active`: Boolean (is product available for purchase)
- `metadata`: Custom key-value pairs
- `default_price`: Default Price ID
- `images`: Product image URLs

**CRM Alignment**:
- Currently NOT in our CRM data model
- **Recommendation**: Create **Product** object in Twenty CRM
- Products can be linked to Quote/Invoice line items
- Store Stripe Product ID in Product object

---

### 3. Price Object
**Purpose**: Defines how a product is priced
**Key Fields**:
- `id` (price_xxx): Unique price identifier
- `product`: Associated Product ID
- `unit_amount`: Price in currency minor units (cents for USD, yen for JPY)
- `currency`: Three-letter ISO code (usd, eur, etc.)
- `type`: `one_time` or `recurring`
- `recurring`: Interval configuration (month, year, etc.)
- `active`: Boolean
- `metadata`: Custom key-value pairs

**CRM Alignment**:
- Prices are embedded in our Quote/Invoice line items
- **Recommendation**: Store Price IDs in metadata when creating Stripe invoices
- For one-time services: Use `type: one_time`
- For recurring contracts: Use `type: recurring`

---

### 4. Invoice Object (CRITICAL - Direct CRM Alignment)
**Purpose**: Statement of amounts owed by a customer
**Key Fields**:
```javascript
{
  id: "in_xxx",                    // Stripe invoice ID
  customer: "cus_xxx",             // Customer ID
  status: "draft|open|paid|void|uncollectible",

  // Amounts (in minor currency units)
  amount_due: 2000,                // Total amount due (cents)
  amount_paid: 2000,               // Amount already paid
  amount_remaining: 0,             // Amount still owed
  total: 2000,                     // Total before adjustments

  // Dates
  created: 1234567890,             // Unix timestamp
  invoice_date: 1234567890,        // Invoice date
  due_date: 1234567890,            // Payment due date
  paid_at: 1234567890,             // When payment completed

  // Payment
  payment_intent: "pi_xxx",        // Associated PaymentIntent ID
  charge: "ch_xxx",                // Associated Charge ID (if paid)
  default_payment_method: "pm_xxx",

  // Identification
  number: "INV-2024-001",          // Human-readable invoice number

  // Metadata
  metadata: {
    crm_invoice_id: "ab4f4492-...",
    crm_quote_id: "1e395f61-...",
    project_id: "908deb12-..."
  },

  // Line items
  lines: {
    data: [
      {
        amount: 2000,
        currency: "usd",
        description: "Laser consulting services",
        quantity: 1,
        price: {
          id: "price_xxx",
          unit_amount: 2000
        }
      }
    ]
  },

  // Collection
  collection_method: "send_invoice|charge_automatically",
  days_until_due: 30,

  // Customization
  custom_fields: [
    { name: "PO Number", value: "PO-12345" }
  ],

  // Tax
  automatic_tax: { enabled: true },

  // PDF
  hosted_invoice_url: "https://...",
  invoice_pdf: "https://..."
}
```

**CRM Alignment** (Our Invoice object → Stripe Invoice):

| CRM Field | Stripe Field | Notes |
|-----------|--------------|-------|
| invoiceNumber | `number` | Store as human-readable number |
| invoiceDate | `invoice_date` | Unix timestamp conversion |
| dueDate | `due_date` | Unix timestamp conversion |
| totalAmount | `amount_due` | Convert dollars to cents (multiply by 100) |
| amountPaid | `amount_paid` | Track partial payments |
| status | `status` | Map statuses (see below) |
| stripePaymentId | `payment_intent` | Store PaymentIntent ID |
| paymentMethod | `default_payment_method` | Payment method type |
| notes | `metadata.notes` | Store in metadata |
| company (relation) | `customer` | Stripe Customer ID |
| quote (relation) | `metadata.crm_quote_id` | Store Quote ID in metadata |

**Status Mapping**:

| CRM Status | Stripe Status | Webhook Event |
|------------|---------------|---------------|
| Draft | `draft` | Manual creation |
| Sent | `open` | `invoice.sent` |
| Viewed | `open` | Track via hosted_invoice_url |
| Partially Paid | `open` | `invoice.payment_succeeded` (partial) |
| Paid | `paid` | `invoice.paid` |
| Overdue | `open` + past due_date | Manual check |
| Cancelled | `void` | `invoice.voided` |

---

### 5. PaymentIntent Object
**Purpose**: Tracks the payment lifecycle
**Key Fields**:
```javascript
{
  id: "pi_xxx",
  customer: "cus_xxx",
  amount: 2000,                    // Amount in cents
  currency: "usd",
  status: "requires_payment_method|requires_action|processing|succeeded|canceled",

  // Payment method
  payment_method: "pm_xxx",
  payment_method_types: ["card", "us_bank_account"],

  // Relationship to invoice
  invoice: "in_xxx",               // Associated invoice ID

  // Metadata
  metadata: {
    crm_invoice_id: "ab4f4492-...",
    crm_company_id: "92d5b2cc-..."
  },

  // Charge details
  latest_charge: "ch_xxx",

  // Receipt
  receipt_email: "customer@example.com",

  // Error handling
  last_payment_error: { message: "..." }
}
```

**Status Flow**:
1. `requires_payment_method` → Customer hasn't provided payment yet
2. `requires_action` → 3D Secure authentication needed
3. `processing` → Payment submitted, awaiting confirmation (ACH, bank transfers)
4. `succeeded` → Payment completed ✅
5. `canceled` → Payment canceled

**CRM Alignment**:
- Store `payment_intent` ID in Invoice.stripePaymentId
- Listen to webhooks to update Invoice status in CRM

---

### 6. Quote Object (Stripe's Native Quotes)
**Purpose**: Proposals sent to customers for acceptance
**Key Fields**:
```javascript
{
  id: "qt_xxx",
  customer: "cus_xxx",
  status: "draft|open|accepted|canceled|expired",

  // Line items (similar to Invoice)
  line_items: [...],

  // Amounts
  amount_total: 2000,

  // Validity
  expires_at: 1234567890,          // Unix timestamp

  // Conversion
  invoice: "in_xxx",               // Created invoice when accepted

  // Metadata
  metadata: {
    crm_quote_id: "1e395f61-..."
  },

  // PDF
  pdf: "https://..."
}
```

**CRM Alignment** (Our Quote object → Stripe Quote):

| CRM Field | Stripe Field | Notes |
|-----------|--------------|-------|
| quoteNumber | Custom numbering | Not in Stripe, use metadata |
| quoteDate | `created` | Unix timestamp |
| validUntil | `expires_at` | Auto-expire quotes |
| totalAmount | `amount_total` | Convert to cents |
| status | `status` | Direct mapping |
| terms | Custom PDF | Use Stripe's hosted quote page |
| notes | `metadata.notes` | Store in metadata |
| company (relation) | `customer` | Stripe Customer ID |

**Quote → Invoice Flow**:
1. Create Stripe Quote (`status: draft`)
2. Finalize quote (`status: open`)
3. Send to customer
4. Customer accepts → Stripe auto-creates Invoice
5. Store invoice ID in CRM Quote object

---

## NEW CRM Object: Order

### Purpose
The **Order** object represents an accepted quote that is pending fulfillment. It acts as the bridge between Quote (sales) and Invoice (billing).

### Object Schema
```graphql
object Order {
  # Standard fields
  id: UUID
  createdAt: DateTime
  updatedAt: DateTime

  # Core fields
  orderNumber: TEXT                    # Auto-generated: ORD-2024-001
  orderDate: DATE                      # Date quote was accepted
  fulfillmentDate: DATE_TIME           # When order was fulfilled
  totalAmount: CURRENCY                # Total order value

  # Status tracking
  status: SELECT {
    "Pending Fulfillment"              # Quote accepted, awaiting fulfillment
    "In Progress"                      # Fulfillment started
    "Fulfilled"                        # Order complete, ready to invoice
    "Invoiced"                         # Invoice created from this order
    "Cancelled"                        # Order cancelled before fulfillment
  }

  # Stripe integration
  stripeQuoteId: TEXT                  # Stripe Quote ID (qt_xxx)
  stripeCustomerId: TEXT               # Stripe Customer ID (cus_xxx)

  # Relations
  company: RELATION (MANY_TO_ONE)      # Company this order is for
  quote: RELATION (MANY_TO_ONE)        # Original quote that was accepted
  invoice: RELATION (ONE_TO_ONE)       # Invoice created from this order (optional)
  project: RELATION (MANY_TO_ONE)      # Project this order is for (optional)

  # Notes and tracking
  fulfillmentNotes: RICH_TEXT          # Notes about fulfillment process
  shippingInfo: RICH_TEXT              # Shipping/delivery details
  internalNotes: RICH_TEXT             # Internal team notes
}
```

### Status Workflow
```
Quote Accepted → Order Created (status: "Pending Fulfillment")
    ↓
User starts work → Update to "In Progress"
    ↓
Work complete → Update to "Fulfilled"
    ↓
Invoice created → Update to "Invoiced"
```

### Relations Overview
```
Company (1) ←→ (Many) Orders
Quote (1) ←→ (One) Order           # One quote can only create one order
Order (1) ←→ (One) Invoice         # One order creates one invoice
Project (1) ←→ (Many) Orders       # Project can have multiple orders
```

---

## Webhook Events (Critical for Sync)

### Invoice Events
```javascript
// Invoice finalized and sent to customer
"invoice.sent"

// Invoice payment succeeded (full or partial)
"invoice.payment_succeeded"

// Invoice fully paid
"invoice.paid"

// Invoice payment failed
"invoice.payment_failed"

// Invoice voided/cancelled
"invoice.voided"

// Invoice updated
"invoice.updated"
```

### PaymentIntent Events
```javascript
// Payment processing started
"payment_intent.processing"

// Payment succeeded
"payment_intent.succeeded"

// Payment failed
"payment_intent.payment_failed"

// Amount ready for capture (if using manual capture)
"payment_intent.amount_capturable_updated"
```

### Customer Events
```javascript
// Customer record updated
"customer.updated"

// Customer deleted
"customer.deleted"
```

---

## Recommended Data Flow (CRM-First Workflow)

### 1. Quote Creation & Acceptance Flow
```
CRM Quote Created (Draft)
    ↓
User adds line items, tax, totals (manual entry)
    ↓
User finalizes CRM Quote
    ↓
Create Stripe Customer (if not exists)
    ↓
Create Stripe Quote with line items
    ↓
Store Stripe Quote ID in CRM Quote.stripeQuoteId
    ↓
Finalize Stripe Quote
    ↓
Send Stripe Quote URL to customer
    ↓
Update CRM Quote status to "Sent"
```

### 2. Quote Acceptance → Order Conversion Flow
```
Customer Accepts Stripe Quote
    ↓
Webhook: quote.accepted
    ↓
Update CRM Quote status to "Accepted"
    ↓
CREATE NEW CRM ORDER RECORD:
  - order.quote = CRM Quote ID
  - order.company = Quote's Company
  - order.totalAmount = Quote's totalAmount
  - order.status = "Pending Fulfillment"
  - order.stripeQuoteId = Stripe Quote ID
    ↓
Link CRM Quote → CRM Order (quote.order relation)
    ↓
[MANUAL] User fulfills order (ships products, delivers services)
    ↓
User marks CRM Order as "Fulfilled"
```

### 3. Quote Expiration → Reminder Flow
```
Stripe Quote Expires (not accepted before validUntil)
    ↓
Webhook: quote.expired (or check daily via cron job)
    ↓
Update CRM Quote status to "Expired"
    ↓
CREATE CRM TASK/REMINDER:
  - type: "Send Quote Reminder Email"
  - linkedTo: CRM Quote ID
  - assignedTo: Sales rep
    ↓
[MANUAL] Sales rep sends reminder email
    ↓
[OPTIONAL] Create new Stripe Quote (extend validity)
    ↓
Update CRM Quote with new Stripe Quote ID
    ↓
Update CRM Quote status to "Sent" (re-sent)
```

### 4. Order Fulfillment → Invoice Creation Flow
```
User marks CRM Order as "Fulfilled"
    ↓
Trigger: "Convert Order to Invoice"
    ↓
CREATE CRM INVOICE RECORD:
  - invoice.order = CRM Order ID
  - invoice.quote = Order's Quote ID
  - invoice.company = Order's Company
  - invoice.totalAmount = Order's totalAmount
  - invoice.status = "Draft"
  - invoice.invoiceDate = Today
  - invoice.dueDate = Today + 30 days
    ↓
[OPTIONAL] User modifies invoice (adjust amounts, add line items)
    ↓
User finalizes CRM Invoice
    ↓
Create Stripe Invoice from CRM Invoice data
    ↓
Store Stripe Invoice ID in CRM Invoice.stripeInvoiceId
    ↓
Finalize Stripe Invoice
    ↓
Webhook: invoice.finalized
    ↓
Send Stripe Invoice to customer
    ↓
Webhook: invoice.sent
    ↓
Update CRM Invoice status to "Sent"
```

### 5. Payment Flow
```
Customer Pays Stripe Invoice (via Stripe hosted page)
    ↓
Webhook: payment_intent.processing
    ↓
Update CRM Invoice status to "Processing"
    ↓
Webhook: payment_intent.succeeded
    ↓
Webhook: invoice.payment_succeeded
    ↓
Update CRM Invoice:
  - status = "Paid"
  - amountPaid = totalAmount
  - stripePaymentIntentId = payment_intent.id
  - stripeChargeId = charge.id
    ↓
Webhook: invoice.paid (final confirmation)
    ↓
Update CRM Invoice status to "Paid"
    ↓
Update CRM Order status to "Completed"
    ↓
[OPTIONAL] Trigger post-payment workflows (thank you email, etc.)
```

---

## Metadata Strategy

### Why Metadata is Critical
- Stripe allows up to **50 metadata keys** per object
- Each value can be up to **500 characters**
- Metadata is included in webhook events
- Searchable via Stripe API

### Recommended Metadata Fields

**On Stripe Customer**:
```javascript
metadata: {
  crm_company_id: "92d5b2cc-3e5a-474e-abf1-51ba5f0513fd",
  crm_company_name: "Phos Industries"
}
```

**On Stripe Invoice**:
```javascript
metadata: {
  crm_invoice_id: "ab4f4492-82f6-4628-87cb-0b07358ea899",
  crm_invoice_number: "INV-2024-001",
  crm_quote_id: "1e395f61-91dd-4ce3-8872-0b674cec9b41",  // if from quote
  crm_company_id: "92d5b2cc-3e5a-474e-abf1-51ba5f0513fd",
  project_id: "908deb12-79d9-4516-bf60-f4f0e2853dc3"     // if project-related
}
```

**On Stripe PaymentIntent**:
```javascript
metadata: {
  crm_invoice_id: "ab4f4492-82f6-4628-87cb-0b07358ea899",
  crm_company_id: "92d5b2cc-3e5a-474e-abf1-51ba5f0513fd"
}
```

**On Stripe Quote**:
```javascript
metadata: {
  crm_quote_id: "1e395f61-91dd-4ce3-8872-0b674cec9b41",
  crm_quote_number: "QT-2024-001",
  crm_company_id: "92d5b2cc-3e5a-474e-abf1-51ba5f0513fd"
}
```

---

## Currency Handling

### CRITICAL: Stripe uses minor currency units
- **USD**: 1 dollar = 100 cents → Store amounts in cents
- **EUR**: 1 euro = 100 cents → Store amounts in cents
- **JPY**: 1 yen = 1 yen (no minor unit) → Store amounts as-is

### Conversion Logic
```javascript
// CRM → Stripe (USD example)
const crmTotalAmount = 150.00;  // dollars
const stripeAmount = Math.round(crmTotalAmount * 100);  // 15000 cents

// Stripe → CRM (USD example)
const stripeAmount = 15000;  // cents
const crmAmount = stripeAmount / 100;  // 150.00 dollars
```

**Recommendation**: Store amounts in CRM as CURRENCY type (dollars/euros), convert to/from cents in integration layer.

---

## Field Alignment Summary

### NEW CRM Object: Order (REQUIRED)

Create new **Order** object with these fields:

| Field Name | Type | Purpose |
|------------|------|---------|
| orderNumber | TEXT | Auto-generated order number (ORD-2024-001) |
| orderDate | DATE | Date quote was accepted |
| fulfillmentDate | DATE_TIME | When order was marked as fulfilled |
| totalAmount | CURRENCY | Total order value (from quote) |
| status | SELECT | Pending Fulfillment, In Progress, Fulfilled, Invoiced, Cancelled |
| stripeQuoteId | TEXT | Stripe Quote ID (qt_xxx) |
| stripeCustomerId | TEXT | Stripe Customer ID (cus_xxx) |
| fulfillmentNotes | RICH_TEXT | Notes about fulfillment process |
| shippingInfo | RICH_TEXT | Shipping/delivery details |
| internalNotes | RICH_TEXT | Internal team notes |

**Relations**:
- company (MANY_TO_ONE) → Company
- quote (MANY_TO_ONE) → Quote
- invoice (ONE_TO_ONE) → Invoice
- project (MANY_TO_ONE) → Project (optional)

### NEW Fields to Add to CRM Invoice Object

| Field Name | Type | Purpose |
|------------|------|---------|
| order | RELATION (MANY_TO_ONE) | Link to Order that created this invoice |
| stripeInvoiceId | TEXT | Stripe Invoice ID (in_xxx) |
| stripeCustomerId | TEXT | Stripe Customer ID (cus_xxx) |
| stripePaymentIntentId | TEXT | Stripe PaymentIntent ID (pi_xxx) |
| stripeChargeId | TEXT | Stripe Charge ID (ch_xxx) |
| stripeInvoiceUrl | LINK | Hosted invoice URL for customer |
| stripePdfUrl | LINK | PDF download URL |
| lastSyncedAt | DATE_TIME | Last webhook sync timestamp |
| taxAmount | CURRENCY | Tax amount (manual entry for now) |
| subtotal | CURRENCY | Subtotal before tax |

### NEW Fields to Add to CRM Quote Object

| Field Name | Type | Purpose |
|------------|------|---------|
| order | RELATION (ONE_TO_ONE) | Link to Order created from this quote |
| stripeQuoteId | TEXT | Stripe Quote ID (qt_xxx) |
| stripeCustomerId | TEXT | Stripe Customer ID (cus_xxx) |
| stripeQuoteUrl | LINK | Hosted quote URL for customer |
| stripePdfUrl | LINK | PDF download URL |
| taxAmount | CURRENCY | Tax amount (manual entry) |
| subtotal | CURRENCY | Subtotal before tax |
| acceptedDate | DATE_TIME | When customer accepted quote |
| expirationReminderSent | BOOLEAN | Track if reminder email was sent |

### NEW Fields to Add to CRM Company Object

| Field Name | Type | Purpose |
|------------|------|---------|
| stripeCustomerId | TEXT | Stripe Customer ID (cus_xxx) |
| stripeDefaultPaymentMethod | TEXT | Default payment method ID |

### UPDATE Existing Quote Status Values

Add new status option:
- "Expired" (when Stripe quote expires without acceptance)

---

## Integration Architecture

### Components Needed

1. **Webhook Endpoint** (NestJS backend)
   - Receive Stripe webhook events
   - Verify webhook signatures (HMAC)
   - Update CRM objects based on events

2. **Stripe Service** (NestJS service)
   - Create/update Stripe customers
   - Create/update Stripe invoices
   - Create/update Stripe quotes
   - Sync CRM → Stripe

3. **CRM Sync Service** (NestJS service)
   - Sync Stripe → CRM (from webhooks)
   - Handle status updates
   - Handle payment tracking

4. **Frontend Components** (React)
   - Display Stripe invoice URLs
   - "Pay Invoice" button → opens Stripe hosted invoice
   - Display payment status
   - Display invoice PDF links

### Stripe SDK Installation
```bash
# Backend
cd packages/twenty-server
yarn add stripe

# Types
yarn add -D @types/stripe
```

### Environment Variables Needed
```env
STRIPE_API_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
```

---

## Recommended Implementation Phases

### Phase 1: Foundation - Company & Stripe Customer Sync
**Goal**: Establish basic Stripe integration and customer linking
- Add `stripeCustomerId` field to Company object
- Create Stripe Customer when Company is created in CRM
- Store Stripe Customer ID in Company.stripeCustomerId
- Sync Company updates to Stripe Customer (name, email, address)

### Phase 2: Quote Creation & Stripe Quote Generation
**Goal**: Enable quote workflow with Stripe hosted pages
- Add Stripe fields to Quote object (stripeQuoteId, stripeQuoteUrl, etc.)
- Add tax/subtotal fields to Quote
- Create Stripe Quote when CRM Quote is finalized
- Store Stripe Quote ID and hosted URL in CRM
- Send Stripe Quote URL to customer via email

### Phase 3: Order Object & Quote Acceptance Webhook
**Goal**: Create Order object and handle quote acceptance
- Create new Order object in CRM schema
- Set up webhook endpoint with signature verification
- Listen to `quote.accepted` webhook
- Auto-create CRM Order when Stripe Quote is accepted
- Update CRM Quote status to "Accepted"
- Link Quote → Order relation

### Phase 4: Quote Expiration Handling
**Goal**: Handle expired quotes and send reminders
- Listen to quote status (check via cron job or webhook)
- Update CRM Quote status to "Expired"
- Create reminder Task/Email for sales rep
- Allow creating new Stripe Quote from expired CRM Quote

### Phase 5: Order Fulfillment Tracking
**Goal**: Track order fulfillment status
- Build UI to mark Orders as "In Progress"
- Build UI to mark Orders as "Fulfilled"
- Add fulfillment notes and shipping info fields
- Display Order details page with status timeline

### Phase 6: Invoice Creation from Fulfilled Orders
**Goal**: Generate invoices after fulfillment
- Add Stripe fields to Invoice object
- Add Order relation to Invoice
- "Convert to Invoice" button on Fulfilled Orders
- Create CRM Invoice (Draft) from Order data
- Allow manual modification of Invoice before finalization
- Create Stripe Invoice when CRM Invoice is finalized
- Store Stripe Invoice ID and hosted URL in CRM

### Phase 7: Payment Webhook Integration
**Goal**: Sync payment status from Stripe to CRM
- Listen to `invoice.paid` webhook
- Update CRM Invoice status to "Paid"
- Update CRM Order status to "Invoiced" → "Completed"
- Listen to `invoice.payment_failed` webhook
- Update CRM Invoice status accordingly
- Send payment confirmation notifications

### Phase 8: Advanced Features (Future)
- Support partial payments (invoice.payment_succeeded tracking)
- Support refunds (create Credit Memo object?)
- Payment method management in CRM
- Subscription support (recurring invoices)
- Multi-currency support
- Stripe Tax API integration (replace manual entry)
- Line Items as separate object (not just in notes)

---

## Testing Strategy

### Test Mode
- Use Stripe test mode API keys (sk_test_...)
- Use test cards: 4242 4242 4242 4242 (success)
- Use test cards: 4000 0000 0000 9995 (decline)
- Use Stripe CLI to trigger webhook events locally

### Test Scenarios
1. Create invoice → Verify Stripe invoice created
2. Customer pays invoice → Verify webhook updates CRM
3. Payment fails → Verify CRM status updates
4. Quote accepted → Verify invoice auto-created
5. Partial payment → Verify amount tracking

---

## Security Considerations

1. **Webhook Signature Verification**
   - ALWAYS verify webhook signatures
   - Use `stripe.webhooks.constructEvent()`
   - Reject unsigned webhooks

2. **API Key Storage**
   - Store in environment variables
   - Never commit to git
   - Use different keys for test/production

3. **Metadata Privacy**
   - Don't store sensitive data in metadata
   - Don't store full credit card numbers
   - Don't store passwords or API keys

4. **PCI Compliance**
   - Use Stripe hosted invoice pages (PCI compliant)
   - Never handle raw card data in CRM
   - Let Stripe handle all payment processing

---

## Design Decisions (LOCKED IN)

### ✅ Workflow Direction
**CRM-First Flow**: All objects created in CRM first, then synced to Stripe
- Create Quote in CRM → Generate Stripe Quote
- Accept Quote in Stripe → Create Order in CRM
- Fulfill Order in CRM → Generate Stripe Invoice

### ✅ Object Flow
**Quote → Order → Invoice**
1. Quote (CRM + Stripe) - Sales document
2. Order (CRM only) - Fulfillment tracking, bridge between sales and billing
3. Invoice (CRM + Stripe) - Billing document created AFTER fulfillment

### ✅ Payment Methods
**Cards + ACH**
- Stripe Payment Element (supports both)
- Customer chooses payment method on Stripe hosted pages

### ✅ Tax Handling
**Manual Entry**
- Tax entered manually when creating Quote in CRM
- Synced to Stripe Quote/Invoice as line items
- Future: Can upgrade to Stripe Tax API

### ✅ Quote Expiration
**Email Reminder Workflow**
- Stripe Quote expires → Webhook or cron job detects
- Create Task/Reminder in CRM for sales rep
- Sales rep manually sends follow-up email
- Optionally create new Stripe Quote with extended validity

### ✅ Invoice Modification
**Editable Before Finalization**
- Invoice created from Order in Draft status
- User can modify amounts, line items, tax before finalizing
- Once finalized → Synced to Stripe (immutable)

### ⏳ Still To Decide

1. **Order Numbering**: Auto-increment format? (ORD-2024-001, ORD-2024-002, etc.)
2. **Invoice Numbering**: Same format as orders? (INV-2024-001, etc.)
3. **Quote Numbering**: Already have quoteNumber field - keep as-is?
4. **Subscriptions**: Not needed yet (all one-time payments for now)
5. **Multi-Currency**: USD only for now (expand later if needed)
6. **Line Items**: Store as JSON in notes field or create separate LineItem object?

---

## Next Steps

1. Review this design document
2. Decide on implementation phases
3. Add new Stripe fields to CRM objects (Invoice, Quote, Company)
4. Set up Stripe test account webhooks
5. Install Stripe SDK in twenty-server
6. Implement Phase 1: Basic Invoice Integration

---

## References

- [Stripe Invoice API](https://docs.stripe.com/api/invoices)
- [Stripe PaymentIntent API](https://docs.stripe.com/api/payment_intents)
- [Stripe Webhooks Guide](https://docs.stripe.com/webhooks)
- [Stripe Metadata Guide](https://docs.stripe.com/metadata)
- [Stripe Invoice Integration Guide](https://docs.stripe.com/invoicing/integration)
- [Stripe Testing Guide](https://docs.stripe.com/testing)
