export type CurrencyValue = {
  amountMicros: number;
  currencyCode: string;
};

export type QuoteLineItem = {
  id: string;
  description: string;
  quantity: number;
  unitPrice: CurrencyValue;
  serviceCategory?: string;
};

export type InvoiceLineItem = {
  id: string;
  description: string;
  quantity: number;
  unitPrice: CurrencyValue;
  serviceCategory?: string;
};

export type QuotePdfData = {
  id: string;
  quoteNumber: string;
  quoteDate: string;
  expirationDate?: string;
  status: string;
  company?: {
    id: string;
    name: string;
    address?: {
      addressStreet1?: string;
      addressStreet2?: string;
      addressCity?: string;
      addressState?: string;
      addressPostcode?: string;
      addressCountry?: string;
    };
  };
  contact?: {
    id: string;
    name: {
      firstName: string;
      lastName: string;
    };
    email?: string;
    phone?: string;
  };
  lineItems: QuoteLineItem[];
  subtotal: CurrencyValue;
  discountPercentage: number;
  discountAmount: CurrencyValue;
  taxPercentage: number;
  taxAmount: CurrencyValue;
  total: CurrencyValue;
  notes?: string;
  terms?: string;
};

export type InvoicePdfData = {
  id: string;
  invoiceNumber: string;
  invoiceDate: string;
  dueDate?: string;
  status: string;
  company?: {
    id: string;
    name: string;
    address?: {
      addressStreet1?: string;
      addressStreet2?: string;
      addressCity?: string;
      addressState?: string;
      addressPostcode?: string;
      addressCountry?: string;
    };
  };
  contact?: {
    id: string;
    name: {
      firstName: string;
      lastName: string;
    };
    email?: string;
    phone?: string;
  };
  lineItems: InvoiceLineItem[];
  subtotal: CurrencyValue;
  discountPercentage: number;
  discountAmount: CurrencyValue;
  taxPercentage: number;
  taxAmount: CurrencyValue;
  total: CurrencyValue;
  amountPaid?: CurrencyValue;
  amountDue?: CurrencyValue;
  notes?: string;
  paymentTerms?: string;
};
