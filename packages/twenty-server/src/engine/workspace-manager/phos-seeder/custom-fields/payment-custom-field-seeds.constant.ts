import { FieldMetadataType } from 'twenty-shared/types';

import { type FieldMetadataSeed } from 'src/engine/workspace-manager/dev-seeder/metadata/types/field-metadata-seed.type';

/**
 * Payment fields per Epic 001 specification
 * Includes Stripe integration fields for tracking charges
 * Note: 'name' field is auto-created by Twenty (used as payment reference)
 */
export const PAYMENT_CUSTOM_FIELD_SEEDS: FieldMetadataSeed[] = [
  {
    type: FieldMetadataType.DATE,
    label: 'Payment Date',
    name: 'paymentDate',
    icon: 'IconCalendar',
  },
  {
    type: FieldMetadataType.CURRENCY,
    label: 'Amount',
    name: 'amount',
    icon: 'IconCurrencyDollar',
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
      {
        label: 'ACH Transfer',
        value: 'ACH_TRANSFER',
        position: 2,
        color: 'purple',
      },
      {
        label: 'Wire Transfer',
        value: 'WIRE_TRANSFER',
        position: 3,
        color: 'orange',
      },
      { label: 'Check', value: 'CHECK', position: 4, color: 'gray' },
      { label: 'Cash', value: 'CASH', position: 5, color: 'gray' },
      { label: 'PayPal', value: 'PAYPAL', position: 6, color: 'blue' },
      { label: 'Stripe', value: 'STRIPE', position: 7, color: 'purple' },
      { label: 'Other', value: 'OTHER', position: 8, color: 'gray' },
    ],
  },
  {
    type: FieldMetadataType.TEXT,
    label: 'Reference Number',
    name: 'referenceNumber',
    icon: 'IconHash',
    description: 'Check number, transaction ID, etc.',
  },
  {
    type: FieldMetadataType.TEXT,
    label: 'Notes',
    name: 'notes',
    icon: 'IconNotes',
  },
  // Stripe Integration Fields
  {
    type: FieldMetadataType.TEXT,
    label: 'Stripe Payment ID',
    name: 'stripePaymentId',
    icon: 'IconBrandStripe',
    description: 'Stripe payment intent ID (pi_xxx)',
  },
  {
    type: FieldMetadataType.TEXT,
    label: 'Stripe Charge ID',
    name: 'stripeChargeId',
    icon: 'IconBrandStripe',
    description: 'Stripe charge ID (ch_xxx)',
  },
];
