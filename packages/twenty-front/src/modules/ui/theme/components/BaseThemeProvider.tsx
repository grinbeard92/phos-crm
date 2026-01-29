import { ThemeProvider } from '@emotion/react';
import { createContext, useMemo } from 'react';

import { useResolvedThemePreferences } from '@/ui/theme/hooks/useResolvedThemePreferences';
import { useSystemColorScheme } from '@/ui/theme/hooks/useSystemColorScheme';
import { buildCustomTheme } from '@/ui/theme/utils/buildCustomTheme';
import { persistedColorSchemeState } from '@/ui/theme/states/persistedColorSchemeState';
import { useRecoilState } from 'recoil';
import { type ColorScheme } from 'twenty-ui/input';
import { THEME_DARK, THEME_LIGHT, ThemeContextProvider } from 'twenty-ui/theme';
import { useIsFeatureEnabled } from '@/workspace/hooks/useIsFeatureEnabled';
import { FeatureFlagKey } from '~/generated-metadata/graphql';

type BaseThemeProviderProps = {
  children: JSX.Element | JSX.Element[];
};

export const ThemeSchemeContext = createContext<(theme: ColorScheme) => void>(
  () => {},
);

export const BaseThemeProvider = ({ children }: BaseThemeProviderProps) => {
  const [persistedColorScheme, setPersistedColorScheme] = useRecoilState(
    persistedColorSchemeState,
  );
  const systemColorScheme = useSystemColorScheme();
  const effectiveColorScheme =
    persistedColorScheme === 'System'
      ? systemColorScheme
      : persistedColorScheme;

  document.documentElement.className =
    effectiveColorScheme === 'Dark' ? 'dark' : 'light';

  const baseTheme = effectiveColorScheme === 'Dark' ? THEME_DARK : THEME_LIGHT;

  const isThemeCustomizationEnabled = useIsFeatureEnabled(
    FeatureFlagKey.IS_THEME_CUSTOMIZATION_ENABLED,
  );

  const { accentPresetId, backgroundTone } = useResolvedThemePreferences();

  const theme = useMemo(() => {
    if (!isThemeCustomizationEnabled) {
      return baseTheme;
    }

    return buildCustomTheme(baseTheme, accentPresetId, backgroundTone);
  }, [baseTheme, isThemeCustomizationEnabled, accentPresetId, backgroundTone]);

  return (
    <ThemeSchemeContext.Provider value={setPersistedColorScheme}>
      <ThemeProvider theme={theme}>
        <ThemeContextProvider theme={theme}>{children}</ThemeContextProvider>
      </ThemeProvider>
    </ThemeSchemeContext.Provider>
  );
};
