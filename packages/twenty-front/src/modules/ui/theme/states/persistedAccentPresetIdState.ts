import { atom } from 'recoil';

import { localStorageEffect } from '~/utils/recoil/localStorageEffect';

export const persistedAccentPresetIdState = atom<string | null>({
  key: 'persistedAccentPresetIdState',
  default: null,
  effects: [localStorageEffect()],
});
