import { useNumberFormat } from '@/localization/hooks/useNumberFormat';
import { useCalculatedFieldDisplay } from '@/object-record/record-field/ui/meta-types/hooks/useCalculatedFieldDisplay';
import { EllipsisDisplay } from '@/ui/field/display/components/EllipsisDisplay';
import { NumberDisplay } from '@/ui/field/display/components/NumberDisplay';
import { isDefined } from 'twenty-shared/utils';

export const CalculatedFieldDisplay = () => {
  const { fieldValue, fieldDefinition } = useCalculatedFieldDisplay();
  const returnType = fieldDefinition.metadata.settings?.returnType;
  const { formatNumber } = useNumberFormat();

  if (!isDefined(fieldValue)) {
    return <NumberDisplay value={null} />;
  }

  if (returnType === 'NUMBER') {
    const numericValue = Number(fieldValue);

    if (isNaN(numericValue)) {
      return <NumberDisplay value={null} />;
    }

    return <NumberDisplay value={formatNumber(numericValue)} />;
  }

  if (returnType === 'BOOLEAN') {
    return <EllipsisDisplay>{fieldValue ? 'True' : 'False'}</EllipsisDisplay>;
  }

  return <EllipsisDisplay>{String(fieldValue)}</EllipsisDisplay>;
};
