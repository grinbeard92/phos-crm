import styled from '@emotion/styled';

import { SettingsCard } from '@/settings/components/SettingsCard';
import { useIsFeatureEnabled } from '@/workspace/hooks/useIsFeatureEnabled';
import { useTheme } from '@emotion/react';
import { useLingui } from '@lingui/react/macro';
import { SettingsPath } from 'twenty-shared/types';
import { getSettingsPath } from 'twenty-shared/utils';
import {
  H2Title,
  IconCalendarEvent,
  IconMailCog,
  IconPencil,
} from 'twenty-ui/display';
import { Section } from 'twenty-ui/layout';
import { UndecoratedLink } from 'twenty-ui/navigation';
import { MOBILE_VIEWPORT } from 'twenty-ui/theme';
import { FeatureFlagKey } from '~/generated/graphql';

const StyledCardsContainer = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing(4)};
  margin-top: ${({ theme }) => theme.spacing(6)};

  @media (max-width: ${MOBILE_VIEWPORT}pxF) {
    flex-direction: column;
  }
`;

export const SettingsAccountsSettingsSection = () => {
  const { t } = useLingui();
  const theme = useTheme();
  const isEmailComposerEnabled = useIsFeatureEnabled(
    FeatureFlagKey.IS_EMAIL_COMPOSER_ENABLED,
  );

  return (
    <Section>
      <H2Title
        title={t`Settings`}
        description={t`Configure your emails and calendar settings.`}
      />
      <StyledCardsContainer>
        <UndecoratedLink to={getSettingsPath(SettingsPath.AccountsEmails)}>
          <SettingsCard
            Icon={
              <IconMailCog
                size={theme.icon.size.lg}
                stroke={theme.icon.stroke.sm}
              />
            }
            title={t`Emails`}
            description={t`Set email visibility, manage your blocklist and more.`}
          />
        </UndecoratedLink>
        <UndecoratedLink to={getSettingsPath(SettingsPath.AccountsCalendars)}>
          <SettingsCard
            Icon={
              <IconCalendarEvent
                size={theme.icon.size.lg}
                stroke={theme.icon.stroke.sm}
              />
            }
            title={t`Calendar`}
            description={t`Configure and customize your calendar preferences.`}
          />
        </UndecoratedLink>
        {isEmailComposerEnabled && (
          <UndecoratedLink
            to={getSettingsPath(SettingsPath.AccountsEmailComposer)}
          >
            <SettingsCard
              Icon={
                <IconPencil
                  size={theme.icon.size.lg}
                  stroke={theme.icon.stroke.sm}
                />
              }
              title={t`Email Composer`}
              description={t`Configure email composer settings and templates.`}
            />
          </UndecoratedLink>
        )}
      </StyledCardsContainer>
    </Section>
  );
};
