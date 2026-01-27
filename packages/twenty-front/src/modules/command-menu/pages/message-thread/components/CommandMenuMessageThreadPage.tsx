import styled from '@emotion/styled';
import { useEffect, useMemo } from 'react';

import { CustomResolverFetchMoreLoader } from '@/activities/components/CustomResolverFetchMoreLoader';
import { EmailLoader } from '@/activities/emails/components/EmailLoader';
import { EmailThreadHeader } from '@/activities/emails/components/EmailThreadHeader';
import { EmailThreadMessage } from '@/activities/emails/components/EmailThreadMessage';
import { CommandMenuMessageThreadIntermediaryMessages } from '@/command-menu/pages/message-thread/components/CommandMenuMessageThreadIntermediaryMessages';
import { useEmailThreadInCommandMenu } from '@/command-menu/pages/message-thread/hooks/useEmailThreadInCommandMenu';
import { messageThreadComponentState } from '@/command-menu/pages/message-thread/states/messageThreadComponentState';
import { EmailComposeModal } from '@/email-composer/components/EmailComposeModal';
import { useEmailComposer } from '@/email-composer/hooks/useEmailComposer';
import { useIsMobile } from '@/ui/utilities/responsive/hooks/useIsMobile';
import { useSetRecoilComponentState } from '@/ui/utilities/state/component-state/hooks/useSetRecoilComponentState';
import { useIsFeatureEnabled } from '@/workspace/hooks/useIsFeatureEnabled';
import { t } from '@lingui/core/macro';
import {
  ConnectedAccountProvider,
  MessageParticipantRole,
} from 'twenty-shared/types';
import { isDefined } from 'twenty-shared/utils';
import { IconArrowBackUp } from 'twenty-ui/display';
import { Button } from 'twenty-ui/input';
import { FeatureFlagKey } from '~/generated/graphql';

const StyledWrapper = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
`;

const StyledContainer = styled.div`
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  flex: 1;
  height: 85%;
  overflow-y: auto;
`;

const StyledButtonContainer = styled.div<{ isMobile: boolean }>`
  background: ${({ theme }) => theme.background.secondary};
  border-top: 1px solid ${({ theme }) => theme.border.color.light};
  display: flex;
  justify-content: flex-end;
  height: ${({ isMobile }) => (isMobile ? '100px' : '50px')};
  padding: ${({ theme }) => theme.spacing(2)};
  width: 100%;
  box-sizing: border-box;
`;

const ALLOWED_REPLY_PROVIDERS = [
  ConnectedAccountProvider.GOOGLE,
  ConnectedAccountProvider.MICROSOFT,
  ConnectedAccountProvider.IMAP_SMTP_CALDAV,
];

export const CommandMenuMessageThreadPage = () => {
  const setMessageThread = useSetRecoilComponentState(
    messageThreadComponentState,
  );

  const isMobile = useIsMobile();
  const { openEmailComposer } = useEmailComposer();
  const isEmailComposerEnabled = useIsFeatureEnabled(
    FeatureFlagKey.IS_EMAIL_COMPOSER_ENABLED,
  );

  const {
    thread,
    messages,
    fetchMoreMessages,
    threadLoading,
    connectedAccountHandle,
    messageChannelLoading,
    connectedAccountProvider,
    lastMessageHeaderId,
    threadReferences,
    connectedAccountConnectionParameters,
  } = useEmailThreadInCommandMenu();

  useEffect(() => {
    if (!messages[0]?.messageThread) {
      return;
    }
    setMessageThread(messages[0]?.messageThread);
  }, [messages, setMessageThread]);

  const messagesCount = messages.length;
  const is5OrMoreMessages = messagesCount >= 5;
  const firstMessages = messages.slice(
    0,
    is5OrMoreMessages ? 2 : messagesCount - 1,
  );
  const intermediaryMessages = is5OrMoreMessages
    ? messages.slice(2, messagesCount - 1)
    : [];
  const lastMessage = messages[messagesCount - 1];
  const subject = messages[0]?.subject;

  const canReply = useMemo(() => {
    return (
      connectedAccountHandle &&
      connectedAccountProvider &&
      ALLOWED_REPLY_PROVIDERS.includes(connectedAccountProvider) &&
      (connectedAccountProvider !== ConnectedAccountProvider.IMAP_SMTP_CALDAV ||
        isDefined(connectedAccountConnectionParameters?.SMTP)) &&
      lastMessage
    );
  }, [
    connectedAccountConnectionParameters,
    connectedAccountHandle,
    connectedAccountProvider,
    lastMessage,
  ]);

  const handleReplyClick = () => {
    if (!canReply || !lastMessage) {
      return;
    }

    // Get connected account email (the user's email) to exclude from recipients
    const myEmail = connectedAccountHandle?.toLowerCase() ?? '';

    // Get sender email from last message
    const senderHandle = lastMessage.sender?.handle ?? '';
    const senderIsMe = senderHandle.toLowerCase() === myEmail;

    // Get all participants from the last message
    const participants = lastMessage.messageParticipants ?? [];

    // Determine the reply-to address:
    // - If someone else sent the message: reply to them (the FROM)
    // - If I sent the message: reply to the original TO recipient(s)
    let replyTo = '';
    const ccRecipients: string[] = [];

    if (senderIsMe) {
      // I sent this message - find the TO recipients to reply to
      for (const participant of participants) {
        const email = participant.handle?.toLowerCase() ?? '';
        if (email === '' || email === myEmail) {
          continue;
        }
        if (participant.role === MessageParticipantRole.TO) {
          if (replyTo === '') {
            // First TO recipient becomes the primary reply-to
            replyTo = participant.handle;
          } else {
            // Additional TO recipients go to CC
            ccRecipients.push(participant.handle);
          }
        } else if (participant.role === MessageParticipantRole.CC) {
          ccRecipients.push(participant.handle);
        }
      }
    } else {
      // Someone else sent this - reply to them
      replyTo = senderHandle;

      // Add other recipients (TO and CC) to CC, excluding myself and the sender
      for (const participant of participants) {
        const email = participant.handle?.toLowerCase() ?? '';
        if (email === '' || email === myEmail) {
          continue;
        }
        // Skip the sender - they're already in the To field
        if (
          participant.role === MessageParticipantRole.FROM ||
          email === replyTo.toLowerCase()
        ) {
          continue;
        }
        if (
          participant.role === MessageParticipantRole.TO ||
          participant.role === MessageParticipantRole.CC
        ) {
          ccRecipients.push(participant.handle);
        }
      }
    }

    // Build subject with "Re:" prefix if not already present
    const originalSubject = subject ?? '';
    const rePrefix = t`Re:`;
    const replySubject = originalSubject.toLowerCase().startsWith('re:')
      ? originalSubject
      : `${rePrefix} ${originalSubject}`;

    // Build quoted message HTML for reply context
    const senderName =
      lastMessage.sender?.displayName ??
      lastMessage.sender?.handle ??
      t`Unknown`;
    const sentDate = new Date(lastMessage.receivedAt).toLocaleString();

    // Convert plain text to HTML preserving line breaks and basic formatting
    // Escape HTML entities first, then convert newlines to <br> tags
    const escapeHtml = (text: string) =>
      text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
    const textToHtml = (text: string | null) => {
      if (!text) return '';
      return escapeHtml(text)
        .split('\n')
        .map((line) => (line.trim() === '' ? '<br>' : `<p>${line}</p>`))
        .join('');
    };

    const quotedTextHtml = textToHtml(lastMessage.text);
    const quotedHtml = `
      <p>${t`On`} ${sentDate}, ${senderName} ${t`wrote`}:</p>
      <blockquote>${quotedTextHtml}</blockquote>
    `;

    // Open compose modal in reply mode with CC recipients
    openEmailComposer({
      isReply: true,
      threadId: thread?.id,
      defaultTo: replyTo,
      defaultCc: ccRecipients.join(', '),
      defaultSubject: replySubject,
      inReplyTo: lastMessageHeaderId ?? undefined,
      references: threadReferences,
      quotedMessageHtml: quotedHtml,
    });
  };
  if (!thread || !messages.length) {
    return null;
  }
  return (
    <StyledWrapper>
      <StyledContainer>
        {threadLoading ? (
          <EmailLoader loadingText={t`Loading thread`} />
        ) : (
          <>
            <EmailThreadHeader
              subject={subject}
              lastMessageSentAt={lastMessage.receivedAt}
            />
            {firstMessages.map((message) => (
              <EmailThreadMessage
                key={message.id}
                sender={message.sender}
                participants={message.messageParticipants}
                body={message.text}
                sentAt={message.receivedAt}
              />
            ))}
            <CommandMenuMessageThreadIntermediaryMessages
              messages={intermediaryMessages}
            />
            <EmailThreadMessage
              key={lastMessage.id}
              sender={lastMessage.sender}
              participants={lastMessage.messageParticipants}
              body={lastMessage.text}
              sentAt={lastMessage.receivedAt}
              isExpanded
            />
            <CustomResolverFetchMoreLoader
              loading={threadLoading}
              onLastRowVisible={fetchMoreMessages}
            />
          </>
        )}
      </StyledContainer>
      {canReply && !messageChannelLoading && (
        <StyledButtonContainer isMobile={isMobile}>
          <Button
            size="small"
            onClick={handleReplyClick}
            title={t`Reply`}
            Icon={IconArrowBackUp}
            disabled={!canReply}
          />
        </StyledButtonContainer>
      )}
      {/* Modal for email reply - reads state from Recoil */}
      {isEmailComposerEnabled && <EmailComposeModal />}
    </StyledWrapper>
  );
};
