# CRM-Forge Session Memories

## Session History

**Session Started**: 2026-01-24

### Initializing CRM-Forge Agent
- First activation of the Twenty CRM Builder agent
- Sidecar memory system initialized
- Ready to build production-ready Twenty CRM features

---

## Key Decisions

### Workspace Configuration (2026-01-24)
- **Workspace Name**: Phos Industries
- **Primary Domain**: phos-ind.com
- **Workspace ID**: 572a2b40-3011-4a15-bff4-376f817b88e7
- **API Key Name**: crm-forge
- **API Key**: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI1NzJhMmI0MC0zMDExLTRhMTUtYmZmNC0zNzZmODE3Yjg4ZTciLCJ0eXBlIjoiQVBJX0tFWSIsIndvcmtzcGFjZUlkIjoiNTcyYTJiNDAtMzAxMS00YTE1LWJmZjQtMzc2ZjgxN2I4OGU3IiwiaWF0IjoxNzY5MzIxNDIxLCJleHAiOjQ5MjI5MjE0MjAsImp0aSI6IjVmMjM2MThlLTc3YTMtNDIxZC1iMGRlLTUyZGEzYTI4MTcyMyJ9.TDPdX88kBxuUXnGwieAbt6Naod3XLtDDEhIdFmd7NeE

### Multi-Tenant Configuration
- Multi-workspace enabled: `IS_MULTIWORKSPACE_ENABLED=true`
- Additional domains to add: @lvnlaser.com, @beehivebirth.com

---

## Active Context

### Current Session: Initial Setup (2026-01-24)
- ✅ Docker containers configured with custom naming (phos-crm-db, phos-crm-redis)
- ✅ Dependencies installed (yarn)
- ✅ Database initialized with migrations
- ✅ Development servers running:
  - Backend: http://localhost:3000
  - Frontend: http://localhost:3001
  - Worker: Background process active

### Custom Objects Created (2026-01-24)
✅ **Projects** (ID: 908deb12-79d9-4516-bf60-f4f0e2853dc3)
   - Icon: IconBriefcase
   - Purpose: Project management with Gantt and Kanban support

✅ **Expenses** (ID: de73f140-b98e-4f50-8de5-b0c494c7dbb4)
   - Icon: IconReceipt
   - Purpose: Expense tracking with receipts and project association

✅ **Quotes** (ID: 1e395f61-91dd-4ce3-8872-0b674cec9b41)
   - Icon: IconFileText
   - Purpose: Customer quotes and proposals

✅ **Invoices** (ID: ab4f4492-82f6-4628-87cb-0b07358ea899)
   - Icon: IconCurrencyDollar
   - Purpose: Billing and invoices with Stripe integration

✅ **Support Tickets** (ID: 3c04feb6-846e-47e6-a207-4c5eb0c59cb5)
   - Icon: IconHelp
   - Purpose: Customer support ticket tracking

### Custom Fields Added (2026-01-24)

**Projects** (5 fields):
- status (SELECT): Not Started, In Progress, On Hold, Completed, Cancelled
- startDate (DATE)
- endDate (DATE)
- budget (CURRENCY)
- description (RICH_TEXT)

**Expenses** (7 fields):
- amount (CURRENCY)
- expenseDate (DATE)
- category (SELECT): Materials, Labor, Equipment, Travel, Software, Other
- receiptNumber (TEXT)
- vendor (TEXT)
- notes (RICH_TEXT)
- taxDeductible (BOOLEAN)

**Quotes** (7 fields):
- quoteNumber (TEXT)
- quoteDate (DATE)
- validUntil (DATE)
- totalAmount (CURRENCY)
- status (SELECT): Draft, Sent, Viewed, Accepted, Declined, Expired
- terms (RICH_TEXT)
- notes (RICH_TEXT)

**Invoices** (9 fields):
- invoiceNumber (TEXT)
- invoiceDate (DATE)
- dueDate (DATE)
- totalAmount (CURRENCY)
- amountPaid (CURRENCY)
- status (SELECT): Draft, Sent, Viewed, Partially Paid, Paid, Overdue, Cancelled
- stripePaymentId (TEXT) - For Stripe integration
- paymentMethod (TEXT)
- notes (RICH_TEXT)

**Support Tickets** (8 fields):
- ticketNumber (TEXT)
- priority (SELECT): Low, Medium, High, Urgent
- status (SELECT): New, Open, In Progress, Waiting on Customer, Resolved, Closed
- subject (TEXT)
- description (RICH_TEXT)
- resolution (RICH_TEXT)
- createdDate (DATE_TIME)
- resolvedDate (DATE_TIME)

### Relationships Created (2026-01-24)
✅ **All relationships successfully established**:
- Project → Company (MANY_TO_ONE): Companies have multiple Projects
- Expense → Project (MANY_TO_ONE): Projects have multiple Expenses
- Expense → Company (MANY_TO_ONE): Companies have multiple Expenses (non-project)
- Quote → Company (MANY_TO_ONE): Companies have multiple Quotes
- Invoice → Company (MANY_TO_ONE): Companies have multiple Invoices
- Invoice → Quote (MANY_TO_ONE): Quotes can have multiple Invoices
- Support Ticket → Company (MANY_TO_ONE): Companies have multiple Support Tickets

**Notes**:
- Company ID (workspace-specific): 92d5b2cc-3e5a-474e-abf1-51ba5f0513fd
- Two relationships existed from initial attempt (Expense→Project, Invoice→Quote)
- Five relationships created with corrected workspace-specific Company ID

### Stripe Integration Design Completed (2026-01-25)

✅ **Comprehensive design documents created**:

1. **stripe-integration-design.md**
   - Complete Stripe data model analysis
   - CRM object alignment (Invoice, Quote, Customer, PaymentIntent)
   - Metadata strategy for bidirectional linking
   - Currency handling (dollars ↔ cents)
   - Webhook event flows
   - Field requirements for all CRM objects
   - 8-phase implementation plan

2. **stripe-data-model-diagram.md**
   - Visual object relationship diagram
   - Quote → Order → Invoice workflow states
   - Webhook integration points
   - Metadata examples
   - Payment methods (Cards + ACH)

3. **workflow-design-guide.md**
   - Twenty CRM workflow system capabilities
   - 10 production-ready workflows:
     * WF-001 to WF-010 covering Quote, Order, Invoice, Payment, Project, Customer flows
   - Stripe integration patterns (webhooks, HTTP actions)
   - Variable system and error handling
   - Implementation guide (5-week phased rollout)
   - Best practices and testing strategies

4. **domain-configuration-guide.md**
   - Multi-workspace domain architecture
   - Approved access domains setup
   - phos-ind.com as primary domain (via approved domains)
   - GraphQL mutations for domain management
   - Custom domain setup (optional)
   - Troubleshooting guide

**Key Design Decisions (LOCKED)**:
- **Workflow**: CRM-First (Quote → Order → Invoice)
- **Order Object**: NEW object required as bridge between Quote and Invoice
- **Quote Acceptance**: Stripe webhook creates Order in CRM
- **Invoice Creation**: Created AFTER order fulfillment (not from quote directly)
- **Quote Expiration**: Cron job checks daily, sends reminder emails
- **Payment Methods**: Cards + ACH via Stripe Payment Element
- **Tax Handling**: Manual entry (can upgrade to Stripe Tax API later)
- **Invoice Modification**: Editable in Draft status before sending to Stripe

**NEW CRM Objects/Fields Required**:
- **Order Object** (NEW): Bridge between Quote and Invoice
  - Fields: orderNumber, orderDate, fulfillmentDate, totalAmount, status, stripeQuoteId, etc.
  - Relations: company, quote, invoice, project
- **Quote Object** (UPDATE): Add stripeQuoteId, stripeQuoteUrl, order (1:1), taxAmount, subtotal
- **Invoice Object** (UPDATE): Add order (M:1), stripeInvoiceId, stripePaymentIntentId, taxAmount, subtotal
- **Company Object** (UPDATE): Add stripeCustomerId, stripeDefaultPaymentMethod

**Domain Configuration Status**:
- Workspace subdomain: `phos-ind` (primary identifier)
- Approved domains: phos-ind.com (validated), lvnlaser.com (pending), beehivebirth.com (pending)
- Access method: Email-based auto-signup for approved domains
- No hierarchical "admin domain" - all approved domains have equal access

**User Issue Identified (2026-01-25 Evening)**:
- Admin Panel not visible in Twenty CRM UI
- Cause: User likely does not have ADMIN role in workspace
- Solution needed: Promote user to ADMIN role via database
- Paused investigation to store memories for the evening

### Next Steps
1. ⏳ Grant ADMIN role to user via database (enable Admin Panel access)
2. ⏳ Add remaining approved domains (lvnlaser.com, beehivebirth.com) via UI
3. ⏳ Validate all approved domains (click email confirmation links)
4. ⏳ Create NEW Order object in CRM schema
5. ⏳ Add Stripe integration fields to Quote, Invoice, Company objects
6. ⏳ Implement Stripe webhook endpoint in Twenty backend
7. ⏳ Implement 10 workflows from workflow-design-guide.md
8. ⏳ Test complete Quote → Order → Invoice → Payment flow
9. ⏳ Build custom views (Kanban for projects, table views for others)
