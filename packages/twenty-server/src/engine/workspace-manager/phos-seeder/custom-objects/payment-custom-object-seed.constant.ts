import { type ObjectMetadataSeed } from 'src/engine/workspace-manager/dev-seeder/metadata/types/object-metadata-seed.type';

export const PAYMENT_CUSTOM_OBJECT_SEED: ObjectMetadataSeed = {
  labelPlural: 'Payments',
  labelSingular: 'Payment',
  namePlural: 'payments',
  nameSingular: 'payment',
  icon: 'IconCreditCard',
  description: 'Payments received against invoices with Stripe tracking',
};
