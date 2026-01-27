import { Logger } from '@nestjs/common';

import { Command, CommandRunner, Option } from 'nest-commander';

import { PhosSeederService } from 'src/engine/workspace-manager/phos-seeder/services/phos-seeder.service';

interface PhosSeederOptions {
  workspaceId: string;
}

@Command({
  name: 'workspace:seed:phos',
  description:
    'Seeds Phos Industries custom objects (Project, Expense, Quote, Invoice, Payment) for a workspace',
})
export class PhosSeedCommand extends CommandRunner {
  private readonly logger = new Logger(PhosSeedCommand.name);

  constructor(private readonly phosSeederService: PhosSeederService) {
    super();
  }

  @Option({
    flags: '-w, --workspace-id <workspaceId>',
    description: 'Workspace ID to seed custom objects into',
    required: true,
  })
  parseWorkspaceId(val: string): string {
    return val;
  }

  async run(
    _passedParams: string[],
    options: PhosSeederOptions,
  ): Promise<void> {
    const { workspaceId } = options;

    if (!workspaceId) {
      this.logger.error('Workspace ID is required. Use --workspace-id <id>');

      return;
    }

    this.logger.log(
      `Starting Phos Industries seeder for workspace: ${workspaceId}`,
    );

    try {
      await this.phosSeederService.seed(workspaceId);
      this.logger.log('Phos Industries seeder completed successfully');
    } catch (error) {
      this.logger.error('Phos Industries seeder failed:', error);
      this.logger.error((error as Error).stack);
    }
  }
}
