import { UseGuards } from '@nestjs/common';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';

import { WorkspaceEntity } from 'src/engine/core-modules/workspace/workspace.entity';
import { AuthWorkspace } from 'src/engine/decorators/auth/auth-workspace.decorator';
import { NoPermissionGuard } from 'src/engine/guards/no-permission.guard';
import { WorkspaceAuthGuard } from 'src/engine/guards/workspace-auth.guard';
import { SendEmailInput } from 'src/engine/core-modules/email-composer/dtos/send-email.input';
import { SendEmailOutput } from 'src/engine/core-modules/email-composer/dtos/send-email.output';
import { EmailComposerService } from 'src/engine/core-modules/email-composer/services/email-composer.service';
import {
  ValidateTemplateInput,
  ValidateTemplateOutput,
} from 'src/engine/core-modules/email-composer/dtos/validate-template.dto';

/**
 * GraphQL resolver for email composition operations.
 * Uses EmailComposerService for all business logic.
 */
@Resolver()
export class EmailComposerResolver {
  constructor(private readonly emailComposerService: EmailComposerService) {}

  /**
   * Sends an email with optional template variable resolution.
   */
  @Mutation(() => SendEmailOutput)
  @UseGuards(WorkspaceAuthGuard, NoPermissionGuard)
  async sendEmail(
    @Args('input') input: SendEmailInput,
    @AuthWorkspace() workspace: WorkspaceEntity,
  ): Promise<SendEmailOutput> {
    const result = await this.emailComposerService.sendEmail(
      {
        email: input.email,
        subject: input.subject,
        body: input.body,
        connectedAccountId: input.connectedAccountId,
        files: input.files,
        templateContext: input.templateContext,
        // Threading support
        inReplyTo: input.inReplyTo,
        references: input.references,
        messageThreadId: input.messageThreadId,
        // Additional recipients
        cc: input.cc,
        bcc: input.bcc,
      },
      { workspaceId: workspace.id },
    );

    return {
      success: result.success,
      message: result.message,
      error: result.error,
      recipient: result.recipient,
      connectedAccountId: result.connectedAccountId,
      messageId: result.messageId,
      messageThreadId: result.messageThreadId,
    };
  }

  /**
   * Validates a template and returns extracted variables.
   */
  @Query(() => ValidateTemplateOutput)
  @UseGuards(WorkspaceAuthGuard, NoPermissionGuard)
  validateEmailTemplate(
    @Args('input') input: ValidateTemplateInput,
  ): ValidateTemplateOutput {
    const result = this.emailComposerService.validateTemplate(
      input.subject,
      input.body,
    );

    return {
      valid: result.valid,
      variables: result.variables,
      invalidVariables: result.invalidVariables,
    };
  }
}
