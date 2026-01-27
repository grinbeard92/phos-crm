import { useCallback } from 'react';

import { useRecoilState, useRecoilValue } from 'recoil';

import { currentWorkspaceMemberState } from '@/auth/states/currentWorkspaceMemberState';
import {
  emailSignatureState,
  includeSignatureState,
  showSignaturePreviewState,
} from '@/email-composer/states/emailComposerSettingsState';

/**
 * Hook for managing email signature settings.
 * Stores signature per workspace member in local storage.
 */
export const useEmailSignature = () => {
  const currentWorkspaceMember = useRecoilValue(currentWorkspaceMemberState);
  const memberId = currentWorkspaceMember?.id ?? 'default';

  const [signature, setSignature] = useRecoilState(
    emailSignatureState(memberId),
  );
  const [includeSignature, setIncludeSignature] = useRecoilState(
    includeSignatureState(memberId),
  );
  const [showSignaturePreview, setShowSignaturePreview] = useRecoilState(
    showSignaturePreviewState(memberId),
  );

  const updateSignature = useCallback(
    (newSignature: string) => {
      setSignature(newSignature);
    },
    [setSignature],
  );

  const toggleIncludeSignature = useCallback(() => {
    setIncludeSignature((prev) => !prev);
  }, [setIncludeSignature]);

  const toggleShowSignaturePreview = useCallback(() => {
    setShowSignaturePreview((prev) => !prev);
  }, [setShowSignaturePreview]);

  /**
   * Returns the signature HTML to append to emails.
   * Returns empty string if signatures are disabled.
   */
  const getSignatureForEmail = useCallback(() => {
    if (!includeSignature || !signature) {
      return '';
    }

    // Add separator before signature
    return `<br><br>--<br>${signature}`;
  }, [includeSignature, signature]);

  return {
    signature,
    includeSignature,
    showSignaturePreview,
    updateSignature,
    setIncludeSignature,
    setShowSignaturePreview,
    toggleIncludeSignature,
    toggleShowSignaturePreview,
    getSignatureForEmail,
  };
};
