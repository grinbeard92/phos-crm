import { FieldMetadataType } from 'twenty-shared/types';

import { type FieldMetadataSeed } from 'src/engine/workspace-manager/dev-seeder/metadata/types/field-metadata-seed.type';

/**
 * ExpenseCategory fields per Epic 001 specification
 * Note: 'name' field is auto-created by Twenty
 */
export const EXPENSE_CATEGORY_CUSTOM_FIELD_SEEDS: FieldMetadataSeed[] = [
  {
    type: FieldMetadataType.TEXT,
    label: 'Description',
    name: 'description',
    icon: 'IconAlignLeft',
  },
  {
    type: FieldMetadataType.SELECT,
    label: 'Tax Category',
    name: 'taxCategory',
    icon: 'IconReceipt2',
    options: [
      {
        label: 'Office Supplies',
        value: 'OFFICE_SUPPLIES',
        position: 0,
        color: 'blue',
      },
      { label: 'Travel', value: 'TRAVEL', position: 1, color: 'green' },
      { label: 'Meals', value: 'MEALS', position: 2, color: 'orange' },
      { label: 'Equipment', value: 'EQUIPMENT', position: 3, color: 'purple' },
      { label: 'Software', value: 'SOFTWARE', position: 4, color: 'blue' },
      {
        label: 'Professional Services',
        value: 'PROFESSIONAL_SERVICES',
        position: 5,
        color: 'gray',
      },
      { label: 'Marketing', value: 'MARKETING', position: 6, color: 'red' },
      { label: 'Utilities', value: 'UTILITIES', position: 7, color: 'yellow' },
      { label: 'Insurance', value: 'INSURANCE', position: 8, color: 'purple' },
      { label: 'Other', value: 'OTHER', position: 9, color: 'gray' },
    ],
  },
  {
    type: FieldMetadataType.TEXT,
    label: 'Color',
    name: 'color',
    icon: 'IconPalette',
    description: 'Hex color code for UI display',
    defaultValue: "'#3B82F6'",
  },
  {
    type: FieldMetadataType.BOOLEAN,
    label: 'Is Active',
    name: 'isActive',
    icon: 'IconToggleLeft',
    defaultValue: true,
  },
];
