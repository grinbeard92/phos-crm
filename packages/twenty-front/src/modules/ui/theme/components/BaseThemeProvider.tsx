import { ThemeProvider } from '@emotion/react';
import { createContext, useMemo } from 'react';

import { useResolvedThemePreferences } from '@/ui/theme/hooks/useResolvedThemePreferences';
import { useSystemColorScheme } from '@/ui/theme/hooks/useSystemColorScheme';
import { buildCustomTheme } from '@/ui/theme/utils/buildCustomTheme';
import { persistedColorSchemeState } from '@/ui/theme/states/persistedColorSchemeState';
import { useRecoilState } from 'recoil';
import { type ColorScheme } from 'twenty-ui/input';
import { THEME_DARK, THEME_LIGHT, ThemeContextProvider } from 'twenty-ui/theme';

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

  // Theme preferences are read directly from localStorage-backed Recoil atoms.
  // No feature flag gate needed here — the defaults (indigo accent, neutral tone)
  // produce an identical theme to the base. The feature flag only gates the
  // Settings UI controls (AccentColorPicker, BackgroundToneSelector).
  const { accentPresetId, backgroundTone } = useResolvedThemePreferences();

  const theme = useMemo(
    () => buildCustomTheme(baseTheme, accentPresetId, backgroundTone),
    [baseTheme, accentPresetId, backgroundTone],
  );

  return (
    <ThemeSchemeContext.Provider value={setPersistedColorScheme}>
      <ThemeProvider theme={theme}>
        <ThemeContextProvider theme={theme}>{children}</ThemeContextProvider>
      </ThemeProvider>
    </ThemeSchemeContext.Provider>
  );
};
