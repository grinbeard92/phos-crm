import { type ObjectRecord } from '@/object-record/types/ObjectRecord';

export type QuoteStatus =
  | 'DRAFT'
  | 'SENT'
  | 'VIEWED'
  | 'ACCEPTED'
  | 'DECLINED'
  | 'EXPIRED';

export type ServiceCategory =
  | 'CONSULTING'
  | 'DEVELOPMENT'
  | 'DESIGN'
  | 'HARDWARE'
  | 'TRAINING'
  | 'SUPPORT'
  | 'OTHER';

export type CurrencyValue = {
  amountMicros: number;
  currencyCode: string;
};

export type QuoteLineItem = ObjectRecord & {
  name: string; // Description of line item
  quantity: number;
  unitPrice: CurrencyValue;
  subtotal: CurrencyValue;
  serviceCategory?: ServiceCategory;
  sortOrder: number;
  quoteId: string;
};

export type Quote = ObjectRecord & {
  name: string; // Quote title
  quoteNumber: string;
  quoteDate: string; // ISO date
  expiryDate: string; // ISO date
  status: QuoteStatus;
  subtotal: CurrencyValue;
  discountPercentage?: number;
  discountAmount?: CurrencyValue;
  taxPercentage?: number;
  taxAmount?: CurrencyValue;
  total: CurrencyValue;
  notes?: string;
  internalNotes?: string;
  terms?: string;
  version: number;
  // Relations
  companyId?: string;
  personId?: string; // Contact
  projectId?: string;
  lineItems?: QuoteLineItem[];
};

export type QuoteFormInput = {
  name?: string;
  companyId?: string;
  personId?: string;
  projectId?: string;
  quoteDate?: string;
  expiryDate?: string;
  discountPercentage?: number;
  taxPercentage?: number;
  notes?: string;
  internalNotes?: string;
  terms?: string;
};

export type QuoteLineItemFormInput = {
  id?: string; // For editing existing items
  name: string;
  quantity: number;
  unitPrice: CurrencyValue;
  serviceCategory?: ServiceCategory;
};
