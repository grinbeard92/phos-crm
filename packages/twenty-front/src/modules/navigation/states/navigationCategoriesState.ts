import { atom } from 'recoil';

import { type NavigationCategory } from '@/navigation/types/NavigationCategory';

export const navigationCategoriesState = atom<NavigationCategory[]>({
  key: 'navigationCategoriesState',
  default: [],
});
