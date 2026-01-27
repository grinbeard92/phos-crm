import { useEmailTemplates } from '@/email-composer/hooks/useEmailTemplates';
import { type EmailTemplateOption } from '@/email-composer/types/EmailComposerTypes';
import { Select } from '@/ui/input/components/Select';
import { GenericDropdownContentWidth } from '@/ui/layout/dropdown/constants/GenericDropdownContentWidth';
import styled from '@emotion/styled';
import { useTheme } from '@emotion/react';
import { t } from '@lingui/core/macro';
import { Trans } from '@lingui/react/macro';
import { type SelectOption } from 'twenty-ui/input';

const StyledNoTemplatesMessage = styled.div`
  color: ${({ theme }) => theme.font.color.tertiary};
  font-size: ${({ theme }) => theme.font.size.sm};
  padding: ${({ theme }) => theme.spacing(2, 0)};
`;

const StyledLabel = styled.span`
  color: ${({ theme }) => theme.font.color.light};
  display: block;
  font-size: ${({ theme }) => theme.font.size.xs};
  font-weight: ${({ theme }) => theme.font.weight.semiBold};
  margin-bottom: ${({ theme }) => theme.spacing(1)};
`;

type EmailTemplateSelectorProps = {
  value: string | null;
  onChange: (template: EmailTemplateOption | null) => void;
  disabled?: boolean;
};

export const EmailTemplateSelector = ({
  value,
  onChange,
  disabled = false,
}: EmailTemplateSelectorProps) => {
  const theme = useTheme();
  const { templates, loading } = useEmailTemplates();

  const templateOptions: SelectOption<string | null>[] = templates.map(
    (template) => ({
      label: template.name,
      value: template.id,
    }),
  );

  const handleChange = (templateId: string | null) => {
    if (templateId === null) {
      onChange(null);
      return;
    }

    const selectedTemplate = templates.find((tmpl) => tmpl.id === templateId);
    onChange(selectedTemplate ?? null);
  };

  if (loading) {
    return null;
  }

  // Show message when no templates exist
  if (templates.length === 0) {
    return (
      <div>
        <StyledLabel>{t`Template`}</StyledLabel>
        <StyledNoTemplatesMessage>
          <Trans>
            No templates available. Create templates in Settings → Accounts →
            Email Composer.
          </Trans>
        </StyledNoTemplatesMessage>
      </div>
    );
  }

  return (
    <Select
      dropdownId="email-template-selector"
      label={t`Template`}
      fullWidth
      emptyOption={{ label: t`No template`, value: null }}
      value={value}
      options={templateOptions}
      onChange={handleChange}
      disabled={disabled}
      dropdownOffset={{ y: parseInt(theme.spacing(1), 10) }}
      dropdownWidth={GenericDropdownContentWidth.ExtraLarge}
    />
  );
};
