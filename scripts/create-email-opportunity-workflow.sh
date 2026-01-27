#!/bin/bash
# Email → Opportunity Workflow Creation Script
# Creates a workflow that auto-creates Opportunities from incoming emails
# Uses Twenty CRM's native GraphQL API

set -e

API_URL="${TWENTY_API_URL:-http://localhost:3000}/graphql"
API_KEY="${TWENTY_API_KEY:-eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI1NzJhMmI0MC0zMDExLTRhMTUtYmZmNC0zNzZmODE3Yjg4ZTciLCJ0eXBlIjoiQVBJX0tFWSIsIndvcmtzcGFjZUlkIjoiNTcyYTJiNDAtMzAxMS00YTE1LWJmZjQtMzc2ZjgxN2I4OGU3IiwiaWF0IjoxNzY5MzIxNDIxLCJleHAiOjQ5MjI5MjE0MjAsImp0aSI6IjVmMjM2MThlLTc3YTMtNDIxZC1iMGRlLTUyZGEzYTI4MTcyMyJ9.TDPdX88kBxuUXnGwieAbt6Naod3XLtDDEhIdFmd7NeE}"

echo "Creating Email → Opportunity Workflow via GraphQL..."
echo "API URL: $API_URL"

# Step 1: Create the workflow
echo ""
echo "Step 1: Creating workflow..."

WORKFLOW_RESPONSE=$(curl -s -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $API_KEY" \
  -d '{
    "query": "mutation CreateWorkflow { createWorkflow(data: { name: \"Email to Opportunity\" }) { id } }"
  }')

echo "Response: $WORKFLOW_RESPONSE"

WORKFLOW_ID=$(echo "$WORKFLOW_RESPONSE" | jq -r '.data.createWorkflow.id')

if [ "$WORKFLOW_ID" == "null" ] || [ -z "$WORKFLOW_ID" ]; then
  echo "Error: Failed to create workflow"
  echo "$WORKFLOW_RESPONSE" | jq .
  exit 1
fi

echo "Created workflow with ID: $WORKFLOW_ID"

# Step 2: Get the auto-created workflow version
echo ""
echo "Step 2: Getting workflow version..."

VERSION_RESPONSE=$(curl -s -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $API_KEY" \
  -d "{
    \"query\": \"query GetWorkflow { workflow(filter: { id: { eq: \\\"$WORKFLOW_ID\\\" } }) { id versions { edges { node { id status } } } } }\"
  }")

echo "Response: $VERSION_RESPONSE"

WORKFLOW_VERSION_ID=$(echo "$VERSION_RESPONSE" | jq -r '.data.workflow.versions.edges[0].node.id')

if [ "$WORKFLOW_VERSION_ID" == "null" ] || [ -z "$WORKFLOW_VERSION_ID" ]; then
  echo "Error: Failed to get workflow version"
  exit 1
fi

echo "Got workflow version ID: $WORKFLOW_VERSION_ID"

# Step 3: Update workflow version with DATABASE_EVENT trigger on message.created
echo ""
echo "Step 3: Setting DATABASE_EVENT trigger on message.created..."

TRIGGER_JSON='{
  "name": "New Email Received",
  "type": "DATABASE_EVENT",
  "settings": {
    "eventName": "message.created",
    "objectType": "message",
    "outputSchema": {
      "id": { "isLeaf": true, "type": "string" },
      "subject": { "isLeaf": true, "type": "string" },
      "text": { "isLeaf": true, "type": "string" },
      "receivedAt": { "isLeaf": true, "type": "string" }
    }
  },
  "nextStepIds": [],
  "position": { "x": 0, "y": 0 }
}'

# Escape for JSON string
TRIGGER_ESCAPED=$(echo "$TRIGGER_JSON" | jq -c . | sed 's/"/\\"/g')

TRIGGER_RESPONSE=$(curl -s -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $API_KEY" \
  -d "{
    \"query\": \"mutation UpdateWorkflowVersion(\$id: UUID!, \$data: WorkflowVersionUpdateInput!) { updateWorkflowVersion(id: \$id, data: \$data) { id trigger } }\",
    \"variables\": {
      \"id\": \"$WORKFLOW_VERSION_ID\",
      \"data\": {
        \"trigger\": $TRIGGER_JSON
      }
    }
  }")

echo "Response: $TRIGGER_RESPONSE"

# Check for errors
if echo "$TRIGGER_RESPONSE" | jq -e '.errors' > /dev/null 2>&1; then
  echo "Error setting trigger:"
  echo "$TRIGGER_RESPONSE" | jq '.errors'
  exit 1
fi

echo "Trigger set successfully!"

# Step 4: Create the CREATE_RECORD step to create an Opportunity
echo ""
echo "Step 4: Creating CREATE_RECORD step for Opportunity..."

STEP_RESPONSE=$(curl -s -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $API_KEY" \
  -d "{
    \"query\": \"mutation CreateWorkflowVersionStep(\$input: CreateWorkflowVersionStepInput!) { createWorkflowVersionStep(input: \$input) { stepsDiff } }\",
    \"variables\": {
      \"input\": {
        \"workflowVersionId\": \"$WORKFLOW_VERSION_ID\",
        \"stepType\": \"CREATE_RECORD\",
        \"parentStepId\": \"trigger\",
        \"position\": { \"x\": 200, \"y\": 0 }
      }
    }
  }")

echo "Response: $STEP_RESPONSE"

# Check for errors
if echo "$STEP_RESPONSE" | jq -e '.errors' > /dev/null 2>&1; then
  echo "Error creating step:"
  echo "$STEP_RESPONSE" | jq '.errors'
  exit 1
fi

echo "CREATE_RECORD step created!"

# Step 5: Get the step ID
echo ""
echo "Step 5: Getting step details..."

STEPS_RESPONSE=$(curl -s -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $API_KEY" \
  -d "{
    \"query\": \"query GetWorkflowVersion { workflowVersion(filter: { id: { eq: \\\"$WORKFLOW_VERSION_ID\\\" } }) { id steps } }\"
  }")

echo "Response: $STEPS_RESPONSE"

STEP_ID=$(echo "$STEPS_RESPONSE" | jq -r '.data.workflowVersion.steps[0].id')

if [ "$STEP_ID" == "null" ] || [ -z "$STEP_ID" ]; then
  echo "Error: Failed to get step ID"
  exit 1
fi

echo "Got step ID: $STEP_ID"

# Step 6: Update the step with Opportunity creation settings
echo ""
echo "Step 6: Configuring step to create Opportunity from email..."

STEP_SETTINGS='{
  "input": {
    "objectName": "opportunity",
    "objectRecord": {
      "name": "{{trigger.object.subject}}",
      "stage": "NEW"
    }
  },
  "outputSchema": {
    "id": { "isLeaf": true, "type": "string" },
    "name": { "isLeaf": true, "type": "string" },
    "stage": { "isLeaf": true, "type": "string" }
  },
  "errorHandlingOptions": {
    "continueOnFailure": { "value": false },
    "retryOnFailure": { "value": false }
  }
}'

UPDATE_STEP_RESPONSE=$(curl -s -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $API_KEY" \
  -d "{
    \"query\": \"mutation UpdateWorkflowVersionStep(\$input: UpdateWorkflowVersionStepInput!) { updateWorkflowVersionStep(input: \$input) { id type name } }\",
    \"variables\": {
      \"input\": {
        \"workflowVersionId\": \"$WORKFLOW_VERSION_ID\",
        \"step\": {
          \"id\": \"$STEP_ID\",
          \"name\": \"Create Opportunity from Email\",
          \"type\": \"CREATE_RECORD\",
          \"valid\": true,
          \"settings\": $STEP_SETTINGS
        }
      }
    }
  }")

echo "Response: $UPDATE_STEP_RESPONSE"

# Check for errors
if echo "$UPDATE_STEP_RESPONSE" | jq -e '.errors' > /dev/null 2>&1; then
  echo "Error updating step:"
  echo "$UPDATE_STEP_RESPONSE" | jq '.errors'
  exit 1
fi

echo "Step configured successfully!"

# Step 7: Activate the workflow version
echo ""
echo "Step 7: Activating workflow version..."

ACTIVATE_RESPONSE=$(curl -s -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $API_KEY" \
  -d "{
    \"query\": \"mutation ActivateWorkflowVersion(\$workflowVersionId: UUID!) { activateWorkflowVersion(workflowVersionId: \$workflowVersionId) }\",
    \"variables\": {
      \"workflowVersionId\": \"$WORKFLOW_VERSION_ID\"
    }
  }")

echo "Response: $ACTIVATE_RESPONSE"

# Check for errors
if echo "$ACTIVATE_RESPONSE" | jq -e '.errors' > /dev/null 2>&1; then
  echo "Error activating workflow:"
  echo "$ACTIVATE_RESPONSE" | jq '.errors'
  exit 1
fi

echo ""
echo "=========================================="
echo "Email → Opportunity Workflow Created!"
echo "=========================================="
echo "Workflow ID: $WORKFLOW_ID"
echo "Version ID: $WORKFLOW_VERSION_ID"
echo "Step ID: $STEP_ID"
echo ""
echo "The workflow will automatically create an Opportunity"
echo "whenever a new email message is received."
echo ""
echo "Trigger: message.created (DATABASE_EVENT)"
echo "Action: CREATE_RECORD (opportunity)"
echo "  - name: Email subject"
echo "  - stage: NEW"
echo "=========================================="
