import { useCallback } from 'react';

import { useRedirect } from '@/domain-manager/hooks/useRedirect';
import { REACT_APP_SERVER_BASE_URL } from '~/config';
import { useGenerateTransientTokenMutation } from '~/generated-metadata/graphql';

/**
 * Hook to trigger OAuth flow for admin Gmail system email configuration.
 * This generates a transient token and redirects to the admin Gmail OAuth endpoint.
 */
export const useTriggerAdminGmailOAuth = () => {
  const [generateTransientToken] = useGenerateTransientTokenMutation();
  const { redirect } = useRedirect();

  const triggerAdminGmailOAuth = useCallback(async () => {
    const authServerUrl = REACT_APP_SERVER_BASE_URL;

    const transientToken = await generateTransientToken();

    const token =
      transientToken.data?.generateTransientToken.transientToken.token;

    if (!token) {
      throw new Error('Failed to generate transient token');
    }

    const params = `transientToken=${token}`;

    redirect(`${authServerUrl}/auth/admin-gmail-oauth?${params}`);
  }, [generateTransientToken, redirect]);

  return { triggerAdminGmailOAuth };
};
