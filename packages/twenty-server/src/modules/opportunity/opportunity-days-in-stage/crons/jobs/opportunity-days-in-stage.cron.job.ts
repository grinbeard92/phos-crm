import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { WorkspaceActivationStatus } from 'twenty-shared/workspace';
import { Repository } from 'typeorm';

import { SentryCronMonitor } from 'src/engine/core-modules/cron/sentry-cron-monitor.decorator';
import { ExceptionHandlerService } from 'src/engine/core-modules/exception-handler/exception-handler.service';
import { InjectMessageQueue } from 'src/engine/core-modules/message-queue/decorators/message-queue.decorator';
import { Process } from 'src/engine/core-modules/message-queue/decorators/process.decorator';
import { Processor } from 'src/engine/core-modules/message-queue/decorators/processor.decorator';
import { MessageQueue } from 'src/engine/core-modules/message-queue/message-queue.constants';
import { MessageQueueService } from 'src/engine/core-modules/message-queue/services/message-queue.service';
import { WorkspaceEntity } from 'src/engine/core-modules/workspace/workspace.entity';
import { OPPORTUNITY_DAYS_IN_STAGE_CRON_PATTERN } from 'src/modules/opportunity/opportunity-days-in-stage/constants/opportunity-days-in-stage-cron-pattern.constant';
import {
  CalculateOpportunityDaysInStageJob,
  type CalculateOpportunityDaysInStageJobData,
} from 'src/modules/opportunity/opportunity-days-in-stage/jobs/calculate-opportunity-days-in-stage.job';

@Injectable()
@Processor(MessageQueue.cronQueue)
export class OpportunityDaysInStageCronJob {
  private readonly logger = new Logger(OpportunityDaysInStageCronJob.name);

  constructor(
    @InjectRepository(WorkspaceEntity)
    private readonly workspaceRepository: Repository<WorkspaceEntity>,
    @InjectMessageQueue(MessageQueue.workspaceQueue)
    private readonly messageQueueService: MessageQueueService,
    private readonly exceptionHandlerService: ExceptionHandlerService,
  ) {}

  @Process(OpportunityDaysInStageCronJob.name)
  @SentryCronMonitor(
    OpportunityDaysInStageCronJob.name,
    OPPORTUNITY_DAYS_IN_STAGE_CRON_PATTERN,
  )
  async handle(): Promise<void> {
    const workspaces = await this.workspaceRepository.find({
      where: {
        activationStatus: WorkspaceActivationStatus.ACTIVE,
      },
    });

    if (workspaces.length === 0) {
      this.logger.log('No active workspaces found for days-in-stage calculation');

      return;
    }

    this.logger.log(
      `Enqueuing days-in-stage calculation for ${workspaces.length} workspace(s)`,
    );

    for (const workspace of workspaces) {
      try {
        await this.messageQueueService.add<CalculateOpportunityDaysInStageJobData>(
          CalculateOpportunityDaysInStageJob.name,
          {
            workspaceId: workspace.id,
          },
        );
      } catch (error) {
        this.exceptionHandlerService.captureExceptions([error], {
          workspace: {
            id: workspace.id,
          },
        });
      }
    }
  }
}
