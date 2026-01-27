import { Module } from '@nestjs/common';

import { EmailTemplateVariableService } from './services/email-template-variable.service';

// Note: EmailComposerResolver (sendEmail mutation) is now in core-modules/email-composer
// This module only provides the EmailTemplateVariableService for template variable expansion

@Module({
  imports: [],
  providers: [EmailTemplateVariableService],
  exports: [EmailTemplateVariableService],
})
export class EmailTemplateModule {}
