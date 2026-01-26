import { Command, CommandRunner } from 'nest-commander';

import { InjectMessageQueue } from 'src/engine/core-modules/message-queue/decorators/message-queue.decorator';
import { MessageQueue } from 'src/engine/core-modules/message-queue/message-queue.constants';
import { MessageQueueService } from 'src/engine/core-modules/message-queue/services/message-queue.service';
import { OPPORTUNITY_DAYS_IN_STAGE_CRON_PATTERN } from 'src/modules/opportunity/opportunity-days-in-stage/constants/opportunity-days-in-stage-cron-pattern.constant';
import { OpportunityDaysInStageCronJob } from 'src/modules/opportunity/opportunity-days-in-stage/crons/jobs/opportunity-days-in-stage.cron.job';

@Command({
  name: 'cron:opportunity:days-in-stage',
  description:
    'Starts a cron job to calculate days-in-stage for all opportunities',
})
export class OpportunityDaysInStageCronCommand extends CommandRunner {
  constructor(
    @InjectMessageQueue(MessageQueue.cronQueue)
    private readonly messageQueueService: MessageQueueService,
  ) {
    super();
  }

  async run(): Promise<void> {
    await this.messageQueueService.addCron<undefined>({
      jobName: OpportunityDaysInStageCronJob.name,
      data: undefined,
      options: {
        repeat: {
          pattern: OPPORTUNITY_DAYS_IN_STAGE_CRON_PATTERN,
        },
      },
    });
  }
}
