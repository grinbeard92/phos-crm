import { useMemo } from 'react';

import { type CurrencyValue, type QuoteLineItemFormInput } from '../types/quote.types';

export type QuoteTotals = {
  subtotal: CurrencyValue;
  discountAmount: CurrencyValue;
  taxAmount: CurrencyValue;
  total: CurrencyValue;
};

type UseQuoteCalculationsParams = {
  lineItems: QuoteLineItemFormInput[];
  discountPercentage?: number;
  taxPercentage?: number;
  currencyCode?: string;
};

/**
 * Hook to calculate quote/invoice totals from line items
 * Handles currency calculations with proper rounding
 */
export const useQuoteCalculations = ({
  lineItems,
  discountPercentage = 0,
  taxPercentage = 0,
  currencyCode = 'USD',
}: UseQuoteCalculationsParams): QuoteTotals => {
  return useMemo(() => {
    // Calculate subtotal from all line items
    const subtotalMicros = lineItems.reduce((sum, item) => {
      const lineSubtotal =
        item.quantity * (item.unitPrice?.amountMicros ?? 0);
      return sum + lineSubtotal;
    }, 0);

    // Calculate discount
    const discountMicros = Math.round(
      (subtotalMicros * discountPercentage) / 100,
    );

    // Calculate taxable amount (subtotal - discount)
    const taxableAmountMicros = subtotalMicros - discountMicros;

    // Calculate tax
    const taxMicros = Math.round((taxableAmountMicros * taxPercentage) / 100);

    // Calculate total (taxable amount + tax)
    const totalMicros = taxableAmountMicros + taxMicros;

    return {
      subtotal: {
        amountMicros: subtotalMicros,
        currencyCode,
      },
      discountAmount: {
        amountMicros: discountMicros,
        currencyCode,
      },
      taxAmount: {
        amountMicros: taxMicros,
        currencyCode,
      },
      total: {
        amountMicros: totalMicros,
        currencyCode,
      },
    };
  }, [lineItems, discountPercentage, taxPercentage, currencyCode]);
};

/**
 * Calculate line item subtotal
 */
export const calculateLineItemSubtotal = (
  quantity: number,
  unitPrice: CurrencyValue,
): CurrencyValue => {
  return {
    amountMicros: quantity * unitPrice.amountMicros,
    currencyCode: unitPrice.currencyCode,
  };
};

/**
 * Convert micros to display amount (e.g., 1000000 -> 1.00)
 */
export const microsToAmount = (micros: number): number => {
  return micros / 1000000;
};

/**
 * Convert display amount to micros (e.g., 1.00 -> 1000000)
 */
export const amountToMicros = (amount: number): number => {
  return Math.round(amount * 1000000);
};
