import { FieldMetadataType, NumberDataType } from 'twenty-shared/types';

import { type FieldMetadataSeed } from 'src/engine/workspace-manager/dev-seeder/metadata/types/field-metadata-seed.type';

/**
 * Mileage Log fields for business travel tracking
 * Note: 'name' field is auto-created by Twenty (used as trip purpose)
 *
 * IRS Standard Mileage Rates (2026): $0.70/mile for business
 * The reimbursementAmount is calculated as: mileage * mileageRate
 * This calculation should be handled via a workflow trigger on record create/update
 */
export const MILEAGE_CUSTOM_FIELD_SEEDS: FieldMetadataSeed[] = [
  {
    type: FieldMetadataType.ADDRESS,
    label: 'From',
    name: 'fromAddress',
    icon: 'IconMapPinOff',
    description: 'Starting location of the trip',
  },
  {
    type: FieldMetadataType.ADDRESS,
    label: 'To',
    name: 'toAddress',
    icon: 'IconMapPin',
    description: 'Destination of the trip',
  },
  {
    type: FieldMetadataType.DATE,
    label: 'Trip Date',
    name: 'tripDate',
    icon: 'IconCalendar',
    description: 'Date of the trip',
  },
  {
    type: FieldMetadataType.NUMBER,
    label: 'Mileage',
    name: 'mileage',
    icon: 'IconRoute',
    description: 'Total miles traveled (one-way or round-trip)',
    settings: {
      dataType: NumberDataType.FLOAT,
      decimals: 2,
    },
  },
  {
    type: FieldMetadataType.NUMBER,
    label: 'Mileage Rate',
    name: 'mileageRate',
    icon: 'IconCurrencyDollar',
    description:
      'Reimbursement rate per mile (defaults to current IRS standard rate)',
    settings: {
      dataType: NumberDataType.FLOAT,
      decimals: 4,
    },
    defaultValue: 0.7, // 2026 IRS standard mileage rate
  },
  {
    type: FieldMetadataType.CURRENCY,
    label: 'Reimbursement Amount',
    name: 'reimbursementAmount',
    icon: 'IconCash',
    description: 'Calculated reimbursement (mileage × rate)',
  },
  {
    type: FieldMetadataType.BOOLEAN,
    label: 'Round Trip',
    name: 'roundTrip',
    icon: 'IconArrowsExchange',
    description: 'Whether this was a round trip (doubles mileage for calc)',
    defaultValue: false,
  },
  {
    type: FieldMetadataType.SELECT,
    label: 'Purpose',
    name: 'purpose',
    icon: 'IconBriefcase',
    description: 'Business purpose of the trip',
    options: [
      { label: 'Client Meeting', value: 'CLIENT_MEETING', position: 0, color: 'blue' },
      { label: 'Site Visit', value: 'SITE_VISIT', position: 1, color: 'green' },
      { label: 'Delivery', value: 'DELIVERY', position: 2, color: 'orange' },
      { label: 'Supplies Pickup', value: 'SUPPLIES_PICKUP', position: 3, color: 'purple' },
      { label: 'Conference', value: 'CONFERENCE', position: 4, color: 'yellow' },
      { label: 'Training', value: 'TRAINING', position: 5, color: 'pink' },
      { label: 'Other', value: 'OTHER', position: 6, color: 'gray' },
    ],
  },
  {
    type: FieldMetadataType.TEXT,
    label: 'Notes',
    name: 'notes',
    icon: 'IconNotes',
    description: 'Additional notes about the trip',
  },
];
