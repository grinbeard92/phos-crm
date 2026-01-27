import { Injectable, Logger } from '@nestjs/common';

import { MessageParticipantRole } from 'twenty-shared/types';
import { isDefined } from 'twenty-shared/utils';
import { v4 } from 'uuid';

import { type WorkspaceEntityManager } from 'src/engine/twenty-orm/entity-manager/workspace-entity-manager';
import { GlobalWorkspaceOrmManager } from 'src/engine/twenty-orm/global-workspace-datasource/global-workspace-orm.manager';
import { buildSystemAuthContext } from 'src/engine/twenty-orm/utils/build-system-auth-context.util';
import { type ConnectedAccountWorkspaceEntity } from 'src/modules/connected-account/standard-objects/connected-account.workspace-entity';
import { MessageDirection } from 'src/modules/messaging/common/enums/message-direction.enum';
import { type MessageChannelMessageAssociationWorkspaceEntity } from 'src/modules/messaging/common/standard-objects/message-channel-message-association.workspace-entity';
import { type MessageChannelWorkspaceEntity } from 'src/modules/messaging/common/standard-objects/message-channel.workspace-entity';
import { type MessageParticipantWorkspaceEntity } from 'src/modules/messaging/common/standard-objects/message-participant.workspace-entity';
import { type MessageThreadWorkspaceEntity } from 'src/modules/messaging/common/standard-objects/message-thread.workspace-entity';
import { type MessageWorkspaceEntity } from 'src/modules/messaging/common/standard-objects/message.workspace-entity';
import { MatchParticipantService } from 'src/modules/match-participant/match-participant.service';

/**
 * Input for persisting a sent message to Twenty's database.
 */
export interface PersistSentMessageInput {
  /** RFC 5322 Message-ID header we generated for this email */
  headerMessageId: string;
  /** Email subject */
  subject: string;
  /** Plain text body */
  text: string;
  /** Recipient email (TO) */
  to: string;
  /** CC recipients (comma-separated) */
  cc?: string;
  /** BCC recipients (comma-separated) */
  bcc?: string;
  /** Provider's external message ID (e.g., Gmail message ID) */
  externalMessageId?: string;
  /** Provider's external thread ID (e.g., Gmail thread ID) */
  threadExternalId?: string;
  /** RFC 5322 Message-ID of the email being replied to (for threading) */
  inReplyTo?: string;
  /** Twenty's internal thread ID (if replying to a known thread) */
  messageThreadId?: string;
  /** Sent timestamp */
  sentAt?: Date;
}

/**
 * Result of persisting a sent message.
 */
export interface PersistSentMessageResult {
  /** Twenty's internal message ID */
  messageId: string;
  /** Twenty's internal thread ID */
  messageThreadId: string;
  /** Whether a new thread was created */
  isNewThread: boolean;
}

/**
 * Service for persisting sent emails to Twenty's database.
 *
 * This service ensures that emails sent through the CRM are immediately
 * available in the timeline/message views without waiting for sync.
 *
 * It handles:
 * - Message creation with proper threading
 * - Participant creation (FROM, TO, CC, BCC)
 * - Message channel association
 * - Thread lookup via inReplyTo header or messageThreadId
 */
@Injectable()
export class MessagingSentMessagePersistenceService {
  private readonly logger = new Logger(
    MessagingSentMessagePersistenceService.name,
  );

  constructor(
    private readonly globalWorkspaceOrmManager: GlobalWorkspaceOrmManager,
    private readonly matchParticipantService: MatchParticipantService<MessageParticipantWorkspaceEntity>,
  ) {}

  /**
   * Persist a sent email to Twenty's database.
   */
  async persistSentMessage(
    input: PersistSentMessageInput,
    connectedAccount: ConnectedAccountWorkspaceEntity,
    workspaceId: string,
  ): Promise<PersistSentMessageResult> {
    const authContext = buildSystemAuthContext(workspaceId);

    return this.globalWorkspaceOrmManager.executeInWorkspaceContext(
      authContext,
      async () => {
        const workspaceDataSource =
          await this.globalWorkspaceOrmManager.getGlobalWorkspaceDataSource();

        const result = await workspaceDataSource?.transaction(
          async (transactionManager: WorkspaceEntityManager) => {
            return this.persistSentMessageWithinTransaction(
              input,
              connectedAccount,
              workspaceId,
              transactionManager,
            );
          },
        );

        if (!result) {
          throw new Error('Failed to persist sent message: transaction failed');
        }

        return result;
      },
    );
  }

  private async persistSentMessageWithinTransaction(
    input: PersistSentMessageInput,
    connectedAccount: ConnectedAccountWorkspaceEntity,
    workspaceId: string,
    transactionManager: WorkspaceEntityManager,
  ): Promise<PersistSentMessageResult> {
    // Get repositories
    const messageRepository =
      await this.globalWorkspaceOrmManager.getRepository<MessageWorkspaceEntity>(
        workspaceId,
        'message',
      );

    const messageThreadRepository =
      await this.globalWorkspaceOrmManager.getRepository<MessageThreadWorkspaceEntity>(
        workspaceId,
        'messageThread',
      );

    const messageChannelMessageAssociationRepository =
      await this.globalWorkspaceOrmManager.getRepository<MessageChannelMessageAssociationWorkspaceEntity>(
        workspaceId,
        'messageChannelMessageAssociation',
      );

    const messageParticipantRepository =
      await this.globalWorkspaceOrmManager.getRepository<MessageParticipantWorkspaceEntity>(
        workspaceId,
        'messageParticipant',
      );

    const messageChannelRepository =
      await this.globalWorkspaceOrmManager.getRepository<MessageChannelWorkspaceEntity>(
        workspaceId,
        'messageChannel',
      );

    // Check if message already exists (deduplication by headerMessageId)
    const existingMessage = await messageRepository.findOne({
      where: { headerMessageId: input.headerMessageId },
    });

    if (existingMessage) {
      this.logger.log(
        `Message already exists with headerMessageId: ${input.headerMessageId}`,
      );

      return {
        messageId: existingMessage.id,
        messageThreadId: existingMessage.messageThreadId!,
        isNewThread: false,
      };
    }

    // Find the message channel for this connected account
    const messageChannel = await messageChannelRepository.findOne({
      where: {
        connectedAccountId: connectedAccount.id,
        ...(connectedAccount.handle && { handle: connectedAccount.handle }),
      },
    });

    if (!messageChannel) {
      throw new Error(
        `No message channel found for connected account ${connectedAccount.id}`,
      );
    }

    // Determine the thread ID
    let messageThreadId: string;
    let isNewThread = false;

    // Priority 1: Use provided messageThreadId (from frontend reply)
    if (input.messageThreadId) {
      // Verify the thread exists
      const existingThread = await messageThreadRepository.findOne({
        where: { id: input.messageThreadId },
      });

      if (existingThread) {
        messageThreadId = input.messageThreadId;
        this.logger.log(
          `Using provided messageThreadId: ${messageThreadId} for reply`,
        );
      } else {
        // Thread doesn't exist, fall through to other methods
        this.logger.warn(
          `Provided messageThreadId ${input.messageThreadId} not found, looking for thread by inReplyTo`,
        );
        messageThreadId = await this.findOrCreateThreadId(
          input,
          messageRepository,
          messageThreadRepository,
          transactionManager,
        );
        isNewThread = !input.inReplyTo;
      }
    }
    // Priority 2: Look up thread by inReplyTo header
    else if (input.inReplyTo) {
      messageThreadId = await this.findOrCreateThreadId(
        input,
        messageRepository,
        messageThreadRepository,
        transactionManager,
      );
      // Only truly new if we didn't find an existing message to thread with
      const existingMessageByInReplyTo = await messageRepository.findOne({
        where: { headerMessageId: input.inReplyTo },
      });

      isNewThread = !existingMessageByInReplyTo;
    }
    // Priority 3: Create a new thread
    else {
      messageThreadId = v4();
      await messageThreadRepository.insert(
        { id: messageThreadId },
        transactionManager,
      );
      isNewThread = true;
      this.logger.log(`Created new thread: ${messageThreadId}`);
    }

    // Create the message
    const messageId = v4();
    const sentAt = input.sentAt ?? new Date();

    await messageRepository.insert(
      {
        id: messageId,
        headerMessageId: input.headerMessageId,
        subject: input.subject,
        text: input.text,
        receivedAt: sentAt,
        messageThreadId,
      },
      transactionManager,
    );

    this.logger.log(
      `Created message ${messageId} in thread ${messageThreadId}`,
    );

    // Create message channel association
    await messageChannelMessageAssociationRepository.insert(
      {
        messageChannelId: messageChannel.id,
        messageId,
        messageExternalId: input.externalMessageId ?? null,
        messageThreadExternalId: input.threadExternalId ?? null,
        direction: MessageDirection.OUTGOING,
      },
      transactionManager,
    );

    // Create participants
    const participants = this.buildParticipants(
      input,
      connectedAccount,
      messageId,
    );

    const createdParticipants = await messageParticipantRepository.insert(
      participants,
      transactionManager,
    );

    // Match participants with people/workspace members
    await this.matchParticipantService.matchParticipants({
      participants: createdParticipants.raw ?? [],
      objectMetadataName: 'messageParticipant',
      transactionManager,
      matchWith: 'workspaceMemberAndPerson',
      workspaceId,
    });

    this.logger.log(
      `Persisted sent message ${messageId} with ${participants.length} participants`,
    );

    return {
      messageId,
      messageThreadId,
      isNewThread,
    };
  }

  /**
   * Find an existing thread by inReplyTo header or create a new one.
   */
  private async findOrCreateThreadId(
    input: PersistSentMessageInput,
    messageRepository: Awaited<
      ReturnType<
        typeof this.globalWorkspaceOrmManager.getRepository<MessageWorkspaceEntity>
      >
    >,
    messageThreadRepository: Awaited<
      ReturnType<
        typeof this.globalWorkspaceOrmManager.getRepository<MessageThreadWorkspaceEntity>
      >
    >,
    transactionManager: WorkspaceEntityManager,
  ): Promise<string> {
    // Try to find the original message we're replying to
    if (input.inReplyTo) {
      const originalMessage = await messageRepository.findOne({
        where: { headerMessageId: input.inReplyTo },
      });

      if (originalMessage && originalMessage.messageThreadId) {
        this.logger.log(
          `Found existing thread ${originalMessage.messageThreadId} via inReplyTo: ${input.inReplyTo}`,
        );

        return originalMessage.messageThreadId;
      }

      this.logger.warn(
        `Could not find original message with headerMessageId: ${input.inReplyTo}`,
      );
    }

    // Create a new thread
    const newThreadId = v4();

    await messageThreadRepository.insert(
      { id: newThreadId },
      transactionManager,
    );

    this.logger.log(`Created new thread: ${newThreadId}`);

    return newThreadId;
  }

  /**
   * Build participant records from the input.
   */
  private buildParticipants(
    input: PersistSentMessageInput,
    connectedAccount: ConnectedAccountWorkspaceEntity,
    messageId: string,
  ): Pick<
    MessageParticipantWorkspaceEntity,
    'messageId' | 'handle' | 'displayName' | 'role'
  >[] {
    const participants: Pick<
      MessageParticipantWorkspaceEntity,
      'messageId' | 'handle' | 'displayName' | 'role'
    >[] = [];

    // FROM participant (the sender - connected account)
    participants.push({
      messageId,
      handle: connectedAccount.handle ?? '',
      displayName: connectedAccount.handle ?? '',
      role: MessageParticipantRole.FROM,
    });

    // TO participant
    if (input.to) {
      participants.push({
        messageId,
        handle: input.to.trim(),
        displayName: input.to.trim(),
        role: MessageParticipantRole.TO,
      });
    }

    // CC participants
    if (input.cc) {
      const ccEmails = input.cc.split(',').map((e) => e.trim());

      for (const email of ccEmails) {
        if (email) {
          participants.push({
            messageId,
            handle: email,
            displayName: email,
            role: MessageParticipantRole.CC,
          });
        }
      }
    }

    // BCC participants
    if (input.bcc) {
      const bccEmails = input.bcc.split(',').map((e) => e.trim());

      for (const email of bccEmails) {
        if (email) {
          participants.push({
            messageId,
            handle: email,
            displayName: email,
            role: MessageParticipantRole.BCC,
          });
        }
      }
    }

    return participants;
  }
}
