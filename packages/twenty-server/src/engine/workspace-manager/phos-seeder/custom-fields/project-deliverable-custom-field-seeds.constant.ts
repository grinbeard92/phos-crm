import { FieldMetadataType } from 'twenty-shared/types';

import { type FieldMetadataSeed } from 'src/engine/workspace-manager/dev-seeder/metadata/types/field-metadata-seed.type';

/**
 * ProjectDeliverable fields per Epic 001 specification
 * Note: 'name' field is auto-created by Twenty
 */
export const PROJECT_DELIVERABLE_CUSTOM_FIELD_SEEDS: FieldMetadataSeed[] = [
  {
    type: FieldMetadataType.RICH_TEXT,
    label: 'Description',
    name: 'description',
    icon: 'IconAlignLeft',
  },
  {
    type: FieldMetadataType.DATE_TIME,
    label: 'Delivery Date',
    name: 'deliveryDate',
    icon: 'IconCalendarEvent',
  },
  {
    type: FieldMetadataType.SELECT,
    label: 'Approval Status',
    name: 'approvalStatus',
    icon: 'IconChecks',
    options: [
      { label: 'Pending', value: 'PENDING', position: 0, color: 'gray' },
      { label: 'In Review', value: 'IN_REVIEW', position: 1, color: 'blue' },
      { label: 'Approved', value: 'APPROVED', position: 2, color: 'green' },
      { label: 'Rejected', value: 'REJECTED', position: 3, color: 'red' },
      {
        label: 'Needs Revision',
        value: 'NEEDS_REVISION',
        position: 4,
        color: 'orange',
      },
    ],
    defaultValue: "'PENDING'",
  },
  {
    type: FieldMetadataType.TEXT,
    label: 'Version',
    name: 'version',
    icon: 'IconVersions',
    defaultValue: "'1.0'",
  },
  {
    type: FieldMetadataType.NUMBER,
    label: 'Sort Order',
    name: 'sortOrder',
    icon: 'IconArrowsSort',
  },
];
