import { FeatureFlagKey } from '~/generated/graphql';

export type PhosFeatureFlag = {
  key: FeatureFlagKey;
  label: string;
  description: string;
};

export const PHOS_FEATURE_FLAGS: PhosFeatureFlag[] = [
  {
    key: FeatureFlagKey.IS_CALCULATED_FIELD_ENABLED,
    label: 'Calculated Fields',
    description:
      'Formula-based fields using {{fieldName}} syntax on data model objects',
  },
  {
    key: FeatureFlagKey.IS_SSE_DB_EVENTS_ENABLED,
    label: 'SSE DB Events',
    description:
      'Real-time server-sent events for database change reactivity',
  },
  {
    key: FeatureFlagKey.IS_THEME_CUSTOMIZATION_ENABLED,
    label: 'Theme Customization',
    description:
      'Custom accent colors and background tones in Experience settings',
  },
  {
    key: FeatureFlagKey.IS_NAVIGATION_HIERARCHY_ENABLED,
    label: 'Navigation Hierarchy',
    description:
      'Categorized sidebar with parent-child object tree and Layout Model settings',
  },
  {
    key: FeatureFlagKey.IS_EMAIL_COMPOSER_ENABLED,
    label: 'Email Composer',
    description:
      'Rich email composition with templates under Accounts settings',
  },
  {
    key: FeatureFlagKey.IS_QUOTING_BILLING_ENABLED,
    label: 'Quoting & Billing',
    description:
      'Professional quotes and invoices with PDF generation and email delivery',
  },
  {
    key: FeatureFlagKey.IS_STRIPE_ENABLED,
    label: 'Stripe Integration',
    description:
      'Automated payment processing with hosted payment links and webhook sync',
  },
];

export const PHOS_FLAG_KEYS = new Set(PHOS_FEATURE_FLAGS.map((f) => f.key));
