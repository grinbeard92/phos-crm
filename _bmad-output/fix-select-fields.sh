#!/bin/bash
# Fix SELECT fields with proper position values

API_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI1NzJhMmI0MC0zMDExLTRhMTUtYmZmNC0zNzZmODE3Yjg4ZTciLCJ0eXBlIjoiQVBJX0tFWSIsIndvcmtzcGFjZUlkIjoiNTcyYTJiNDAtMzAxMS00YTE1LWJmZjQtMzc2ZjgxN2I4OGU3IiwiaWF0IjoxNzY5MzIxNDIxLCJleHAiOjQ5MjI5MjE0MjAsImp0aSI6IjVmMjM2MThlLTc3YTMtNDIxZC1iMGRlLTUyZGEzYTI4MTcyMyJ9.TDPdX88kBxuUXnGwieAbt6Naod3XLtDDEhIdFmd7NeE"
GRAPHQL_ENDPOINT="http://localhost:3000/graphql"

PROJECT_ID="908deb12-79d9-4516-bf60-f4f0e2853dc3"
EXPENSE_ID="de73f140-b98e-4f50-8de5-b0c494c7dbb4"
QUOTE_ID="1e395f61-91dd-4ce3-8872-0b674cec9b41"
INVOICE_ID="ab4f4492-82f6-4628-87cb-0b07358ea899"
TICKET_ID="3c04feb6-846e-47e6-a207-4c5eb0c59cb5"

echo "=== Fixing SELECT Fields with Proper Positions ==="
echo ""

echo "1. Projects - Status..."
curl -s -X POST "$GRAPHQL_ENDPOINT" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $API_KEY" \
  -d '{
    "query": "mutation CreateField($input: CreateOneFieldMetadataInput!) { createOneField(input: $input) { id name label type } }",
    "variables": {
      "input": {
        "field": {
          "objectMetadataId": "'"$PROJECT_ID"'",
          "name": "status",
          "label": "Status",
          "type": "SELECT",
          "description": "Current project status",
          "options": [
            {"value": "NOT_STARTED", "label": "Not Started", "color": "gray", "position": 0},
            {"value": "IN_PROGRESS", "label": "In Progress", "color": "blue", "position": 1},
            {"value": "ON_HOLD", "label": "On Hold", "color": "yellow", "position": 2},
            {"value": "COMPLETED", "label": "Completed", "color": "green", "position": 3},
            {"value": "CANCELLED", "label": "Cancelled", "color": "red", "position": 4}
          ]
        }
      }
    }
  }' | jq '.'
sleep 1

echo ""
echo "2. Expenses - Category..."
curl -s -X POST "$GRAPHQL_ENDPOINT" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $API_KEY" \
  -d '{
    "query": "mutation CreateField($input: CreateOneFieldMetadataInput!) { createOneField(input: $input) { id name label type } }",
    "variables": {
      "input": {
        "field": {
          "objectMetadataId": "'"$EXPENSE_ID"'",
          "name": "category",
          "label": "Category",
          "type": "SELECT",
          "description": "Expense category",
          "options": [
            {"value": "MATERIALS", "label": "Materials", "color": "blue", "position": 0},
            {"value": "LABOR", "label": "Labor", "color": "green", "position": 1},
            {"value": "EQUIPMENT", "label": "Equipment", "color": "purple", "position": 2},
            {"value": "TRAVEL", "label": "Travel", "color": "orange", "position": 3},
            {"value": "SOFTWARE", "label": "Software", "color": "cyan", "position": 4},
            {"value": "OTHER", "label": "Other", "color": "gray", "position": 5}
          ]
        }
      }
    }
  }' | jq '.'
sleep 1

echo ""
echo "3. Quotes - Status..."
curl -s -X POST "$GRAPHQL_ENDPOINT" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $API_KEY" \
  -d '{
    "query": "mutation CreateField($input: CreateOneFieldMetadataInput!) { createOneField(input: $input) { id name label type } }",
    "variables": {
      "input": {
        "field": {
          "objectMetadataId": "'"$QUOTE_ID"'",
          "name": "status",
          "label": "Status",
          "type": "SELECT",
          "description": "Quote status",
          "options": [
            {"value": "DRAFT", "label": "Draft", "color": "gray", "position": 0},
            {"value": "SENT", "label": "Sent", "color": "blue", "position": 1},
            {"value": "VIEWED", "label": "Viewed", "color": "cyan", "position": 2},
            {"value": "ACCEPTED", "label": "Accepted", "color": "green", "position": 3},
            {"value": "DECLINED", "label": "Declined", "color": "red", "position": 4},
            {"value": "EXPIRED", "label": "Expired", "color": "orange", "position": 5}
          ]
        }
      }
    }
  }' | jq '.'
sleep 1

echo ""
echo "4. Invoices - Status..."
curl -s -X POST "$GRAPHQL_ENDPOINT" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $API_KEY" \
  -d '{
    "query": "mutation CreateField($input: CreateOneFieldMetadataInput!) { createOneField(input: $input) { id name label type } }",
    "variables": {
      "input": {
        "field": {
          "objectMetadataId": "'"$INVOICE_ID"'",
          "name": "status",
          "label": "Status",
          "type": "SELECT",
          "description": "Invoice status",
          "options": [
            {"value": "DRAFT", "label": "Draft", "color": "gray", "position": 0},
            {"value": "SENT", "label": "Sent", "color": "blue", "position": 1},
            {"value": "VIEWED", "label": "Viewed", "color": "cyan", "position": 2},
            {"value": "PARTIAL", "label": "Partially Paid", "color": "yellow", "position": 3},
            {"value": "PAID", "label": "Paid", "color": "green", "position": 4},
            {"value": "OVERDUE", "label": "Overdue", "color": "red", "position": 5},
            {"value": "CANCELLED", "label": "Cancelled", "color": "orange", "position": 6}
          ]
        }
      }
    }
  }' | jq '.'
sleep 1

echo ""
echo "5. Support Tickets - Priority..."
curl -s -X POST "$GRAPHQL_ENDPOINT" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $API_KEY" \
  -d '{
    "query": "mutation CreateField($input: CreateOneFieldMetadataInput!) { createOneField(input: $input) { id name label type } }",
    "variables": {
      "input": {
        "field": {
          "objectMetadataId": "'"$TICKET_ID"'",
          "name": "priority",
          "label": "Priority",
          "type": "SELECT",
          "description": "Ticket priority level",
          "options": [
            {"value": "LOW", "label": "Low", "color": "gray", "position": 0},
            {"value": "MEDIUM", "label": "Medium", "color": "blue", "position": 1},
            {"value": "HIGH", "label": "High", "color": "orange", "position": 2},
            {"value": "URGENT", "label": "Urgent", "color": "red", "position": 3}
          ]
        }
      }
    }
  }' | jq '.'
sleep 1

echo ""
echo "6. Support Tickets - Status..."
curl -s -X POST "$GRAPHQL_ENDPOINT" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $API_KEY" \
  -d '{
    "query": "mutation CreateField($input: CreateOneFieldMetadataInput!) { createOneField(input: $input) { id name label type } }",
    "variables": {
      "input": {
        "field": {
          "objectMetadataId": "'"$TICKET_ID"'",
          "name": "status",
          "label": "Status",
          "type": "SELECT",
          "description": "Ticket status",
          "options": [
            {"value": "NEW", "label": "New", "color": "blue", "position": 0},
            {"value": "OPEN", "label": "Open", "color": "cyan", "position": 1},
            {"value": "IN_PROGRESS", "label": "In Progress", "color": "yellow", "position": 2},
            {"value": "WAITING", "label": "Waiting on Customer", "color": "orange", "position": 3},
            {"value": "RESOLVED", "label": "Resolved", "color": "green", "position": 4},
            {"value": "CLOSED", "label": "Closed", "color": "gray", "position": 5}
          ]
        }
      }
    }
  }' | jq '.'

echo ""
echo "✓ All SELECT fields created!"
