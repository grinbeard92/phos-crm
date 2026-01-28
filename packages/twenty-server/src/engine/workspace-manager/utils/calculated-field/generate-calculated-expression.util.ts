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

/**
 * Maps CALCULATED field return types to PostgreSQL column types.
 * Only these types are supported as return types for calculated fields.
 */
const RETURN_TYPE_TO_COLUMN_TYPE: Record<string, string> = {
  [FieldMetadataType.TEXT]: 'text',
  [FieldMetadataType.NUMBER]: 'float',
  [FieldMetadataType.BOOLEAN]: 'boolean',
  [FieldMetadataType.DATE]: 'date',
  [FieldMetadataType.DATE_TIME]: 'timestamptz',
};

/**
 * Generates a PostgreSQL expression for a CALCULATED field.
 *
 * Takes a formula with field references like {{fieldName}} and converts it
 * to a valid PostgreSQL expression with quoted column names.
 *
 * @param input - The formula, return type, and field map
 * @returns The SQL expression and column type for the GENERATED ALWAYS AS clause
 *
 * @example
 * generateCalculatedExpression({
 *   formula: '{{quantity}} * {{unitPrice}}',
 *   returnType: FieldMetadataType.NUMBER,
 *   fieldMap: {
 *     quantity: { columnName: 'quantity', type: FieldMetadataType.NUMBER },
 *     unitPrice: { columnName: 'unitPrice', type: FieldMetadataType.NUMBER },
 *   },
 * })
 * // Returns: { expression: '"quantity" * "unitPrice"', columnType: 'float' }
 */
export const generateCalculatedExpression = (
  input: CalculatedExpressionInput,
): CalculatedExpressionResult => {
  const { formula, returnType, fieldMap } = input;

  // Parse and validate the formula
  const parseResult = parseFormula(formula);

  if (!parseResult.isValid) {
    throw new Error(`Invalid formula: ${parseResult.error}`);
  }

  // Validate all referenced fields exist in the field map
  for (const fieldName of parseResult.fieldReferences) {
    if (!fieldMap[fieldName]) {
      throw new Error(`Unknown field reference: {{${fieldName}}}`);
    }
  }

  // Replace {{fieldName}} with quoted column names
  let expression = formula;

  for (const [fieldName, fieldInfo] of Object.entries(fieldMap)) {
    // Only replace if this field is actually referenced
    const regex = new RegExp(`\\{\\{${fieldName}\\}\\}`, 'g');

    expression = expression.replace(regex, `"${fieldInfo.columnName}"`);
  }

  // Get the PostgreSQL column type for this return type
  const columnType = RETURN_TYPE_TO_COLUMN_TYPE[returnType];

  if (!columnType) {
    throw new Error(`Unsupported return type: ${returnType}`);
  }

  return {
    expression,
    columnType,
  };
};
