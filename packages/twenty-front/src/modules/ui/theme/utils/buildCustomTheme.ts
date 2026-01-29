import {
  ACCENT_PRESETS,
  type BackgroundTone,
  BACKGROUND_TONE_GRAY_SCALES,
  DEFAULT_ACCENT_PRESET_ID,
  DEFAULT_BACKGROUND_TONE,
  type ThemeType,
} from 'twenty-ui/theme';

export const buildCustomTheme = (
  baseTheme: ThemeType,
  accentPresetId?: string | null,
  backgroundTone?: BackgroundTone | null,
): ThemeType => {
  const resolvedAccentId =
    accentPresetId && accentPresetId in ACCENT_PRESETS
      ? accentPresetId
      : DEFAULT_ACCENT_PRESET_ID;

  const resolvedTone: BackgroundTone =
    backgroundTone ?? DEFAULT_BACKGROUND_TONE;

  const preset = ACCENT_PRESETS[resolvedAccentId];
  const isDark = baseTheme.name === 'dark';
  const accentSteps = isDark ? preset.dark : preset.light;

  const toneGrayScales = BACKGROUND_TONE_GRAY_SCALES[resolvedTone];
  const grayScale = isDark ? toneGrayScales.dark : toneGrayScales.light;

  return {
    ...baseTheme,
    accent: {
      ...baseTheme.accent,
      accent1: accentSteps.accent1,
      accent2: accentSteps.accent2,
      accent3: accentSteps.accent3,
      accent4: accentSteps.accent4,
      accent5: accentSteps.accent5,
      accent6: accentSteps.accent6,
      accent7: accentSteps.accent7,
      accent8: accentSteps.accent8,
      accent9: accentSteps.accent9,
      accent10: accentSteps.accent10,
      accent11: accentSteps.accent11,
      accent12: accentSteps.accent12,
    },
    grayScale,
    background: {
      ...baseTheme.background,
      primary: grayScale.gray1,
      secondary: grayScale.gray2,
      tertiary: grayScale.gray4,
      quaternary: grayScale.gray5,
      invertedPrimary: grayScale.gray12,
      invertedSecondary: grayScale.gray11,
      radialGradient: `radial-gradient(50% 62.62% at 50% 0%, ${grayScale.gray9} 0%, ${grayScale.gray10} 100%)`,
      radialGradientHover: `radial-gradient(76.32% 95.59% at 50% 0%, ${grayScale.gray10} 0%, ${grayScale.gray11} 100%)`,
      primaryInverted: grayScale.gray12,
      primaryInvertedHover: grayScale.gray11,
    },
  };
};
