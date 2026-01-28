import { FieldMetadataType } from 'twenty-shared/types';

import {
  generateCalculatedExpression,
  CalculatedExpressionInput,
} from '../generate-calculated-expression.util';

describe('generateCalculatedExpression', () => {
  const mockFieldMap: Record<
    string,
    { columnName: string; type: FieldMetadataType }
  > = {
    quantity: { columnName: 'quantity', type: FieldMetadataType.NUMBER },
    unitPrice: { columnName: 'unitPrice', type: FieldMetadataType.NUMBER },
    firstName: { columnName: 'nameFirstName', type: FieldMetadataType.TEXT },
    lastName: { columnName: 'nameLastName', type: FieldMetadataType.TEXT },
  };

  describe('arithmetic expressions', () => {
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

    it('should generate expression for addition', () => {
      const input: CalculatedExpressionInput = {
        formula: '{{quantity}} + {{unitPrice}}',
        returnType: FieldMetadataType.NUMBER,
        fieldMap: mockFieldMap,
      };
      const result = generateCalculatedExpression(input);
      expect(result.expression).toBe('"quantity" + "unitPrice"');
    });

    it('should generate expression for subtraction', () => {
      const input: CalculatedExpressionInput = {
        formula: '{{quantity}} - {{unitPrice}}',
        returnType: FieldMetadataType.NUMBER,
        fieldMap: mockFieldMap,
      };
      const result = generateCalculatedExpression(input);
      expect(result.expression).toBe('"quantity" - "unitPrice"');
    });

    it('should generate expression for division', () => {
      const input: CalculatedExpressionInput = {
        formula: '{{quantity}} / {{unitPrice}}',
        returnType: FieldMetadataType.NUMBER,
        fieldMap: mockFieldMap,
      };
      const result = generateCalculatedExpression(input);
      expect(result.expression).toBe('"quantity" / "unitPrice"');
    });
  });

  describe('text expressions', () => {
    it('should generate expression for text concatenation', () => {
      const input: CalculatedExpressionInput = {
        formula: "{{firstName}} || ' ' || {{lastName}}",
        returnType: FieldMetadataType.TEXT,
        fieldMap: mockFieldMap,
      };
      const result = generateCalculatedExpression(input);
      expect(result.expression).toBe("\"nameFirstName\" || ' ' || \"nameLastName\"");
      expect(result.columnType).toBe('text');
    });
  });

  describe('column type mapping', () => {
    it('should return boolean type for BOOLEAN return type', () => {
      const input: CalculatedExpressionInput = {
        formula: '{{quantity}} > 0',
        returnType: FieldMetadataType.BOOLEAN,
        fieldMap: mockFieldMap,
      };
      const result = generateCalculatedExpression(input);
      expect(result.columnType).toBe('boolean');
    });

    it('should return date type for DATE return type', () => {
      const input: CalculatedExpressionInput = {
        formula: '{{quantity}}', // Not realistic, just for testing column type
        returnType: FieldMetadataType.DATE,
        fieldMap: mockFieldMap,
      };
      const result = generateCalculatedExpression(input);
      expect(result.columnType).toBe('date');
    });

    it('should return timestamptz type for DATE_TIME return type', () => {
      const input: CalculatedExpressionInput = {
        formula: '{{quantity}}',
        returnType: FieldMetadataType.DATE_TIME,
        fieldMap: mockFieldMap,
      };
      const result = generateCalculatedExpression(input);
      expect(result.columnType).toBe('timestamptz');
    });
  });

  describe('error handling', () => {
    it('should throw for unknown field reference', () => {
      const input: CalculatedExpressionInput = {
        formula: '{{unknownField}}',
        returnType: FieldMetadataType.NUMBER,
        fieldMap: mockFieldMap,
      };
      expect(() => generateCalculatedExpression(input)).toThrow(
        'Unknown field reference',
      );
    });

    it('should throw for invalid formula', () => {
      const input: CalculatedExpressionInput = {
        formula: '',
        returnType: FieldMetadataType.NUMBER,
        fieldMap: mockFieldMap,
      };
      expect(() => generateCalculatedExpression(input)).toThrow(
        'Invalid formula',
      );
    });

    it('should throw for unsupported return type', () => {
      const input: CalculatedExpressionInput = {
        formula: '{{quantity}}',
        returnType: FieldMetadataType.RELATION as any, // Invalid return type
        fieldMap: mockFieldMap,
      };
      expect(() => generateCalculatedExpression(input)).toThrow(
        'Unsupported return type',
      );
    });
  });
});
