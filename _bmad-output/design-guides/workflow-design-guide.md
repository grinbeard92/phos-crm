# Phos Industries CRM - Workflow Design Guide
## Twenty CRM Workflow System Integration with Stripe

**Created**: 2026-01-25
**Based on**: Twenty CRM Workflow Engine v0.40+
**Status**: Design Phase

---

## Table of Contents

1. [Overview](#overview)
2. [Twenty Workflow System Capabilities](#twenty-workflow-system-capabilities)
3. [Recommended Workflows for Phos Industries](#recommended-workflows)
4. [Stripe Integration Patterns](#stripe-integration-patterns)
5. [Implementation Guide](#implementation-guide)
6. [Best Practices](#best-practices)

---

## Overview

This guide provides workflow designs for Phos Industries CRM using Twenty's native workflow automation system. All workflows are designed to work with the **Quote → Order → Invoice** data model and Stripe integration.

### Workflow Philosophy
- **CRM-First**: All business logic starts in Twenty CRM
- **Automation-Driven**: Reduce manual work through intelligent automation
- **Webhook-Reactive**: Respond to external events (Stripe, email, etc.)
- **Audit-Ready**: Track all changes and transitions

---

## Twenty Workflow System Capabilities

### Trigger Types (4 Available)

#### 1. DATABASE_EVENT
**When to Use**: Automate actions when CRM records change
**Format**: `"objectName.action"`
**Available Events**: `created`, `updated`, `deleted`, `upserted`

**Example**:
```json
{
  "type": "DATABASE_EVENT",
  "settings": {
    "eventName": "quote.updated",
    "outputSchema": {
      "object": {
        "id": "uuid",
        "status": "string",
        "totalAmount": "number"
      }
    }
  }
}
```

**Access Data**: `{{trigger.object.fieldName}}`

#### 2. WEBHOOK
**When to Use**: Receive events from external services (Stripe, Typeform, etc.)
**Endpoint**: `POST/GET /webhooks/workflows/{workspaceId}/{workflowId}`
**Authentication**: Optional API_KEY or public

**Example** (Stripe webhook):
```json
{
  "type": "WEBHOOK",
  "settings": {
    "method": "POST",
    "authentication": {
      "enabled": false
    },
    "outputSchema": {
      "body": {
        "id": "string",
        "type": "string",
        "data": {
          "object": {
            "id": "string",
            "customer": "string",
            "amount": "number"
          }
        }
      }
    }
  }
}
```

**Access Data**: `{{trigger.body.data.object.customer}}`

#### 3. CRON
**When to Use**: Scheduled tasks (daily reports, reminders, cleanups)
**Patterns**: DAYS, HOURS, MINUTES, or custom cron

**Example** (daily at 9am):
```json
{
  "type": "CRON",
  "settings": {
    "cron": "0 9 * * *"
  }
}
```

#### 4. MANUAL
**When to Use**: User-initiated actions from UI
**Modes**: GLOBAL, SINGLE_RECORD, BULK_RECORDS

**Example** (trigger from Company record):
```json
{
  "type": "MANUAL",
  "settings": {
    "objectType": "company",
    "triggerType": "SINGLE_RECORD",
    "outputSchema": {
      "record": {
        "id": "uuid",
        "name": "string",
        "stripeCustomerId": "string"
      }
    }
  }
}
```

**Access Data**: `{{trigger.record.name}}`

---

### Action Types (15 Available)

#### Data Operations
- **CREATE_RECORD**: Create new CRM records
- **UPDATE_RECORD**: Modify existing records
- **DELETE_RECORD**: Remove records
- **UPSERT_RECORD**: Create or update based on unique field
- **FIND_RECORDS**: Query records with filters

#### External Communication
- **HTTP_REQUEST**: Call external APIs (Stripe, etc.)
  - Methods: GET, POST, PUT, PATCH, DELETE
  - Custom headers and body
  - Response data accessible as `{{steps.stepId.result}}`

- **SEND_EMAIL**: Send emails via connected Gmail/Outlook
  - HTML/plain text body
  - File attachments
  - Variable substitution

#### Flow Control
- **IF_ELSE**: Conditional branching
- **FILTER**: Conditional execution
- **ITERATOR**: Loop over arrays
- **CODE**: Custom JavaScript execution
- **DELAY**: Time delays (seconds, minutes, hours)

#### Advanced
- **FORM**: Handle form submissions
- **AI_AGENT**: AI-powered actions
- **EMPTY**: Placeholder steps

---

### Variable System

Variables use `{{variable}}` syntax and are resolved automatically:

```javascript
// Trigger data
{{trigger.object.fieldName}}       // Database event
{{trigger.body.data.object.id}}    // Webhook
{{trigger.record.name}}            // Manual trigger

// Previous step results
{{steps.stepId.result.fieldName}}  // HTTP response, record data
{{steps.stepId.result.id}}         // Created record ID

// Iterator context
{{iterator.currentItem.name}}      // Current loop item
{{iterator.currentIndex}}          // Loop index
```

---

## Recommended Workflows

### Category 1: Quote Management

#### WF-001: Auto-Create Stripe Quote When CRM Quote Finalized

**Trigger**: DATABASE_EVENT - `quote.updated`
**Condition**: `status` changed from "Draft" to "Sent"

**Steps**:
1. **IF_ELSE**: Check if `stripeQuoteId` is empty
   - If empty → Continue
   - If exists → Skip (already has Stripe quote)

2. **HTTP_REQUEST**: Get or create Stripe Customer
   ```json
   {
     "method": "POST",
     "url": "https://api.stripe.com/v1/customers",
     "headers": {
       "Authorization": "Bearer {{env.STRIPE_SECRET_KEY}}",
       "Content-Type": "application/x-www-form-urlencoded"
     },
     "body": {
       "name": "{{trigger.object.company.name}}",
       "email": "{{trigger.object.company.email}}",
       "metadata[crm_company_id]": "{{trigger.object.company.id}}"
     }
   }
   ```

3. **HTTP_REQUEST**: Create Stripe Quote
   ```json
   {
     "method": "POST",
     "url": "https://api.stripe.com/v1/quotes",
     "body": {
       "customer": "{{steps.createCustomer.result.id}}",
       "line_items[0][price_data][currency]": "usd",
       "line_items[0][price_data][unit_amount]": "{{trigger.object.subtotal * 100}}",
       "line_items[0][price_data][product_data][name]": "Services",
       "line_items[0][quantity]": "1",
       "line_items[1][price_data][currency]": "usd",
       "line_items[1][price_data][unit_amount]": "{{trigger.object.taxAmount * 100}}",
       "line_items[1][price_data][product_data][name]": "Tax",
       "line_items[1][quantity]": "1",
       "expires_at": "{{trigger.object.validUntil.timestamp}}",
       "metadata[crm_quote_id]": "{{trigger.object.id}}",
       "metadata[crm_company_id]": "{{trigger.object.company.id}}"
     }
   }
   ```

4. **HTTP_REQUEST**: Finalize Stripe Quote
   ```json
   {
     "method": "POST",
     "url": "https://api.stripe.com/v1/quotes/{{steps.createQuote.result.id}}/finalize"
   }
   ```

5. **UPDATE_RECORD**: Save Stripe IDs to CRM Quote
   ```json
   {
     "objectName": "quote",
     "objectRecordId": "{{trigger.object.id}}",
     "fields": {
       "stripeQuoteId": "{{steps.finalizeQuote.result.id}}",
       "stripeCustomerId": "{{steps.createCustomer.result.id}}",
       "stripeQuoteUrl": "{{steps.finalizeQuote.result.hosted_quote_url}}",
       "stripePdfUrl": "{{steps.finalizeQuote.result.pdf}}"
     }
   }
   ```

6. **SEND_EMAIL**: Send quote to customer
   ```html
   To: {{trigger.object.company.email}}
   Subject: Your Quote from Phos Industries - {{trigger.object.quoteNumber}}

   <p>Hi {{trigger.object.company.name}},</p>
   <p>Thank you for your interest! Please review your quote:</p>
   <p><a href="{{steps.finalizeQuote.result.hosted_quote_url}}">View Quote</a></p>
   <p>This quote is valid until {{trigger.object.validUntil}}.</p>
   <p>Best regards,<br>Phos Industries Team</p>
   ```

**Expected Outcome**: When user changes Quote status to "Sent", Stripe Quote is created and customer receives email with quote link.

---

#### WF-002: Handle Quote Acceptance from Stripe

**Trigger**: WEBHOOK - Stripe `quote.accepted` event
**Endpoint**: `POST /webhooks/workflows/{workspaceId}/{workflowId}`

**Stripe Webhook Configuration**:
- Add this URL to Stripe Dashboard → Webhooks
- Subscribe to event: `quote.accepted`

**Steps**:
1. **FIND_RECORDS**: Find CRM Quote by Stripe Quote ID
   ```json
   {
     "objectName": "quote",
     "filter": {
       "stripeQuoteId": {
         "eq": "{{trigger.body.data.object.id}}"
       }
     },
     "limit": 1
   }
   ```

2. **IF_ELSE**: Check if quote found
   - If not found → SEND_EMAIL to admin (error notification)
   - If found → Continue

3. **UPDATE_RECORD**: Update CRM Quote status
   ```json
   {
     "objectName": "quote",
     "objectRecordId": "{{steps.findQuote.result[0].id}}",
     "fields": {
       "status": "Accepted",
       "acceptedDate": "{{trigger.body.created * 1000}}"
     }
   }
   ```

4. **CREATE_RECORD**: Create Order from Quote
   ```json
   {
     "objectName": "order",
     "fields": {
       "orderNumber": "ORD-{{steps.findQuote.result[0].quoteNumber}}",
       "orderDate": "{{trigger.body.created * 1000}}",
       "totalAmount": "{{steps.findQuote.result[0].totalAmount}}",
       "status": "Pending Fulfillment",
       "stripeQuoteId": "{{trigger.body.data.object.id}}",
       "stripeCustomerId": "{{trigger.body.data.object.customer}}",
       "company": "{{steps.findQuote.result[0].company.id}}",
       "quote": "{{steps.findQuote.result[0].id}}"
     }
   }
   ```

5. **UPDATE_RECORD**: Link Order to Quote
   ```json
   {
     "objectName": "quote",
     "objectRecordId": "{{steps.findQuote.result[0].id}}",
     "fields": {
       "order": "{{steps.createOrder.result.id}}"
     }
   }
   ```

6. **SEND_EMAIL**: Notify sales team
   ```html
   To: sales@phos-ind.com
   Subject: Quote Accepted! {{steps.findQuote.result[0].quoteNumber}}

   <p>Great news! {{steps.findQuote.result[0].company.name}} accepted quote {{steps.findQuote.result[0].quoteNumber}}.</p>
   <p>Order #{{steps.createOrder.result.orderNumber}} created.</p>
   <p>Total: ${{steps.createOrder.result.totalAmount}}</p>
   <p><a href="https://crm.phos-ind.com/orders/{{steps.createOrder.result.id}}">View Order</a></p>
   ```

**Expected Outcome**: When customer accepts Stripe Quote, CRM automatically creates Order and notifies sales team.

---

#### WF-003: Check for Expired Quotes Daily

**Trigger**: CRON - Daily at 9:00 AM
**Pattern**: `0 9 * * *`

**Steps**:
1. **FIND_RECORDS**: Find quotes that are expired
   ```json
   {
     "objectName": "quote",
     "filter": {
       "and": [
         {
           "status": {
             "eq": "Sent"
           }
         },
         {
           "validUntil": {
             "lt": "{{now}}"
           }
         },
         {
           "expirationReminderSent": {
             "eq": false
           }
         }
       ]
     }
   }
   ```

2. **ITERATOR**: Loop through expired quotes
   - Items: `{{steps.findExpiredQuotes.result}}`

3. **UPDATE_RECORD**: Update quote status (inside iterator)
   ```json
   {
     "objectName": "quote",
     "objectRecordId": "{{iterator.currentItem.id}}",
     "fields": {
       "status": "Expired",
       "expirationReminderSent": true
     }
   }
   ```

4. **SEND_EMAIL**: Send reminder to sales rep (inside iterator)
   ```html
   To: {{iterator.currentItem.assignedTo.email}}
   Subject: Follow up: Expired Quote {{iterator.currentItem.quoteNumber}}

   <p>Hi {{iterator.currentItem.assignedTo.name}},</p>
   <p>Quote {{iterator.currentItem.quoteNumber}} for {{iterator.currentItem.company.name}} has expired.</p>
   <p>Consider reaching out to the customer to renew their interest.</p>
   <p><a href="https://crm.phos-ind.com/quotes/{{iterator.currentItem.id}}">View Quote</a></p>
   ```

**Expected Outcome**: Every morning, expired quotes are marked and sales reps receive follow-up reminders.

---

### Category 2: Order Fulfillment

#### WF-004: Create Invoice When Order Fulfilled

**Trigger**: DATABASE_EVENT - `order.updated`
**Condition**: `status` changed to "Fulfilled"

**Steps**:
1. **IF_ELSE**: Check if invoice already exists
   - If `order.invoice` exists → Skip
   - If empty → Continue

2. **FIND_RECORDS**: Get related Quote
   ```json
   {
     "objectName": "quote",
     "filter": {
       "id": {
         "eq": "{{trigger.object.quote.id}}"
       }
     },
     "limit": 1
   }
   ```

3. **CREATE_RECORD**: Create Invoice (Draft)
   ```json
   {
     "objectName": "invoice",
     "fields": {
       "invoiceNumber": "INV-{{trigger.object.orderNumber}}",
       "invoiceDate": "{{now}}",
       "dueDate": "{{now + 30 days}}",
       "totalAmount": "{{trigger.object.totalAmount}}",
       "subtotal": "{{steps.findQuote.result[0].subtotal}}",
       "taxAmount": "{{steps.findQuote.result[0].taxAmount}}",
       "status": "Draft",
       "company": "{{trigger.object.company.id}}",
       "quote": "{{trigger.object.quote.id}}",
       "order": "{{trigger.object.id}}"
     }
   }
   ```

4. **UPDATE_RECORD**: Link Invoice to Order
   ```json
   {
     "objectName": "order",
     "objectRecordId": "{{trigger.object.id}}",
     "fields": {
       "invoice": "{{steps.createInvoice.result.id}}",
       "status": "Invoiced"
     }
   }
   ```

5. **SEND_EMAIL**: Notify user to review invoice
   ```html
   To: {{trigger.object.assignedTo.email}}
   Subject: Review Draft Invoice for Order {{trigger.object.orderNumber}}

   <p>Hi {{trigger.object.assignedTo.name}},</p>
   <p>Draft invoice created for fulfilled order {{trigger.object.orderNumber}}.</p>
   <p>Please review and finalize the invoice to send to customer.</p>
   <p><a href="https://crm.phos-ind.com/invoices/{{steps.createInvoice.result.id}}">Review Invoice</a></p>
   ```

**Expected Outcome**: When order is marked "Fulfilled", draft invoice is auto-created for review.

---

#### WF-005: Send Stripe Invoice When CRM Invoice Finalized

**Trigger**: DATABASE_EVENT - `invoice.updated`
**Condition**: `status` changed to "Sent"

**Steps**:
1. **IF_ELSE**: Check if Stripe Invoice already exists
   - If `stripeInvoiceId` exists → Skip
   - If empty → Continue

2. **HTTP_REQUEST**: Create Stripe Invoice
   ```json
   {
     "method": "POST",
     "url": "https://api.stripe.com/v1/invoices",
     "headers": {
       "Authorization": "Bearer {{env.STRIPE_SECRET_KEY}}"
     },
     "body": {
       "customer": "{{trigger.object.company.stripeCustomerId}}",
       "collection_method": "send_invoice",
       "days_until_due": "30",
       "metadata[crm_invoice_id]": "{{trigger.object.id}}",
       "metadata[crm_order_id]": "{{trigger.object.order.id}}",
       "metadata[crm_quote_id]": "{{trigger.object.quote.id}}",
       "metadata[crm_company_id]": "{{trigger.object.company.id}}"
     }
   }
   ```

3. **HTTP_REQUEST**: Add line item (services)
   ```json
   {
     "method": "POST",
     "url": "https://api.stripe.com/v1/invoiceitems",
     "body": {
       "customer": "{{trigger.object.company.stripeCustomerId}}",
       "invoice": "{{steps.createInvoice.result.id}}",
       "amount": "{{trigger.object.subtotal * 100}}",
       "currency": "usd",
       "description": "Services - Invoice {{trigger.object.invoiceNumber}}"
     }
   }
   ```

4. **HTTP_REQUEST**: Add line item (tax)
   ```json
   {
     "method": "POST",
     "url": "https://api.stripe.com/v1/invoiceitems",
     "body": {
       "customer": "{{trigger.object.company.stripeCustomerId}}",
       "invoice": "{{steps.createInvoice.result.id}}",
       "amount": "{{trigger.object.taxAmount * 100}}",
       "currency": "usd",
       "description": "Tax"
     }
   }
   ```

5. **HTTP_REQUEST**: Finalize and send Stripe Invoice
   ```json
   {
     "method": "POST",
     "url": "https://api.stripe.com/v1/invoices/{{steps.createInvoice.result.id}}/finalize"
   }
   ```

6. **HTTP_REQUEST**: Send Stripe Invoice
   ```json
   {
     "method": "POST",
     "url": "https://api.stripe.com/v1/invoices/{{steps.createInvoice.result.id}}/send_invoice"
   }
   ```

7. **UPDATE_RECORD**: Save Stripe Invoice data to CRM
   ```json
   {
     "objectName": "invoice",
     "objectRecordId": "{{trigger.object.id}}",
     "fields": {
       "stripeInvoiceId": "{{steps.finalizeInvoice.result.id}}",
       "stripeCustomerId": "{{trigger.object.company.stripeCustomerId}}",
       "stripeInvoiceUrl": "{{steps.finalizeInvoice.result.hosted_invoice_url}}",
       "stripePdfUrl": "{{steps.finalizeInvoice.result.invoice_pdf}}",
       "lastSyncedAt": "{{now}}"
     }
   }
   ```

**Expected Outcome**: When user finalizes CRM invoice, Stripe invoice is created and sent to customer.

---

### Category 3: Payment Tracking

#### WF-006: Update Invoice When Payment Succeeds

**Trigger**: WEBHOOK - Stripe `invoice.paid` event

**Steps**:
1. **FIND_RECORDS**: Find CRM Invoice by Stripe Invoice ID
   ```json
   {
     "objectName": "invoice",
     "filter": {
       "stripeInvoiceId": {
         "eq": "{{trigger.body.data.object.id}}"
       }
     },
     "limit": 1
   }
   ```

2. **IF_ELSE**: Check if invoice found
   - If not found → SEND_EMAIL to admin
   - If found → Continue

3. **UPDATE_RECORD**: Update Invoice status
   ```json
   {
     "objectName": "invoice",
     "objectRecordId": "{{steps.findInvoice.result[0].id}}",
     "fields": {
       "status": "Paid",
       "amountPaid": "{{trigger.body.data.object.amount_paid / 100}}",
       "stripePaymentIntentId": "{{trigger.body.data.object.payment_intent}}",
       "stripeChargeId": "{{trigger.body.data.object.charge}}",
       "lastSyncedAt": "{{now}}"
     }
   }
   ```

4. **FIND_RECORDS**: Get related Order
   ```json
   {
     "objectName": "order",
     "filter": {
       "invoice": {
         "eq": "{{steps.findInvoice.result[0].id}}"
       }
     },
     "limit": 1
   }
   ```

5. **UPDATE_RECORD**: Update Order status
   ```json
   {
     "objectName": "order",
     "objectRecordId": "{{steps.findOrder.result[0].id}}",
     "fields": {
       "status": "Completed"
     }
   }
   ```

6. **SEND_EMAIL**: Send payment confirmation to customer
   ```html
   To: {{steps.findInvoice.result[0].company.email}}
   Subject: Payment Received - Invoice {{steps.findInvoice.result[0].invoiceNumber}}

   <p>Hi {{steps.findInvoice.result[0].company.name}},</p>
   <p>Thank you for your payment!</p>
   <p>Invoice: {{steps.findInvoice.result[0].invoiceNumber}}</p>
   <p>Amount Paid: ${{steps.findInvoice.result[0].amountPaid}}</p>
   <p>Date: {{now}}</p>
   <p>Best regards,<br>Phos Industries</p>
   ```

7. **SEND_EMAIL**: Notify internal team
   ```html
   To: accounting@phos-ind.com
   Subject: Payment Received - {{steps.findInvoice.result[0].invoiceNumber}}

   <p>Payment received for invoice {{steps.findInvoice.result[0].invoiceNumber}}</p>
   <p>Company: {{steps.findInvoice.result[0].company.name}}</p>
   <p>Amount: ${{steps.findInvoice.result[0].amountPaid}}</p>
   <p>Order: {{steps.findOrder.result[0].orderNumber}}</p>
   ```

**Expected Outcome**: When customer pays via Stripe, CRM is automatically updated and confirmation emails are sent.

---

#### WF-007: Handle Failed Payments

**Trigger**: WEBHOOK - Stripe `invoice.payment_failed` event

**Steps**:
1. **FIND_RECORDS**: Find CRM Invoice
   ```json
   {
     "objectName": "invoice",
     "filter": {
       "stripeInvoiceId": {
         "eq": "{{trigger.body.data.object.id}}"
       }
     },
     "limit": 1
   }
   ```

2. **UPDATE_RECORD**: Update Invoice with error
   ```json
   {
     "objectName": "invoice",
     "objectRecordId": "{{steps.findInvoice.result[0].id}}",
     "fields": {
       "status": "Payment Failed",
       "notes": "Payment failed: {{trigger.body.data.object.last_payment_error.message}}",
       "lastSyncedAt": "{{now}}"
     }
   }
   ```

3. **SEND_EMAIL**: Notify customer
   ```html
   To: {{steps.findInvoice.result[0].company.email}}
   Subject: Payment Issue - Invoice {{steps.findInvoice.result[0].invoiceNumber}}

   <p>Hi {{steps.findInvoice.result[0].company.name}},</p>
   <p>We encountered an issue processing your payment for invoice {{steps.findInvoice.result[0].invoiceNumber}}.</p>
   <p>Please update your payment method and try again:</p>
   <p><a href="{{steps.findInvoice.result[0].stripeInvoiceUrl}}">Pay Invoice</a></p>
   <p>If you have questions, please contact us.</p>
   ```

4. **SEND_EMAIL**: Notify accounting team
   ```html
   To: accounting@phos-ind.com
   Subject: Payment Failed - {{steps.findInvoice.result[0].invoiceNumber}}

   <p>Payment failed for invoice {{steps.findInvoice.result[0].invoiceNumber}}</p>
   <p>Company: {{steps.findInvoice.result[0].company.name}}</p>
   <p>Error: {{trigger.body.data.object.last_payment_error.message}}</p>
   <p>Follow up required.</p>
   ```

**Expected Outcome**: When payment fails, customer and team are notified to resolve the issue.

---

### Category 4: Project & Expense Tracking

#### WF-008: Link Expenses to Projects Automatically

**Trigger**: DATABASE_EVENT - `expense.created`

**Steps**:
1. **IF_ELSE**: Check if expense has project
   - If `project` is set → Skip
   - If empty → Try to auto-link

2. **FIND_RECORDS**: Find active project for this company
   ```json
   {
     "objectName": "project",
     "filter": {
       "and": [
         {
           "company": {
             "eq": "{{trigger.object.company.id}}"
           }
         },
         {
           "status": {
             "in": ["In Progress", "On Hold"]
           }
         }
       ]
     },
     "orderBy": {
       "startDate": "DESC"
     },
     "limit": 1
   }
   ```

3. **IF_ELSE**: Check if project found
   - If found → Update expense
   - If not found → Send notification to assign manually

4. **UPDATE_RECORD**: Link expense to project
   ```json
   {
     "objectName": "expense",
     "objectRecordId": "{{trigger.object.id}}",
     "fields": {
       "project": "{{steps.findProject.result[0].id}}"
     }
   }
   ```

5. **SEND_EMAIL**: Notify project manager
   ```html
   To: {{steps.findProject.result[0].owner.email}}
   Subject: New Expense Added to {{steps.findProject.result[0].name}}

   <p>A new expense was added to your project:</p>
   <p>Amount: ${{trigger.object.amount}}</p>
   <p>Category: {{trigger.object.category}}</p>
   <p>Vendor: {{trigger.object.vendor}}</p>
   <p><a href="https://crm.phos-ind.com/expenses/{{trigger.object.id}}">View Expense</a></p>
   ```

**Expected Outcome**: Expenses are automatically linked to active projects and project managers are notified.

---

#### WF-009: Send Monthly Project Budget Report

**Trigger**: CRON - First day of month at 8:00 AM
**Pattern**: `0 8 1 * *`

**Steps**:
1. **FIND_RECORDS**: Get all active projects
   ```json
   {
     "objectName": "project",
     "filter": {
       "status": {
         "in": ["In Progress", "On Hold"]
       }
     }
   }
   ```

2. **ITERATOR**: Loop through projects

3. **FIND_RECORDS**: Get expenses for this project (inside iterator)
   ```json
   {
     "objectName": "expense",
     "filter": {
       "project": {
         "eq": "{{iterator.currentItem.id}}"
       }
     }
   }
   ```

4. **CODE**: Calculate total expenses (inside iterator)
   ```javascript
   const expenses = {{steps.findExpenses.result}};
   const total = expenses.reduce((sum, exp) => sum + exp.amount, 0);
   const remaining = {{iterator.currentItem.budget}} - total;
   const percentUsed = (total / {{iterator.currentItem.budget}}) * 100;

   return {
     totalSpent: total,
     budgetRemaining: remaining,
     percentUsed: percentUsed.toFixed(1)
   };
   ```

5. **SEND_EMAIL**: Send report to project owner (inside iterator)
   ```html
   To: {{iterator.currentItem.owner.email}}
   Subject: Monthly Budget Report - {{iterator.currentItem.name}}

   <h2>{{iterator.currentItem.name}}</h2>
   <p><strong>Budget:</strong> ${{iterator.currentItem.budget}}</p>
   <p><strong>Spent:</strong> ${{steps.calculateBudget.result.totalSpent}}</p>
   <p><strong>Remaining:</strong> ${{steps.calculateBudget.result.budgetRemaining}}</p>
   <p><strong>Used:</strong> {{steps.calculateBudget.result.percentUsed}}%</p>
   <p><a href="https://crm.phos-ind.com/projects/{{iterator.currentItem.id}}">View Project</a></p>
   ```

**Expected Outcome**: First of every month, project managers receive budget status reports.

---

### Category 5: Customer Communication

#### WF-010: Send Welcome Email to New Companies

**Trigger**: DATABASE_EVENT - `company.created`

**Steps**:
1. **DELAY**: Wait 5 minutes (let user finish setup)
   ```json
   {
     "duration": 300,
     "unit": "seconds"
     }
   ```

2. **SEND_EMAIL**: Welcome email
   ```html
   To: {{trigger.object.email}}
   Subject: Welcome to Phos Industries!

   <p>Hi {{trigger.object.name}},</p>
   <p>Welcome! We're excited to work with you.</p>
   <p>You've been added to our CRM system. Here's what to expect:</p>
   <ul>
     <li>Quotes and proposals via email</li>
     <li>Secure payment links from Stripe</li>
     <li>Project updates and invoices</li>
   </ul>
   <p>Questions? Reply to this email anytime.</p>
   <p>Best regards,<br>Phos Industries Team</p>
   ```

3. **SEND_EMAIL**: Notify sales team
   ```html
   To: sales@phos-ind.com
   Subject: New Company Added - {{trigger.object.name}}

   <p>New company created in CRM:</p>
   <p>Name: {{trigger.object.name}}</p>
   <p>Email: {{trigger.object.email}}</p>
   <p><a href="https://crm.phos-ind.com/companies/{{trigger.object.id}}">View Company</a></p>
   ```

**Expected Outcome**: New customers receive welcome email and sales team is notified.

---

## Stripe Integration Patterns

### Pattern 1: Webhook-Triggered Workflows

**Setup**:
1. Create workflow in Twenty with WEBHOOK trigger
2. Copy webhook URL: `https://your-twenty.com/webhooks/workflows/{workspaceId}/{workflowId}`
3. Add URL to Stripe Dashboard → Webhooks
4. Subscribe to events: `quote.accepted`, `invoice.paid`, `invoice.payment_failed`

**Security**:
- Stripe sends signature in `Stripe-Signature` header
- Twenty can validate webhook authenticity (optional)
- For now, rely on obscurity of workflowId (UUID)

**Webhook Event Structure**:
```json
{
  "id": "evt_xxx",
  "type": "invoice.paid",
  "data": {
    "object": {
      "id": "in_xxx",
      "customer": "cus_xxx",
      "amount_paid": 15000,
      "metadata": {
        "crm_invoice_id": "ab4f4492-..."
      }
    }
  }
}
```

**Access in Workflow**: `{{trigger.body.data.object.metadata.crm_invoice_id}}`

---

### Pattern 2: HTTP Actions for Stripe API Calls

**Authentication**:
Store Stripe secret key in environment variable: `STRIPE_SECRET_KEY`

**Headers** (all requests):
```json
{
  "Authorization": "Bearer {{env.STRIPE_SECRET_KEY}}",
  "Content-Type": "application/x-www-form-urlencoded"
}
```

**Common Operations**:

**Create Customer**:
```http
POST https://api.stripe.com/v1/customers
Body: name=Phos&email=test@example.com&metadata[crm_id]=uuid
```

**Create Quote**:
```http
POST https://api.stripe.com/v1/quotes
Body: customer=cus_xxx&line_items[0][price_data][currency]=usd&...
```

**Create Invoice**:
```http
POST https://api.stripe.com/v1/invoices
Body: customer=cus_xxx&collection_method=send_invoice&days_until_due=30
```

**Add Invoice Item**:
```http
POST https://api.stripe.com/v1/invoiceitems
Body: customer=cus_xxx&invoice=in_xxx&amount=15000&currency=usd
```

**Finalize Invoice**:
```http
POST https://api.stripe.com/v1/invoices/{invoice_id}/finalize
```

**Send Invoice**:
```http
POST https://api.stripe.com/v1/invoices/{invoice_id}/send_invoice
```

---

### Pattern 3: Currency Conversion

**USD Conversion** (cents):
```javascript
// CRM (dollars) → Stripe (cents)
{{trigger.object.totalAmount * 100}}

// Stripe (cents) → CRM (dollars)
{{trigger.body.data.object.amount_paid / 100}}
```

---

### Pattern 4: Error Handling

**Stripe API Error Response**:
```json
{
  "error": {
    "type": "invalid_request_error",
    "message": "Customer not found",
    "code": "resource_missing"
  }
}
```

**In Workflow**:
1. Add IF_ELSE after HTTP_REQUEST
2. Check: `{{steps.apiCall.result.error}}` exists
3. If error → SEND_EMAIL to admin with error details
4. If success → Continue workflow

---

## Implementation Guide

### Phase 1: Setup Foundation (Week 1)

1. **Create Stripe Webhook in Twenty**:
   - Go to Workflows → New Workflow
   - Name: "Stripe Event Handler"
   - Trigger: WEBHOOK (POST)
   - Copy webhook URL
   - Add to Stripe Dashboard

2. **Add Environment Variable**:
   - Backend `.env`: `STRIPE_SECRET_KEY=sk_test_...`
   - Restart server

3. **Test Webhook**:
   - Create simple workflow that logs webhook data
   - Trigger test event from Stripe Dashboard
   - Verify data received in Twenty

### Phase 2: Quote Workflows (Week 2)

Implement workflows:
- WF-001: Auto-create Stripe Quote
- WF-002: Handle Quote Acceptance
- WF-003: Check Expired Quotes

### Phase 3: Order & Invoice Workflows (Week 3)

Implement workflows:
- WF-004: Create Invoice from Order
- WF-005: Send Stripe Invoice

### Phase 4: Payment Workflows (Week 4)

Implement workflows:
- WF-006: Update on Payment Success
- WF-007: Handle Payment Failures

### Phase 5: Additional Workflows (Week 5+)

Implement workflows:
- WF-008: Link Expenses to Projects
- WF-009: Monthly Budget Reports
- WF-010: Welcome Emails

---

## Best Practices

### Workflow Design

1. **Keep Workflows Focused**: One workflow = one trigger + one purpose
2. **Use Descriptive Names**: "Handle Stripe Quote Acceptance" not "Workflow 1"
3. **Add Comments**: Use step descriptions to explain logic
4. **Error Handling**: Always check for missing data or failed API calls
5. **Idempotency**: Check if action already done before repeating (use IF_ELSE)

### Variable Usage

1. **Validate Data**: Check if `{{variable}}` exists before using
2. **Type Conversions**: Remember currency conversions (dollars ↔ cents)
3. **Null Handling**: Use IF_ELSE to check for null/empty values
4. **Timestamps**: Stripe uses Unix timestamps (seconds), CRM uses milliseconds

### Performance

1. **Limit Queries**: Use specific filters instead of fetching all records
2. **Batch Operations**: Use ITERATOR for bulk actions
3. **Delays**: Add delays before sending emails to avoid spam flags
4. **Cron Timing**: Schedule heavy workflows during off-peak hours

### Security

1. **Environment Variables**: Store API keys in env vars, not hardcoded
2. **Webhook Validation**: Verify Stripe signatures in production
3. **Data Sanitization**: Validate user input before API calls
4. **Least Privilege**: Only grant necessary permissions

### Testing

1. **Use Stripe Test Mode**: Test all workflows with `sk_test_` keys
2. **Test Cards**: Use 4242 4242 4242 4242 for success tests
3. **Manual Testing**: Trigger workflows manually before going live
4. **Monitor Runs**: Check workflow run history for errors

### Maintenance

1. **Version Control**: Export workflow JSON to git
2. **Documentation**: Keep this guide updated with changes
3. **Monitoring**: Set up alerts for workflow failures
4. **Cleanup**: Archive unused workflows

---

## Appendix: Workflow JSON Templates

### Template 1: Stripe Webhook Handler
```json
{
  "name": "Handle Stripe Invoice Paid",
  "trigger": {
    "type": "WEBHOOK",
    "settings": {
      "method": "POST",
      "outputSchema": {
        "body": {
          "id": "string",
          "type": "string",
          "data": {
            "object": {
              "id": "string",
              "customer": "string",
              "amount_paid": "number",
              "metadata": {
                "crm_invoice_id": "string"
              }
            }
          }
        }
      }
    }
  },
  "steps": [
    {
      "type": "FIND_RECORDS",
      "settings": {
        "objectName": "invoice",
        "filter": {
          "stripeInvoiceId": {
            "eq": "{{trigger.body.data.object.id}}"
          }
        }
      }
    },
    {
      "type": "UPDATE_RECORD",
      "settings": {
        "objectName": "invoice",
        "objectRecordId": "{{steps.step1.result[0].id}}",
        "fields": {
          "status": "Paid",
          "amountPaid": "{{trigger.body.data.object.amount_paid / 100}}"
        }
      }
    }
  ]
}
```

---

## Next Steps

1. ✅ Review this workflow design guide
2. ⏳ Create custom fields for Order, Quote, Invoice (Stripe fields)
3. ⏳ Set up Stripe webhook endpoint in Twenty
4. ⏳ Implement WF-001 through WF-010 in sequence
5. ⏳ Test each workflow in Stripe test mode
6. ⏳ Document any custom workflows specific to Phos Industries
7. ⏳ Train team on workflow management

---

**Last Updated**: 2026-01-25
**Version**: 1.0
**Author**: Phos Industries CRM Team
