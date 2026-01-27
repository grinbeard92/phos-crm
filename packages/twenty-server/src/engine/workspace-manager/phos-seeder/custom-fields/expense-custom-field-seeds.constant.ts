import { FieldMetadataType } from 'twenty-shared/types';

import { type FieldMetadataSeed } from 'src/engine/workspace-manager/dev-seeder/metadata/types/field-metadata-seed.type';

/**
 * Expense fields per Epic 001 specification
 * Note: 'name' field is auto-created by Twenty (used as expense description)
 */
export const EXPENSE_CUSTOM_FIELD_SEEDS: FieldMetadataSeed[] = [
  {
    type: FieldMetadataType.DATE,
    label: 'Date',
    name: 'date',
    icon: 'IconCalendar',
  },
  {
    type: FieldMetadataType.CURRENCY,
    label: 'Amount',
    name: 'amount',
    icon: 'IconCurrencyDollar',
  },
  {
    type: FieldMetadataType.TEXT,
    label: 'Vendor',
    name: 'vendor',
    icon: 'IconBuildingStore',
  },
  {
    type: FieldMetadataType.SELECT,
    label: 'Payment Method',
    name: 'paymentMethod',
    icon: 'IconCreditCard',
    options: [
      {
        label: 'Credit Card',
        value: 'CREDIT_CARD',
        position: 0,
        color: 'blue',
      },
      { label: 'Debit Card', value: 'DEBIT_CARD', position: 1, color: 'green' },
      { label: 'Cash', value: 'CASH', position: 2, color: 'gray' },
      { label: 'Check', value: 'CHECK', position: 3, color: 'purple' },
      {
        label: 'Bank Transfer',
        value: 'BANK_TRANSFER',
        position: 4,
        color: 'orange',
      },
      { label: 'PayPal', value: 'PAYPAL', position: 5, color: 'blue' },
      { label: 'Venmo', value: 'VENMO', position: 6, color: 'blue' },
      { label: 'Other', value: 'OTHER', position: 7, color: 'gray' },
    ],
  },
  {
    type: FieldMetadataType.BOOLEAN,
    label: 'Tax Deductible',
    name: 'taxDeductible',
    icon: 'IconReceipt',
    defaultValue: true,
  },
  {
    type: FieldMetadataType.BOOLEAN,
    label: 'Billable',
    name: 'billable',
    icon: 'IconFileInvoice',
    description: 'Whether this expense can be billed to a client',
    defaultValue: false,
  },
  {
    type: FieldMetadataType.SELECT,
    label: 'Status',
    name: 'status',
    icon: 'IconStatusChange',
    options: [
      { label: 'Draft', value: 'DRAFT', position: 0, color: 'gray' },
      {
        label: 'Pending Approval',
        value: 'PENDING_APPROVAL',
        position: 1,
        color: 'yellow',
      },
      { label: 'Approved', value: 'APPROVED', position: 2, color: 'green' },
      { label: 'Rejected', value: 'REJECTED', position: 3, color: 'red' },
      {
        label: 'Reimbursed',
        value: 'REIMBURSED',
        position: 4,
        color: 'purple',
      },
    ],
    defaultValue: "'DRAFT'",
  },
  {
    type: FieldMetadataType.TEXT,
    label: 'Notes',
    name: 'notes',
    icon: 'IconNotes',
  },
];
