import { Module } from '@nestjs/common';

import { ToolModule } from 'src/engine/core-modules/tool/tool.module';
import { EmailTemplateResolver } from './email-template.resolver';
import { EmailTemplateVariableService } from './services/email-template-variable.service';

@Module({
  imports: [ToolModule],
  providers: [EmailTemplateVariableService, EmailTemplateResolver],
  exports: [EmailTemplateVariableService],
})
export class EmailTemplateModule {}
