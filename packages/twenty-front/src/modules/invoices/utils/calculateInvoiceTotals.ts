import { type InvoiceLineItemFormData, type InvoiceCalculations } from '../types/invoice-form.types';

/**
 * Calculate invoice totals from line items, discount/tax percentages, and amount paid.
 * All amounts stored as micros (multiply by 1,000,000) for precision.
 */
export const calculateInvoiceTotals = (
  lineItems: InvoiceLineItemFormData[],
  discountPercentage: number,
  taxPercentage: number,
  amountPaidMicros: number,
  currencyCode = 'USD',
): InvoiceCalculations => {
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

  // Balance due = total - amount paid
  const balanceDueMicros = Math.max(0, totalMicros - amountPaidMicros);

  return {
    subtotalMicros,
    discountAmountMicros,
    taxableAmountMicros,
    taxAmountMicros,
    totalMicros,
    amountPaidMicros,
    balanceDueMicros,
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

/**
 * Calculate due date based on payment terms
 */
export const calculateDueDate = (
  invoiceDate: string,
  paymentTerms: string,
): string => {
  const date = new Date(invoiceDate);

  // Parse common payment terms
  const match = paymentTerms.match(/Net\s*(\d+)/i);
  if (match) {
    const days = parseInt(match[1], 10);
    date.setDate(date.getDate() + days);
  } else {
    // Default to 30 days
    date.setDate(date.getDate() + 30);
  }

  return date.toISOString().split('T')[0];
};
