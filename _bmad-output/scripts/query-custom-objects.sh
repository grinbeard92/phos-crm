#!/bin/bash
# Query custom objects via GraphQL API for Phos Industries workspace

API_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI1NzJhMmI0MC0zMDExLTRhMTUtYmZmNC0zNzZmODE3Yjg4ZTciLCJ0eXBlIjoiQVBJX0tFWSIsIndvcmtzcGFjZUlkIjoiNTcyYTJiNDAtMzAxMS00YTE1LWJmZjQtMzc2ZjgxN2I4OGU3IiwiaWF0IjoxNzY5MzIxNDIxLCJleHAiOjQ5MjI5MjE0MjAsImp0aSI6IjVmMjM2MThlLTc3YTMtNDIxZC1iMGRlLTUyZGEzYTI4MTcyMyJ9.TDPdX88kBxuUXnGwieAbt6Naod3XLtDDEhIdFmd7NeE"
GRAPHQL_ENDPOINT="http://localhost:3000/graphql"

echo "=== Querying Custom Objects via GraphQL API ==="
echo ""

# Query all custom objects metadata
echo "1. Querying all custom objects..."
curl -s -X POST "$GRAPHQL_ENDPOINT" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $API_KEY" \
  -d '{
    "query": "query { objects(filter: { isCustom: { eq: true } }) { edges { node { id nameSingular namePlural labelSingular labelPlural isActive } } } }"
  }' | jq '.'

echo ""
echo "2. Querying Project object fields..."
curl -s -X POST "$GRAPHQL_ENDPOINT" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $API_KEY" \
  -d '{
    "query": "query { object(filter: { nameSingular: { eq: \"project\" } }) { id nameSingular fields { edges { node { name label type isCustom } } } } }"
  }' | jq '.'

echo ""
echo "3. Querying Expense object fields..."
curl -s -X POST "$GRAPHQL_ENDPOINT" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $API_KEY" \
  -d '{
    "query": "query { object(filter: { nameSingular: { eq: \"expense\" } }) { id nameSingular fields { edges { node { name label type isCustom } } } } }"
  }' | jq '.'

echo ""
echo "4. Querying Opportunity object fields (for Priority 1 features)..."
curl -s -X POST "$GRAPHQL_ENDPOINT" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $API_KEY" \
  -d '{
    "query": "query { object(filter: { nameSingular: { eq: \"opportunity\" } }) { id nameSingular fields(filter: { or: [{ name: { eq: \"stage\" } }, { name: { eq: \"amount\" } }, { isCustom: { eq: true } }] }) { edges { node { name label type isCustom } } } } }"
  }' | jq '.'

echo ""
echo "✓ GraphQL object queries complete!"
