import styled from '@emotion/styled';
import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react/macro';
import { Controller, useFormContext } from 'react-hook-form';
import { z } from 'zod';

import { useFilteredObjectMetadataItems } from '@/object-metadata/hooks/useFilteredObjectMetadataItems';
import { useFieldMetadataItemById } from '@/object-metadata/hooks/useFieldMetadataItemById';
import { Separator } from '@/settings/components/Separator';
import { SettingsOptionCardContentSelect } from '@/settings/components/SettingsOptions/SettingsOptionCardContentSelect';
import { Select } from '@/ui/input/components/Select';
import { TextArea } from '@/ui/input/components/TextArea';
import { IconEye } from 'twenty-ui/display';
import { Tag } from 'twenty-ui/components';
import { FieldMetadataType } from '~/generated-metadata/graphql';

const CALCULATED_RETURN_TYPE_OPTIONS = [
  { label: msg`Number`, value: 'NUMBER' },
  { label: msg`Text`, value: 'TEXT' },
  { label: msg`True/False`, value: 'BOOLEAN' },
  { label: msg`Date`, value: 'DATE' },
  { label: msg`Date and Time`, value: 'DATE_TIME' },
] as const;

const EXCLUDED_FIELD_TYPES: FieldMetadataType[] = [
  FieldMetadataType.RELATION,
  FieldMetadataType.MORPH_RELATION,
  FieldMetadataType.CALCULATED,
  FieldMetadataType.TS_VECTOR,
  FieldMetadataType.ACTOR,
  FieldMetadataType.RICH_TEXT,
  FieldMetadataType.RICH_TEXT_V2,
];

export const settingsDataModelFieldCalculatedFormSchema = z.object({
  settings: z.object({
    formula: z.string().min(1, 'Formula is required'),
    returnType: z.enum(['NUMBER', 'TEXT', 'BOOLEAN', 'DATE', 'DATE_TIME']),
  }),
});

export type SettingsDataModelFieldCalculatedFormValues = z.infer<
  typeof settingsDataModelFieldCalculatedFormSchema
>;

const StyledFormulaSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing(2)};
  padding: ${({ theme }) => theme.spacing(4)};
  background-color: ${({ theme }) => theme.background.secondary};
`;

const StyledFormulaLabel = styled.div`
  color: ${({ theme }) => theme.font.color.primary};
  font-weight: ${({ theme }) => theme.font.weight.medium};
  margin-bottom: ${({ theme }) => theme.spacing(1)};
`;

const StyledFormulaDescription = styled.div`
  color: ${({ theme }) => theme.font.color.tertiary};
  font-size: ${({ theme }) => theme.font.size.sm};
`;

const StyledFieldChipsContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing(1)};
`;

const StyledClickableTag = styled.div`
  cursor: pointer;
  &:hover {
    opacity: 0.8;
  }
`;

type SettingsDataModelFieldCalculatedFormProps = {
  disabled?: boolean;
  existingFieldMetadataId: string;
  objectNameSingular: string;
};

export const SettingsDataModelFieldCalculatedForm = ({
  disabled,
  existingFieldMetadataId,
  objectNameSingular,
}: SettingsDataModelFieldCalculatedFormProps) => {
  const { t } = useLingui();
  const { control } = useFormContext<SettingsDataModelFieldCalculatedFormValues>();

  const { fieldMetadataItem } = useFieldMetadataItemById(
    existingFieldMetadataId,
  );

  const { objectMetadataItems } = useFilteredObjectMetadataItems();
  const objectMetadataItem = objectMetadataItems.find(
    (item) => item.nameSingular === objectNameSingular,
  );

  const availableFields =
    objectMetadataItem?.fields.filter(
      (f) =>
        f.isActive &&
        !f.isSystem &&
        !EXCLUDED_FIELD_TYPES.includes(f.type as FieldMetadataType),
    ) ?? [];

  return (
    <Controller
      name="settings"
      defaultValue={{
        formula: fieldMetadataItem?.settings?.formula ?? '',
        returnType: fieldMetadataItem?.settings?.returnType ?? 'NUMBER',
      }}
      control={control}
      render={({ field: { onChange, value } }) => {
        const formula = value?.formula ?? '';
        const returnType = value?.returnType ?? 'NUMBER';

        const insertFieldReference = (fieldName: string) => {
          const ref = `{{${fieldName}}}`;
          const needsSpace = formula.length > 0 && !formula.endsWith(' ');
          const newFormula = formula + (needsSpace ? ' ' : '') + ref;

          onChange({ ...value, formula: newFormula });
        };

        return (
          <>
            <SettingsOptionCardContentSelect
              Icon={IconEye}
              title={t`Return type`}
              description={t`The data type of the calculated result`}
            >
              <Select<string>
                selectSizeVariant="small"
                dropdownId="calculated-return-type"
                dropdownWidth={140}
                value={returnType}
                onChange={(newReturnType) =>
                  onChange({ ...value, returnType: newReturnType })
                }
                disabled={disabled}
                needIconCheck={false}
                options={CALCULATED_RETURN_TYPE_OPTIONS.map((option) => ({
                  ...option,
                  label: t(option.label),
                }))}
              />
            </SettingsOptionCardContentSelect>
            <Separator />
            <StyledFormulaSection>
              <div>
                <StyledFormulaLabel>{t`Formula`}</StyledFormulaLabel>
                <StyledFormulaDescription>
                  {t`Use {{fieldName}} to reference fields. Example: {{quantity}} * {{unitPrice}}`}
                </StyledFormulaDescription>
              </div>
              <TextArea
                textAreaId="calculated-formula"
                placeholder="{{mileage}} * {{mileageRate}}"
                value={formula}
                onChange={(newFormula) =>
                  onChange({ ...value, formula: newFormula })
                }
                disabled={disabled}
                minRows={2}
              />
              {availableFields.length > 0 && (
                <>
                  <StyledFormulaDescription>
                    {t`Click a field to insert it into the formula:`}
                  </StyledFormulaDescription>
                  <StyledFieldChipsContainer>
                    {availableFields.map((field) => (
                      <StyledClickableTag
                        key={field.id}
                        onClick={() => insertFieldReference(field.name)}
                      >
                        <Tag
                          text={field.label}
                          color="blue"
                        />
                      </StyledClickableTag>
                    ))}
                  </StyledFieldChipsContainer>
                </>
              )}
            </StyledFormulaSection>
          </>
        );
      }}
    />
  );
};
