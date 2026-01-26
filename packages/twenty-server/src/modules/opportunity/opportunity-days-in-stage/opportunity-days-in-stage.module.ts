import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { WorkspaceEntity } from 'src/engine/core-modules/workspace/workspace.entity';
import { OpportunityDaysInStageCronCommand } from 'src/modules/opportunity/opportunity-days-in-stage/commands/opportunity-days-in-stage.cron.command';
import { OpportunityDaysInStageCronJob } from 'src/modules/opportunity/opportunity-days-in-stage/crons/jobs/opportunity-days-in-stage.cron.job';
import { CalculateOpportunityDaysInStageJob } from 'src/modules/opportunity/opportunity-days-in-stage/jobs/calculate-opportunity-days-in-stage.job';
import { OpportunityStageChangeListener } from 'src/modules/opportunity/opportunity-days-in-stage/listeners/opportunity-stage-change.listener';

@Module({
  imports: [TypeOrmModule.forFeature([WorkspaceEntity])],
  providers: [
    OpportunityDaysInStageCronJob,
    OpportunityDaysInStageCronCommand,
    CalculateOpportunityDaysInStageJob,
    OpportunityStageChangeListener,
  ],
})
export class OpportunityDaysInStageModule {}
