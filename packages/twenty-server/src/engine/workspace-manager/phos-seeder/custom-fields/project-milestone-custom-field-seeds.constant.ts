import { FieldMetadataType } from 'twenty-shared/types';

import { type FieldMetadataSeed } from 'src/engine/workspace-manager/dev-seeder/metadata/types/field-metadata-seed.type';

/**
 * ProjectMilestone fields per Epic 001 specification
 * Gantt-ready with start/end dates for task bar rendering
 * Note: 'name' field is auto-created by Twenty
 */
export const PROJECT_MILESTONE_CUSTOM_FIELD_SEEDS: FieldMetadataSeed[] = [
  {
    type: FieldMetadataType.RICH_TEXT,
    label: 'Description',
    name: 'description',
    icon: 'IconAlignLeft',
  },
  {
    type: FieldMetadataType.DATE_TIME,
    label: 'Start Date',
    name: 'startDate',
    icon: 'IconCalendar',
    description: 'Gantt chart: task bar start position',
  },
  {
    type: FieldMetadataType.DATE_TIME,
    label: 'End Date',
    name: 'endDate',
    icon: 'IconCalendarEvent',
    description: 'Gantt chart: task bar end position',
  },
  {
    type: FieldMetadataType.DATE_TIME,
    label: 'Due Date',
    name: 'dueDate',
    icon: 'IconCalendarDue',
    description: 'User-facing deadline for the milestone',
  },
  {
    type: FieldMetadataType.DATE_TIME,
    label: 'Completed Date',
    name: 'completedDate',
    icon: 'IconCalendarCheck',
  },
  {
    type: FieldMetadataType.SELECT,
    label: 'Status',
    name: 'status',
    icon: 'IconStatusChange',
    options: [
      {
        label: 'Not Started',
        value: 'NOT_STARTED',
        position: 0,
        color: 'gray',
      },
      {
        label: 'In Progress',
        value: 'IN_PROGRESS',
        position: 1,
        color: 'blue',
      },
      { label: 'Completed', value: 'COMPLETED', position: 2, color: 'green' },
      { label: 'Blocked', value: 'BLOCKED', position: 3, color: 'red' },
    ],
    defaultValue: "'NOT_STARTED'",
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
    type: FieldMetadataType.NUMBER,
    label: 'Sort Order',
    name: 'sortOrder',
    icon: 'IconArrowsSort',
    description: 'For ordering milestones in Gantt view',
  },
];
