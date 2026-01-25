#!/bin/bash
# Add approved access domains for Phos Industries workspace

API_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI1NzJhMmI0MC0zMDExLTRhMTUtYmZmNC0zNzZmODE3Yjg4ZTciLCJ0eXBlIjoiQVBJX0tFWSIsIndvcmtzcGFjZUlkIjoiNTcyYTJiNDAtMzAxMS00YTE1LWJmZjQtMzc2ZjgxN2I4OGU3IiwiaWF0IjoxNzY5MzIxNDIxLCJleHAiOjQ5MjI5MjE0MjAsImp0aSI6IjVmMjM2MThlLTc3YTMtNDIxZC1iMGRlLTUyZGEzYTI4MTcyMyJ9.TDPdX88kBxuUXnGwieAbt6Naod3XLtDDEhIdFmd7NeE"
ENDPOINT="http://localhost:3000/graphql"

# Add lvnlaser.com domain
echo "Adding lvnlaser.com..."
curl -X POST "$ENDPOINT" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $API_KEY" \
  -d '{
    "query": "mutation CreateApprovedAccessDomain($input: CreateApprovedAccessDomainInput!) { createApprovedAccessDomain(input: $input) { id domain isValidated } }",
    "variables": {
      "input": {
        "domain": "lvnlaser.com",
        "email": "ben@phos-ind.com"
      }
    }
  }'

echo -e "\n\nAdding beehivebirth.com..."
curl -X POST "$ENDPOINT" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $API_KEY" \
  -d '{
    "query": "mutation CreateApprovedAccessDomain($input: CreateApprovedAccessDomainInput!) { createApprovedAccessDomain(input: $input) { id domain isValidated } }",
    "variables": {
      "input": {
        "domain": "beehivebirth.com",
        "email": "ben@phos-ind.com"
      }
    }
  }'

echo -e "\n\nQuerying all approved domains..."
curl -X POST "$ENDPOINT" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $API_KEY" \
  -d '{
    "query": "query GetApprovedAccessDomains { getApprovedAccessDomains { id domain isValidated } }"
  }'

echo -e "\n✓ Domain configuration complete"
