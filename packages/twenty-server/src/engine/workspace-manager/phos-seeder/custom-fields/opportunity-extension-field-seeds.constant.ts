import {
  type FieldMetadataComplexOption,
  FieldMetadataType,
  NumberDataType,
} from 'twenty-shared/types';

import { type FieldMetadataSeed } from 'src/engine/workspace-manager/dev-seeder/metadata/types/field-metadata-seed.type';

/**
 * Custom fields to add to the standard Opportunity object
 * These are Priority 1 fields from the PRD for sales acceleration
 */
export const OPPORTUNITY_EXTENSION_FIELD_SEEDS: FieldMetadataSeed[] = [
  {
    name: 'salesGuidance',
    label: 'Sales Guidance',
    type: FieldMetadataType.RICH_TEXT,
    description:
      'Stage-specific sales tips, discovery questions, and objection handling scripts',
    icon: 'IconBulb',
  },
  {
    name: 'leadSource',
    label: 'Lead Source',
    type: FieldMetadataType.SELECT,
    description: 'How this lead was acquired - for attribution tracking',
    icon: 'IconTarget',
    options: [
      { value: 'REFERRAL', label: 'Referral', color: 'green', position: 0 },
      { value: 'WEBSITE', label: 'Website', color: 'blue', position: 1 },
      { value: 'LINKEDIN', label: 'LinkedIn', color: 'sky', position: 2 },
      {
        value: 'COLD_OUTREACH',
        label: 'Cold Outreach',
        color: 'orange',
        position: 3,
      },
      {
        value: 'CONFERENCE',
        label: 'Conference',
        color: 'purple',
        position: 4,
      },
      {
        value: 'EXISTING_CUSTOMER',
        label: 'Existing Customer',
        color: 'yellow',
        position: 5,
      },
      { value: 'OTHER', label: 'Other', color: 'gray', position: 6 },
    ] as FieldMetadataComplexOption[],
  },
  {
    name: 'daysInStage',
    label: 'Days in Stage',
    type: FieldMetadataType.NUMBER,
    description:
      'Number of days the opportunity has been in current stage - for stall detection',
    icon: 'IconClock',
    settings: {
      dataType: NumberDataType.INT,
    },
  },
];
