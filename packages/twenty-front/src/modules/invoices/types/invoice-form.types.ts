export type InvoiceFormData = {
  // Relations
  companyId: string | null;
  contactId: string | null;
  projectId: string | null;
  quoteId: string | null; // Optional link to originating quote

  // Core fields
  invoiceNumber: string;
  invoiceDate: string; // ISO date string
  dueDate: string | null; // ISO date string
  status: InvoiceStatus;

  // Line items
  lineItems: InvoiceLineItemFormData[];

  // Calculations
  discountPercentage: number;
  taxPercentage: number;
  amountPaidMicros: number; // Tracks payments received

  // Notes
  notes: string | null;
  paymentTerms: string | null;

  // Stripe integration
  stripeInvoiceId: string | null;
  stripePaymentLink: string | null;
};

export type InvoiceLineItemFormData = {
  id: string; // temp ID for form state
  description: string;
  quantity: number;
  unitPriceMicros: number;
  currencyCode: string;
  serviceCategory: string | null;
  sortOrder: number;
};

export type InvoiceStatus =
  | 'DRAFT'
  | 'SENT'
  | 'VIEWED'
  | 'PARTIALLY_PAID'
  | 'PAID'
  | 'OVERDUE'
  | 'CANCELLED';

export type InvoiceCalculations = {
  subtotalMicros: number;
  discountAmountMicros: number;
  taxableAmountMicros: number;
  taxAmountMicros: number;
  totalMicros: number;
  amountPaidMicros: number;
  balanceDueMicros: number;
  currencyCode: string;
};
