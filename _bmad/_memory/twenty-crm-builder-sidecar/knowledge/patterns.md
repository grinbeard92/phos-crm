# Twenty CRM Implementation Patterns

## Architecture Patterns

*Reusable architectural patterns will be documented here as they are discovered*

---

## TypeORM Patterns

*Database entity and migration patterns will be tracked here*

---

## GraphQL Patterns

### Creating Custom Objects via Metadata API
**Endpoint**: `POST http://localhost:3000/graphql`
**Auth**: Bearer token (API Key)

```graphql
mutation CreateObject($input: CreateOneObjectInput!) {
  createOneObject(input: $input) {
    id
    nameSingular
    namePlural
    labelSingular
    labelPlural
    description
    icon
  }
}
```

**Variables structure**:
```json
{
  "input": {
    "object": {
      "nameSingular": "project",
      "namePlural": "projects",
      "labelSingular": "Project",
      "labelPlural": "Projects",
      "description": "Description here",
      "icon": "IconBriefcase"
    }
  }
}
```

**Key learnings**:
- Input is nested: `input.object` not just `input`
- Icon names use Twenty's icon set (IconBriefcase, IconReceipt, etc.)
- nameSingular/namePlural must be different for GraphQL to work
- Objects are automatically added to the workspace schema

### Creating Custom Fields via GraphQL
**Endpoint**: `POST http://localhost:3000/graphql`

```graphql
mutation CreateField($input: CreateOneFieldMetadataInput!) {
  createOneField(input: $input) {
    id
    name
    label
    type
  }
}
```

**Variables structure**:
```json
{
  "input": {
    "field": {
      "objectMetadataId": "OBJECT_ID",
      "name": "fieldName",
      "label": "Field Label",
      "type": "TEXT|NUMBER|DATE|CURRENCY|SELECT|BOOLEAN|RICH_TEXT|DATE_TIME",
      "description": "Field description"
    }
  }
}
```

**SELECT fields require options with positions**:
```json
{
  "input": {
    "field": {
      "objectMetadataId": "...",
      "name": "status",
      "label": "Status",
      "type": "SELECT",
      "options": [
        {"value": "DRAFT", "label": "Draft", "color": "gray", "position": 0},
        {"value": "SENT", "label": "Sent", "color": "blue", "position": 1}
      ]
    }
  }
}
```

**Field types available**:
- TEXT, PHONE, EMAIL
- NUMBER, CURRENCY
- BOOLEAN
- DATE, DATE_TIME
- SELECT, MULTI_SELECT
- LINK, LINKS
- ADDRESS, FULL_NAME
- RATING, RICH_TEXT
- RELATION (for linking objects)

**Key learnings**:
- SELECT options MUST have explicit `position` values (0, 1, 2...)
- Colors: gray, blue, green, yellow, orange, red, purple, cyan
- Field names use camelCase, labels use Title Case

---

## Frontend Patterns

*React component and state management patterns will be tracked here*

---

## Integration Patterns

*Third-party API integration patterns will be documented here*

---

## Configuration Snippets

*Working configuration examples will be saved here*

---

## Authentication Patterns

### API Key vs User Access Token
**CRITICAL DISTINCTION:**
- **API Key**: Works for data CRUD operations (companies, people, opportunities, etc.)
- **User Access Token**: Required for admin operations (workflows, settings, permissions)

**When to use which:**
| Operation | Auth Type |
|-----------|-----------|
| Create/Read/Update/Delete records | API Key ✅ |
| Create workflow | API Key ✅ |
| Update workflow trigger | API Key ✅ |
| Create/Update workflow STEPS | User Token ⚠️ |
| Activate workflow | User Token ⚠️ |
| Admin panel operations | User Token ⚠️ |

### Getting User Access Token
**Script**: `scripts/get-user-access-token.sh`
**Credentials**: Stored in `_bmad/.env` (gitignored)

**Two-step process:**
1. **Get Login Token** (password auth):
```graphql
mutation GetLoginTokenFromCredentials($email: String!, $password: String!, $origin: String!) {
  getLoginTokenFromCredentials(email: $email, password: $password, origin: $origin) {
    loginToken { token expiresAt }
  }
}
```
Variables: `{ email, password, origin: "http://phos-ind.localhost:3001" }`

2. **Exchange for Access Token**:
```graphql
mutation GetAuthTokensFromLoginToken($loginToken: String!, $origin: String!) {
  getAuthTokensFromLoginToken(loginToken: $loginToken, origin: $origin) {
    tokens {
      accessOrWorkspaceAgnosticToken { token expiresAt }
      refreshToken { token expiresAt }
    }
  }
}
```

**Key learnings:**
- Origin MUST match workspace subdomain: `http://{subdomain}.localhost:3001`
- Field is `accessOrWorkspaceAgnosticToken` not `accessToken`
- Access tokens expire in ~30 minutes, refresh tokens last ~60 days
- Password special characters handled automatically by Python's json.dumps()

---

## Workflow Patterns

### Creating Workflows via GraphQL
**IMPORTANT**: Workflow creation has TWO permission levels:
1. Workflow + Trigger: API Key works ✅
2. Workflow Steps: Requires User Access Token ⚠️

**Complete workflow creation flow:**

**Step 1: Create Workflow** (API Key OK)
```graphql
mutation CreateWorkflow {
  createWorkflow(data: { name: "My Workflow" }) {
    id
  }
}
```

**Step 2: Get Auto-Created Version** (API Key OK)
```graphql
query GetWorkflow($id: UUID!) {
  workflow(filter: { id: { eq: $id } }) {
    id
    versions { edges { node { id status } } }
  }
}
```

**Step 3: Set Trigger** (API Key OK)
```graphql
mutation UpdateWorkflowVersion($id: UUID!, $data: WorkflowVersionUpdateInput!) {
  updateWorkflowVersion(id: $id, data: $data) {
    id trigger
  }
}
```
Variables:
```json
{
  "id": "version-id",
  "data": {
    "trigger": {
      "name": "New Email Received",
      "type": "DATABASE_EVENT",
      "settings": {
        "eventName": "message.created",
        "objectType": "message",
        "outputSchema": {}
      },
      "nextStepIds": [],
      "position": { "x": 0, "y": 0 }
    }
  }
}
```

**Step 4: Create Step** (User Token REQUIRED)
```graphql
mutation CreateWorkflowVersionStep($input: CreateWorkflowVersionStepInput!) {
  createWorkflowVersionStep(input: $input) {
    stepsDiff
  }
}
```
Variables:
```json
{
  "input": {
    "workflowVersionId": "version-id",
    "stepType": "CREATE_RECORD",
    "parentStepId": "trigger",
    "position": { "x": 200, "y": 0 }
  }
}
```

**Step 5: Configure Step** (User Token REQUIRED)
```graphql
mutation UpdateWorkflowVersionStep($input: UpdateWorkflowVersionStepInput!) {
  updateWorkflowVersionStep(input: $input) {
    id type name
  }
}
```

**Step 6: Activate Workflow** (User Token REQUIRED)
```graphql
mutation ActivateWorkflowVersion($workflowVersionId: UUID!) {
  activateWorkflowVersion(workflowVersionId: $workflowVersionId)
}
```

### Trigger Types
- `DATABASE_EVENT`: Fires on record create/update/delete
  - eventName format: `{objectName}.{action}` (e.g., `message.created`, `opportunity.updated`)
- `MANUAL`: User-triggered workflows
- `CRON`: Scheduled workflows
- `WEBHOOK`: External trigger via HTTP

### Step Types
- `CREATE_RECORD`: Create new record
- `UPDATE_RECORD`: Update existing record
- `DELETE_RECORD`: Delete record
- `SEND_EMAIL`: Send email
- `IF_ELSE`: Conditional branching
- `CODE`: Custom serverless function
- `HTTP_REQUEST`: External API call

### Variable References in Workflows
Access trigger data: `{{trigger.object.fieldName}}`
Access step output: `{{stepId.output.fieldName}}`

---

## Gotchas & Pitfalls

### Admin Panel Visibility
**Issue**: Admin Panel section not visible in Twenty CRM Settings UI
**Cause**: User must have `userRole = "ADMIN"` in workspace member table
**Location**: Settings accessible only with ADMIN role
**Tables**: `core.workspace` + workspace-specific schema `workspaceMember` table
**Solution**: Query/update user role via database to grant ADMIN access

### Multi-Workspace Domain Configuration
**Pattern**: Twenty CRM has NO concept of "admin domain" or "primary domain"
**Architecture**:
- `workspace.subdomain`: Primary routing identifier (e.g., "phos-ind")
- `workspace.customDomain`: Optional custom URL (e.g., "phos-ind.com")
- `approvedAccessDomain.domain`: Email domains for auto-signup (e.g., "@phos-ind.com")
**Key Insight**: All approved domains have EQUAL access - no hierarchy
**Access Control**: Based on email domain validation, not domain priority

### Stripe Integration Best Practices
**Currency Handling**: CRITICAL - Stripe uses minor currency units
- USD: Multiply by 100 (dollars → cents)
- JPY: No conversion needed (yen has no minor unit)
- Always convert at integration boundary, store as CURRENCY in CRM

**Metadata Strategy**: Use bidirectional linking
- CRM → Stripe: Store Stripe IDs in CRM fields (stripeInvoiceId, etc.)
- Stripe → CRM: Store CRM IDs in Stripe metadata (crm_invoice_id, etc.)
- Enables lookup in both directions via webhooks and API calls

**Workflow Design**: CRM-First approach
- Create objects in CRM first (Quote, Invoice, etc.)
- Sync to Stripe when finalized
- Webhooks update CRM with Stripe state changes
- Never rely solely on Stripe as source of truth for business logic
