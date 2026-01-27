import styled from '@emotion/styled';

import { currentWorkspaceMemberState } from '@/auth/states/currentWorkspaceMemberState';
import { useFindManyRecords } from '@/object-record/hooks/useFindManyRecords';
import { type ObjectRecord } from '@/object-record/types/ObjectRecord';
import { SettingsAccountsToggleSettingCard } from '@/settings/accounts/components/SettingsAccountsToggleSettingCard';
import { useLingui } from '@lingui/react/macro';
import { useRecoilValue } from 'recoil';
import { Link } from 'react-router-dom';
import { H2Title, IconFileText } from 'twenty-ui/display';
import { Button } from 'twenty-ui/input';
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

const StyledTemplateInfo = styled.div`
  background: ${({ theme }) => theme.background.secondary};
  border-radius: ${({ theme }) => theme.border.radius.md};
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing(3)};
  padding: ${({ theme }) => theme.spacing(4)};
`;

const StyledLinkWrapper = styled(Link)`
  text-decoration: none;
`;

const StyledInfoText = styled.p`
  color: ${({ theme }) => theme.font.color.secondary};
  font-size: ${({ theme }) => theme.font.size.sm};
  margin: 0;
  line-height: 1.5;
`;

const StyledVariablesList = styled.ul`
  color: ${({ theme }) => theme.font.color.tertiary};
  font-size: ${({ theme }) => theme.font.size.sm};
  margin: ${({ theme }) => theme.spacing(2)} 0;
  padding-left: ${({ theme }) => theme.spacing(4)};
`;

const StyledCode = styled.code`
  background: ${({ theme }) => theme.background.tertiary};
  padding: ${({ theme }) => theme.spacing(0.5, 1)};
  border-radius: ${({ theme }) => theme.border.radius.xs};
  font-family: monospace;
  font-size: ${({ theme }) => theme.font.size.xs};
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
          description={t`Create and manage reusable email templates with dynamic variables.`}
        />

        <StyledTemplateInfo>
          <StyledInfoText>
            {t`Email templates allow you to create reusable email content with dynamic variables that get replaced with actual values when composing emails. This helps maintain consistency and saves time when sending similar emails.`}
          </StyledInfoText>

          <StyledInfoText>
            <strong>{t`Available variables:`}</strong>
          </StyledInfoText>
          <StyledVariablesList>
            <li>
              <StyledCode>{'{{person.firstName}}'}</StyledCode> -{' '}
              {t`Recipient's first name`}
            </li>
            <li>
              <StyledCode>{'{{person.lastName}}'}</StyledCode> -{' '}
              {t`Recipient's last name`}
            </li>
            <li>
              <StyledCode>{'{{person.email}}'}</StyledCode> -{' '}
              {t`Recipient's email`}
            </li>
            <li>
              <StyledCode>{'{{company.name}}'}</StyledCode> - {t`Company name`}
            </li>
          </StyledVariablesList>

          <StyledLinkWrapper to="/objects/emailTemplates">
            <Button
              Icon={IconFileText}
              title={t`Customize Email Templates`}
              variant="secondary"
              accent="default"
              size="medium"
            />
          </StyledLinkWrapper>
        </StyledTemplateInfo>

        {loading ? (
          <StyledEmptyState>{t`Loading templates...`}</StyledEmptyState>
        ) : templates.length === 0 ? (
          <StyledEmptyState>
            {t`No email templates found. Click "Customize Email Templates" to create your first template.`}
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
