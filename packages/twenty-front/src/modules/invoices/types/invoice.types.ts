import { type ObjectRecord } from '@/object-record/types/ObjectRecord';
import { type CurrencyValue, type ServiceCategory } from '@/quotes/types/quote.types';

export type InvoiceStatus =
  | 'DRAFT'
  | 'SENT'
  | 'VIEWED'
  | 'PARTIAL'
  | 'PAID'
  | 'OVERDUE'
  | 'CANCELLED';

export type InvoiceLineItem = ObjectRecord & {
  name: string;
  quantity: number;
  unitPrice: CurrencyValue;
  subtotal: CurrencyValue;
  serviceCategory?: ServiceCategory;
  sortOrder: number;
  invoiceId: string;
};

export type Invoice = ObjectRecord & {
  name: string;
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  status: InvoiceStatus;
  subtotal: CurrencyValue;
  discountPercentage?: number;
  discountAmount?: CurrencyValue;
  taxPercentage?: number;
  taxAmount?: CurrencyValue;
  total: CurrencyValue;
  paidAmount?: CurrencyValue;
  balanceDue?: CurrencyValue;
  notes?: string;
  terms?: string;
  stripeInvoiceId?: string;
  stripePaymentStatus?: string;
  stripePaymentLink?: string;
  // Relations
  companyId?: string;
  personId?: string;
  projectId?: string;
  quoteId?: string;
  lineItems?: InvoiceLineItem[];
};
