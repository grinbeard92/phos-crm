import { type QuoteLineItemFormData, type QuoteCalculations } from '../types/quote-form.types';

/**
 * Calculate quote totals from line items and discount/tax percentages.
 * All amounts stored as micros (multiply by 1,000,000) for precision.
 */
export const calculateQuoteTotals = (
  lineItems: QuoteLineItemFormData[],
  discountPercentage: number,
  taxPercentage: number,
  currencyCode = 'USD',
): QuoteCalculations => {
  // Sum all line items (quantity * unitPrice)
  const subtotalMicros = lineItems.reduce((sum, item) => {
    return sum + item.quantity * item.unitPriceMicros;
  }, 0);

  // Calculate discount amount
  const discountAmountMicros = Math.round(
    (subtotalMicros * discountPercentage) / 100,
  );

  // Taxable amount = subtotal - discount
  const taxableAmountMicros = subtotalMicros - discountAmountMicros;

  // Calculate tax amount
  const taxAmountMicros = Math.round(
    (taxableAmountMicros * taxPercentage) / 100,
  );

  // Total = taxable amount + tax
  const totalMicros = taxableAmountMicros + taxAmountMicros;

  return {
    subtotalMicros,
    discountAmountMicros,
    taxableAmountMicros,
    taxAmountMicros,
    totalMicros,
    currencyCode,
  };
};

/**
 * Format micros to currency string for display
 */
export const formatCurrencyFromMicros = (
  amountMicros: number,
  currencyCode = 'USD',
): string => {
  const amount = amountMicros / 1_000_000;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currencyCode,
  }).format(amount);
};

/**
 * Convert dollars to micros for storage
 */
export const dollarsToMicros = (dollars: number): number => {
  return Math.round(dollars * 1_000_000);
};

/**
 * Convert micros to dollars for display/editing
 */
export const microsToDollars = (micros: number): number => {
  return micros / 1_000_000;
};
