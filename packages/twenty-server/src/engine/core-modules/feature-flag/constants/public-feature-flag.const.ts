import { FeatureFlagKey } from 'src/engine/core-modules/feature-flag/enums/feature-flag-key.enum';

type FeatureFlagMetadata = {
  label: string;
  description: string;
  imagePath: string;
};

export type PublicFeatureFlag = {
  key: FeatureFlagKey;
  metadata: FeatureFlagMetadata;
};

export const PUBLIC_FEATURE_FLAGS: PublicFeatureFlag[] = [
  {
    key: FeatureFlagKey.IS_JUNCTION_RELATIONS_ENABLED,
    metadata: {
      label: 'Junction Relations',
      description:
        'Enable many-to-many relations through junction tables configuration',
      imagePath: 'https://twenty.com/images/lab/is-junction-relations.png',
    },
  },
  {
    key: FeatureFlagKey.IS_ROW_LEVEL_PERMISSION_PREDICATES_ENABLED,
    metadata: {
      label: 'Row Level Permissions',
      description: 'Enable row level permission',
      imagePath:
        'https://twenty.com/images/lab/is-row-level-permission-predicates-enabled.png',
    },
  },
  {
    key: FeatureFlagKey.IS_EMAIL_COMPOSER_ENABLED,
    metadata: {
      label: 'Email Composer',
      description:
        'Enable the email composer with template support for composing emails directly from person records',
      imagePath: 'https://twenty.com/images/lab/is-email-composer-enabled.png',
    },
  },
  {
    key: FeatureFlagKey.IS_CALCULATED_FIELD_ENABLED,
    metadata: {
      label: 'Calculated Fields',
      description:
        'Formula-based fields using {{fieldName}} syntax on data model objects',
      imagePath: '',
    },
  },
  {
    key: FeatureFlagKey.IS_SSE_DB_EVENTS_ENABLED,
    metadata: {
      label: 'SSE DB Events',
      description:
        'Real-time server-sent events for database change reactivity',
      imagePath: '',
    },
  },
  {
    key: FeatureFlagKey.IS_THEME_CUSTOMIZATION_ENABLED,
    metadata: {
      label: 'Theme Customization',
      description:
        'Custom accent colors and background tones in Experience settings',
      imagePath: '',
    },
  },
  {
    key: FeatureFlagKey.IS_NAVIGATION_HIERARCHY_ENABLED,
    metadata: {
      label: 'Navigation Hierarchy',
      description:
        'Categorized sidebar with parent-child object tree and Layout Model settings',
      imagePath: '',
    },
  },
  ...(process.env.CLOUDFLARE_API_KEY
    ? [
        // {
        // Here you can add cloud only feature flags
        // },
      ]
    : []),
];
