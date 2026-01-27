import { Module } from '@nestjs/common';

import { EmailTemplateVariableService } from './services/email-template-variable.service';

@Module({
  providers: [EmailTemplateVariableService],
  exports: [EmailTemplateVariableService],
})
export class EmailTemplateModule {}
