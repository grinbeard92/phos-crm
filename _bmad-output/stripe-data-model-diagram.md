# Phos Industries CRM - Stripe Integration Data Model

## Object Relationship Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                         CRM + STRIPE DATA MODEL                     │
│                    Quote → Order → Invoice Flow                     │
└─────────────────────────────────────────────────────────────────────┘


┌──────────────────────────────────────────────────────────────────────┐
│                            COMPANY OBJECT                            │
│  ┌────────────────────────────────────────────────────────────────┐  │
│  │ CRM Fields:                 Stripe Fields:                     │  │
│  │ • id                        • stripeCustomerId (cus_xxx)       │  │
│  │ • name                      • stripeDefaultPaymentMethod       │  │
│  │ • email                                                        │  │
│  │ • address                   ┌──────────────────────────────┐   │  │
│  │                             │   STRIPE CUSTOMER            │   │  │
│  └─────────────────────────────┤   • id: cus_xxx              │   │  │
│                                │   • name                     │   │  │
│         ┌──────────────────────│   • email                    │   │  │
│         │                      │   • metadata:                │   │  │
│         │                      │     - crm_company_id         │   │  │
│         │                      └──────────────────────────────┘   │  │
└─────────┼───────────────────────────────────────────────────────────┘
          │
          │ (1 Company has many Quotes)
          ↓
┌─────────────────────────────────────────────────────────────────────┐
│                             QUOTE OBJECT                             │
│  ┌────────────────────────────────────────────────────────────────┐  │
│  │ CRM Fields:                 Stripe Fields:                     │  │
│  │ • id                        • stripeQuoteId (qt_xxx)           │  │
│  │ • quoteNumber               • stripeCustomerId                 │  │
│  │ • quoteDate                 • stripeQuoteUrl (hosted page)     │  │
│  │ • validUntil                • stripePdfUrl                     │  │
│  │ • totalAmount               • acceptedDate                     │  │
│  │ • subtotal                  • expirationReminderSent          │  │
│  │ • taxAmount (manual)        • order (ONE_TO_ONE relation)      │  │
│  │ • status: SELECT {                                             │  │
│  │   - Draft                   ┌──────────────────────────────┐   │  │
│  │   - Sent              ◄─────┤   STRIPE QUOTE               │   │  │
│  │   - Viewed                  │   • id: qt_xxx               │   │  │
│  │   - Accepted ────────┐      │   • customer: cus_xxx        │   │  │
│  │   - Declined         │      │   • status: open/accepted    │   │  │
│  │   - Expired          │      │   • amount_total             │   │  │
│  │ }                    │      │   • expires_at               │   │  │
│  │ • company (M:1)      │      │   • line_items[...]          │   │  │
│  └──────────────────────┼──────│   • metadata:                │   │  │
│                         │      │     - crm_quote_id           │   │  │
│                         │      └──────────────────────────────┘   │  │
└─────────────────────────┼───────────────────────────────────────────┘
                          │
                          │ WEBHOOK: quote.accepted
                          │ ACTION: Create Order
                          ↓
┌─────────────────────────────────────────────────────────────────────┐
│                             ORDER OBJECT                             │
│  ┌────────────────────────────────────────────────────────────────┐  │
│  │ CRM-Only Object (No direct Stripe equivalent)                  │  │
│  │                                                                 │  │
│  │ • id                                                            │  │
│  │ • orderNumber (ORD-2024-001)                                   │  │
│  │ • orderDate (date quote accepted)                              │  │
│  │ • fulfillmentDate                                              │  │
│  │ • totalAmount (copied from quote)                              │  │
│  │ • status: SELECT {                                             │  │
│  │   - Pending Fulfillment  ◄── Created when quote accepted      │  │
│  │   - In Progress          ◄── User marks as in progress         │  │
│  │   - Fulfilled ───────────┐   User marks as complete            │  │
│  │   - Invoiced             │   Invoice created                   │  │
│  │   - Cancelled            │                                      │  │
│  │ }                        │                                      │  │
│  │                          │                                      │  │
│  │ • stripeQuoteId          │   (reference to Stripe Quote)       │  │
│  │ • stripeCustomerId       │                                      │  │
│  │ • fulfillmentNotes       │                                      │  │
│  │ • shippingInfo           │                                      │  │
│  │                          │                                      │  │
│  │ Relations:               │                                      │  │
│  │ • company (M:1)          │                                      │  │
│  │ • quote (M:1)            │                                      │  │
│  │ • invoice (1:1)          │                                      │  │
│  │ • project (M:1, optional)│                                      │  │
│  └──────────────────────────┼──────────────────────────────────────┘
│                             │                                        │
└─────────────────────────────┼────────────────────────────────────────┘
                              │
                              │ USER ACTION: Mark Order as "Fulfilled"
                              │ TRIGGER: "Convert to Invoice"
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│                            INVOICE OBJECT                            │
│  ┌────────────────────────────────────────────────────────────────┐  │
│  │ CRM Fields:                 Stripe Fields:                     │  │
│  │ • id                        • stripeInvoiceId (in_xxx)         │  │
│  │ • invoiceNumber             • stripeCustomerId                 │  │
│  │ • invoiceDate               • stripePaymentIntentId (pi_xxx)   │  │
│  │ • dueDate                   • stripeChargeId (ch_xxx)          │  │
│  │ • totalAmount               • stripeInvoiceUrl (hosted page)   │  │
│  │ • amountPaid                • stripePdfUrl                     │  │
│  │ • subtotal                  • lastSyncedAt                     │  │
│  │ • taxAmount (manual)                                           │  │
│  │ • status: SELECT {          ┌──────────────────────────────┐   │  │
│  │   - Draft           ────────┤   STRIPE INVOICE             │   │  │
│  │   - Sent                    │   • id: in_xxx               │   │  │
│  │   - Viewed                  │   • customer: cus_xxx        │   │  │
│  │   - Partially Paid          │   • status: paid             │   │  │
│  │   - Paid ◄──────────────────│   • amount_due               │   │  │
│  │   - Overdue                 │   • amount_paid              │   │  │
│  │   - Cancelled               │   • payment_intent: pi_xxx   │   │  │
│  │ }                           │   • charge: ch_xxx           │   │  │
│  │                             │   • invoice_pdf              │   │  │
│  │ Relations:                  │   • metadata:                │   │  │
│  │ • company (M:1)             │     - crm_invoice_id         │   │  │
│  │ • quote (M:1)               │     - crm_order_id           │   │  │
│  │ • order (M:1) ◄─────────────│     - crm_quote_id           │   │  │
│  └─────────────────────────────└──────────────────────────────┘   │  │
│                                                                     │  │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              │ WEBHOOK: invoice.paid
                              │ ACTION: Update Invoice status
                              │         Update Order status → "Completed"
                              ↓
                        ┌──────────────┐
                        │   PAYMENT    │
                        │  COMPLETED   │
                        └──────────────┘
```

## Workflow States

### Quote Lifecycle
```
1. Draft         → User creating quote in CRM
2. Sent          → Stripe Quote created and URL sent to customer
3. Viewed        → Customer opened Stripe hosted quote page
4. Accepted      → Customer accepted → ORDER CREATED
5. Declined      → Customer declined
6. Expired       → Quote expired → Send reminder email
```

### Order Lifecycle
```
1. Pending Fulfillment  → Created automatically when quote accepted
2. In Progress          → User marks order as in progress
3. Fulfilled            → User marks order complete → ENABLE "Create Invoice"
4. Invoiced             → Invoice created from order
5. Cancelled            → Order cancelled before fulfillment
```

### Invoice Lifecycle
```
1. Draft               → Created from order, user can modify
2. Sent                → Stripe Invoice created and sent to customer
3. Viewed              → Customer opened Stripe invoice page
4. Partially Paid      → Customer paid partial amount
5. Paid                → Payment completed (invoice.paid webhook)
6. Overdue             → Past due date and unpaid
7. Cancelled           → Invoice voided
```

## Key Integration Points

### CRM → Stripe (Outbound)
1. **Company created** → Create Stripe Customer
2. **Quote finalized** → Create Stripe Quote
3. **Invoice finalized** → Create Stripe Invoice

### Stripe → CRM (Inbound - Webhooks)
1. **quote.accepted** → Create Order in CRM
2. **quote.expired** → Update Quote status, create reminder
3. **invoice.paid** → Update Invoice status, Update Order status
4. **invoice.payment_failed** → Update Invoice status
5. **payment_intent.succeeded** → Confirm payment completion

## Metadata Strategy

### Stripe Customer
```json
{
  "metadata": {
    "crm_company_id": "92d5b2cc-3e5a-474e-abf1-51ba5f0513fd"
  }
}
```

### Stripe Quote
```json
{
  "metadata": {
    "crm_quote_id": "1e395f61-91dd-4ce3-8872-0b674cec9b41",
    "crm_company_id": "92d5b2cc-3e5a-474e-abf1-51ba5f0513fd"
  }
}
```

### Stripe Invoice
```json
{
  "metadata": {
    "crm_invoice_id": "ab4f4492-82f6-4628-87cb-0b07358ea899",
    "crm_order_id": "NEW_ORDER_UUID",
    "crm_quote_id": "1e395f61-91dd-4ce3-8872-0b674cec9b41",
    "crm_company_id": "92d5b2cc-3e5a-474e-abf1-51ba5f0513fd",
    "crm_project_id": "908deb12-79d9-4516-bf60-f4f0e2853dc3"
  }
}
```

## Payment Methods Supported

- **Cards**: Visa, Mastercard, Amex (via Stripe Payment Element)
- **ACH Direct Debit**: US bank account payments (via Stripe Payment Element)
- Both methods available on Stripe hosted invoice pages

## Tax Handling

- **Current**: Manual entry when creating Quote/Invoice in CRM
- **Future**: Stripe Tax API integration for automatic calculation
