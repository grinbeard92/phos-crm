import { Logger, Scope } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';

import { DataSource } from 'typeorm';

import { Process } from 'src/engine/core-modules/message-queue/decorators/process.decorator';
import { Processor } from 'src/engine/core-modules/message-queue/decorators/processor.decorator';
import { MessageQueue } from 'src/engine/core-modules/message-queue/message-queue.constants';
import { getWorkspaceSchemaName } from 'src/engine/workspace-datasource/utils/get-workspace-schema-name.util';

export type CalculateOpportunityDaysInStageJobData = {
  workspaceId: string;
};

@Processor({
  queueName: MessageQueue.workspaceQueue,
  scope: Scope.REQUEST,
})
export class CalculateOpportunityDaysInStageJob {
  private readonly logger = new Logger(CalculateOpportunityDaysInStageJob.name);

  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  @Process(CalculateOpportunityDaysInStageJob.name)
  async handle(data: CalculateOpportunityDaysInStageJobData): Promise<void> {
    const { workspaceId } = data;

    this.logger.log(
      `Calculating days-in-stage for opportunities in workspace ${workspaceId}`,
    );

    try {
      const schemaName = getWorkspaceSchemaName(workspaceId);

      // Calculate days since last stage update (using updatedAt as proxy for stage change)
      // Formula: EXTRACT(DAY FROM NOW() - "updatedAt")::integer
      const result = await this.dataSource.query(
        `
        UPDATE ${schemaName}."opportunity"
        SET "daysInStage" = EXTRACT(DAY FROM NOW() - "updatedAt")::integer
        WHERE "deletedAt" IS NULL
        RETURNING id, name, stage, "daysInStage"
        `,
      );

      this.logger.log(
        `Updated ${result.length} opportunities in workspace ${workspaceId}`,
      );
    } catch (error) {
      this.logger.error(
        `Error calculating days-in-stage for workspace ${workspaceId}`,
        error,
      );
      throw error;
    }
  }
}
