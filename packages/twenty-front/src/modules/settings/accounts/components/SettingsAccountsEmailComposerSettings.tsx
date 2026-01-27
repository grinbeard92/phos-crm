import styled from '@emotion/styled';

import { currentWorkspaceMemberState } from '@/auth/states/currentWorkspaceMemberState';
import { useFindManyRecords } from '@/object-record/hooks/useFindManyRecords';
import { type ObjectRecord } from '@/object-record/types/ObjectRecord';
import { SettingsAccountsToggleSettingCard } from '@/settings/accounts/components/SettingsAccountsToggleSettingCard';
import { useLingui } from '@lingui/react/macro';
import { useRecoilValue } from 'recoil';
import { H2Title } from 'twenty-ui/display';
import { Section } from 'twenty-ui/layout';

const StyledSettingsContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing(6)};
`;

const StyledEmptyState = styled.div`
  color: ${({ theme }) => theme.font.color.tertiary};
  font-size: ${({ theme }) => theme.font.size.sm};
  padding: ${({ theme }) => theme.spacing(4)};
`;

type EmailTemplateRecord = ObjectRecord & {
  name: string;
  subject: string;
  isActive: boolean;
  category: string;
};

export const SettingsAccountsEmailComposerSettings = () => {
  const { t } = useLingui();
  const currentWorkspaceMember = useRecoilValue(currentWorkspaceMemberState);

  // EmailTemplate is a custom object, use string name
  const { records: templates, loading } =
    useFindManyRecords<EmailTemplateRecord>({
      objectNameSingular: 'emailTemplate',
      filter: {
        isActive: { eq: true },
      },
      recordGqlFields: {
        id: true,
        name: true,
        subject: true,
        isActive: true,
        category: true,
      },
      skip: !currentWorkspaceMember,
    });

  return (
    <StyledSettingsContainer>
      <Section>
        <H2Title
          title={t`Email Composer`}
          description={t`Configure your email composer settings and manage templates.`}
        />
        <SettingsAccountsToggleSettingCard
          parameters={[
            {
              title: t`Include signature`,
              description: t`Automatically include your email signature when composing new emails.`,
              value: true,
              onToggle: () => {
                // TODO: Implement signature toggle
              },
            },
          ]}
        />
      </Section>

      <Section>
        <H2Title
          title={t`Email Templates`}
          description={t`Manage your email templates for quick composition.`}
        />
        {loading ? (
          <StyledEmptyState>{t`Loading templates...`}</StyledEmptyState>
        ) : templates.length === 0 ? (
          <StyledEmptyState>
            {t`No email templates found. Create templates in the Email Templates section.`}
          </StyledEmptyState>
        ) : (
          <SettingsAccountsToggleSettingCard
            parameters={templates.map((template) => ({
              title: template.name,
              description: template.subject,
              value: template.isActive,
              onToggle: () => {
                // TODO: Implement template toggle
              },
            }))}
          />
        )}
      </Section>
    </StyledSettingsContainer>
  );
};
