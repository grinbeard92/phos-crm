#!/bin/bash
# Add custom fields to Phos Industries business objects

API_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI1NzJhMmI0MC0zMDExLTRhMTUtYmZmNC0zNzZmODE3Yjg4ZTciLCJ0eXBlIjoiQVBJX0tFWSIsIndvcmtzcGFjZUlkIjoiNTcyYTJiNDAtMzAxMS00YTE1LWJmZjQtMzc2ZjgxN2I4OGU3IiwiaWF0IjoxNzY5MzIxNDIxLCJleHAiOjQ5MjI5MjE0MjAsImp0aSI6IjVmMjM2MThlLTc3YTMtNDIxZC1iMGRlLTUyZGEzYTI4MTcyMyJ9.TDPdX88kBxuUXnGwieAbt6Naod3XLtDDEhIdFmd7NeE"
GRAPHQL_ENDPOINT="http://localhost:3000/graphql"

# Object IDs
PROJECT_ID="908deb12-79d9-4516-bf60-f4f0e2853dc3"
EXPENSE_ID="de73f140-b98e-4f50-8de5-b0c494c7dbb4"
QUOTE_ID="1e395f61-91dd-4ce3-8872-0b674cec9b41"
INVOICE_ID="ab4f4492-82f6-4628-87cb-0b07358ea899"
TICKET_ID="3c04feb6-846e-47e6-a207-4c5eb0c59cb5"

create_field() {
  local object_id=$1
  local name=$2
  local label=$3
  local type=$4
  local description=$5
  local options=$6

  if [ -z "$options" ]; then
    curl -s -X POST "$GRAPHQL_ENDPOINT" \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer $API_KEY" \
      -d "{
        \"query\": \"mutation CreateField(\$input: CreateOneFieldMetadataInput!) { createOneField(input: \$input) { id name label type } }\",
        \"variables\": {
          \"input\": {
            \"field\": {
              \"objectMetadataId\": \"$object_id\",
              \"name\": \"$name\",
              \"label\": \"$label\",
              \"type\": \"$type\",
              \"description\": \"$description\"
            }
          }
        }
      }" | jq '.'
  else
    curl -s -X POST "$GRAPHQL_ENDPOINT" \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer $API_KEY" \
      -d "{
        \"query\": \"mutation CreateField(\$input: CreateOneFieldMetadataInput!) { createOneField(input: \$input) { id name label type } }\",
        \"variables\": {
          \"input\": {
            \"field\": {
              \"objectMetadataId\": \"$object_id\",
              \"name\": \"$name\",
              \"label\": \"$label\",
              \"type\": \"$type\",
              \"description\": \"$description\",
              \"options\": $options
            }
          }
        }
      }" | jq '.'
  fi
  sleep 1
}

echo "=== Adding Fields to Projects ==="
echo "1. Project Status (SELECT)..."
create_field "$PROJECT_ID" "status" "Status" "SELECT" "Current project status" '[
  {"value": "NOT_STARTED", "label": "Not Started", "color": "gray"},
  {"value": "IN_PROGRESS", "label": "In Progress", "color": "blue"},
  {"value": "ON_HOLD", "label": "On Hold", "color": "yellow"},
  {"value": "COMPLETED", "label": "Completed", "color": "green"},
  {"value": "CANCELLED", "label": "Cancelled", "color": "red"}
]'

echo "2. Start Date..."
create_field "$PROJECT_ID" "startDate" "Start Date" "DATE" "Project start date"

echo "3. End Date..."
create_field "$PROJECT_ID" "endDate" "End Date" "DATE" "Project end date"

echo "4. Budget..."
create_field "$PROJECT_ID" "budget" "Budget" "CURRENCY" "Project budget amount"

echo "5. Description..."
create_field "$PROJECT_ID" "description" "Description" "RICH_TEXT" "Project description and details"

echo ""
echo "=== Adding Fields to Expenses ==="
echo "1. Amount..."
create_field "$EXPENSE_ID" "amount" "Amount" "CURRENCY" "Expense amount"

echo "2. Expense Date..."
create_field "$EXPENSE_ID" "expenseDate" "Expense Date" "DATE" "Date expense was incurred"

echo "3. Category (SELECT)..."
create_field "$EXPENSE_ID" "category" "Category" "SELECT" "Expense category" '[
  {"value": "MATERIALS", "label": "Materials", "color": "blue"},
  {"value": "LABOR", "label": "Labor", "color": "green"},
  {"value": "EQUIPMENT", "label": "Equipment", "color": "purple"},
  {"value": "TRAVEL", "label": "Travel", "color": "orange"},
  {"value": "SOFTWARE", "label": "Software", "color": "cyan"},
  {"value": "OTHER", "label": "Other", "color": "gray"}
]'

echo "4. Receipt Number..."
create_field "$EXPENSE_ID" "receiptNumber" "Receipt Number" "TEXT" "Receipt or invoice number"

echo "5. Vendor..."
create_field "$EXPENSE_ID" "vendor" "Vendor" "TEXT" "Vendor or supplier name"

echo "6. Notes..."
create_field "$EXPENSE_ID" "notes" "Notes" "RICH_TEXT" "Additional expense notes"

echo "7. Tax Deductible..."
create_field "$EXPENSE_ID" "taxDeductible" "Tax Deductible" "BOOLEAN" "Is this expense tax deductible?"

echo ""
echo "=== Adding Fields to Quotes ==="
echo "1. Quote Number..."
create_field "$QUOTE_ID" "quoteNumber" "Quote Number" "TEXT" "Unique quote identifier"

echo "2. Quote Date..."
create_field "$QUOTE_ID" "quoteDate" "Quote Date" "DATE" "Date quote was created"

echo "3. Valid Until..."
create_field "$QUOTE_ID" "validUntil" "Valid Until" "DATE" "Quote expiration date"

echo "4. Total Amount..."
create_field "$QUOTE_ID" "totalAmount" "Total Amount" "CURRENCY" "Total quote amount"

echo "5. Status (SELECT)..."
create_field "$QUOTE_ID" "status" "Status" "SELECT" "Quote status" '[
  {"value": "DRAFT", "label": "Draft", "color": "gray"},
  {"value": "SENT", "label": "Sent", "color": "blue"},
  {"value": "VIEWED", "label": "Viewed", "color": "cyan"},
  {"value": "ACCEPTED", "label": "Accepted", "color": "green"},
  {"value": "DECLINED", "label": "Declined", "color": "red"},
  {"value": "EXPIRED", "label": "Expired", "color": "orange"}
]'

echo "6. Terms..."
create_field "$QUOTE_ID" "terms" "Terms" "RICH_TEXT" "Quote terms and conditions"

echo "7. Notes..."
create_field "$QUOTE_ID" "notes" "Notes" "RICH_TEXT" "Internal notes"

echo ""
echo "=== Adding Fields to Invoices ==="
echo "1. Invoice Number..."
create_field "$INVOICE_ID" "invoiceNumber" "Invoice Number" "TEXT" "Unique invoice identifier"

echo "2. Invoice Date..."
create_field "$INVOICE_ID" "invoiceDate" "Invoice Date" "DATE" "Date invoice was issued"

echo "3. Due Date..."
create_field "$INVOICE_ID" "dueDate" "Due Date" "DATE" "Payment due date"

echo "4. Total Amount..."
create_field "$INVOICE_ID" "totalAmount" "Total Amount" "CURRENCY" "Total invoice amount"

echo "5. Amount Paid..."
create_field "$INVOICE_ID" "amountPaid" "Amount Paid" "CURRENCY" "Amount already paid"

echo "6. Status (SELECT)..."
create_field "$INVOICE_ID" "status" "Status" "SELECT" "Invoice status" '[
  {"value": "DRAFT", "label": "Draft", "color": "gray"},
  {"value": "SENT", "label": "Sent", "color": "blue"},
  {"value": "VIEWED", "label": "Viewed", "color": "cyan"},
  {"value": "PARTIAL", "label": "Partially Paid", "color": "yellow"},
  {"value": "PAID", "label": "Paid", "color": "green"},
  {"value": "OVERDUE", "label": "Overdue", "color": "red"},
  {"value": "CANCELLED", "label": "Cancelled", "color": "orange"}
]'

echo "7. Stripe Payment ID..."
create_field "$INVOICE_ID" "stripePaymentId" "Stripe Payment ID" "TEXT" "Stripe payment reference"

echo "8. Payment Method..."
create_field "$INVOICE_ID" "paymentMethod" "Payment Method" "TEXT" "How payment was received"

echo "9. Notes..."
create_field "$INVOICE_ID" "notes" "Notes" "RICH_TEXT" "Invoice notes"

echo ""
echo "=== Adding Fields to Support Tickets ==="
echo "1. Ticket Number..."
create_field "$TICKET_ID" "ticketNumber" "Ticket Number" "TEXT" "Unique ticket identifier"

echo "2. Priority (SELECT)..."
create_field "$TICKET_ID" "priority" "Priority" "SELECT" "Ticket priority level" '[
  {"value": "LOW", "label": "Low", "color": "gray"},
  {"value": "MEDIUM", "label": "Medium", "color": "blue"},
  {"value": "HIGH", "label": "High", "color": "orange"},
  {"value": "URGENT", "label": "Urgent", "color": "red"}
]'

echo "3. Status (SELECT)..."
create_field "$TICKET_ID" "status" "Status" "SELECT" "Ticket status" '[
  {"value": "NEW", "label": "New", "color": "blue"},
  {"value": "OPEN", "label": "Open", "color": "cyan"},
  {"value": "IN_PROGRESS", "label": "In Progress", "color": "yellow"},
  {"value": "WAITING", "label": "Waiting on Customer", "color": "orange"},
  {"value": "RESOLVED", "label": "Resolved", "color": "green"},
  {"value": "CLOSED", "label": "Closed", "color": "gray"}
]'

echo "4. Subject..."
create_field "$TICKET_ID" "subject" "Subject" "TEXT" "Ticket subject line"

echo "5. Description..."
create_field "$TICKET_ID" "description" "Description" "RICH_TEXT" "Detailed issue description"

echo "6. Resolution..."
create_field "$TICKET_ID" "resolution" "Resolution" "RICH_TEXT" "How the issue was resolved"

echo "7. Created Date..."
create_field "$TICKET_ID" "createdDate" "Created Date" "DATE_TIME" "When ticket was created"

echo "8. Resolved Date..."
create_field "$TICKET_ID" "resolvedDate" "Resolved Date" "DATE_TIME" "When ticket was resolved"

echo ""
echo "✓ All fields added successfully!"
echo "Check your objects in the UI: http://localhost:3001/settings/objects"
