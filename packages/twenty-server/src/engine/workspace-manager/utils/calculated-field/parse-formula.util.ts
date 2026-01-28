export type FormulaParseResult = {
  isValid: boolean;
  fieldReferences: string[];
  error?: string;
};

// Matches field references like {{fieldName}} or {{object.property}}
// Field names must start with a letter, can contain letters, numbers, and underscores
const FIELD_REFERENCE_REGEX =
  /\{\{([a-zA-Z][a-zA-Z0-9_]*(?:\.[a-zA-Z][a-zA-Z0-9_]*)?)\}\}/g;

// SQL injection patterns to block
const FORBIDDEN_PATTERNS = [
  /;\s*(DROP|DELETE|UPDATE|INSERT|ALTER|CREATE|TRUNCATE)/i,
  /--/, // SQL single-line comment
  /\/\*/, // SQL block comment start
  /UNION\s+SELECT/i,
];

/**
 * Parses a formula string and extracts field references.
 * Validates the formula for security and correctness.
 *
 * @param formula - The formula string to parse (e.g., "{{quantity}} * {{unitPrice}}")
 * @returns FormulaParseResult with validation status and extracted field references
 *
 * @example
 * parseFormula('{{quantity}} * {{unitPrice}}')
 * // Returns: { isValid: true, fieldReferences: ['quantity', 'unitPrice'] }
 *
 * @example
 * parseFormula('{{budget.amountMicros}} / 1000000')
 * // Returns: { isValid: true, fieldReferences: ['budget'] }
 */
export const parseFormula = (formula: string): FormulaParseResult => {
  // Check for empty formula
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

  // Extract base field names (for composite fields like "budget.amount", extract "budget")
  const fieldReferences = [
    ...new Set(matches.map((match) => match[1].split('.')[0])),
  ];

  // Validate that formula contains at least one field reference
  if (fieldReferences.length === 0) {
    return {
      isValid: false,
      fieldReferences: [],
      error:
        'Formula must contain at least one field reference (e.g., {{fieldName}})',
    };
  }

  return {
    isValid: true,
    fieldReferences,
  };
};
