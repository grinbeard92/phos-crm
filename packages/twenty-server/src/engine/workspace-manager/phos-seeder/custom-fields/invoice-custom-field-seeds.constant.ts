import { FieldMetadataType } from 'twenty-shared/types';

import { type FieldMetadataSeed } from 'src/engine/workspace-manager/dev-seeder/metadata/types/field-metadata-seed.type';

/**
 * Invoice fields per Epic 001 specification
 * Includes Stripe integration fields for payment processing
 * Note: 'name' field is auto-created by Twenty (used as invoice title)
 */
export const INVOICE_CUSTOM_FIELD_SEEDS: FieldMetadataSeed[] = [
  {
    type: FieldMetadataType.TEXT,
    label: 'Invoice Number',
    name: 'invoiceNumber',
    icon: 'IconHash',
    description: 'Auto-generated: INV-YYYY-NNN format',
  },
  {
    type: FieldMetadataType.DATE,
    label: 'Invoice Date',
    name: 'invoiceDate',
    icon: 'IconCalendar',
  },
  {
    type: FieldMetadataType.DATE,
    label: 'Due Date',
    name: 'dueDate',
    icon: 'IconCalendarDue',
  },
  {
    type: FieldMetadataType.SELECT,
    label: 'Status',
    name: 'status',
    icon: 'IconStatusChange',
    options: [
      { label: 'Draft', value: 'DRAFT', position: 0, color: 'gray' },
      { label: 'Sent', value: 'SENT', position: 1, color: 'blue' },
      { label: 'Viewed', value: 'VIEWED', position: 2, color: 'purple' },
      { label: 'Partial', value: 'PARTIAL', position: 3, color: 'orange' },
      { label: 'Paid', value: 'PAID', position: 4, color: 'green' },
      { label: 'Overdue', value: 'OVERDUE', position: 5, color: 'red' },
      { label: 'Cancelled', value: 'CANCELLED', position: 6, color: 'gray' },
      { label: 'Refunded', value: 'REFUNDED', position: 7, color: 'yellow' },
    ],
    defaultValue: "'DRAFT'",
  },
  {
    type: FieldMetadataType.CURRENCY,
    label: 'Subtotal',
    name: 'subtotal',
    icon: 'IconSum',
    description: 'Sum of all line items before discounts/tax',
  },
  {
    type: FieldMetadataType.NUMBER,
    label: 'Discount Percentage',
    name: 'discountPercentage',
    icon: 'IconPercentage',
    settings: {
      decimals: 2,
      type: 'percentage',
    },
  },
  {
    type: FieldMetadataType.CURRENCY,
    label: 'Discount Amount',
    name: 'discountAmount',
    icon: 'IconDiscount2',
  },
  {
    type: FieldMetadataType.NUMBER,
    label: 'Tax Percentage',
    name: 'taxPercentage',
    icon: 'IconPercentage',
    settings: {
      decimals: 2,
      type: 'percentage',
    },
  },
  {
    type: FieldMetadataType.CURRENCY,
    label: 'Tax Amount',
    name: 'taxAmount',
    icon: 'IconReceipt2',
  },
  {
    type: FieldMetadataType.CURRENCY,
    label: 'Total',
    name: 'total',
    icon: 'IconCurrencyDollar',
    description: 'Computed: subtotal - discount + tax',
  },
  {
    type: FieldMetadataType.CURRENCY,
    label: 'Paid Amount',
    name: 'paidAmount',
    icon: 'IconCash',
    description: 'Total amount paid against this invoice',
  },
  {
    type: FieldMetadataType.CURRENCY,
    label: 'Balance Due',
    name: 'balanceDue',
    icon: 'IconCashBanknote',
    description: 'Computed: total - paidAmount',
  },
  {
    type: FieldMetadataType.RICH_TEXT,
    label: 'Notes',
    name: 'notes',
    icon: 'IconNotes',
    description: 'Customer-visible notes',
  },
  {
    type: FieldMetadataType.RICH_TEXT,
    label: 'Terms',
    name: 'terms',
    icon: 'IconFileText',
    description: 'Payment terms and conditions',
  },
  // Stripe Integration Fields
  {
    type: FieldMetadataType.TEXT,
    label: 'Stripe Invoice ID',
    name: 'stripeInvoiceId',
    icon: 'IconBrandStripe',
    description: 'Stripe invoice ID (inv_xxx)',
  },
  {
    type: FieldMetadataType.SELECT,
    label: 'Stripe Payment Status',
    name: 'stripePaymentStatus',
    icon: 'IconBrandStripe',
    options: [
      { label: 'Not Synced', value: 'NOT_SYNCED', position: 0, color: 'gray' },
      { label: 'Pending', value: 'PENDING', position: 1, color: 'yellow' },
      { label: 'Processing', value: 'PROCESSING', position: 2, color: 'blue' },
      { label: 'Succeeded', value: 'SUCCEEDED', position: 3, color: 'green' },
      { label: 'Failed', value: 'FAILED', position: 4, color: 'red' },
    ],
    defaultValue: "'NOT_SYNCED'",
  },
  {
    type: FieldMetadataType.LINKS,
    label: 'Stripe Payment Link',
    name: 'stripePaymentLink',
    icon: 'IconExternalLink',
    description: 'Hosted payment page URL',
  },
];
