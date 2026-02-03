export type QuoteFormData = {
  // Relations
  companyId: string | null;
  contactId: string | null;
  projectId: string | null;

  // Core fields
  quoteNumber: string;
  quoteDate: string; // ISO date string
  expirationDate: string | null; // ISO date string
  status: QuoteStatus;

  // Line items
  lineItems: QuoteLineItemFormData[];

  // Calculations
  discountPercentage: number;
  taxPercentage: number;

  // Notes
  notes: string | null;
  terms: string | null;
};

export type QuoteLineItemFormData = {
  id: string; // temp ID for form state, becomes real ID after save
  description: string;
  quantity: number;
  unitPriceMicros: number; // Store as micros for precision
  currencyCode: string;
  serviceCategory: string | null;
  sortOrder: number;
};

export type QuoteStatus =
  | 'DRAFT'
  | 'SENT'
  | 'VIEWED'
  | 'ACCEPTED'
  | 'DECLINED'
  | 'EXPIRED'
  | 'CONVERTED';

export type QuoteCalculations = {
  subtotalMicros: number;
  discountAmountMicros: number;
  taxableAmountMicros: number;
  taxAmountMicros: number;
  totalMicros: number;
  currencyCode: string;
};
