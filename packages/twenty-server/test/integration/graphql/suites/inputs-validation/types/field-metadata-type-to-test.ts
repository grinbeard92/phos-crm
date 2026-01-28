import { type FieldMetadataType } from 'twenty-shared/types';

type FieldMetadataTypesNotTestedForFilterInputValidation =
  | 'TS_VECTOR'
  | 'RICH_TEXT'
  | 'POSITION'
  | 'ACTOR'
  | 'NUMERIC'
  | 'RICH_TEXT_V2'
  | 'CALCULATED'; // CALCULATED fields are read-only

type FieldMetadataTypesNotTestedForCreateInputValidation =
  | 'TS_VECTOR'
  | 'ACTOR'
  | 'NUMERIC'
  | 'CALCULATED'; // CALCULATED fields are read-only

export type FieldMetadataTypesToTestForCreateInputValidation = Exclude<
  FieldMetadataType,
  FieldMetadataTypesNotTestedForCreateInputValidation
>;

export type FieldMetadataTypesToTestForFilterInputValidation = Exclude<
  FieldMetadataType,
  FieldMetadataTypesNotTestedForFilterInputValidation
>;
