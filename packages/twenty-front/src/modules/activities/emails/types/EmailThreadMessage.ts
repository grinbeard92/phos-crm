import { type EmailThreadMessageParticipant } from '@/activities/emails/types/EmailThreadMessageParticipant';
import { type MessageThread } from '@/activities/emails/types/MessageThread';

export type EmailThreadMessageChannelAssociation = {
  id: string;
  direction: 'INCOMING' | 'OUTGOING';
};

export type EmailThreadMessage = {
  id: string;
  text: string;
  receivedAt: string;
  subject: string;
  messageThreadId: string;
  /** RFC 5322 Message-ID header for threading */
  headerMessageId?: string;
  messageParticipants: EmailThreadMessageParticipant[];
  messageThread: MessageThread;
  messageChannelMessageAssociations?: EmailThreadMessageChannelAssociation[];
  __typename: 'EmailThreadMessage';
};
