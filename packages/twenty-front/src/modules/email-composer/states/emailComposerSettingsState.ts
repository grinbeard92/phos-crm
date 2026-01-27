import { atom, atomFamily } from 'recoil';

import { localStorageEffect } from '~/utils/recoil/localStorageEffect';

/**
 * Email signature state - stored per workspace member.
 * Keyed by workspaceMemberId.
 */
export const emailSignatureState = atomFamily<string, string>({
  key: 'emailSignature',
  default: '',
  effects: (workspaceMemberId) => [
    localStorageEffect(`emailSignature-${workspaceMemberId}`),
  ],
});

/**
 * Whether to include signature in composed emails.
 */
export const includeSignatureState = atomFamily<boolean, string>({
  key: 'includeSignature',
  default: true,
  effects: (workspaceMemberId) => [
    localStorageEffect(`includeSignature-${workspaceMemberId}`),
  ],
});

/**
 * Whether to show signature preview in the email compose body.
 */
export const showSignaturePreviewState = atomFamily<boolean, string>({
  key: 'showSignaturePreview',
  default: true,
  effects: (workspaceMemberId) => [
    localStorageEffect(`showSignaturePreview-${workspaceMemberId}`),
  ],
});

/**
 * Track which workspaces have had their templates initialized.
 * This is a module-level state (not persisted) to prevent re-initialization.
 */
export const emailTemplatesInitializedState = atom<Record<string, boolean>>({
  key: 'emailTemplatesInitialized',
  default: {},
});

/**
 * Editor mode for composing emails/templates.
 */
export type EditorMode = 'rich' | 'html';

/**
 * Default editor mode preference per workspace member.
 */
export const defaultEditorModeState = atomFamily<EditorMode, string>({
  key: 'defaultEditorMode',
  default: 'rich',
  effects: (workspaceMemberId) => [
    localStorageEffect(`defaultEditorMode-${workspaceMemberId}`),
  ],
});

/**
 * Email template stored locally.
 */
export type LocalEmailTemplate = {
  id: string;
  name: string;
  subject: string;
  body: string;
  /** Format of the body content: 'html' for raw HTML, 'rich' for BlockNote JSON */
  bodyFormat: EditorMode;
  category: 'GENERAL' | 'SALES' | 'SUPPORT' | 'FOLLOW_UP';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

/**
 * Email templates stored locally per workspace.
 * This is a temporary solution until we have a proper custom object.
 */
export const localEmailTemplatesState = atomFamily<
  LocalEmailTemplate[],
  string
>({
  key: 'localEmailTemplates',
  default: [],
  effects: (workspaceId) => [
    localStorageEffect(`emailTemplates-${workspaceId}`),
  ],
});

/**
 * Default templates that are pre-populated when the user first accesses templates.
 */
export const DEFAULT_EMAIL_TEMPLATES: Omit<
  LocalEmailTemplate,
  'id' | 'createdAt' | 'updatedAt'
>[] = [
  {
    name: 'Introduction',
    subject: 'Nice to meet you, {{person.firstName}}!',
    body: '<p>Hi {{person.firstName}},</p><p>It was great connecting with you. I wanted to follow up and introduce myself properly.</p><p>I work at {{company.name}} and I think we could help you with...</p><p>Would you be open to a quick call this week?</p><p>Best regards</p>',
    bodyFormat: 'html',
    category: 'GENERAL',
    isActive: true,
  },
  {
    name: 'Follow Up',
    subject: 'Following up on our conversation',
    body: '<p>Hi {{person.firstName}},</p><p>I wanted to follow up on our recent conversation.</p><p>Have you had a chance to think about what we discussed?</p><p>Let me know if you have any questions.</p><p>Best regards</p>',
    bodyFormat: 'html',
    category: 'FOLLOW_UP',
    isActive: true,
  },
  {
    name: 'Meeting Request',
    subject: 'Can we schedule a meeting?',
    body: '<p>Hi {{person.firstName}},</p><p>I hope this email finds you well.</p><p>I would love to schedule a meeting to discuss how we can work together.</p><p>Are you available for a 30-minute call this week?</p><p>Best regards</p>',
    bodyFormat: 'html',
    category: 'SALES',
    isActive: true,
  },
];
