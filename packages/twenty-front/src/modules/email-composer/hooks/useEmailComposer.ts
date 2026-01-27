import { EMAIL_COMPOSE_MODAL_ID } from '@/email-composer/components/EmailComposeModal';
import { type EmailComposeContext } from '@/email-composer/types/EmailComposerTypes';
import { useModal } from '@/ui/layout/modal/hooks/useModal';
import { useCallback } from 'react';

type OpenEmailComposerOptions = {
  context?: EmailComposeContext;
  defaultTo?: string;
  defaultSubject?: string;
  defaultBody?: string;
  threadId?: string;
  inReplyTo?: string;
};

export const useEmailComposer = () => {
  const { openModal, closeModal } = useModal();

  const openEmailComposer = useCallback(
    (options?: OpenEmailComposerOptions) => {
      // Store options in a temporary state or context if needed
      // For now, the modal will receive props directly
      openModal(EMAIL_COMPOSE_MODAL_ID);
    },
    [openModal],
  );

  const closeEmailComposer = useCallback(() => {
    closeModal(EMAIL_COMPOSE_MODAL_ID);
  }, [closeModal]);

  return {
    openEmailComposer,
    closeEmailComposer,
  };
};
