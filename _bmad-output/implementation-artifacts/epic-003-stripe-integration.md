# Epic 003: Stripe Integration - Automated Payment Processing

**Epic ID**: EPIC-003
**Phase**: Phase 3 (Weeks 5-6)
**Priority**: P0 (Critical)
**Status**: Not Started
**Owner**: TBD
**Created**: 2026-01-24
**Target Completion**: Week 6

## Epic Overview

Integrate Stripe payment processing to automate invoice payments, generate payment links, and sync payment status via webhooks.

## Business Value

- Automates payment collection (no manual entry)
- Provides customers with easy payment options
- Reduces time from invoice to payment
- Accurate financial records with automatic sync

## Success Criteria

- [ ] Invoice payment via Stripe updates CRM automatically
- [ ] Payment links generated and embedded in invoices
- [ ] Webhooks update invoice status in real-time
- [ ] Payment history accurate and complete
- [ ] No manual data entry needed for Stripe payments

## Dependencies

- **Blocked By**: Epic 002 (needs Invoice and Payment UI)
- **Blocks**: Epic 004 (financial dashboards need payment data)

---

## User Stories

### Story 3.1: Set Up Stripe API Integration Module
**Estimate**: 4 hours | **Status**: Not Started

**Acceptance Criteria**:
- [ ] Stripe SDK installed and configured
- [ ] StripeService module created in backend
- [ ] API key storage in workspace settings (encrypted)
- [ ] Stripe settings page in UI for API key configuration
- [ ] Test mode toggle (sandbox vs live keys)
- [ ] Error handling for Stripe API calls

**CRITICAL**: Testing REQUIRES sandbox API key (pk_test / sk_test). NEVER use production keys in testing.

---

### Story 3.2: Implement Stripe Invoice Creation
**Estimate**: 5 hours | **Status**: Not Started

**Acceptance Criteria**:
- [ ] Method: `createStripeInvoice(invoiceId: string)` creates Stripe invoice
- [ ] Stripe invoice includes all line items from CRM invoice
- [ ] Customer created in Stripe if not exists
- [ ] Stripe invoice ID stored in Invoice.stripeInvoiceId
- [ ] "Create Stripe Invoice" button on invoice detail page
- [ ] Error handling for Stripe API failures

---

### Story 3.3: Implement Payment Link Generation
**Estimate**: 3 hours | **Status**: Not Started

**Acceptance Criteria**:
- [ ] Method: `createPaymentLink(invoiceId: string)` generates hosted payment link
- [ ] Payment link stored in Invoice.stripePaymentLink
- [ ] Link embedded in invoice PDF
- [ ] Link included in invoice emails
- [ ] Payment link accessible from invoice detail page
- [ ] Link expires appropriately (based on due date)

---

### Story 3.4: Configure Stripe Webhook Endpoint
**Estimate**: 4 hours | **Status**: Not Started

**Acceptance Criteria**:
- [ ] Webhook endpoint created: `/api/webhooks/stripe`
- [ ] Webhook signature validation implemented
- [ ] HTTPS required for webhook URL
- [ ] Webhook registered in Stripe dashboard
- [ ] Error logging for failed webhook processing
- [ ] Webhook secret stored securely

---

### Story 3.5: Implement Webhook Handlers for Payment Events
**Estimate**: 6 hours | **Status**: Not Started

**Acceptance Criteria**:
- [ ] Handler for `invoice.paid`: Update Invoice.status to "Paid", create Payment record
- [ ] Handler for `invoice.payment_failed`: Update Invoice.status, create notification
- [ ] Handler for `payment_intent.succeeded`: Create Payment record with Stripe IDs
- [ ] Handler for `charge.refunded`: Create refund Payment record
- [ ] All handlers are idempotent (can process same event multiple times safely)
- [ ] Webhook events logged for audit trail

---

### Story 3.6: Test Full Payment Flow
**Estimate**: 3 hours | **Status**: Not Started

**Acceptance Criteria**:
- [ ] End-to-end test: Create invoice → Generate Stripe invoice → Create payment link → Test payment (sandbox) → Verify webhook → Confirm CRM status updated
- [ ] Test payment failures
- [ ] Test refunds
- [ ] Test partial payments
- [ ] Verify all Stripe payment methods work (card, bank transfer, etc.)

---

## Technical Notes

**Location**: `/packages/twenty-server/src/modules/customer-billing/`

**Architecture**:
```
Invoice (CRM) → createStripeInvoice() → Stripe API
                     ↓
              stripeInvoiceId stored
                     ↓
              createPaymentLink() → Payment Link
                     ↓
         Customer pays via Stripe → Webhook
                     ↓
    Webhook Handler → Update Invoice.status → Create Payment record
```

**Critical Environment Variables**:
- `STRIPE_SECRET_KEY` - Stripe secret key (sk_test or sk_live)
- `STRIPE_PUBLISHABLE_KEY` - Stripe publishable key (pk_test or pk_live)
- `STRIPE_WEBHOOK_SECRET` - Webhook signing secret

Add to `./prd/critical-environment-vars.md` if not already there.

---

## Technical Risks

1. **Webhook Reliability**: Webhooks may fail or arrive out of order
   - Mitigation: Implement idempotent handlers, retry failed webhooks, periodic sync job

2. **Testing Limitations**: Sandbox mode may not support all payment methods
   - Mitigation: Document tested payment methods, plan live testing phase

3. **Security**: API keys must be stored securely
   - Mitigation: Use encrypted workspace settings, never log API keys

---

## Testing Strategy

1. **Unit Tests**: Test Stripe service methods (mock Stripe SDK)
2. **Integration Tests**: Test webhook handlers with Stripe test events
3. **Manual Testing**: Full payment flow in Stripe test mode
4. **Security Testing**: Verify webhook signature validation, API key encryption

---

## Documentation Needs

- [ ] Admin guide: Stripe setup (account creation, API keys, webhook configuration)
- [ ] User guide: How to generate payment links
- [ ] Developer guide: Stripe integration architecture
- [ ] Troubleshooting: Common Stripe errors and fixes
