import { Module } from '@nestjs/common';

import { ToolModule } from 'src/engine/core-modules/tool/tool.module';
import { EmailComposerResolver } from 'src/engine/core-modules/email-composer/email-composer.resolver';

@Module({
  imports: [ToolModule],
  providers: [EmailComposerResolver],
  exports: [],
})
export class EmailComposerModule {}
