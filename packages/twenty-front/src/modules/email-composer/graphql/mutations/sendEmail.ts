import { gql } from '@apollo/client';

export const SEND_EMAIL_MUTATION = gql`
  mutation SendEmail($input: SendEmailInput!) {
    sendEmail(input: $input) {
      success
      message
      error
      recipient
      connectedAccountId
    }
  }
`;
