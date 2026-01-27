import styled from '@emotion/styled';

import { EmailSignatureEditor } from '@/email-composer/components/EmailSignatureEditor';
import { EmailTemplateManager } from '@/email-composer/components/EmailTemplateManager';
import { EmailTemplateVariablesManager } from '@/email-composer/components/EmailTemplateVariablesManager';

const StyledSettingsContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing(6)};
`;

/**
 * Settings page for Email Composer configuration.
 * Includes signature editor, template manager, and custom variables.
 */
export const SettingsAccountsEmailComposerSettings = () => {
  return (
    <StyledSettingsContainer>
      <EmailSignatureEditor />
      <EmailTemplateVariablesManager />
      <EmailTemplateManager />
    </StyledSettingsContainer>
  );
};
