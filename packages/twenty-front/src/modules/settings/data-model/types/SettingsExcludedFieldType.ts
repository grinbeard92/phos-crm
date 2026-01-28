import { type FieldType } from '@/settings/data-model/types/FieldType';
import { type PickLiteral } from '~/types/PickLiteral';

export type SettingsExcludedFieldType = PickLiteral<
  FieldType,
  | 'NUMERIC'
  | 'POSITION'
  | 'RICH_TEXT'
  | 'RICH_TEXT_V2'
  | 'TS_VECTOR'
>;
