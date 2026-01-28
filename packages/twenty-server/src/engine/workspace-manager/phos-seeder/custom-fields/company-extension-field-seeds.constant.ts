import { FieldMetadataType } from 'twenty-shared/types';

import { type FieldMetadataSeed } from 'src/engine/workspace-manager/dev-seeder/metadata/types/field-metadata-seed.type';

/**
 * Custom fields to add to the standard Company object
 * These are Stripe integration fields for Epic 003
 */
export const COMPANY_EXTENSION_FIELD_SEEDS: FieldMetadataSeed[] = [
  {
    name: 'stripeCustomerId',
    label: 'Stripe Customer ID',
    type: FieldMetadataType.TEXT,
    description: 'Stripe Customer ID for payment integration (cus_xxx)',
    icon: 'IconCreditCard',
  },
  {
    name: 'stripeDefaultPaymentMethod',
    label: 'Default Payment Method',
    type: FieldMetadataType.TEXT,
    description: 'Stripe payment method ID for default payments (pm_xxx)',
    icon: 'IconWallet',
  },
];
