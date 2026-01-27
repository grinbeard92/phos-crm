import { FieldMetadataType } from 'twenty-shared/types';

import { type FieldMetadataSeed } from 'src/engine/workspace-manager/dev-seeder/metadata/types/field-metadata-seed.type';

/**
 * InvoiceLineItem fields per Epic 001 specification
 * Note: 'name' field is auto-created by Twenty (used as line item description)
 */
export const INVOICE_LINE_ITEM_CUSTOM_FIELD_SEEDS: FieldMetadataSeed[] = [
  {
    type: FieldMetadataType.NUMBER,
    label: 'Quantity',
    name: 'quantity',
    icon: 'IconStack2',
    settings: {
      decimals: 2,
    },
    defaultValue: 1,
  },
  {
    type: FieldMetadataType.CURRENCY,
    label: 'Unit Price',
    name: 'unitPrice',
    icon: 'IconCurrencyDollar',
  },
  {
    type: FieldMetadataType.CURRENCY,
    label: 'Subtotal',
    name: 'subtotal',
    icon: 'IconSum',
    description: 'Computed: quantity * unitPrice',
  },
  {
    type: FieldMetadataType.SELECT,
    label: 'Service Category',
    name: 'serviceCategory',
    icon: 'IconCategory',
    options: [
      { label: 'Consulting', value: 'CONSULTING', position: 0, color: 'blue' },
      {
        label: 'Development',
        value: 'DEVELOPMENT',
        position: 1,
        color: 'green',
      },
      { label: 'Design', value: 'DESIGN', position: 2, color: 'purple' },
      { label: 'Hardware', value: 'HARDWARE', position: 3, color: 'orange' },
      { label: 'Training', value: 'TRAINING', position: 4, color: 'yellow' },
      { label: 'Support', value: 'SUPPORT', position: 5, color: 'gray' },
      { label: 'Other', value: 'OTHER', position: 6, color: 'gray' },
    ],
  },
  {
    type: FieldMetadataType.NUMBER,
    label: 'Sort Order',
    name: 'sortOrder',
    icon: 'IconArrowsSort',
    description: 'Order of line items on the invoice',
  },
];
