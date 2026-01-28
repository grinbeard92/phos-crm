import { FieldMetadataType } from 'twenty-shared/types';

import { type FieldMetadataSeed } from 'src/engine/workspace-manager/dev-seeder/metadata/types/field-metadata-seed.type';

export const EMAIL_TEMPLATE_CUSTOM_FIELD_SEEDS: FieldMetadataSeed[] = [
  {
    name: 'templateName',
    label: 'Template Name',
    type: FieldMetadataType.TEXT,
    description: 'Name of the email template',
    icon: 'IconTag',
  },
  {
    name: 'subject',
    label: 'Subject',
    type: FieldMetadataType.TEXT,
    description: 'Email subject line (supports variables like {{firstName}})',
    icon: 'IconTextCaption',
  },
  {
    name: 'body',
    label: 'Body',
    type: FieldMetadataType.RICH_TEXT,
    description: 'Email body content (supports variables)',
    icon: 'IconFileText',
  },
  {
    name: 'category',
    label: 'Category',
    type: FieldMetadataType.SELECT,
    description: 'Template category for organization',
    icon: 'IconCategory',
    options: [
      { value: 'SALES', label: 'Sales', color: 'blue', position: 0 },
      { value: 'FOLLOW_UP', label: 'Follow-up', color: 'green', position: 1 },
      { value: 'QUOTE', label: 'Quote', color: 'orange', position: 2 },
      { value: 'INVOICE', label: 'Invoice', color: 'purple', position: 3 },
      { value: 'SUPPORT', label: 'Support', color: 'yellow', position: 4 },
      { value: 'GENERAL', label: 'General', color: 'gray', position: 5 },
    ],
  },
  {
    name: 'isActive',
    label: 'Active',
    type: FieldMetadataType.BOOLEAN,
    description: 'Whether this template is active and available for use',
    icon: 'IconToggleRight',
    defaultValue: true,
  },
  {
    name: 'variables',
    label: 'Available Variables',
    type: FieldMetadataType.TEXT,
    description:
      'JSON array of variable names available in this template (e.g., ["firstName", "companyName"])',
    icon: 'IconVariable',
  },
];
