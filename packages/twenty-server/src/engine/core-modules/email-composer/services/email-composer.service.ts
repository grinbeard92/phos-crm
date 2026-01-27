import { Injectable, Logger } from '@nestjs/common';

import { SendEmailTool } from 'src/engine/core-modules/tool/tools/send-email-tool/send-email-tool';
import {
  EmailTemplateContext,
  EmailTemplateService,
} from 'src/engine/core-modules/email-composer/services/email-template.service';

/**
 * Input for sending an email through the composer.
 */
export interface SendEmailParams {
  /** Primary recipient email address */
  email: string;
  /** Email subject line */
  subject: string;
  /** Email body (BlockNote JSON or HTML) */
  body: string;
  /** Connected account ID for sending */
  connectedAccountId?: string;
  /** File attachments */
  files?: Array<{
    id: string;
    name: string;
    type: string;
  }>;
  /** Template context for variable substitution (optional) */
  templateContext?: EmailTemplateContext;
  /** RFC 5322 Message-ID of email being replied to (for threading) */
  inReplyTo?: string;
  /** Chain of Message-IDs for threading */
  references?: string[];
  /** Twenty's internal thread ID for persistence */
  messageThreadId?: string;
  /** CC recipients (comma-separated) */
  cc?: string;
  /** BCC recipients (comma-separated) */
  bcc?: string;
}

/**
 * Result of sending an email.
 */
export interface SendEmailResult {
  success: boolean;
  message: string;
  error?: string;
  recipient?: string;
  connectedAccountId?: string;
  /** RFC 5322 Message-ID we generated */
  messageId?: string;
  /** Twenty's internal thread ID */
  messageThreadId?: string;
}

/**
 * EmailComposerService orchestrates email composition and sending.
 * It integrates template variable resolution with the core email sending tool.
 *
 * This service is designed to be the single entry point for email operations,
 * making it easier to extract as a standalone module in the future.
 *
 * @example
 * ```typescript
 * const result = await emailComposerService.sendEmail(
 *   {
 *     email: 'recipient@example.com',
 *     subject: 'Hello {{person.firstName}}!',
 *     body: 'Your order is ready.',
 *     templateContext: { person: { firstName: 'John' } },
 *   },
 *   { workspaceId: 'workspace-123' }
 * );
 * ```
 */
@Injectable()
export class EmailComposerService {
  private readonly logger = new Logger(EmailComposerService.name);

  constructor(
    private readonly sendEmailTool: SendEmailTool,
    private readonly emailTemplateService: EmailTemplateService,
  ) {}

  /**
   * Sends an email with optional template variable resolution.
   *
   * @param params - Email parameters including recipient, subject, body, and optional template context
   * @param context - Workspace context for the email operation
   * @returns Result indicating success or failure with details
   */
  async sendEmail(
    params: SendEmailParams,
    context: { workspaceId: string },
  ): Promise<SendEmailResult> {
    const {
      email,
      subject,
      body,
      connectedAccountId,
      files,
      templateContext,
      inReplyTo,
      references,
      messageThreadId,
      cc,
      bcc,
    } = params;

    this.logger.log(
      `Sending email to ${email} in workspace ${context.workspaceId}${inReplyTo ? ` (reply to ${inReplyTo})` : ''}`,
    );

    try {
      // Resolve template variables if context is provided
      let resolvedSubject = subject;
      let resolvedBody = body;

      if (templateContext) {
        const resolved = this.emailTemplateService.resolveTemplate(
          subject,
          body,
          templateContext,
        );

        resolvedSubject = resolved.subject;
        resolvedBody = resolved.body;
      }

      // Prepare file attachments
      const preparedFiles = (files ?? []).map((file) => ({
        id: file.id,
        name: file.name,
        type: file.type,
        size: 0,
        createdAt: new Date().toISOString(),
      }));

      // Execute the send email tool with threading support
      const result = await this.sendEmailTool.execute(
        {
          email,
          subject: resolvedSubject,
          body: resolvedBody,
          connectedAccountId,
          files: preparedFiles,
          inReplyTo,
          references,
          messageThreadId,
          cc,
          bcc,
        },
        context,
      );

      const resultData = result.result as
        | {
            recipient?: string;
            connectedAccountId?: string;
            messageId?: string;
            messageThreadId?: string;
          }
        | undefined;

      return {
        success: result.success,
        message: result.message,
        error: result.error,
        recipient: resultData?.recipient,
        connectedAccountId: resultData?.connectedAccountId,
        messageId: resultData?.messageId,
        messageThreadId: resultData?.messageThreadId,
      };
    } catch (error) {
      this.logger.error(`Failed to send email to ${email}`, error);

      return {
        success: false,
        message: 'Failed to send email',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Validates a template and returns extracted variables.
   *
   * @param subject - Template subject line
   * @param body - Template body content
   * @returns Validation result with extracted variables
   */
  validateTemplate(
    subject: string,
    body: string,
  ): {
    valid: boolean;
    variables: string[];
    invalidVariables: string[];
  } {
    const subjectVars = this.emailTemplateService.extractVariables(subject);
    const bodyVars = this.emailTemplateService.extractVariables(body);
    const allVariables = [...new Set([...subjectVars, ...bodyVars])];

    const validation =
      this.emailTemplateService.validateVariables(allVariables);

    return {
      valid: validation.valid,
      variables: allVariables,
      invalidVariables: validation.invalid,
    };
  }

  /**
   * Previews a template with the given context.
   *
   * @param subject - Template subject line
   * @param body - Template body content
   * @param context - Template context for variable substitution
   * @returns Resolved subject and body
   */
  previewTemplate(
    subject: string,
    body: string,
    context: EmailTemplateContext,
  ): { subject: string; body: string } {
    return this.emailTemplateService.resolveTemplate(subject, body, context);
  }
}
