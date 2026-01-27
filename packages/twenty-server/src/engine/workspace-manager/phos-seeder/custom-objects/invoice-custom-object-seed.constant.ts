import { type ObjectMetadataSeed } from 'src/engine/workspace-manager/dev-seeder/metadata/types/object-metadata-seed.type';

export const INVOICE_CUSTOM_OBJECT_SEED: ObjectMetadataSeed = {
  labelPlural: 'Invoices',
  labelSingular: 'Invoice',
  namePlural: 'invoices',
  nameSingular: 'invoice',
  icon: 'IconFileInvoice',
  description: 'Invoices for billing customers with Stripe integration',
};
