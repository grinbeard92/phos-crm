import { parseFormula } from '../parse-formula.util';

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

    it('should handle complex formulas with multiple operations', () => {
      const result = parseFormula(
        '({{quantity}} * {{unitPrice}}) - {{discount}}',
      );
      expect(result.fieldReferences).toEqual([
        'quantity',
        'unitPrice',
        'discount',
      ]);
    });

    it('should handle formulas with numeric literals', () => {
      const result = parseFormula('{{price}} * 1.08');
      expect(result.fieldReferences).toEqual(['price']);
    });

    it('should handle field references with underscores', () => {
      const result = parseFormula('{{unit_price}} * {{total_quantity}}');
      expect(result.fieldReferences).toEqual(['unit_price', 'total_quantity']);
    });
  });

  describe('validateFormula', () => {
    it('should reject empty formula', () => {
      const result = parseFormula('');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('empty');
    });

    it('should reject whitespace-only formula', () => {
      const result = parseFormula('   ');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('empty');
    });

    it('should reject formula with no field references', () => {
      const result = parseFormula('1 + 1');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('field reference');
    });

    it('should reject SQL injection attempts with DROP', () => {
      const result = parseFormula('{{field}}; DROP TABLE users;');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('invalid');
    });

    it('should reject SQL injection attempts with DELETE', () => {
      const result = parseFormula('{{field}}; DELETE FROM users;');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('invalid');
    });

    it('should reject SQL injection attempts with UPDATE', () => {
      const result = parseFormula('{{field}}; UPDATE users SET name=x;');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('invalid');
    });

    it('should reject SQL injection attempts with INSERT', () => {
      const result = parseFormula('{{field}}; INSERT INTO users VALUES(1);');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('invalid');
    });

    it('should reject SQL comment injection', () => {
      const result = parseFormula('{{field}} -- malicious comment');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('invalid');
    });

    it('should reject SQL block comment injection', () => {
      const result = parseFormula('{{field}} /* comment */');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('invalid');
    });

    it('should reject UNION SELECT injection', () => {
      const result = parseFormula('{{field}} UNION SELECT * FROM users');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('invalid');
    });

    it('should accept valid simple formula', () => {
      const result = parseFormula('{{quantity}} * {{unitPrice}}');
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should accept valid formula with parentheses', () => {
      const result = parseFormula('({{a}} + {{b}}) / {{c}}');
      expect(result.isValid).toBe(true);
    });

    it('should accept valid formula with composite fields', () => {
      const result = parseFormula('{{budget.amount}} * {{rate}}');
      expect(result.isValid).toBe(true);
    });
  });

  describe('edge cases', () => {
    it('should handle formula with only whitespace around field reference', () => {
      const result = parseFormula('  {{amount}}  ');
      expect(result.isValid).toBe(true);
      expect(result.fieldReferences).toEqual(['amount']);
    });

    it('should handle camelCase field names', () => {
      const result = parseFormula('{{totalAmount}} + {{taxRate}}');
      expect(result.fieldReferences).toEqual(['totalAmount', 'taxRate']);
    });

    it('should handle numeric field name suffixes', () => {
      const result = parseFormula('{{field1}} + {{field2}}');
      expect(result.fieldReferences).toEqual(['field1', 'field2']);
    });

    it('should reject invalid field name format (starting with number)', () => {
      const result = parseFormula('{{1field}}');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('field reference');
    });

    it('should handle deeply nested composite field', () => {
      const result = parseFormula('{{object.property}}');
      expect(result.isValid).toBe(true);
      expect(result.fieldReferences).toEqual(['object']);
    });
  });
});
