# Epic 004: Expense Tracking & Financial Dashboards

**Epic ID**: EPIC-004
**Phase**: Phase 4 (Weeks 7-8)
**Priority**: P0 (Critical)
**Status**: Not Started
**Owner**: TBD
**Target Completion**: Week 8

## Epic Overview

Build comprehensive expense management system with receipt uploads, approval workflows, project tracking, and financial dashboard visualizations.

## Success Criteria

- [ ] Can submit expenses with receipt attachments
- [ ] Expense approval workflow functional
- [ ] Project expense tracking working
- [ ] Tax year export generates CSV/Excel with receipts
- [ ] Financial dashboards show accurate real-time data

## User Stories

### Story 4.1: Build Expense Submission Form with Receipt Upload (4h)
- Expense form with all fields
- Receipt drag-and-drop upload (PDF, PNG, JPG, HEIC)
- Multi-receipt support per expense
- Link expenses to projects

### Story 4.2: Implement Expense Approval Workflow (5h)
- Status: Draft → Submitted → Approved/Rejected → Paid
- Approval threshold (>$500 requires manager approval)
- Email notifications to approvers
- Approval/rejection UI

### Story 4.3: Create Project-Expense Relationship Views (3h)
- Project detail page shows expenses
- Budget vs actual tracking
- Expense breakdown by category
- Real-time budget alerts (>80% threshold)

### Story 4.4: Build Expense Category Management UI (2h)
- CRUD for ExpenseCategory
- Tax category mapping (IRS categories)
- Color coding for UI
- Active/inactive toggle

### Story 4.5: Create Financial Dashboard Widgets (8h)
- Revenue by customer chart (bar/pie)
- Expense by category chart (pie)
- Cash flow timeline (line chart: income vs expenses)
- Outstanding invoices table (sortable, filterable)
- Project profitability chart (revenue - expenses per project)
- Budget vs actual gauges

### Story 4.6: Implement Tax Year Export Functionality (4h)
- Export formats: CSV, Excel
- Date range filter (fiscal year, calendar year, custom)
- Filter by taxDeductible=true
- Group by category
- Include receipt attachments (ZIP bundle)

### Story 4.7: Create Expense Report PDF Generation (3h)
- PDF template for expense reports
- Project expense reports
- Category summaries
- Receipt thumbnails in PDF

## Technical Notes

**Chart Library**: Use Twenty's existing dashboard components or Recharts

**Export Library**: Use `xlsx` for Excel generation

**File Storage**: S3-compatible or local storage for receipts

---

## Dependencies

- **Blocked By**: Epic 001 (Expense objects), Epic 003 (payment data for dashboards)
- **Blocks**: None
