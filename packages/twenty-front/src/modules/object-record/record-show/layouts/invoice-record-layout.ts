import { CardType } from '@/object-record/record-show/types/CardType';
import { type RecordLayout } from '@/object-record/record-show/types/RecordLayout';

export const INVOICE_RECORD_LAYOUT: RecordLayout = {
  tabs: {
    payments: {
      title: 'Payments',
      position: 100,
      icon: 'IconCreditCard',
      cards: [{ type: CardType.PaymentCard }],
      hide: {
        ifMobile: false,
        ifDesktop: false,
        ifInRightDrawer: false,
        ifFeaturesDisabled: [],
        ifRequiredObjectsInactive: [],
        ifRelationsMissing: [],
      },
    },
  },
};
