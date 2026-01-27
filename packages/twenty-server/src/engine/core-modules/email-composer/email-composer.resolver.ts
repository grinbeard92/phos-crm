import { UseGuards } from '@nestjs/common';
import { Args, Mutation, Resolver } from '@nestjs/graphql';

import { SendEmailTool } from 'src/engine/core-modules/tool/tools/send-email-tool/send-email-tool';
import { WorkspaceEntity } from 'src/engine/core-modules/workspace/workspace.entity';
import { AuthWorkspace } from 'src/engine/decorators/auth/auth-workspace.decorator';
import { NoPermissionGuard } from 'src/engine/guards/no-permission.guard';
import { WorkspaceAuthGuard } from 'src/engine/guards/workspace-auth.guard';
import { SendEmailInput } from 'src/engine/core-modules/email-composer/dtos/send-email.input';
import { SendEmailOutput } from 'src/engine/core-modules/email-composer/dtos/send-email.output';

type SendEmailResult = {
  recipient?: string;
  connectedAccountId?: string;
};

@Resolver()
export class EmailComposerResolver {
  constructor(private readonly sendEmailTool: SendEmailTool) {}

  @Mutation(() => SendEmailOutput)
  @UseGuards(WorkspaceAuthGuard, NoPermissionGuard)
  async sendEmail(
    @Args('input') input: SendEmailInput,
    @AuthWorkspace() workspace: WorkspaceEntity,
  ): Promise<SendEmailOutput> {
    const files = (input.files ?? []).map((file) => ({
      id: file.id,
      name: file.name,
      type: file.type,
      size: 0,
      createdAt: new Date().toISOString(),
    }));

    const result = await this.sendEmailTool.execute(
      {
        email: input.email,
        subject: input.subject,
        body: input.body,
        connectedAccountId: input.connectedAccountId,
        files,
      },
      {
        workspaceId: workspace.id,
      },
    );

    const resultData = result.result as SendEmailResult | undefined;

    return {
      success: result.success,
      message: result.message,
      error: result.error,
      recipient: resultData?.recipient,
      connectedAccountId: resultData?.connectedAccountId,
    };
  }
}
