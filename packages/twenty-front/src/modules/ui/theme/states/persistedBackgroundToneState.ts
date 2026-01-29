import { atom } from 'recoil';

import { type BackgroundTone } from 'twenty-ui/theme';
import { localStorageEffect } from '~/utils/recoil/localStorageEffect';

export const persistedBackgroundToneState = atom<BackgroundTone | null>({
  key: 'persistedBackgroundToneState',
  default: null,
  effects: [localStorageEffect()],
});
