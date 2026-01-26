#!/bin/bash
# Add Priority 1 fields to Opportunity object for Sales Acceleration
# Production-safe: Uses metadata API which handles migrations internally

API_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI1NzJhMmI0MC0zMDExLTRhMTUtYmZmNC0zNzZmODE3Yjg4ZTciLCJ0eXBlIjoiQVBJX0tFWSIsIndvcmtzcGFjZUlkIjoiNTcyYTJiNDAtMzAxMS00YTE1LWJmZjQtMzc2ZjgxN2I4OGU3IiwiaWF0IjoxNzY5MzIxNDIxLCJleHAiOjQ5MjI5MjE0MjAsImp0aSI6IjVmMjM2MThlLTc3YTMtNDIxZC1iMGRlLTUyZGEzYTI4MTcyMyJ9.TDPdX88kBxuUXnGwieAbt6Naod3XLtDDEhIdFmd7NeE"
METADATA_ENDPOINT="http://localhost:3000/metadata"
OPPORTUNITY_OBJECT_ID="0ce11a69-d1fb-4140-b087-8b061e1d3a91"

echo "=== Adding Priority 1 Fields to Opportunity Object ==="
echo "Object ID: $OPPORTUNITY_OBJECT_ID"
echo ""

# 1. Add Sales Guidance rich-text field
echo "1. Adding Sales Guidance field (RICH_TEXT)..."
SALES_GUIDANCE_RESPONSE=$(curl -s -X POST "$METADATA_ENDPOINT" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $API_KEY" \
  -d "{
    \"query\": \"mutation { createOneField(input: { field: { name: \\\"salesGuidance\\\", label: \\\"Sales Guidance\\\", description: \\\"Call scripts, objection handling, and sales talking points for this opportunity\\\", type: RICH_TEXT, objectMetadataId: \\\"$OPPORTUNITY_OBJECT_ID\\\", icon: \\\"IconScript\\\" } }) { id name label type } }\"
  }")
echo "$SALES_GUIDANCE_RESPONSE" | jq '.'
echo ""

# 2. Add Lead Source SELECT field
echo "2. Adding Lead Source field (SELECT)..."
LEAD_SOURCE_RESPONSE=$(curl -s -X POST "$METADATA_ENDPOINT" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $API_KEY" \
  -d "{
    \"query\": \"mutation { createOneField(input: { field: { name: \\\"leadSource\\\", label: \\\"Lead Source\\\", description: \\\"Where did this opportunity originate from\\\", type: SELECT, objectMetadataId: \\\"$OPPORTUNITY_OBJECT_ID\\\", icon: \\\"IconSource\\\", options: [{value: \\\"LINKEDIN\\\", label: \\\"LinkedIn\\\", color: \\\"blue\\\", position: 0}, {value: \\\"REFERRAL\\\", label: \\\"Referral\\\", color: \\\"green\\\", position: 1}, {value: \\\"WEBSITE\\\", label: \\\"Website\\\", color: \\\"purple\\\", position: 2}, {value: \\\"EMAIL\\\", label: \\\"Email\\\", color: \\\"orange\\\", position: 3}, {value: \\\"COLD_OUTREACH\\\", label: \\\"Cold Outreach\\\", color: \\\"sky\\\", position: 4}, {value: \\\"EVENT\\\", label: \\\"Event/Conference\\\", color: \\\"pink\\\", position: 5}, {value: \\\"OTHER\\\", label: \\\"Other\\\", color: \\\"gray\\\", position: 6}] } }) { id name label type } }\"
  }")
echo "$LEAD_SOURCE_RESPONSE" | jq '.'
echo ""

# 3. Add Days In Stage NUMBER field
echo "3. Adding Days In Stage field (NUMBER)..."
DAYS_IN_STAGE_RESPONSE=$(curl -s -X POST "$METADATA_ENDPOINT" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $API_KEY" \
  -d "{
    \"query\": \"mutation { createOneField(input: { field: { name: \\\"daysInStage\\\", label: \\\"Days in Stage\\\", description: \\\"Number of days opportunity has been in current stage - for stall detection\\\", type: NUMBER, objectMetadataId: \\\"$OPPORTUNITY_OBJECT_ID\\\", icon: \\\"IconClock\\\", defaultValue: 0 } }) { id name label type } }\"
  }")
echo "$DAYS_IN_STAGE_RESPONSE" | jq '.'
echo ""

echo "✓ Priority 1 field creation complete!"
echo ""
echo "Next steps:"
echo "  1. Verify fields in UI: http://localhost:3001/settings/objects/opportunity"
echo "  2. Check GraphQL query to confirm fields accessible"
echo "  3. Test updating an opportunity with new fields"
