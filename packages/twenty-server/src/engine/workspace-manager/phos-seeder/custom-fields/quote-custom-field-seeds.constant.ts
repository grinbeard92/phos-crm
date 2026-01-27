import { FieldMetadataType } from 'twenty-shared/types';

import { type FieldMetadataSeed } from 'src/engine/workspace-manager/dev-seeder/metadata/types/field-metadata-seed.type';

/**
 * Quote fields per Epic 001 specification
 * Note: 'name' field is auto-created by Twenty (used as quote title)
 */
export const QUOTE_CUSTOM_FIELD_SEEDS: FieldMetadataSeed[] = [
  {
    type: FieldMetadataType.TEXT,
    label: 'Quote Number',
    name: 'quoteNumber',
    icon: 'IconHash',
    description: 'Auto-generated: Q-YYYY-NNN format',
  },
  {
    type: FieldMetadataType.DATE,
    label: 'Quote Date',
    name: 'quoteDate',
    icon: 'IconCalendar',
  },
  {
    type: FieldMetadataType.DATE,
    label: 'Expiry Date',
    name: 'expiryDate',
    icon: 'IconCalendarEvent',
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
      { label: 'Accepted', value: 'ACCEPTED', position: 3, color: 'green' },
      { label: 'Declined', value: 'DECLINED', position: 4, color: 'red' },
      { label: 'Expired', value: 'EXPIRED', position: 5, color: 'orange' },
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
    type: FieldMetadataType.RICH_TEXT,
    label: 'Notes',
    name: 'notes',
    icon: 'IconNotes',
    description: 'Customer-visible notes',
  },
  {
    type: FieldMetadataType.TEXT,
    label: 'Internal Notes',
    name: 'internalNotes',
    icon: 'IconLock',
    description: 'Internal notes (not visible to customer)',
  },
  {
    type: FieldMetadataType.RICH_TEXT,
    label: 'Terms',
    name: 'terms',
    icon: 'IconFileText',
    description: 'Terms and conditions',
  },
  {
    type: FieldMetadataType.NUMBER,
    label: 'Version',
    name: 'version',
    icon: 'IconVersions',
    defaultValue: 1,
  },
];
