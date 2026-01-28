export {
  EmailComposeModal,
  EMAIL_COMPOSE_MODAL_ID,
} from './components/EmailComposeModal';
export { EmailTemplateSelector } from './components/EmailTemplateSelector';
export { useEmailComposer } from './hooks/useEmailComposer';
export { useEmailTemplates } from './hooks/useEmailTemplates';
export { useSendEmail } from './hooks/useSendEmail';
export type {
  EmailComposeData,
  EmailComposeContext,
  EmailRecipient,
  EmailAttachment,
  EmailTemplateOption,
} from './types/EmailComposerTypes';
