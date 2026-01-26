import { Injectable, Logger } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';

import { DataSource } from 'typeorm';

import { OnDatabaseBatchEvent } from 'src/engine/api/graphql/graphql-query-runner/decorators/on-database-batch-event.decorator';
import { DatabaseEventAction } from 'src/engine/api/graphql/graphql-query-runner/enums/database-event-action.enum';
import type { ObjectRecordBaseEvent } from 'src/engine/core-modules/event-emitter/types/object-record.base.event';
import { getWorkspaceSchemaName } from 'src/engine/workspace-datasource/utils/get-workspace-schema-name.util';

@Injectable()
export class OpportunityStageChangeListener {
  private readonly logger = new Logger(OpportunityStageChangeListener.name);

  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  @OnDatabaseBatchEvent('opportunity', DatabaseEventAction.UPDATED)
  async handleOpportunityUpdate(
    payload: ObjectRecordBaseEvent,
  ): Promise<void> {
    const { workspaceId, objectMetadata, recordIds, properties } = payload;

    // Only process if stage field was updated
    if (!properties?.diff?.stage) {
      return;
    }

    this.logger.log(
      `Opportunity stage changed for ${recordIds.length} record(s) in workspace ${workspaceId}`,
    );

    try {
      const schemaName = getWorkspaceSchemaName(workspaceId);

      // Reset daysInStage to 0 when stage changes
      const result = await this.dataSource.query(
        `
        UPDATE ${schemaName}."opportunity"
        SET "daysInStage" = 0
        WHERE id = ANY($1::uuid[])
        AND "deletedAt" IS NULL
        RETURNING id, name, stage, "daysInStage"
        `,
        [recordIds],
      );

      this.logger.log(
        `Reset daysInStage to 0 for ${result.length} opportunity(ies) after stage change`,
      );
    } catch (error) {
      this.logger.error(
        `Error resetting daysInStage for workspace ${workspaceId}`,
        error,
      );
    }
  }
}
