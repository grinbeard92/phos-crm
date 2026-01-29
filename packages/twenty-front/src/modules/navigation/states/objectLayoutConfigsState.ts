import { atom } from 'recoil';

import { type ObjectLayoutConfig } from '@/navigation/types/ObjectLayoutConfig';

export const objectLayoutConfigsState = atom<ObjectLayoutConfig[]>({
  key: 'objectLayoutConfigsState',
  default: [],
});
