import { Injectable, Logger } from '@nestjs/common';

import { type ImapFlow } from 'imapflow';

import {
  MessageImportDriverException,
  MessageImportDriverExceptionCode,
} from 'src/modules/messaging/message-import-manager/drivers/exceptions/message-import-driver.exception';
import { canUseQresync } from 'src/modules/messaging/message-import-manager/drivers/imap/utils/can-use-qresync.util';
import { type MailboxState } from 'src/modules/messaging/message-import-manager/drivers/imap/utils/extract-mailbox-state.util';
import { type ImapSyncCursor } from 'src/modules/messaging/message-import-manager/drivers/imap/utils/parse-sync-cursor.util';

type SyncResult = {
  messageUids: number[];
};

@Injectable()
export class ImapSyncService {
  private readonly logger = new Logger(ImapSyncService.name);

  async syncFolder(
    client: ImapFlow,
    folderPath: string,
    previousCursor: ImapSyncCursor | null,
    mailboxState: MailboxState,
    sinceDate?: Date,
  ): Promise<SyncResult> {
    this.validateUidValidity(previousCursor, mailboxState, folderPath);

    const messageUids = await this.fetchNewMessageUids(
      client,
      previousCursor,
      mailboxState,
      folderPath,
      sinceDate,
    );

    return { messageUids };
  }

  private validateUidValidity(
    previousCursor: ImapSyncCursor | null,
    mailboxState: MailboxState,
    folderPath: string,
  ): void {
    const previousUidValidity = previousCursor?.uidValidity ?? 0;
    const { uidValidity } = mailboxState;

    if (previousUidValidity !== 0 && previousUidValidity !== uidValidity) {
      this.logger.warn(
        `UID validity changed from ${previousUidValidity} to ${uidValidity} in ${folderPath}. Full resync required.`,
      );

      throw new MessageImportDriverException(
        `IMAP UID validity changed for folder ${folderPath}`,
        MessageImportDriverExceptionCode.SYNC_CURSOR_ERROR,
      );
    }
  }

  private async fetchNewMessageUids(
    client: ImapFlow,
    previousCursor: ImapSyncCursor | null,
    mailboxState: MailboxState,
    folderPath: string,
    sinceDate?: Date,
  ): Promise<number[]> {
    const lastSyncedUid = previousCursor?.highestUid ?? 0;
    const { maxUid } = mailboxState;

    // For initial sync (no previous cursor), apply date filter if specified
    const isInitialSync = previousCursor === null || lastSyncedUid === 0;

    if (isInitialSync && sinceDate !== undefined) {
      this.logger.log(
        `Using date-filtered search for initial sync in folder ${folderPath}`,
      );

      return this.fetchWithDateFilter(client, sinceDate);
    }

    if (canUseQresync(client, previousCursor, mailboxState)) {
      this.logger.log(`Using QRESYNC for folder ${folderPath}`);

      try {
        return await this.fetchWithQresync(
          client,
          lastSyncedUid,
          BigInt(previousCursor!.modSeq!),
        );
      } catch (error) {
        this.logger.warn(
          `QRESYNC failed for ${folderPath}, falling back to UID range: ${error.message}`,
        );
      }
    }

    this.logger.log(`Using UID range fetch for folder ${folderPath}`);

    return this.fetchWithUidRange(client, lastSyncedUid, maxUid);
  }

  private async fetchWithDateFilter(
    client: ImapFlow,
    sinceDate: Date,
  ): Promise<number[]> {
    // IMAP SINCE search uses date without time (DD-Mon-YYYY format)
    const uids = await client.search({ since: sinceDate }, { uid: true });

    if (!uids || !Array.isArray(uids)) {
      return [];
    }

    this.logger.log(`Date filter search found ${uids.length} messages`);

    return uids;
  }

  private async fetchWithUidRange(
    client: ImapFlow,
    lastSyncedUid: number,
    highestAvailableUid: number,
  ): Promise<number[]> {
    if (lastSyncedUid >= highestAvailableUid) {
      return [];
    }

    const uidRange = `${lastSyncedUid + 1}:${highestAvailableUid}`;
    const uids = await client.search({ uid: uidRange }, { uid: true });

    if (!uids || !Array.isArray(uids)) {
      return [];
    }

    return uids;
  }

  private async fetchWithQresync(
    client: ImapFlow,
    lastSyncedUid: number,
    lastModSeq: bigint,
  ): Promise<number[]> {
    const uids = await client.search(
      {
        modseq: lastModSeq + BigInt(1),
        uid: `${lastSyncedUid + 1}:*`,
      },
      { uid: true },
    );

    if (!uids || !Array.isArray(uids) || !uids.length) {
      return [];
    }

    this.logger.log(`QRESYNC found ${uids.length} new/modified messages`);

    return uids;
  }
}
