# CRM-Forge Memories

Session history, user preferences, past implementations, and configuration decisions.

## User Profile

- **Name**: Ben
- **Company**: Phos Industries (laser/software technical consulting)
- **Technical Level**: Software industry intermediate with deep technical prowess
- **Learning Style**: Keen mind able to absorb new concepts quickly
- **Preferences**: Production-ready implementations, not just scaffolding

## API Credentials

### Phos Industries Workspace API Key
- **Key Name**: crm-forge
- **Expires**: 2126-01-01 (100 years)
- **Token**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI1NzJhMmI0MC0zMDExLTRhMTUtYmZmNC0zNzZmODE3Yjg4ZTciLCJ0eXBlIjoiQVBJX0tFWSIsIndvcmtzcGFjZUlkIjoiNTcyYTJiNDAtMzAxMS00YTE1LWJmZjQtMzc2ZjgxN2I4OGU3IiwiaWF0IjoxNzY5NDgzMzkwLCJleHAiOjQ5MjI4OTkxOTksImp0aSI6IjVmMjM2MThlLTc3YTMtNDIxZC1iMGRlLTUyZGEzYTI4MTcyMyJ9.vYbCuLvUVnIv6Auxbx2KRH4PhVEDLTaq-cqSC3yVsBk`
- **Usage**: `Authorization: Bearer <token>`
- **Workspace ID**: 572a2b40-3011-4a15-bff4-376f817b88e7
- **Schema**: workspace_55rtvgt6kptd0ioln5lvjh33b

### Quick Auth Commands
```bash
# Set API key for session
export PHOS_API_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI1NzJhMmI0MC0zMDExLTRhMTUtYmZmNC0zNzZmODE3Yjg4ZTciLCJ0eXBlIjoiQVBJX0tFWSIsIndvcmtzcGFjZUlkIjoiNTcyYTJiNDAtMzAxMS00YTE1LWJmZjQtMzc2ZjgxN2I4OGU3IiwiaWF0IjoxNzY5NDgzMzkwLCJleHAiOjQ5MjI4OTkxOTksImp0aSI6IjVmMjM2MThlLTc3YTMtNDIxZC1iMGRlLTUyZGEzYTI4MTcyMyJ9.vYbCuLvUVnIv6Auxbx2KRH4PhVEDLTaq-cqSC3yVsBk"

# GraphQL query
curl -s http://localhost:3000/graphql -H "Content-Type: application/json" -H "Authorization: Bearer $PHOS_API_KEY" -d '{"query":"..."}'
```

## Session History

<!-- Chronological log of sessions with CRM-Forge -->

### Session: 2026-01-26
- **Topic**: Schema Audit & Epic Implementation
- **Implementations**: API key generation, schema discovery
- **Decisions**: Using metadata API for custom objects, production-safe migrations only
- **Learnings**: Twenty auth flow requires origin-based workspace resolution

## Past Implementations

<!-- Track of all features/modules built -->

### [Feature/Module Name]
- **Date**: [When implemented]
- **Purpose**: [What it does]
- **Stack**: [Technologies used]
- **Patterns Used**: [Link to knowledge/patterns.md]
- **Notes**: [Special considerations, gotchas]

## Configuration Decisions

<!-- Twenty CRM specific configurations -->

### Database
- [Configuration choices]

### GraphQL
- [Schema decisions]

### Frontend
- [UI/UX patterns]

### Integrations
- [API integration approaches]

## Notes for Future Sessions

<!-- Things to remember for next time -->

## Twenty Metadata API Patterns (CRITICAL REFERENCE)

### Endpoint
- **Metadata API**: `http://localhost:3000/metadata` (NOT /graphql)
- **Data API**: `http://localhost:3000/graphql`

### Creating Custom Objects
```graphql
mutation CreateOneObject($input: CreateOneObjectInput!) {
  createOneObject(input: $input) { id nameSingular namePlural }
}
```
Variables:
```json
{
  "input": {
    "object": {
      "nameSingular": "emailTemplate",
      "namePlural": "emailTemplates",
      "labelSingular": "Email Template",
      "labelPlural": "Email Templates",
      "description": "...",
      "icon": "IconMail"
    }
  }
}
```

### Creating Fields
```graphql
mutation CreateOneField($input: CreateOneFieldMetadataInput!) {
  createOneField(input: $input) { id name label type }
}
```

### SELECT Field Pattern (CRITICAL)
**Options format**: Array of objects with position, label, value (UPPERCASE), color
**Default value**: Quoted string format `"'VALUE'"`
**Colors**: green, turquoise, sky, blue, purple, pink, red, orange, yellow, gray

```json
{
  "input": {
    "field": {
      "objectMetadataId": "UUID",
      "name": "category",
      "label": "Category",
      "type": "SELECT",
      "defaultValue": "'GENERAL'",
      "options": [
        {"position": 0, "label": "General", "value": "GENERAL", "color": "gray"},
        {"position": 1, "label": "Sales", "value": "SALES", "color": "blue"}
      ]
    }
  }
}
```

### Field Types
- TEXT, RICH_TEXT, NUMBER, BOOLEAN, DATE, DATE_TIME
- SELECT (single), MULTI_SELECT (multiple)
- CURRENCY (amountMicros, currencyCode composite)
- RELATION (requires separate relation metadata)

### Value Format Rules
- SELECT default: `"'UPPERCASE_VALUE'"` (quoted string)
- MULTI_SELECT default: `["'VALUE1'", "'VALUE2'"]`
- Option values MUST be valid GraphQL enum names (UPPERCASE_UNDERSCORE)

## Twenty Feature Flag Patterns (CRITICAL REFERENCE)

### Adding a Feature Flag

1. **Backend enum**: Add to `packages/twenty-server/src/engine/core-modules/feature-flag/enums/feature-flag-key.enum.ts`
   ```typescript
   export enum FeatureFlagKey {
     // ...existing flags
     IS_MY_FEATURE_ENABLED = 'IS_MY_FEATURE_ENABLED',
   }
   ```

2. **Regenerate GraphQL types**: Run BOTH commands
   ```bash
   npx nx run twenty-front:graphql:generate           # Data API types
   npx nx run twenty-front:graphql:generate:metadata  # Metadata API types
   ```

3. **Frontend usage**: Use the `useIsFeatureEnabled` hook
   ```typescript
   import { useIsFeatureEnabled } from '@/workspace/hooks/useIsFeatureEnabled';
   import { FeatureFlagKey } from '~/generated/graphql';

   const isFeatureEnabled = useIsFeatureEnabled(FeatureFlagKey.IS_MY_FEATURE_ENABLED);
   ```

### Enabling Feature Flags
Feature flags are enabled per-workspace in the database. Use the admin panel or direct DB query.

## Twenty Type Patterns (CRITICAL REFERENCE)

### Custom Record Types
When creating custom record types for `useFindOneRecord` or `useFindManyRecords`, ALWAYS extend `ObjectRecord`:
```typescript
import { type ObjectRecord } from '@/object-record/types/ObjectRecord';

type MyRecord = ObjectRecord & {
  myField: string;
  nestedField?: { subField: string } | null;
};

const { record } = useFindOneRecord<MyRecord>({...});
```

**Why**: `ObjectRecord` includes required `__typename` from `BaseObjectRecord`. Without it, TypeScript will error.

### Lingui i18n Requirements
All user-facing strings MUST be wrapped:
- JSX: `<Trans>Text here</Trans>`
- Template strings: `` t`Text here` ``
- Import from: `@lingui/core/macro` (for `t`) and `@lingui/react/macro` (for `Trans`)

### Import Deduplication
Never duplicate imports from the same module:
```typescript
// ❌ BAD - will fail lint
import { Button } from 'twenty-ui/input';
import { type SelectOption } from 'twenty-ui/input';

// ✅ GOOD
import { Button, type SelectOption } from 'twenty-ui/input';
```
