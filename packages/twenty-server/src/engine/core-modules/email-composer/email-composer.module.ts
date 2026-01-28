import { Module } from '@nestjs/common';

import { ToolModule } from 'src/engine/core-modules/tool/tool.module';
import { EmailComposerResolver } from 'src/engine/core-modules/email-composer/email-composer.resolver';
import { EmailComposerService } from 'src/engine/core-modules/email-composer/services/email-composer.service';
import { EmailTemplateService } from 'src/engine/core-modules/email-composer/services/email-template.service';

@Module({
  imports: [ToolModule],
  providers: [
    EmailComposerResolver,
    EmailComposerService,
    EmailTemplateService,
  ],
  exports: [EmailComposerService, EmailTemplateService],
})
export class EmailComposerModule {}
