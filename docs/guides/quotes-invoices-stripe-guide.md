# Quotes, Invoices & Stripe Integration Guide

**Last Updated**: 2026-02-02
**Author**: CRM Forge (Twenty CRM Builder)

---

## Overview

The Phos CRM provides a complete quote-to-cash workflow:
1. **Create Quote** → Send to customer
2. **Convert to Invoice** → Auto-populate from accepted quote
3. **Stripe Integration** → Generate payment links, auto-sync payments
4. **Track Payments** → Real-time invoice status updates

---

## Quick Start: Creating Your First Quote

### 1. Navigate to Quotes
- **Settings > Other > Phos Settings** → Enable `IS_QUOTING_BILLING_ENABLED`
- Go to **Quotes** in the main navigation
- Click **+ New Quote**

### 2. Fill Quote Details
```
Customer:      [Select Company]
Contact:       [Select Person]
Project:       [Optional - link to project]
Quote Date:    [Auto-filled with today]
Valid Until:   [Set expiration date]
```

### 3. Add Line Items
Click **+ Add Line Item** for each service/product:
```
Description:   "Consulting Services - Phase 1"
Quantity:      40 hours
Unit Price:    $150
Category:      Consulting
──────────────────────────────
Subtotal:      $6,000
```

### 4. Apply Discounts & Tax
```
Subtotal:           $6,000
Discount (10%):     -$600
Tax (8%):           +$432
─────────────────────────
Total:              $5,832
```

### 5. Save & Send
- **Save Draft** - Saves without sending
- **Save & Send** - Opens email composer with PDF attached

---

## Quote Email Flow

When you click **Save & Send**:

1. **PDF Auto-Generated** - Quote rendered as professional PDF
2. **Email Composer Opens** - Pre-filled with:
   - **To**: Contact's primary email
   - **Subject**: `Quote Q-2026-001 from Phos Industries`
   - **Body**: Template with quote details
   - **Attachment**: `Quote-Q-2026-001.pdf`
3. **Edit & Send** - Customize message before sending
4. **Status Updated** - Quote marked as `SENT`

### Email Template Variables

The email template supports these variables:
```
{{person.firstName}}         → Contact's first name
{{company.name}}             → Customer company name
{{quote.number}}             → Quote number (Q-2026-001)
{{quote.date}}               → Quote date
{{quote.expiryDate}}         → Expiration date
{{quote.total}}              → Total amount ($5,832)
{{sender.firstName}}         → Your first name
```

**Example Email**:
```
Hi Sarah,

Thank you for your interest! Please find attached our quote.

Quote Details:
• Quote Number: Q-2026-001
• Date: February 2, 2026
• Valid Until: March 2, 2026
• Total: $5,832

Please review and let us know if you have any questions.

Best regards,
Ben
Phos Industries
```

---

## Converting Quote to Invoice

### When Customer Accepts Quote

1. **Update Quote Status** → Set to `ACCEPTED`
2. **Click "Convert to Invoice"** button
3. **Invoice Auto-Created** with:
   - Invoice number: `INV-2026-001`
   - All line items copied from quote
   - Customer, contact, project copied
   - Invoice date: Today
   - Due date: Today + 30 days (Net 30)
   - Status: `DRAFT`
   - Link back to original quote

### Review & Finalize Invoice

Before sending:
- Review line items (editable)
- Adjust payment terms if needed
- Add payment instructions/notes
- **Save** when ready

---

## Stripe Integration: Automated Payments

### Setup (Admin - One Time)

1. **Get Stripe API Keys**
   - Go to https://dashboard.stripe.com/apikeys
   - Copy **Publishable Key** (pk_test_...)
   - Copy **Secret Key** (sk_test_...)

2. **Configure in CRM**
   - **Settings > Integrations > Stripe**
   - Paste API keys
   - Toggle **Test Mode** (sandbox)
   - Click **Save & Test Connection**

3. **Configure Webhook**
   - In Stripe dashboard: **Developers > Webhooks**
   - Click **Add Endpoint**
   - URL: `https://your-crm.com/api/webhooks/stripe`
   - Events to send:
     - `invoice.paid`
     - `invoice.payment_failed`
     - `payment_intent.succeeded`
     - `charge.refunded`
   - Copy **Signing Secret** → Paste in CRM settings

### Creating Stripe Invoice from CRM Invoice

#### Method 1: Manual Creation

1. Open invoice in CRM
2. Click **Create Stripe Invoice** button
3. CRM creates:
   - Stripe customer (if new)
   - Stripe invoice with all line items
   - Stores `stripeInvoiceId` in CRM

#### Method 2: Automatic Creation

If enabled in settings, Stripe invoice auto-creates when invoice status → `SENT`

### Generate Payment Link

1. **In Invoice Detail Page**
   - Click **Generate Payment Link**
   - CRM creates hosted payment page in Stripe
   - Link stored in `invoice.stripePaymentLink`

2. **Link Auto-Embedded In**:
   - Invoice PDF (QR code + clickable link)
   - Invoice email template
   - Invoice detail page (copyable link)

**Example Payment Link**:
```
https://invoice.stripe.com/i/acct_xxx/test_YWNjdF8x...
```

Customer clicks → Stripe hosted page → Enters payment → Done

---

## Automated Payment Sync (Webhooks)

### How It Works

```
Customer pays on Stripe
    ↓
Stripe sends webhook → invoice.paid event
    ↓
CRM receives webhook
    ↓
CRM validates signature
    ↓
CRM creates Payment record:
  - Amount: $5,832
  - Date: Payment timestamp
  - Method: Credit Card (from Stripe)
  - Stripe Payment Intent ID
    ↓
CRM updates Invoice:
  - amountPaid: $5,832
  - balanceDue: $0
  - status: PAID
    ↓
CRM logs activity in invoice timeline
```

### Webhook Events Handled

| Event | CRM Action |
|-------|------------|
| `invoice.paid` | Create Payment, Update status → PAID |
| `payment_intent.succeeded` | Create Payment record with Stripe IDs |
| `invoice.payment_failed` | Update status → PAYMENT_FAILED, Create notification |
| `charge.refunded` | Create refund Payment record (negative amount) |

### Idempotency

All webhook handlers are **idempotent** - processing the same event multiple times won't create duplicates.

CRM checks:
- Payment with same `stripePaymentIntentId` already exists? → Skip
- Invoice already marked PAID? → Skip

---

## Manual Payment Recording

For non-Stripe payments (check, cash, wire):

1. **Open Invoice**
2. **Payments Section** → Click **+ Add Payment**
3. **Fill Payment Form**:
   ```
   Date:          [Payment received date]
   Amount:        $5,832
   Method:        Check / Cash / Wire / ACH
   Reference:     [Check number, wire confirmation, etc.]
   Notes:         [Optional]
   ```
4. **Save** → Invoice updates:
   - `amountPaid` increases
   - `balanceDue` decreases
   - Status → `PARTIALLY_PAID` or `PAID` (if fully paid)

### Partial Payments

Invoice supports multiple payments:
```
Invoice Total:     $5,832
Payment 1:         $2,000 (Stripe - Feb 5)
Payment 2:         $3,832 (Check - Feb 15)
─────────────────────────
Amount Paid:       $5,832
Balance Due:       $0
Status:            PAID ✓
```

---

## Invoice Status Lifecycle

```
DRAFT → SENT → VIEWED → PARTIALLY_PAID → PAID
                  ↓
              OVERDUE (if past due date)
                  ↓
              CANCELLED (if void)
```

### Status Triggers

| Status | Trigger |
|--------|---------|
| **DRAFT** | Initial creation |
| **SENT** | Email sent or marked manually |
| **VIEWED** | Customer opens Stripe payment link |
| **PARTIALLY_PAID** | Payment received < total |
| **PAID** | Full payment received (balanceDue = $0) |
| **OVERDUE** | Due date passed + balanceDue > 0 |
| **CANCELLED** | Manually cancelled |

---

## PDF Templates & Branding

### Default Template

All quotes and invoices use the **Phos Industries Default** template:
- Logo: Phos Industries logo
- Primary Color: `#0066cc` (blue)
- Company Info: Phos Industries address, phone, email, website
- Footer: "Thank you for your business!"

### Customizing Templates

1. **Settings > PDF Templates**
2. **Create New Template**:
   ```
   Name:              "Modern Invoice"
   Template Type:     Invoice
   Default:           Yes
   ─────────────────────────
   Logo URL:          [Upload or paste URL]
   Primary Color:     #ff5733 (orange)
   Secondary Color:   #333333 (dark gray)
   ─────────────────────────
   Company Name:      Phos Industries
   Company Address:   [Your address]
   Company Phone:     [Your phone]
   Company Email:     [Your email]
   Company Website:   https://phos.solutions
   ─────────────────────────
   Footer Text:       "Payment due within terms. Thank you!"
   Show Payment Terms: Yes
   Show Notes:        Yes
   ```
3. **Preview** → See live preview with sample data
4. **Save** → All new invoices use this template

### Multiple Templates

Create templates for different purposes:
- **Professional Invoice** - Default for all invoices
- **Minimal Quote** - Clean design for quotes
- **Detailed Quote** - Includes terms & conditions

Select template when generating PDF:
- **Invoice Detail Page** → **Download PDF** → Choose template

---

## Payment Methods Supported (Stripe)

When customer opens payment link, they can pay with:
- **Credit/Debit Card** (Visa, Mastercard, Amex, Discover)
- **ACH Bank Transfer** (US only)
- **Wire Transfer**
- **Apple Pay** (if configured in Stripe)
- **Google Pay** (if configured in Stripe)

### Currency Handling

**CRITICAL**: Stripe uses **minor currency units** (cents for USD).

CRM handles conversion automatically:
```
Invoice Total (CRM):    $5,832.00
Stripe Amount:          583200 cents
```

Always verify amounts match in both systems.

---

## Troubleshooting

### Quote/Invoice Not Sending

**Symptom**: Click "Send Email" → Email doesn't arrive

**Check**:
1. Email composer settings configured? (**Settings > Email > Composer**)
2. Gmail/SMTP credentials valid?
3. Recipient email address valid?
4. Check email logs: **Settings > Email > Logs**

**Fix**:
- Re-authenticate Gmail if tokens expired
- Test email with **Send Test Email** button
- Check spam folder

---

### Stripe Payment Not Syncing

**Symptom**: Customer paid in Stripe → CRM still shows unpaid

**Check**:
1. Webhook configured in Stripe dashboard?
2. Webhook URL correct? (`https://your-crm.com/api/webhooks/stripe`)
3. Webhook secret matches CRM settings?
4. Check webhook logs in Stripe dashboard

**Fix**:
1. **Stripe Dashboard** → **Developers > Webhooks** → Click endpoint
2. Check **Recent events** → Look for failures
3. Click **Resend** to retry failed events
4. If signature invalid: Copy new webhook secret → Update CRM

**Manual Sync** (if webhook fails):
- Record payment manually in CRM (see Manual Payment Recording above)

---

### PDF Generation Fails

**Symptom**: Click "Download PDF" → Error or blank PDF

**Check**:
1. Invoice has line items?
2. Company/customer info populated?
3. PDF template exists?

**Fix**:
- Ensure invoice is not empty
- Check PDF template settings
- Check server logs: `npx nx run twenty-server:logs`

---

### Webhook Signature Validation Fails

**Symptom**: Webhook events not processing, logs show "Invalid signature"

**Fix**:
1. **Stripe Dashboard** → **Developers > Webhooks**
2. Click your endpoint
3. Click **Reveal** webhook signing secret
4. Copy secret
5. **CRM Settings** → **Integrations > Stripe** → **Webhook Secret** → Paste
6. **Save**
7. Stripe resends failed events automatically

---

## Best Practices

### Quote Management

1. **Set Realistic Expiration Dates** - 30 days is typical
2. **Use Quote Numbers for Reference** - Always reference in communications
3. **Track Quote Status** - Mark as Accepted/Declined to avoid confusion
4. **Convert Accepted Quotes Promptly** - Don't wait to create invoice

### Invoice Management

1. **Send Invoices Promptly** - As soon as work is complete
2. **Include Payment Link** - Makes it easy for customers to pay
3. **Set Clear Payment Terms** - Net 15, Net 30, etc.
4. **Follow Up on Overdue** - Use email templates for reminders

### Stripe Integration

1. **Start in Test Mode** - Verify everything works before going live
2. **Test Payment Flow** - Use Stripe test cards before accepting real payments
3. **Monitor Webhook Health** - Check Stripe dashboard regularly
4. **Keep API Keys Secure** - Never commit to git, never share

### Financial Tracking

1. **Link Expenses to Projects** - Accurate profitability tracking
2. **Categorize Properly** - Makes tax time easier
3. **Upload Receipts** - Required for tax deductions
4. **Reconcile Monthly** - Compare CRM payments to bank statements

---

## Stripe Test Cards

For testing payment flow in sandbox mode:

| Card Number | Result |
|-------------|--------|
| `4242 4242 4242 4242` | Successful payment |
| `4000 0000 0000 9995` | Payment declined (insufficient funds) |
| `4000 0000 0000 0002` | Payment declined (card declined) |
| `4000 0025 0000 3155` | Requires 3D Secure authentication |

**Expiration**: Any future date (e.g., 12/34)
**CVC**: Any 3 digits (e.g., 123)
**ZIP**: Any 5 digits (e.g., 12345)

---

## Additional Resources

- **Stripe Documentation**: https://stripe.com/docs
- **Twenty CRM Docs**: https://docs.twenty.com
- **Phos Industries Support**: ben@phos-ind.com

---

## Summary Workflow Diagram

```
┌──────────────┐
│ Create Quote │
└──────┬───────┘
       │
       ├─→ Send to Customer (Email + PDF)
       │
       ├─→ Customer Reviews
       │
       ├─→ Update Status → ACCEPTED
       │
       ↓
┌──────────────────────┐
│ Convert to Invoice   │
└──────┬───────────────┘
       │
       ├─→ Review & Finalize
       │
       ├─→ Create Stripe Invoice
       │
       ├─→ Generate Payment Link
       │
       ├─→ Send to Customer (Email + PDF + Link)
       │
       ↓
┌──────────────────────┐
│ Customer Pays        │
│ (Stripe or Manual)   │
└──────┬───────────────┘
       │
       ├─→ Stripe Webhook → CRM
       │
       ├─→ Payment Record Created
       │
       ├─→ Invoice Status → PAID
       │
       ↓
┌──────────────────────┐
│ Financial Reports    │
│ (Dashboards, Exports)│
└──────────────────────┘
```

---

**Questions?** Contact ben@phos-ind.com or check the troubleshooting section above.
