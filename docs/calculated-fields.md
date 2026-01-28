# Calculated Fields

Calculated fields automatically compute values based on formulas referencing other fields.

## Overview

The CALCULATED field type uses PostgreSQL GENERATED ALWAYS AS columns for efficient,
automatically-updated computed values. When source fields change, the calculated field
updates instantly at the database level.

## Feature Flag

Enable with:

```sql
INSERT INTO core."featureFlag" ("key", "value", "workspaceId")
VALUES ('IS_CALCULATED_FIELD_ENABLED', true, 'your-workspace-id');
```

## Creating a Calculated Field

### Via GraphQL API

```graphql
mutation CreateCalculatedField {
  createOneFieldMetadata(
    input: {
      fieldMetadata: {
        name: "balanceDue"
        label: "Balance Due"
        type: CALCULATED
        objectMetadataId: "your-object-id"
        settings: {
          formula: "{{totalAmount}} - {{paidAmount}}"
          returnType: NUMBER
        }
      }
    }
  ) {
    id
    name
  }
}
```

### Via phos-seeder

```typescript
{
  name: 'balanceDue',
  label: 'Balance Due',
  type: FieldMetadataType.CALCULATED,
  icon: 'IconCalculator',
  description: 'Automatically calculated: totalAmount - paidAmount',
  settings: {
    formula: '{{totalAmount}} - {{paidAmount}}',
    returnType: FieldMetadataType.NUMBER,
  },
}
```

## Formula Syntax

### Field References

Use double curly braces to reference fields:

- `{{fieldName}}` - Simple field reference
- `{{budget.amountMicros}}` - Composite field subfield (extracts parent field)

### Operators

- Arithmetic: `+`, `-`, `*`, `/`
- Concatenation: `||` (for TEXT return type)
- Comparisons: `>`, `<`, `=`, `>=`, `<=`, `<>`

### Examples

```typescript
// Numeric calculation
"{{quantity}} * {{unitPrice}}"

// Text concatenation
"{{firstName}} || ' ' || {{lastName}}"

// Balance calculation
"{{totalAmount}} - {{amountPaid}}"

// Percentage
"{{completedTasks}} * 100 / {{totalTasks}}"
```

## Supported Return Types

| Return Type | PostgreSQL Column | Use Case |
|-------------|-------------------|----------|
| `TEXT` | text | String concatenation |
| `NUMBER` | float | Numeric calculations |
| `BOOLEAN` | boolean | Comparisons |
| `DATE` | date | Date calculations |
| `DATE_TIME` | timestamptz | Timestamp calculations |

## Settings Structure

```typescript
type FieldMetadataCalculatedSettings = {
  formula: string;           // e.g., "{{quantity}} * {{unitPrice}}"
  returnType: CalculatedReturnType;
  dependsOnFields?: string[]; // Auto-populated by backend
};
```

## Limitations

1. **Read-only** - Cannot be manually set or updated via API
2. **No circular dependencies** - Cannot reference other calculated fields
3. **No relation fields** - Cannot directly reference relation fields
4. **Same-table only** - Can only reference fields on the same object
5. **Maximum formula length** - 1000 characters
6. **No aggregate functions** - Cannot use SUM, COUNT, etc. (use views for that)

## Security

The formula parser blocks SQL injection attempts:

- No semicolons followed by DDL/DML keywords
- No SQL comments (`--`, `/*`)
- No UNION SELECT patterns
- Only whitelisted field references allowed

## How It Works

1. **Field Creation**: Formula is validated and parsed
2. **Migration**: PostgreSQL GENERATED ALWAYS AS STORED column is created
3. **Query**: Field is read like any other field
4. **Update**: When referenced fields change, PostgreSQL auto-recalculates

## Troubleshooting

### "Formula cannot be empty"

The `formula` setting is required. Provide a valid formula.

### "Must contain at least one field reference"

Formulas must reference at least one other field using `{{fieldName}}` syntax.

### "Unknown field reference"

The referenced field doesn't exist on the object. Check field names.

### "Invalid returnType"

Only TEXT, NUMBER, BOOLEAN, DATE, and DATE_TIME are supported.
