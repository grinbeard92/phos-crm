import { atom } from 'recoil';

import {
  type QuoteFormInput,
  type QuoteLineItemFormInput,
} from '../types/quote.types';

export const quoteFormState = atom<QuoteFormInput>({
  key: 'quoteFormState',
  default: {
    quoteDate: new Date().toISOString().split('T')[0],
    discountPercentage: 0,
    taxPercentage: 0,
  },
});

export const quoteLineItemsState = atom<QuoteLineItemFormInput[]>({
  key: 'quoteLineItemsState',
  default: [],
});

export const isQuoteFormDirtyState = atom<boolean>({
  key: 'isQuoteFormDirtyState',
  default: false,
});
