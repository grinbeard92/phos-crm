import { type ObjectMetadataSeed } from 'src/engine/workspace-manager/dev-seeder/metadata/types/object-metadata-seed.type';

export const EMAIL_TEMPLATE_CUSTOM_OBJECT_SEED: ObjectMetadataSeed = {
  nameSingular: 'emailTemplate',
  namePlural: 'emailTemplates',
  labelSingular: 'Email Template',
  labelPlural: 'Email Templates',
  description: 'Reusable email templates with variable substitution',
  icon: 'IconMail',
  isLabelSyncedWithName: false,
};
