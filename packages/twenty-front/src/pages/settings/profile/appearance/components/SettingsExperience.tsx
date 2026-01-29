import { SettingsPageContainer } from '@/settings/components/SettingsPageContainer';
import { FormatPreferencesSettings } from '@/settings/experience/components/FormatPreferencesSettings';
import { AccentColorPicker } from '@/settings/profile/components/AccentColorPicker';
import { BackgroundToneSelector } from '@/settings/profile/components/BackgroundToneSelector';
import { SubMenuTopBarContainer } from '@/ui/layout/page/components/SubMenuTopBarContainer';
import { useColorScheme } from '@/ui/theme/hooks/useColorScheme';
import { useIsFeatureEnabled } from '@/workspace/hooks/useIsFeatureEnabled';
import { Trans, useLingui } from '@lingui/react/macro';
import { SettingsPath } from 'twenty-shared/types';
import { getSettingsPath } from 'twenty-shared/utils';
import { H2Title } from 'twenty-ui/display';
import { ColorSchemePicker } from 'twenty-ui/input';
import { Section } from 'twenty-ui/layout';
import { FeatureFlagKey } from '~/generated-metadata/graphql';
import { LocalePicker } from '~/pages/settings/profile/appearance/components/LocalePicker';

export const SettingsExperience = () => {
  const { colorScheme, setColorScheme } = useColorScheme();
  const { t } = useLingui();
  const isThemeCustomizationEnabled = useIsFeatureEnabled(
    FeatureFlagKey.IS_THEME_CUSTOMIZATION_ENABLED,
  );

  return (
    <SubMenuTopBarContainer
      title={t`Experience`}
      links={[
        {
          children: <Trans>User</Trans>,
          href: getSettingsPath(SettingsPath.ProfilePage),
        },
        { children: <Trans>Experience</Trans> },
      ]}
    >
      <SettingsPageContainer>
        <Section>
          <H2Title title={t`Appearance`} />
          <ColorSchemePicker
            value={colorScheme}
            onChange={setColorScheme}
            lightLabel={t`Light`}
            darkLabel={t`Dark`}
            systemLabel={t`System settings`}
          />
        </Section>

        {isThemeCustomizationEnabled && (
          <>
            <Section>
              <H2Title
                title={t`Accent Color`}
                description={t`Choose the primary accent color`}
              />
              <AccentColorPicker />
            </Section>
            <Section>
              <H2Title
                title={t`Background Tone`}
                description={t`Adjust the background warmth`}
              />
              <BackgroundToneSelector />
            </Section>
          </>
        )}

        <Section>
          <H2Title
            title={t`Language`}
            description={t`Select your preferred language`}
          />
          <LocalePicker />
        </Section>

        <Section>
          <H2Title
            title={t`Formats`}
            description={t`Configure date, time, number, timezone, and calendar start day`}
          />
          <FormatPreferencesSettings />
        </Section>
        {/* Unified into FormatPreferencesSettings */}
      </SettingsPageContainer>
    </SubMenuTopBarContainer>
  );
};
