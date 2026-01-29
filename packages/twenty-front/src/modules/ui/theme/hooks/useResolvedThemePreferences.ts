import { useMemo } from 'react';
import { useRecoilValue } from 'recoil';

import {
  type BackgroundTone,
  DEFAULT_ACCENT_PRESET_ID,
  DEFAULT_BACKGROUND_TONE,
} from 'twenty-ui/theme';

import { persistedAccentPresetIdState } from '@/ui/theme/states/persistedAccentPresetIdState';
import { persistedBackgroundToneState } from '@/ui/theme/states/persistedBackgroundToneState';

export const useResolvedThemePreferences = () => {
  const persistedAccentPresetId = useRecoilValue(persistedAccentPresetIdState);
  const persistedBackgroundTone = useRecoilValue(persistedBackgroundToneState);

  const accentPresetId: string = useMemo(
    () => persistedAccentPresetId ?? DEFAULT_ACCENT_PRESET_ID,
    [persistedAccentPresetId],
  );

  const backgroundTone: BackgroundTone = useMemo(
    () => persistedBackgroundTone ?? DEFAULT_BACKGROUND_TONE,
    [persistedBackgroundTone],
  );

  return { accentPresetId, backgroundTone };
};
