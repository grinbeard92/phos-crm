# CALCULATED Field Type Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a modular CALCULATED field type to Twenty CRM that computes values from formulas referencing other fields.

**Architecture:** PostgreSQL GENERATED ALWAYS AS columns for stored calculations, with formula parsing and SQL expression generation. Read-only enforcement at GraphQL and data processor layers. Feature-flagged for safe rollout.

**Tech Stack:** PostgreSQL generated columns, NestJS, GraphQL, TypeScript

**Commit Convention:** All commits MUST include `[calculated-field]` tag for PR extraction.

---

## Overview

The CALCULATED field type allows users to define computed fields using formulas like:
- `{{quantity}} * {{unitPrice}}` → NUMBER result
- `{{firstName}} || ' ' || {{lastName}}` → TEXT result
- `{{totalAmount}} - {{amountPaid}}` → CURRENCY result

The implementation follows the TS_VECTOR pattern: PostgreSQL GENERATED columns with expressions.

---

## Task 1: Add Feature Flag

**Files:**
- Modify: `packages/twenty-server/src/engine/core-modules/feature-flag/enums/feature-flag-key.enum.ts`

**Step 1: Add the feature flag enum**

```typescript
export enum FeatureFlagKey {
  // ... existing flags
  IS_CALCULATED_FIELD_ENABLED = 'IS_CALCULATED_FIELD_ENABLED',
}
```

**Step 2: Commit**

```bash
git add packages/twenty-server/src/engine/core-modules/feature-flag/enums/feature-flag-key.enum.ts
git commit -m "feat(feature-flag): add IS_CALCULATED_FIELD_ENABLED [calculated-field]"
```

---

## Task 2: Add CALCULATED to FieldMetadataType Enum

**Files:**
- Modify: `packages/twenty-shared/src/types/FieldMetadataType.ts`

**Step 1: Add the enum value**

```typescript
export enum FieldMetadataType {
  // ... existing types (keep alphabetical order after existing)
  CALCULATED = 'CALCULATED',
  // ... rest of types
}
```

**Step 2: Commit**

```bash
git add packages/twenty-shared/src/types/FieldMetadataType.ts
git commit -m "feat(field-metadata): add CALCULATED field type enum [calculated-field]"
```

---

## Task 3: Define CalculatedSettings Type

**Files:**
- Modify: `packages/twenty-shared/src/types/FieldMetadataSettings.ts`

**Step 1: Add the settings type definition**

After the existing settings types, add:

```typescript
export type CalculatedReturnType =
  | FieldMetadataType.TEXT
  | FieldMetadataType.NUMBER
  | FieldMetadataType.BOOLEAN
  | FieldMetadataType.DATE
  | FieldMetadataType.DATE_TIME;

type FieldMetadataCalculatedSettings = {
  formula: string; // e.g., "{{quantity}} * {{unitPrice}}"
  returnType: CalculatedReturnType;
  // Computed by backend - list of field names the formula depends on
  dependsOnFields?: string[];
};
```

**Step 2: Add to FieldMetadataSettingsMapping**

```typescript
export type FieldMetadataSettingsMapping = {
  // ... existing mappings
  [FieldMetadataType.CALCULATED]: FieldMetadataCalculatedSettings;
};
```

**Step 3: Commit**

```bash
git add packages/twenty-shared/src/types/FieldMetadataSettings.ts
git commit -m "feat(field-metadata): add FieldMetadataCalculatedSettings type [calculated-field]"
```

---

## Task 4: Create Formula Parser Utility

**Files:**
- Create: `packages/twenty-server/src/engine/workspace-manager/utils/calculated-field/parse-formula.util.ts`
- Create: `packages/twenty-server/src/engine/workspace-manager/utils/calculated-field/__tests__/parse-formula.util.spec.ts`

**Step 1: Write the failing test**

```typescript
// parse-formula.util.spec.ts
import { parseFormula, FormulaParseResult } from '../parse-formula.util';

describe('parseFormula', () => {
  describe('extractFieldReferences', () => {
    it('should extract single field reference', () => {
      const result = parseFormula('{{quantity}}');
      expect(result.fieldReferences).toEqual(['quantity']);
    });

    it('should extract multiple field references', () => {
      const result = parseFormula('{{quantity}} * {{unitPrice}}');
      expect(result.fieldReferences).toEqual(['quantity', 'unitPrice']);
    });

    it('should deduplicate repeated references', () => {
      const result = parseFormula('{{amount}} + {{amount}}');
      expect(result.fieldReferences).toEqual(['amount']);
    });

    it('should handle nested composite field references', () => {
      const result = parseFormula('{{budget.amountMicros}} / 1000000');
      expect(result.fieldReferences).toEqual(['budget']);
    });
  });

  describe('validateFormula', () => {
    it('should reject empty formula', () => {
      const result = parseFormula('');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('empty');
    });

    it('should reject formula with no field references', () => {
      const result = parseFormula('1 + 1');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('field reference');
    });

    it('should reject SQL injection attempts', () => {
      const result = parseFormula('{{field}}; DROP TABLE users;');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('invalid');
    });
  });
});
```

**Step 2: Run test to verify it fails**

```bash
npx nx test twenty-server --testPathPattern="parse-formula.util.spec.ts" --passWithNoTests
```

Expected: FAIL (file doesn't exist)

**Step 3: Write minimal implementation**

```typescript
// parse-formula.util.ts
export type FormulaParseResult = {
  isValid: boolean;
  fieldReferences: string[];
  error?: string;
};

const FIELD_REFERENCE_REGEX = /\{\{([a-zA-Z][a-zA-Z0-9]*(?:\.[a-zA-Z][a-zA-Z0-9]*)?)\}\}/g;
const FORBIDDEN_PATTERNS = [
  /;\s*(DROP|DELETE|UPDATE|INSERT|ALTER|CREATE|TRUNCATE)/i,
  /--/,
  /\/\*/,
  /UNION\s+SELECT/i,
];

export const parseFormula = (formula: string): FormulaParseResult => {
  if (!formula || formula.trim() === '') {
    return {
      isValid: false,
      fieldReferences: [],
      error: 'Formula cannot be empty',
    };
  }

  // Check for SQL injection patterns
  for (const pattern of FORBIDDEN_PATTERNS) {
    if (pattern.test(formula)) {
      return {
        isValid: false,
        fieldReferences: [],
        error: 'Formula contains invalid SQL patterns',
      };
    }
  }

  // Extract field references
  const matches = [...formula.matchAll(FIELD_REFERENCE_REGEX)];
  const fieldReferences = [...new Set(matches.map((m) => m[1].split('.')[0]))];

  if (fieldReferences.length === 0) {
    return {
      isValid: false,
      fieldReferences: [],
      error: 'Formula must contain at least one field reference (e.g., {{fieldName}})',
    };
  }

  return {
    isValid: true,
    fieldReferences,
  };
};
```

**Step 4: Run test to verify it passes**

```bash
npx nx test twenty-server --testPathPattern="parse-formula.util.spec.ts"
```

Expected: PASS

**Step 5: Commit**

```bash
git add packages/twenty-server/src/engine/workspace-manager/utils/calculated-field/
git commit -m "feat(calculated-field): add formula parser with validation [calculated-field]"
```

---

## Task 5: Create SQL Expression Generator

**Files:**
- Create: `packages/twenty-server/src/engine/workspace-manager/utils/calculated-field/generate-calculated-expression.util.ts`
- Create: `packages/twenty-server/src/engine/workspace-manager/utils/calculated-field/__tests__/generate-calculated-expression.util.spec.ts`

**Step 1: Write the failing test**

```typescript
// generate-calculated-expression.util.spec.ts
import { FieldMetadataType } from 'twenty-shared/types';
import {
  generateCalculatedExpression,
  CalculatedExpressionInput,
} from '../generate-calculated-expression.util';

describe('generateCalculatedExpression', () => {
  const mockFieldMap: Record<string, { columnName: string; type: FieldMetadataType }> = {
    quantity: { columnName: 'quantity', type: FieldMetadataType.NUMBER },
    unitPrice: { columnName: 'unitPrice', type: FieldMetadataType.NUMBER },
    firstName: { columnName: 'name', type: FieldMetadataType.TEXT }, // composite
  };

  it('should generate expression for multiplication', () => {
    const input: CalculatedExpressionInput = {
      formula: '{{quantity}} * {{unitPrice}}',
      returnType: FieldMetadataType.NUMBER,
      fieldMap: mockFieldMap,
    };
    const result = generateCalculatedExpression(input);
    expect(result.expression).toBe('"quantity" * "unitPrice"');
    expect(result.columnType).toBe('float');
  });

  it('should generate expression for text concatenation', () => {
    const input: CalculatedExpressionInput = {
      formula: "{{firstName}} || ' ' || {{lastName}}",
      returnType: FieldMetadataType.TEXT,
      fieldMap: {
        firstName: { columnName: 'nameFirstName', type: FieldMetadataType.TEXT },
        lastName: { columnName: 'nameLastName', type: FieldMetadataType.TEXT },
      },
    };
    const result = generateCalculatedExpression(input);
    expect(result.expression).toBe("\"nameFirstName\" || ' ' || \"nameLastName\"");
    expect(result.columnType).toBe('text');
  });

  it('should throw for unknown field reference', () => {
    const input: CalculatedExpressionInput = {
      formula: '{{unknownField}}',
      returnType: FieldMetadataType.NUMBER,
      fieldMap: mockFieldMap,
    };
    expect(() => generateCalculatedExpression(input)).toThrow('Unknown field');
  });
});
```

**Step 2: Run test to verify it fails**

```bash
npx nx test twenty-server --testPathPattern="generate-calculated-expression.util.spec.ts" --passWithNoTests
```

Expected: FAIL

**Step 3: Write minimal implementation**

```typescript
// generate-calculated-expression.util.ts
import { FieldMetadataType } from 'twenty-shared/types';

import { parseFormula } from './parse-formula.util';

export type CalculatedExpressionInput = {
  formula: string;
  returnType: FieldMetadataType;
  fieldMap: Record<string, { columnName: string; type: FieldMetadataType }>;
};

export type CalculatedExpressionResult = {
  expression: string;
  columnType: string;
};

const RETURN_TYPE_TO_COLUMN_TYPE: Record<string, string> = {
  [FieldMetadataType.TEXT]: 'text',
  [FieldMetadataType.NUMBER]: 'float',
  [FieldMetadataType.BOOLEAN]: 'boolean',
  [FieldMetadataType.DATE]: 'date',
  [FieldMetadataType.DATE_TIME]: 'timestamptz',
};

export const generateCalculatedExpression = (
  input: CalculatedExpressionInput,
): CalculatedExpressionResult => {
  const { formula, returnType, fieldMap } = input;

  const parseResult = parseFormula(formula);

  if (!parseResult.isValid) {
    throw new Error(`Invalid formula: ${parseResult.error}`);
  }

  // Validate all referenced fields exist
  for (const fieldName of parseResult.fieldReferences) {
    if (!fieldMap[fieldName]) {
      throw new Error(`Unknown field reference: {{${fieldName}}}`);
    }
  }

  // Replace {{fieldName}} with quoted column names
  let expression = formula;
  for (const [fieldName, fieldInfo] of Object.entries(fieldMap)) {
    const regex = new RegExp(`\\{\\{${fieldName}\\}\\}`, 'g');
    expression = expression.replace(regex, `"${fieldInfo.columnName}"`);
  }

  const columnType = RETURN_TYPE_TO_COLUMN_TYPE[returnType];

  if (!columnType) {
    throw new Error(`Unsupported return type: ${returnType}`);
  }

  return {
    expression,
    columnType,
  };
};
```

**Step 4: Run test to verify it passes**

```bash
npx nx test twenty-server --testPathPattern="generate-calculated-expression.util.spec.ts"
```

Expected: PASS

**Step 5: Commit**

```bash
git add packages/twenty-server/src/engine/workspace-manager/utils/calculated-field/
git commit -m "feat(calculated-field): add SQL expression generator [calculated-field]"
```

---

## Task 6: Add Column Type Mapping for CALCULATED

**Files:**
- Modify: `packages/twenty-server/src/engine/workspace-manager/workspace-migration/workspace-migration-runner/utils/field-metadata-type-to-column-type.util.ts`

**Step 1: Add CALCULATED case**

This is special - CALCULATED fields derive their column type from settings.returnType, so we need to handle it dynamically. For now, we'll throw since the caller should use the settings.

```typescript
case FieldMetadataType.CALCULATED:
  throw new WorkspaceMigrationActionExecutionException({
    message: 'CALCULATED fields must use settings.returnType for column type',
    code: WorkspaceMigrationActionExecutionExceptionCode.UNSUPPORTED_FIELD_METADATA_TYPE,
  });
```

**Step 2: Commit**

```bash
git add packages/twenty-server/src/engine/workspace-manager/workspace-migration/workspace-migration-runner/utils/field-metadata-type-to-column-type.util.ts
git commit -m "feat(calculated-field): add column type mapping placeholder [calculated-field]"
```

---

## Task 7: Update SQL Column Definition Builder

**Files:**
- Modify: `packages/twenty-server/src/engine/twenty-orm/workspace-schema-manager/utils/build-sql-column-definition.util.ts`

**Step 1: Extend to support any generated column type (not just tsvector)**

```typescript
export const buildSqlColumnDefinition = (
  column: WorkspaceSchemaColumnDefinition,
): string => {
  const safeName = removeSqlDDLInjection(column.name);
  const parts = [`"${safeName}"`];

  parts.push(column.isArray ? `${column.type}[]` : column.type);

  // Support GENERATED ALWAYS AS for tsvector and calculated fields
  if (column.asExpression) {
    parts.push(`GENERATED ALWAYS AS (${column.asExpression})`);
    if (column.generatedType) {
      parts.push(column.generatedType);
    }
  }

  if (column.isPrimary) {
    parts.push('PRIMARY KEY');
  }

  if (column.isNullable === false && !column.asExpression) {
    parts.push('NOT NULL');
  }

  if (isDefined(column.default) && !column.asExpression) {
    parts.push(`DEFAULT ${column.default}`);
  }

  return parts.join(' ');
};
```

**Step 2: Commit**

```bash
git add packages/twenty-server/src/engine/twenty-orm/workspace-schema-manager/utils/build-sql-column-definition.util.ts
git commit -m "feat(calculated-field): extend column builder for generated columns [calculated-field]"
```

---

## Task 8: Block Write Operations for CALCULATED Fields

**Files:**
- Modify: `packages/twenty-server/src/engine/api/common/common-args-processors/data-arg-processor/data-arg.processor.ts`

**Step 1: Add CALCULATED to the write-blocking switch case**

Find the case for `RICH_TEXT` and `TS_VECTOR` and add `CALCULATED`:

```typescript
case FieldMetadataType.RICH_TEXT:
case FieldMetadataType.TS_VECTOR:
case FieldMetadataType.CALCULATED:
  throw new CommonQueryRunnerException(
    `${key} ${fieldMetadata.type}-typed field does not support write operations`,
    CommonQueryRunnerExceptionCode.INVALID_ARGS_DATA,
    { userFriendlyMessage: STANDARD_ERROR_MESSAGE },
  );
```

**Step 2: Commit**

```bash
git add packages/twenty-server/src/engine/api/common/common-args-processors/data-arg-processor/data-arg.processor.ts
git commit -m "feat(calculated-field): block write operations [calculated-field]"
```

---

## Task 9: Add GraphQL Type Mapping

**Files:**
- Modify: `packages/twenty-server/src/engine/api/graphql/workspace-schema-builder/services/type-mapper.service.ts`

**Step 1: Add CALCULATED to baseTypeScalarMapping**

CALCULATED fields output the type specified in their settings. For the base mapping, we use GraphQLString as default (actual type comes from settings):

```typescript
// In baseTypeScalarMapping Map:
[FieldMetadataType.CALCULATED, GraphQLString],
```

**Step 2: Add filter type mapping**

```typescript
// In mapToFilterType method's typeFilterMapping Map:
[FieldMetadataType.CALCULATED, StringFilterType], // Default, actual filter depends on returnType
```

**Step 3: Commit**

```bash
git add packages/twenty-server/src/engine/api/graphql/workspace-schema-builder/services/type-mapper.service.ts
git commit -m "feat(calculated-field): add GraphQL type mapping [calculated-field]"
```

---

## Task 10: Create Index Barrel File

**Files:**
- Create: `packages/twenty-server/src/engine/workspace-manager/utils/calculated-field/index.ts`

**Step 1: Create the barrel export**

```typescript
export * from './parse-formula.util';
export * from './generate-calculated-expression.util';
```

**Step 2: Commit**

```bash
git add packages/twenty-server/src/engine/workspace-manager/utils/calculated-field/index.ts
git commit -m "chore(calculated-field): add barrel export [calculated-field]"
```

---

## Task 11: Add Calculated Field Validation in Field Metadata Service

**Files:**
- Modify: `packages/twenty-server/src/engine/metadata-modules/field-metadata/services/field-metadata.service.ts`

**Step 1: Find the field creation validation section and add CALCULATED validation**

Add import at top:

```typescript
import { parseFormula } from 'src/engine/workspace-manager/utils/calculated-field';
```

In the field creation method, add validation for CALCULATED type:

```typescript
if (createFieldInput.type === FieldMetadataType.CALCULATED) {
  const settings = createFieldInput.settings as FieldMetadataCalculatedSettings;

  if (!settings?.formula) {
    throw new FieldMetadataException(
      'CALCULATED field requires a formula in settings',
      FieldMetadataExceptionCode.INVALID_FIELD_INPUT,
    );
  }

  if (!settings?.returnType) {
    throw new FieldMetadataException(
      'CALCULATED field requires a returnType in settings',
      FieldMetadataExceptionCode.INVALID_FIELD_INPUT,
    );
  }

  const parseResult = parseFormula(settings.formula);

  if (!parseResult.isValid) {
    throw new FieldMetadataException(
      `Invalid formula: ${parseResult.error}`,
      FieldMetadataExceptionCode.INVALID_FIELD_INPUT,
    );
  }
}
```

**Step 2: Commit**

```bash
git add packages/twenty-server/src/engine/metadata-modules/field-metadata/services/field-metadata.service.ts
git commit -m "feat(calculated-field): add field creation validation [calculated-field]"
```

---

## Task 12: Update phos-seeder with Example Calculated Field

**Files:**
- Modify: `packages/twenty-server/src/engine/workspace-manager/phos-seeder/custom-fields/invoice-custom-field-seeds.constant.ts`

**Step 1: Add a calculated balanceDue field to Invoice**

```typescript
{
  name: 'balanceDue',
  label: 'Balance Due',
  type: FieldMetadataType.CALCULATED,
  description: 'Automatically calculated: totalAmount - amountPaid',
  icon: 'IconCalculator',
  settings: {
    formula: '{{totalAmount}} - {{amountPaid}}',
    returnType: FieldMetadataType.NUMBER,
    dependsOnFields: ['totalAmount', 'amountPaid'],
  },
  isUIReadOnly: true,
},
```

**Step 2: Commit**

```bash
git add packages/twenty-server/src/engine/workspace-manager/phos-seeder/custom-fields/invoice-custom-field-seeds.constant.ts
git commit -m "feat(phos-seeder): add balanceDue calculated field example [calculated-field]"
```

---

## Task 13: Add Documentation

**Files:**
- Create: `docs/calculated-fields.md`

**Step 1: Write documentation**

```markdown
# Calculated Fields

Calculated fields automatically compute values based on formulas referencing other fields.

## Overview

The CALCULATED field type uses PostgreSQL GENERATED ALWAYS AS columns for efficient,
automatically-updated computed values.

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
          formula: "{{totalAmount}} - {{amountPaid}}"
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
  settings: {
    formula: '{{totalAmount}} - {{amountPaid}}',
    returnType: FieldMetadataType.NUMBER,
  },
}
```

## Formula Syntax

- Field references: `{{fieldName}}`
- Arithmetic: `+`, `-`, `*`, `/`
- Concatenation: `||`
- Comparisons: `>`, `<`, `=`, `>=`, `<=`

## Supported Return Types

- `TEXT` - String result
- `NUMBER` - Numeric result (float)
- `BOOLEAN` - True/false result
- `DATE` - Date result
- `DATE_TIME` - Timestamp result

## Feature Flag

Enable with: `IS_CALCULATED_FIELD_ENABLED = true`

## Limitations

- Read-only (cannot be manually set)
- Cannot reference relation fields directly
- Cannot reference other calculated fields (no circular dependencies)
- Maximum formula length: 1000 characters
```

**Step 2: Commit**

```bash
git add docs/calculated-fields.md
git commit -m "docs(calculated-field): add usage documentation [calculated-field]"
```

---

## Task 14: Verify All Commits Have Tag

**Step 1: Check commits**

```bash
git log --oneline --grep="calculated-field" | head -15
```

Expected: All commits from this implementation should appear

**Step 2: Create summary for PR**

```bash
echo "## Calculated Field Implementation Summary

### Commits for PR:
$(git log --oneline --grep="calculated-field")

### Files Changed:
- packages/twenty-shared/src/types/FieldMetadataType.ts
- packages/twenty-shared/src/types/FieldMetadataSettings.ts
- packages/twenty-server/src/engine/core-modules/feature-flag/enums/feature-flag-key.enum.ts
- packages/twenty-server/src/engine/workspace-manager/utils/calculated-field/*
- packages/twenty-server/src/engine/twenty-orm/workspace-schema-manager/utils/build-sql-column-definition.util.ts
- packages/twenty-server/src/engine/api/common/common-args-processors/data-arg-processor/data-arg.processor.ts
- packages/twenty-server/src/engine/api/graphql/workspace-schema-builder/services/type-mapper.service.ts
- packages/twenty-server/src/engine/metadata-modules/field-metadata/services/field-metadata.service.ts
- packages/twenty-server/src/engine/workspace-manager/phos-seeder/custom-fields/invoice-custom-field-seeds.constant.ts
- docs/calculated-fields.md
" > /tmp/calculated-field-pr-summary.md
cat /tmp/calculated-field-pr-summary.md
```

---

## Execution Notes

### To Extract Commits for PR Later:

```bash
# List all calculated-field commits
git log --oneline --grep="calculated-field"

# Create branch with just these commits
git checkout main
git checkout -b feature/calculated-field
git cherry-pick $(git log --reverse --format="%H" --grep="calculated-field" wip)
```

### Feature Flag Enablement:

```sql
INSERT INTO core."featureFlag" ("key", "value", "workspaceId")
VALUES ('IS_CALCULATED_FIELD_ENABLED', true, 'your-workspace-id');
```

---

Plan complete and saved to `docs/plans/2026-01-28-calculated-field-type.md`. Two execution options:

**1. Subagent-Driven (this session)** - I dispatch fresh subagent per task, review between tasks, fast iteration

**2. Parallel Session (separate)** - Open new session with executing-plans, batch execution with checkpoints

Which approach?
