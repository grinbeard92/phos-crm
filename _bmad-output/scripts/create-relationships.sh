#!/bin/bash
# Create relationships between Phos Industries objects

API_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI1NzJhMmI0MC0zMDExLTRhMTUtYmZmNC0zNzZmODE3Yjg4ZTciLCJ0eXBlIjoiQVBJX0tFWSIsIndvcmtzcGFjZUlkIjoiNTcyYTJiNDAtMzAxMS00YTE1LWJmZjQtMzc2ZjgxN2I4OGU3IiwiaWF0IjoxNzY5MzIxNDIxLCJleHAiOjQ5MjI5MjE0MjAsImp0aSI6IjVmMjM2MThlLTc3YTMtNDIxZC1iMGRlLTUyZGEzYTI4MTcyMyJ9.TDPdX88kBxuUXnGwieAbt6Naod3XLtDDEhIdFmd7NeE"
GRAPHQL_ENDPOINT="http://localhost:3000/graphql"

# Object IDs
COMPANY_ID="92d5b2cc-3e5a-474e-abf1-51ba5f0513fd"
PROJECT_ID="908deb12-79d9-4516-bf60-f4f0e2853dc3"
EXPENSE_ID="de73f140-b98e-4f50-8de5-b0c494c7dbb4"
QUOTE_ID="1e395f61-91dd-4ce3-8872-0b674cec9b41"
INVOICE_ID="ab4f4492-82f6-4628-87cb-0b07358ea899"
TICKET_ID="3c04feb6-846e-47e6-a207-4c5eb0c59cb5"

echo "=== Creating Relationships Between Objects ==="
echo ""

# 1. Project → Company (MANY_TO_ONE)
# Many projects can belong to one company
echo "1. Creating Project → Company relationship..."
curl -s -X POST "$GRAPHQL_ENDPOINT" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $API_KEY" \
  -d "{
    \"query\": \"mutation CreateField(\$input: CreateOneFieldMetadataInput!) { createOneField(input: \$input) { id name label type } }\",
    \"variables\": {
      \"input\": {
        \"field\": {
          \"objectMetadataId\": \"$PROJECT_ID\",
          \"name\": \"company\",
          \"label\": \"Company\",
          \"type\": \"RELATION\",
          \"description\": \"Company this project belongs to\",
          \"icon\": \"IconBuildingSkyscraper\",
          \"relationCreationPayload\": {
            \"type\": \"MANY_TO_ONE\",
            \"targetObjectMetadataId\": \"$COMPANY_ID\",
            \"targetFieldLabel\": \"Projects\",
            \"targetFieldIcon\": \"IconBriefcase\"
          }
        }
      }
    }
  }" | jq '.'
sleep 2

# 2. Expense → Project (MANY_TO_ONE)
# Many expenses can belong to one project
echo ""
echo "2. Creating Expense → Project relationship..."
curl -s -X POST "$GRAPHQL_ENDPOINT" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $API_KEY" \
  -d "{
    \"query\": \"mutation CreateField(\$input: CreateOneFieldMetadataInput!) { createOneField(input: \$input) { id name label type } }\",
    \"variables\": {
      \"input\": {
        \"field\": {
          \"objectMetadataId\": \"$EXPENSE_ID\",
          \"name\": \"project\",
          \"label\": \"Project\",
          \"type\": \"RELATION\",
          \"description\": \"Project this expense is for\",
          \"icon\": \"IconBriefcase\",
          \"relationCreationPayload\": {
            \"type\": \"MANY_TO_ONE\",
            \"targetObjectMetadataId\": \"$PROJECT_ID\",
            \"targetFieldLabel\": \"Expenses\",
            \"targetFieldIcon\": \"IconReceipt\"
          }
        }
      }
    }
  }" | jq '.'
sleep 2

# 3. Expense → Company (MANY_TO_ONE)
# Many expenses can belong to one company (for non-project expenses)
echo ""
echo "3. Creating Expense → Company relationship..."
curl -s -X POST "$GRAPHQL_ENDPOINT" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $API_KEY" \
  -d "{
    \"query\": \"mutation CreateField(\$input: CreateOneFieldMetadataInput!) { createOneField(input: \$input) { id name label type } }\",
    \"variables\": {
      \"input\": {
        \"field\": {
          \"objectMetadataId\": \"$EXPENSE_ID\",
          \"name\": \"company\",
          \"label\": \"Company\",
          \"type\": \"RELATION\",
          \"description\": \"Company this expense is for (if not project-specific)\",
          \"icon\": \"IconBuildingSkyscraper\",
          \"relationCreationPayload\": {
            \"type\": \"MANY_TO_ONE\",
            \"targetObjectMetadataId\": \"$COMPANY_ID\",
            \"targetFieldLabel\": \"Expenses\",
            \"targetFieldIcon\": \"IconReceipt\"
          }
        }
      }
    }
  }" | jq '.'
sleep 2

# 4. Quote → Company (MANY_TO_ONE)
# Many quotes can belong to one company
echo ""
echo "4. Creating Quote → Company relationship..."
curl -s -X POST "$GRAPHQL_ENDPOINT" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $API_KEY" \
  -d "{
    \"query\": \"mutation CreateField(\$input: CreateOneFieldMetadataInput!) { createOneField(input: \$input) { id name label type } }\",
    \"variables\": {
      \"input\": {
        \"field\": {
          \"objectMetadataId\": \"$QUOTE_ID\",
          \"name\": \"company\",
          \"label\": \"Company\",
          \"type\": \"RELATION\",
          \"description\": \"Company this quote is for\",
          \"icon\": \"IconBuildingSkyscraper\",
          \"relationCreationPayload\": {
            \"type\": \"MANY_TO_ONE\",
            \"targetObjectMetadataId\": \"$COMPANY_ID\",
            \"targetFieldLabel\": \"Quotes\",
            \"targetFieldIcon\": \"IconFileText\"
          }
        }
      }
    }
  }" | jq '.'
sleep 2

# 5. Invoice → Company (MANY_TO_ONE)
# Many invoices can belong to one company
echo ""
echo "5. Creating Invoice → Company relationship..."
curl -s -X POST "$GRAPHQL_ENDPOINT" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $API_KEY" \
  -d "{
    \"query\": \"mutation CreateField(\$input: CreateOneFieldMetadataInput!) { createOneField(input: \$input) { id name label type } }\",
    \"variables\": {
      \"input\": {
        \"field\": {
          \"objectMetadataId\": \"$INVOICE_ID\",
          \"name\": \"company\",
          \"label\": \"Company\",
          \"type\": \"RELATION\",
          \"description\": \"Company this invoice is for\",
          \"icon\": \"IconBuildingSkyscraper\",
          \"relationCreationPayload\": {
            \"type\": \"MANY_TO_ONE\",
            \"targetObjectMetadataId\": \"$COMPANY_ID\",
            \"targetFieldLabel\": \"Invoices\",
            \"targetFieldIcon\": \"IconCurrencyDollar\"
          }
        }
      }
    }
  }" | jq '.'
sleep 2

# 6. Invoice → Quote (MANY_TO_ONE)
# An invoice can be linked to a quote (optional)
echo ""
echo "6. Creating Invoice → Quote relationship..."
curl -s -X POST "$GRAPHQL_ENDPOINT" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $API_KEY" \
  -d "{
    \"query\": \"mutation CreateField(\$input: CreateOneFieldMetadataInput!) { createOneField(input: \$input) { id name label type } }\",
    \"variables\": {
      \"input\": {
        \"field\": {
          \"objectMetadataId\": \"$INVOICE_ID\",
          \"name\": \"quote\",
          \"label\": \"Quote\",
          \"type\": \"RELATION\",
          \"description\": \"Quote that this invoice is based on\",
          \"icon\": \"IconFileText\",
          \"relationCreationPayload\": {
            \"type\": \"MANY_TO_ONE\",
            \"targetObjectMetadataId\": \"$QUOTE_ID\",
            \"targetFieldLabel\": \"Invoices\",
            \"targetFieldIcon\": \"IconCurrencyDollar\"
          }
        }
      }
    }
  }" | jq '.'
sleep 2

# 7. Support Ticket → Company (MANY_TO_ONE)
# Many tickets can belong to one company
echo ""
echo "7. Creating Support Ticket → Company relationship..."
curl -s -X POST "$GRAPHQL_ENDPOINT" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $API_KEY" \
  -d "{
    \"query\": \"mutation CreateField(\$input: CreateOneFieldMetadataInput!) { createOneField(input: \$input) { id name label type } }\",
    \"variables\": {
      \"input\": {
        \"field\": {
          \"objectMetadataId\": \"$TICKET_ID\",
          \"name\": \"company\",
          \"label\": \"Company\",
          \"type\": \"RELATION\",
          \"description\": \"Company this support ticket is for\",
          \"icon\": \"IconBuildingSkyscraper\",
          \"relationCreationPayload\": {
            \"type\": \"MANY_TO_ONE\",
            \"targetObjectMetadataId\": \"$COMPANY_ID\",
            \"targetFieldLabel\": \"Support Tickets\",
            \"targetFieldIcon\": \"IconHelp\"
          }
        }
      }
    }
  }" | jq '.'

echo ""
echo "✓ All relationships created!"
echo "Your objects are now connected:"
echo "  - Projects belong to Companies"
echo "  - Expenses can link to Projects OR Companies"
echo "  - Quotes belong to Companies"
echo "  - Invoices belong to Companies (and optionally link to Quotes)"
echo "  - Support Tickets belong to Companies"
