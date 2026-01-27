import { SettingsAccountsEmailComposerSettings } from '@/settings/accounts/components/SettingsAccountsEmailComposerSettings';
import { SettingsPageContainer } from '@/settings/components/SettingsPageContainer';
import { SubMenuTopBarContainer } from '@/ui/layout/page/components/SubMenuTopBarContainer';
import { useIsFeatureEnabled } from '@/workspace/hooks/useIsFeatureEnabled';
import { useLingui } from '@lingui/react/macro';
import { Navigate } from 'react-router-dom';
import { SettingsPath } from 'twenty-shared/types';
import { getSettingsPath } from 'twenty-shared/utils';
import { FeatureFlagKey } from '~/generated/graphql';

export const SettingsAccountsEmailComposer = () => {
  const { t } = useLingui();
  const isEmailComposerEnabled = useIsFeatureEnabled(
    FeatureFlagKey.IS_EMAIL_COMPOSER_ENABLED,
  );

  if (!isEmailComposerEnabled) {
    return <Navigate to={getSettingsPath(SettingsPath.Accounts)} replace />;
  }

  return (
    <SubMenuTopBarContainer
      title={t`Email Composer`}
      links={[
        {
          children: t`User`,
          href: getSettingsPath(SettingsPath.ProfilePage),
        },
        {
          children: t`Accounts`,
          href: getSettingsPath(SettingsPath.Accounts),
        },
        { children: t`Email Composer` },
      ]}
    >
      <SettingsPageContainer>
        <SettingsAccountsEmailComposerSettings />
      </SettingsPageContainer>
    </SubMenuTopBarContainer>
  );
};
