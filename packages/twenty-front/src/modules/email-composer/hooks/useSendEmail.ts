import { useMutation } from '@apollo/client';
import { useCallback } from 'react';

import { SEND_EMAIL_MUTATION } from '@/email-composer/graphql/mutations/sendEmail';

type SendEmailInput = {
  email: string;
  subject: string;
  body: string;
  connectedAccountId?: string;
  files?: Array<{ id: string; name: string; type: string }>;
};

type SendEmailResult = {
  success: boolean;
  message: string;
  error?: string;
  recipient?: string;
  connectedAccountId?: string;
};

export const useSendEmail = () => {
  const [sendEmailMutation, { loading }] = useMutation<
    { sendEmail: SendEmailResult },
    { input: SendEmailInput }
  >(SEND_EMAIL_MUTATION);

  const sendEmail = useCallback(
    async (input: SendEmailInput): Promise<SendEmailResult> => {
      const result = await sendEmailMutation({
        variables: { input },
      });

      if (!result.data?.sendEmail) {
        return {
          success: false,
          message: 'Failed to send email',
          error: 'No response from server',
        };
      }

      return result.data.sendEmail;
    },
    [sendEmailMutation],
  );

  return {
    sendEmail,
    loading,
  };
};
