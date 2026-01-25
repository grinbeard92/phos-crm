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
