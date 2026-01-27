import { useEmailTemplates } from '@/email-composer/hooks/useEmailTemplates';
import { type EmailTemplateOption } from '@/email-composer/types/EmailComposerTypes';
import { Select } from '@/ui/input/components/Select';
import { GenericDropdownContentWidth } from '@/ui/layout/dropdown/constants/GenericDropdownContentWidth';
import { useTheme } from '@emotion/react';
import { t } from '@lingui/core/macro';
import { type SelectOption } from 'twenty-ui/input';

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
    if (!templateId) {
      onChange(null);
      return;
    }

    const selectedTemplate = templates.find((t) => t.id === templateId);
    onChange(selectedTemplate || null);
  };

  if (loading) {
    return null;
  }

  if (templates.length === 0) {
    return null;
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
