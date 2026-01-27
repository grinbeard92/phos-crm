import { FieldMetadataType } from 'twenty-shared/types';

import { type FieldMetadataSeed } from 'src/engine/workspace-manager/dev-seeder/metadata/types/field-metadata-seed.type';

/**
 * Project object fields per Epic 001 specification
 * Note: 'name' field is auto-created by Twenty
 */
export const PROJECT_CUSTOM_FIELD_SEEDS: FieldMetadataSeed[] = [
  {
    type: FieldMetadataType.RICH_TEXT,
    label: 'Description',
    name: 'description',
    icon: 'IconAlignLeft',
  },
  {
    type: FieldMetadataType.SELECT,
    label: 'Status',
    name: 'status',
    icon: 'IconStatusChange',
    options: [
      { label: 'Draft', value: 'DRAFT', position: 0, color: 'gray' },
      { label: 'Planning', value: 'PLANNING', position: 1, color: 'blue' },
      { label: 'Active', value: 'ACTIVE', position: 2, color: 'green' },
      { label: 'On Hold', value: 'ON_HOLD', position: 3, color: 'yellow' },
      { label: 'Completed', value: 'COMPLETED', position: 4, color: 'purple' },
      { label: 'Cancelled', value: 'CANCELLED', position: 5, color: 'red' },
    ],
    defaultValue: "'DRAFT'",
  },
  {
    type: FieldMetadataType.SELECT,
    label: 'Priority',
    name: 'priority',
    icon: 'IconFlag',
    options: [
      { label: 'Low', value: 'LOW', position: 0, color: 'gray' },
      { label: 'Medium', value: 'MEDIUM', position: 1, color: 'blue' },
      { label: 'High', value: 'HIGH', position: 2, color: 'orange' },
      { label: 'Critical', value: 'CRITICAL', position: 3, color: 'red' },
    ],
    defaultValue: "'MEDIUM'",
  },
  {
    type: FieldMetadataType.DATE_TIME,
    label: 'Start Date',
    name: 'startDate',
    icon: 'IconCalendar',
  },
  {
    type: FieldMetadataType.DATE_TIME,
    label: 'End Date',
    name: 'endDate',
    icon: 'IconCalendarEvent',
  },
  {
    type: FieldMetadataType.CURRENCY,
    label: 'Budget',
    name: 'budget',
    icon: 'IconCurrencyDollar',
  },
  {
    type: FieldMetadataType.CURRENCY,
    label: 'Actual Cost',
    name: 'actualCost',
    icon: 'IconCash',
  },
  {
    type: FieldMetadataType.NUMBER,
    label: 'Progress Percentage',
    name: 'progressPercentage',
    icon: 'IconPercentage',
    settings: {
      decimals: 0,
      type: 'percentage',
    },
  },
  {
    type: FieldMetadataType.SELECT,
    label: 'Project Type',
    name: 'projectType',
    icon: 'IconCategory',
    options: [
      { label: 'Consulting', value: 'CONSULTING', position: 0, color: 'blue' },
      {
        label: 'Software Development',
        value: 'SOFTWARE_DEVELOPMENT',
        position: 1,
        color: 'green',
      },
      {
        label: 'Laser Engraving',
        value: 'LASER_ENGRAVING',
        position: 2,
        color: 'purple',
      },
      {
        label: 'Technical Training',
        value: 'TECHNICAL_TRAINING',
        position: 3,
        color: 'orange',
      },
      { label: 'Internal', value: 'INTERNAL', position: 4, color: 'gray' },
    ],
  },
];
