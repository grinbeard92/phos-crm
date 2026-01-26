#!/bin/bash
# Create custom business objects for Phos Industries CRM

API_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI1NzJhMmI0MC0zMDExLTRhMTUtYmZmNC0zNzZmODE3Yjg4ZTciLCJ0eXBlIjoiQVBJX0tFWSIsIndvcmtzcGFjZUlkIjoiNTcyYTJiNDAtMzAxMS00YTE1LWJmZjQtMzc2ZjgxN2I4OGU3IiwiaWF0IjoxNzY5MzIxNDIxLCJleHAiOjQ5MjI5MjE0MjAsImp0aSI6IjVmMjM2MThlLTc3YTMtNDIxZC1iMGRlLTUyZGEzYTI4MTcyMyJ9.TDPdX88kBxuUXnGwieAbt6Naod3XLtDDEhIdFmd7NeE"
GRAPHQL_ENDPOINT="http://localhost:3000/graphql"

echo "=== Creating Phos Industries Custom Business Objects ==="
echo ""

# 1. Create Projects Object
echo "1. Creating Projects object..."
curl -s -X POST "$GRAPHQL_ENDPOINT" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $API_KEY" \
  -d '{
    "query": "mutation CreateObject($input: CreateOneObjectInput!) { createOneObject(input: $input) { id nameSingular namePlural labelSingular labelPlural description icon } }",
    "variables": {
      "input": {
        "object": {
          "nameSingular": "project",
          "namePlural": "projects",
          "labelSingular": "Project",
          "labelPlural": "Projects",
          "description": "Project management with Gantt and Kanban support",
          "icon": "IconBriefcase"
        }
      }
    }
  }' | jq '.'
echo ""
sleep 2

# 2. Create Expenses Object
echo "2. Creating Expenses object..."
curl -s -X POST "$GRAPHQL_ENDPOINT" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $API_KEY" \
  -d '{
    "query": "mutation CreateObject($input: CreateOneObjectInput!) { createOneObject(input: $input) { id nameSingular namePlural labelSingular labelPlural description icon } }",
    "variables": {
      "input": {
        "object": {
          "nameSingular": "expense",
          "namePlural": "expenses",
          "labelSingular": "Expense",
          "labelPlural": "Expenses",
          "description": "Expense tracking with receipts and project association",
          "icon": "IconReceipt"
        }
      }
    }
  }' | jq '.'
echo ""
sleep 2

# 3. Create Quotes Object
echo "3. Creating Quotes object..."
curl -s -X POST "$GRAPHQL_ENDPOINT" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $API_KEY" \
  -d '{
    "query": "mutation CreateObject($input: CreateOneObjectInput!) { createOneObject(input: $input) { id nameSingular namePlural labelSingular labelPlural description icon } }",
    "variables": {
      "input": {
        "object": {
          "nameSingular": "quote",
          "namePlural": "quotes",
          "labelSingular": "Quote",
          "labelPlural": "Quotes",
          "description": "Customer quotes and proposals",
          "icon": "IconFileText"
        }
      }
    }
  }' | jq '.'
echo ""
sleep 2

# 4. Create Invoices Object
echo "4. Creating Invoices object..."
curl -s -X POST "$GRAPHQL_ENDPOINT" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $API_KEY" \
  -d '{
    "query": "mutation CreateObject($input: CreateOneObjectInput!) { createOneObject(input: $input) { id nameSingular namePlural labelSingular labelPlural description icon } }",
    "variables": {
      "input": {
        "object": {
          "nameSingular": "invoice",
          "namePlural": "invoices",
          "labelSingular": "Invoice",
          "labelPlural": "Invoices",
          "description": "Billing and invoices with Stripe integration",
          "icon": "IconCurrencyDollar"
        }
      }
    }
  }' | jq '.'
echo ""
sleep 2

# 5. Create Support Tickets Object
echo "5. Creating Support Tickets object..."
curl -s -X POST "$GRAPHQL_ENDPOINT" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $API_KEY" \
  -d '{
    "query": "mutation CreateObject($input: CreateOneObjectInput!) { createOneObject(input: $input) { id nameSingular namePlural labelSingular labelPlural description icon } }",
    "variables": {
      "input": {
        "object": {
          "nameSingular": "supportTicket",
          "namePlural": "supportTickets",
          "labelSingular": "Support Ticket",
          "labelPlural": "Support Tickets",
          "description": "Customer support ticket tracking",
          "icon": "IconHelp"
        }
      }
    }
  }' | jq '.'
echo ""

echo "✓ Custom object creation complete!"
echo "Check http://localhost:3001/settings/objects for your new objects"
