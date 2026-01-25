# Epic 006: Enhanced Workflows & Automation

**Epic ID**: EPIC-006
**Phase**: Phase 6 (Weeks 11-12)
**Priority**: P1 (High)
**Status**: Not Started
**Owner**: TBD
**Target Completion**: Week 12

## Epic Overview

Automate repetitive tasks with workflows for invoice reminders, budget alerts, milestone notifications, and expense approvals.

## Success Criteria

- [ ] 6-8 production workflows active and tested
- [ ] Email notifications working reliably
- [ ] Automated reminders reduce manual work by >50%

## User Stories

### Story 6.1: Create Invoice Payment Reminder Workflow (3h)
- Trigger: Cron (daily at 9am)
- Find overdue invoices (status=Sent, dueDate < today, balanceDue > 0)
- Send reminder email to customer
- Create follow-up task for sales rep
- Update status to "Overdue"

### Story 6.2: Create Project Budget Alert Workflow (2h)
- Trigger: Expense created/updated
- Calculate actualCost (sum expenses)
- If actualCost > 80% of budget: notify project manager

### Story 6.3: Create Milestone Notification Workflow (2h)
- Trigger: Cron (daily)
- Find milestones due in 3 days
- Send email to project manager
- If status != Completed: escalate notification

### Story 6.4: Create Expense Approval Automation (3h)
- Trigger: Expense.status = Submitted
- If amount > $500: create approval task, email manager
- On approval: update status, create reimbursement task

### Story 6.5: Build Custom Email Templates for Workflows (4h)
- Template: Invoice payment reminder
- Template: Budget alert
- Template: Milestone reminder
- Template: Expense approval request

### Story 6.6: Implement Quote Expiry Workflow (2h)
- Trigger: Cron (daily)
- Find quotes where expiryDate < today and status = "Sent"
- Update status to "Expired"
- Optional: notify sales rep

### Story 6.7: Create Customer Activity Summary Workflow (3h)
- Trigger: Cron (weekly on Monday)
- Generate summary of customer activity (emails, tasks, opportunities)
- Email digest to account manager

### Story 6.8: Test All Workflows End-to-End (3h)
- Test each workflow in development
- Verify emails sent correctly
- Confirm notifications created
- Check error handling

## Technical Notes

**Location**: `/packages/twenty-server/src/modules/workflows/`

Use Twenty's existing workflow engine (cron triggers, webhook triggers, status change triggers)

---

## Dependencies

- **Blocked By**: Epic 002 (invoices), Epic 004 (expenses)
