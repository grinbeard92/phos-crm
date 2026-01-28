import { Injectable, Logger } from '@nestjs/common';

import {
  PageIterator,
  type PageCollection,
  type PageIteratorCallback,
} from '@microsoft/microsoft-graph-client';
import { isNonEmptyString } from '@sniptt/guards';
import pLimit from 'p-limit';

import { OAuth2ClientManagerService } from 'src/modules/connected-account/oauth2-client-manager/services/oauth2-client-manager.service';
import { type ConnectedAccountWorkspaceEntity } from 'src/modules/connected-account/standard-objects/connected-account.workspace-entity';
import { MessageFolderImportPolicy } from 'src/modules/messaging/common/standard-objects/message-channel.workspace-entity';
import { type MessageFolderWorkspaceEntity } from 'src/modules/messaging/common/standard-objects/message-folder.workspace-entity';
import { MicrosoftMessageListFetchErrorHandler } from 'src/modules/messaging/message-import-manager/drivers/microsoft/services/microsoft-message-list-fetch-error-handler.service';
import { type GetMessageListsArgs } from 'src/modules/messaging/message-import-manager/types/get-message-lists-args.type';
import {
  type GetMessageListsResponse,
  type GetOneMessageListResponse,
} from 'src/modules/messaging/message-import-manager/types/get-message-lists-response.type';

// Microsoft API limit is 999 messages per request on this endpoint
const MESSAGING_MICROSOFT_USERS_MESSAGES_LIST_MAX_RESULT = 999;

/* reference: https://learn.microsoft.com/en-us/graph/throttling-limits#limits-per-mailbox */
const FOLDER_PROCESSING_CONCURRENCY = 4;

@Injectable()
export class MicrosoftGetMessageListService {
  private readonly logger = new Logger(MicrosoftGetMessageListService.name);
  constructor(
    private readonly oAuth2ClientManagerService: OAuth2ClientManagerService,
    private readonly microsoftMessageListFetchErrorHandler: MicrosoftMessageListFetchErrorHandler,
  ) {}

  public async getMessageLists({
    messageChannel,
    connectedAccount,
    messageFolders,
  }: GetMessageListsArgs): Promise<GetMessageListsResponse> {
    const foldersToProcess =
      messageChannel.messageFolderImportPolicy ===
      MessageFolderImportPolicy.SELECTED_FOLDERS
        ? messageFolders.filter((folder) => folder.isSynced)
        : messageFolders;

    if (foldersToProcess.length === 0) {
      this.logger.warn(
        `Connected account ${connectedAccount.id}: Message Channel: ${messageChannel.id}: No folders to process`,
      );

      return [];
    }

    // Calculate date filter for initial sync based on syncHistoryDepthDays
    const syncHistoryDepthDays = messageChannel.syncHistoryDepthDays ?? 30;
    let dateFilter: string | undefined;

    if (syncHistoryDepthDays > 0) {
      const afterDate = new Date();

      afterDate.setDate(afterDate.getDate() - syncHistoryDepthDays);
      // Microsoft Graph uses ISO 8601 format for date filters
      dateFilter = afterDate.toISOString();
      this.logger.log(
        `Connected account ${connectedAccount.id}: Applying date filter for initial sync: receivedDateTime ge ${dateFilter}`,
      );
    }

    const limit = pLimit(FOLDER_PROCESSING_CONCURRENCY);

    const results = await Promise.all(
      foldersToProcess.map((folder) =>
        limit(async () => {
          const response = await this.getMessageList(
            connectedAccount,
            folder,
            dateFilter,
          );

          return {
            ...response,
            folderId: folder.id,
          };
        }),
      ),
    );

    return results;
  }

  public async getMessageList(
    connectedAccount: Pick<
      ConnectedAccountWorkspaceEntity,
      'provider' | 'accessToken' | 'id'
    >,
    messageFolder: Pick<
      MessageFolderWorkspaceEntity,
      'name' | 'syncCursor' | 'externalId'
    >,
    dateFilter?: string,
  ): Promise<GetOneMessageListResponse> {
    const messageExternalIds: string[] = [];
    const messageExternalIdsToDelete: string[] = [];

    const microsoftClient =
      await this.oAuth2ClientManagerService.getMicrosoftOAuth2Client(
        connectedAccount,
      );

    const folderId = messageFolder.externalId || messageFolder.name;

    // Build API URL with optional date filter for initial sync
    let apiUrl: string;

    if (isNonEmptyString(messageFolder.syncCursor)) {
      // Incremental sync - use cursor
      apiUrl = messageFolder.syncCursor;
    } else {
      // Initial sync - apply date filter if specified
      const baseUrl = `/me/mailfolders/${folderId}/messages/delta?$select=id`;

      apiUrl =
        dateFilter !== undefined
          ? `${baseUrl}&$filter=receivedDateTime ge ${dateFilter}`
          : baseUrl;
    }

    const response: PageCollection = await microsoftClient
      .api(apiUrl)
      .version('beta')
      .headers({
        Prefer: `odata.maxpagesize=${MESSAGING_MICROSOFT_USERS_MESSAGES_LIST_MAX_RESULT}, IdType="ImmutableId"`,
      })
      .get()
      .catch((error) => {
        this.logger.error(
          `Connected account ${connectedAccount.id}: Error fetching message list: ${JSON.stringify(error)}`,
        );
        this.microsoftMessageListFetchErrorHandler.handleError(error);
      });

    const callback: PageIteratorCallback = (data) => {
      if (data['@removed']) {
        messageExternalIdsToDelete.push(data.id);
      } else {
        messageExternalIds.push(data.id);
      }

      return true;
    };

    const pageIterator = new PageIterator(microsoftClient, response, callback, {
      headers: {
        Prefer: `odata.maxpagesize=${MESSAGING_MICROSOFT_USERS_MESSAGES_LIST_MAX_RESULT}, IdType="ImmutableId"`,
      },
    });

    await pageIterator.iterate().catch((error) => {
      this.microsoftMessageListFetchErrorHandler.handleError(error);
    });

    return {
      messageExternalIds,
      messageExternalIdsToDelete,
      previousSyncCursor: messageFolder.syncCursor,
      nextSyncCursor: pageIterator.getDeltaLink() || '',
      folderId: undefined,
    };
  }
}
