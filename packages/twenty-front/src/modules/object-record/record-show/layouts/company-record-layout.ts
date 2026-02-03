import { CardType } from '@/object-record/record-show/types/CardType';
import { type RecordLayout } from '@/object-record/record-show/types/RecordLayout';
import { FeatureFlagKey } from '~/generated/graphql';

export const COMPANY_RECORD_LAYOUT: RecordLayout = {
  tabs: {
    emails: {
      title: 'Emails',
      position: 600,
      icon: 'IconMail',
      cards: [{ type: CardType.EmailCard }],
      hide: {
        ifMobile: false,
        ifDesktop: false,
        ifInRightDrawer: false,
        ifFeaturesDisabled: [],
        ifRequiredObjectsInactive: [],
        ifRelationsMissing: [],
      },
    },
    calendar: {
      title: 'Calendar',
      position: 700,
      icon: 'IconCalendarEvent',
      cards: [{ type: CardType.CalendarCard }],
      hide: {
        ifMobile: false,
        ifDesktop: false,
        ifInRightDrawer: false,
        ifFeaturesDisabled: [],
        ifRequiredObjectsInactive: [],
        ifRelationsMissing: [],
      },
    },
    quotes: {
      title: 'Quotes',
      position: 800,
      icon: 'IconFileText',
      cards: [{ type: CardType.QuoteCard }],
      hide: {
        ifMobile: false,
        ifDesktop: false,
        ifInRightDrawer: false,
        ifFeaturesDisabled: [FeatureFlagKey.IS_QUOTING_BILLING_ENABLED],
        ifRequiredObjectsInactive: [],
        ifRelationsMissing: [],
      },
    },
    invoices: {
      title: 'Invoices',
      position: 900,
      icon: 'IconFileText',
      cards: [{ type: CardType.InvoiceCard }],
      hide: {
        ifMobile: false,
        ifDesktop: false,
        ifInRightDrawer: false,
        ifFeaturesDisabled: [FeatureFlagKey.IS_QUOTING_BILLING_ENABLED],
        ifRequiredObjectsInactive: [],
        ifRelationsMissing: [],
      },
    },
  },
};
