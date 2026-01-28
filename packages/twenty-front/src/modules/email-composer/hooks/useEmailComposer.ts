import { EMAIL_COMPOSE_MODAL_ID } from '@/email-composer/components/EmailComposeModal';
import {
  emailComposeModalOptionsState,
  type EmailComposeModalOptions,
} from '@/email-composer/states/emailComposerSettingsState';
import { useModal } from '@/ui/layout/modal/hooks/useModal';
import { useCallback } from 'react';
import { useSetRecoilState } from 'recoil';

export const useEmailComposer = () => {
  const { openModal, closeModal } = useModal();
  const setModalOptions = useSetRecoilState(emailComposeModalOptionsState);

  const openEmailComposer = useCallback(
    (options?: EmailComposeModalOptions) => {
      // Store options in recoil state for the modal to read
      setModalOptions(options ?? {});
      openModal(EMAIL_COMPOSE_MODAL_ID);
    },
    [openModal, setModalOptions],
  );

  const closeEmailComposer = useCallback(() => {
    closeModal(EMAIL_COMPOSE_MODAL_ID);
    // Clear options when closing
    setModalOptions({});
  }, [closeModal, setModalOptions]);

  return {
    openEmailComposer,
    closeEmailComposer,
  };
};
