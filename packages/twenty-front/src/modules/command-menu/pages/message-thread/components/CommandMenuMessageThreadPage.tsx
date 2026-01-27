import { useTheme } from '@emotion/react';
import styled from '@emotion/styled';
import { useEffect, useMemo } from 'react';

import { CustomResolverFetchMoreLoader } from '@/activities/components/CustomResolverFetchMoreLoader';
import { EmailLoader } from '@/activities/emails/components/EmailLoader';
import { EmailThreadHeader } from '@/activities/emails/components/EmailThreadHeader';
import { EmailThreadMessage } from '@/activities/emails/components/EmailThreadMessage';
import { CommandMenuMessageThreadIntermediaryMessages } from '@/command-menu/pages/message-thread/components/CommandMenuMessageThreadIntermediaryMessages';
import { useEmailThreadInCommandMenu } from '@/command-menu/pages/message-thread/hooks/useEmailThreadInCommandMenu';
import { messageThreadComponentState } from '@/command-menu/pages/message-thread/states/messageThreadComponentState';
import { useEmailComposer } from '@/email-composer/hooks/useEmailComposer';
import { useIsMobile } from '@/ui/utilities/responsive/hooks/useIsMobile';
import { useSetRecoilComponentState } from '@/ui/utilities/state/component-state/hooks/useSetRecoilComponentState';
import { t } from '@lingui/core/macro';
import { ConnectedAccountProvider } from 'twenty-shared/types';
import { isDefined } from 'twenty-shared/utils';
import { IconArrowBackUp } from 'twenty-ui/display';
import { Button } from 'twenty-ui/input';

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
  const theme = useTheme();
  const { openEmailComposer } = useEmailComposer();

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

    // Get sender email from last message to use as recipient
    const senderHandle = lastMessage.sender?.handle;
    const replyTo = senderHandle ?? '';

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
    const borderColor = theme.border.color.medium;
    const textColor = theme.font.color.tertiary;
    const quotedHtml = `
      <br/><br/>
      <div style="border-left: 2px solid ${borderColor}; padding-left: 10px; margin-left: 5px; color: ${textColor};">
        <p>${t`On`} ${sentDate}, ${senderName} ${t`wrote`}:</p>
        <blockquote>${lastMessage.text}</blockquote>
      </div>
    `;

    // Open compose modal in reply mode
    openEmailComposer({
      isReply: true,
      threadId: thread?.id,
      defaultTo: replyTo,
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
    </StyledWrapper>
  );
};
