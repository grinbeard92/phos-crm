import { Injectable } from '@nestjs/common';

import { google } from 'googleapis';
import MailComposer from 'nodemailer/lib/mail-composer';
import { ConnectedAccountProvider } from 'twenty-shared/types';
import { assertUnreachable, isDefined } from 'twenty-shared/utils';
import { z } from 'zod';

import { OAuth2ClientManagerService } from 'src/modules/connected-account/oauth2-client-manager/services/oauth2-client-manager.service';
import { type ConnectedAccountWorkspaceEntity } from 'src/modules/connected-account/standard-objects/connected-account.workspace-entity';
import {
  MessageImportDriverException,
  MessageImportDriverExceptionCode,
} from 'src/modules/messaging/message-import-manager/drivers/exceptions/message-import-driver.exception';
import { ImapClientProvider } from 'src/modules/messaging/message-import-manager/drivers/imap/providers/imap-client.provider';
import { SmtpClientProvider } from 'src/modules/messaging/message-import-manager/drivers/smtp/providers/smtp-client.provider';
import { mimeEncode } from 'src/modules/messaging/message-import-manager/utils/mime-encode.util';

interface SendMessageInput {
  body: string;
  subject: string;
  to: string;
  html: string;
  attachments?: {
    filename: string;
    content: Buffer;
    contentType: string;
  }[];
  /** For threading: Message-ID header of the email being replied to */
  inReplyTo?: string;
  /** For threading: Chain of Message-IDs (most recent first) */
  references?: string[];
  /** CC recipients (comma-separated) */
  cc?: string;
  /** BCC recipients (comma-separated) */
  bcc?: string;
}

interface SendMessageResult {
  /** The Message-ID header of the sent email */
  messageId: string;
  /** Provider's message ID (for Gmail: messages.send response id) */
  externalMessageId?: string;
  /** Provider's thread ID if available */
  threadExternalId?: string;
}

@Injectable()
export class MessagingSendMessageService {
  constructor(
    private readonly oAuth2ClientManagerService: OAuth2ClientManagerService,
    private readonly smtpClientProvider: SmtpClientProvider,
    private readonly imapClientProvider: ImapClientProvider,
  ) {}

  public async sendMessage(
    sendMessageInput: SendMessageInput,
    connectedAccount: ConnectedAccountWorkspaceEntity,
  ): Promise<SendMessageResult> {
    switch (connectedAccount.provider) {
      case ConnectedAccountProvider.GOOGLE: {
        const oAuth2Client =
          await this.oAuth2ClientManagerService.getGoogleOAuth2Client(
            connectedAccount,
          );

        const gmailClient = google.gmail({
          version: 'v1',
          auth: oAuth2Client,
        });

        const peopleClient = google.people({
          version: 'v1',
          auth: oAuth2Client,
        });

        const { data: gmailData } = await gmailClient.users.getProfile({
          userId: 'me',
        });

        const fromEmail = gmailData.emailAddress;

        const { data: peopleData } = await peopleClient.people.get({
          resourceName: 'people/me',
          personFields: 'names',
        });

        const fromName = peopleData?.names?.[0]?.displayName;

        // Generate a unique Message-ID for threading
        const messageId = this.generateMessageId(fromEmail ?? 'unknown');

        // Build threading headers
        const headers: Record<string, string> = {
          'Message-ID': messageId,
        };

        if (sendMessageInput.inReplyTo) {
          headers['In-Reply-To'] = sendMessageInput.inReplyTo;
        }

        if (
          sendMessageInput.references &&
          sendMessageInput.references.length > 0
        ) {
          headers['References'] = sendMessageInput.references.join(' ');
        }

        const mail = new MailComposer({
          from: isDefined(fromName)
            ? `"${mimeEncode(fromName)}" <${fromEmail}>`
            : `${fromEmail}`,
          to: sendMessageInput.to,
          cc: sendMessageInput.cc,
          bcc: sendMessageInput.bcc,
          subject: sendMessageInput.subject,
          text: sendMessageInput.body,
          html: sendMessageInput.html,
          headers,
          ...(sendMessageInput.attachments &&
          sendMessageInput.attachments.length > 0
            ? {
                attachments: sendMessageInput.attachments.map((attachment) => ({
                  filename: attachment.filename,
                  content: attachment.content,
                  contentType: attachment.contentType,
                })),
              }
            : {}),
        });

        const messageBuffer = await mail.compile().build();
        const encodedMessage = Buffer.from(messageBuffer).toString('base64');

        const response = await gmailClient.users.messages.send({
          userId: 'me',
          requestBody: {
            raw: encodedMessage,
          },
        });

        return {
          messageId,
          externalMessageId: response.data.id ?? undefined,
          threadExternalId: response.data.threadId ?? undefined,
        };
      }
      case ConnectedAccountProvider.MICROSOFT: {
        const microsoftClient =
          await this.oAuth2ClientManagerService.getMicrosoftOAuth2Client(
            connectedAccount,
          );

        // Generate a unique Message-ID for threading
        const messageId = this.generateMessageId(
          connectedAccount.handle ?? 'unknown',
        );

        // Build CC/BCC recipients
        const ccRecipients = sendMessageInput.cc
          ? sendMessageInput.cc
              .split(',')
              .map((email) => ({ emailAddress: { address: email.trim() } }))
          : [];
        const bccRecipients = sendMessageInput.bcc
          ? sendMessageInput.bcc
              .split(',')
              .map((email) => ({ emailAddress: { address: email.trim() } }))
          : [];

        // Build internet message headers for threading
        const internetMessageHeaders: Array<{
          name: string;
          value: string;
        }> = [{ name: 'Message-ID', value: messageId }];

        if (sendMessageInput.inReplyTo) {
          internetMessageHeaders.push({
            name: 'In-Reply-To',
            value: sendMessageInput.inReplyTo,
          });
        }

        if (
          sendMessageInput.references &&
          sendMessageInput.references.length > 0
        ) {
          internetMessageHeaders.push({
            name: 'References',
            value: sendMessageInput.references.join(' '),
          });
        }

        const message = {
          subject: sendMessageInput.subject,
          body: {
            contentType: 'HTML',
            content: sendMessageInput.html,
          },
          toRecipients: [{ emailAddress: { address: sendMessageInput.to } }],
          ...(ccRecipients.length > 0 ? { ccRecipients } : {}),
          ...(bccRecipients.length > 0 ? { bccRecipients } : {}),
          internetMessageHeaders,
          ...(sendMessageInput.attachments &&
          sendMessageInput.attachments.length > 0
            ? {
                attachments: sendMessageInput.attachments.map((attachment) => ({
                  '@odata.type': '#microsoft.graph.fileAttachment',
                  name: attachment.filename,
                  contentType: attachment.contentType,
                  contentBytes: attachment.content.toString('base64'),
                })),
              }
            : {}),
        };

        const response = await microsoftClient
          .api(`/me/messages`)
          .post(message);

        z.string().parse(response.id);

        await microsoftClient.api(`/me/messages/${response.id}/send`).post({});

        return {
          messageId,
          externalMessageId: response.id,
          threadExternalId: response.conversationId,
        };
      }
      case ConnectedAccountProvider.IMAP_SMTP_CALDAV: {
        const { handle, connectionParameters, messageChannels } =
          connectedAccount;

        const smtpClient =
          await this.smtpClientProvider.getSmtpClient(connectedAccount);

        if (!isDefined(handle)) {
          throw new MessageImportDriverException(
            'Handle is required',
            MessageImportDriverExceptionCode.CHANNEL_MISCONFIGURED,
          );
        }

        // Generate a unique Message-ID for threading
        const messageId = this.generateMessageId(handle);

        // Build threading headers
        const headers: Record<string, string> = {
          'Message-ID': messageId,
        };

        if (sendMessageInput.inReplyTo) {
          headers['In-Reply-To'] = sendMessageInput.inReplyTo;
        }

        if (
          sendMessageInput.references &&
          sendMessageInput.references.length > 0
        ) {
          headers['References'] = sendMessageInput.references.join(' ');
        }

        const mail = new MailComposer({
          from: handle,
          to: sendMessageInput.to,
          cc: sendMessageInput.cc,
          bcc: sendMessageInput.bcc,
          subject: sendMessageInput.subject,
          text: sendMessageInput.body,
          html: sendMessageInput.html,
          headers,
          ...(sendMessageInput.attachments &&
          sendMessageInput.attachments.length > 0
            ? {
                attachments: sendMessageInput.attachments.map((attachment) => ({
                  filename: attachment.filename,
                  content: attachment.content,
                  contentType: attachment.contentType,
                })),
              }
            : {}),
        });

        const messageBuffer = await mail.compile().build();

        await smtpClient.sendMail({
          from: handle,
          to: sendMessageInput.to,
          raw: messageBuffer,
        });

        if (isDefined(connectionParameters?.IMAP)) {
          const imapClient =
            await this.imapClientProvider.getClient(connectedAccount);

          const messageChannel = messageChannels.find(
            (channel) => channel.handle === handle,
          );

          const sentFolder = messageChannel?.messageFolders.find(
            (messageFolder) => messageFolder.isSentFolder,
          );

          if (isDefined(sentFolder) && isDefined(sentFolder.name)) {
            await imapClient.append(sentFolder.name, messageBuffer);
          }

          await this.imapClientProvider.closeClient(imapClient);
        }

        return {
          messageId,
          // IMAP/SMTP doesn't provide external IDs like Gmail does
          externalMessageId: undefined,
          threadExternalId: undefined,
        };
      }
      default:
        assertUnreachable(
          connectedAccount.provider,
          `Provider ${connectedAccount.provider} not supported for sending messages`,
        );
    }
  }

  /**
   * Generates an RFC 5322 compliant Message-ID header.
   * Format: <timestamp.random@domain>
   */
  private generateMessageId(email: string): string {
    const domain = email.includes('@') ? email.split('@')[1] : 'localhost';
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 10);

    return `<${timestamp}.${random}@${domain}>`;
  }
}
