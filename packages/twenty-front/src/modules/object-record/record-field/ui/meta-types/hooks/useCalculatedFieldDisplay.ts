import { useContext } from 'react';

import { FieldMetadataType } from '~/generated-metadata/graphql';

import { useRecordFieldValue } from '@/object-record/record-store/hooks/useRecordFieldValue';
import { FieldContext } from '@/object-record/record-field/ui/contexts/FieldContext';
import { assertFieldMetadata } from '@/object-record/record-field/ui/types/guards/assertFieldMetadata';
import { isFieldCalculated } from '@/object-record/record-field/ui/types/guards/isFieldCalculated';

export const useCalculatedFieldDisplay = () => {
  const { recordId, fieldDefinition } = useContext(FieldContext);

  assertFieldMetadata(
    FieldMetadataType.CALCULATED,
    isFieldCalculated,
    fieldDefinition,
  );

  const fieldName = fieldDefinition.metadata.fieldName;
  const fieldValue = useRecordFieldValue<string | number | boolean | null>(
    recordId,
    fieldName,
    fieldDefinition,
  );

  return {
    fieldDefinition,
    fieldValue,
  };
};
