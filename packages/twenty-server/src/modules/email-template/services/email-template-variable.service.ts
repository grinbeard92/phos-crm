import { Injectable } from '@nestjs/common';

import {
  resolveInput,
  resolveRichTextVariables,
} from 'twenty-shared/utils';

export interface EmailTemplateContext {
  person?: {
    id?: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    jobTitle?: string;
    linkedinLink?: string;
    city?: string;
  };
  company?: {
    id?: string;
    name?: string;
    domainName?: string;
    address?: string;
    employees?: number;
    linkedinLink?: string;
    xLink?: string;
  };
  sender?: {
    firstName?: string;
    lastName?: string;
    email?: string;
  };
  custom?: Record<string, unknown>;
}

export interface ResolvedEmailTemplate {
  subject: string;
  body: string;
}

@Injectable()
export class EmailTemplateVariableService {
  /**
   * Available variables for email templates with their descriptions
   */
  static readonly AVAILABLE_VARIABLES = {
    'person.firstName': 'Contact first name',
    'person.lastName': 'Contact last name',
    'person.email': 'Contact email address',
    'person.phone': 'Contact phone number',
    'person.jobTitle': 'Contact job title',
    'person.city': 'Contact city',
    'company.name': 'Company name',
    'company.domainName': 'Company domain',
    'company.address': 'Company address',
    'company.employees': 'Number of employees',
    'sender.firstName': 'Your first name',
    'sender.lastName': 'Your last name',
    'sender.email': 'Your email address',
  } as const;

  /**
   * Resolves variables in an email template subject and body
   */
  resolveTemplate(
    subject: string,
    body: string,
    context: EmailTemplateContext,
  ): ResolvedEmailTemplate {
    const flatContext = this.buildFlatContext(context);

    // Resolve subject (plain text with {{variable}} syntax)
    const resolvedSubject = resolveInput(subject, flatContext) as string;

    // Resolve body (TipTap JSON with variableTag nodes)
    const resolvedBody = this.isRichTextJson(body)
      ? resolveRichTextVariables(body, flatContext) ?? body
      : (resolveInput(body, flatContext) as string);

    return {
      subject: resolvedSubject,
      body: resolvedBody,
    };
  }

  /**
   * Extracts variable names used in a template
   */
  extractVariables(content: string): string[] {
    const variablePattern = /\{\{([^{}]+)\}\}/g;
    const variables: string[] = [];
    let match;

    while ((match = variablePattern.exec(content)) !== null) {
      const variable = match[1].trim();
      if (!variables.includes(variable)) {
        variables.push(variable);
      }
    }

    return variables;
  }

  /**
   * Validates that all variables in the template are supported
   */
  validateVariables(variables: string[]): {
    valid: boolean;
    unsupported: string[];
  } {
    const supportedVariables = Object.keys(
      EmailTemplateVariableService.AVAILABLE_VARIABLES,
    );
    const unsupported = variables.filter(
      (v) => !supportedVariables.includes(v) && !v.startsWith('custom.'),
    );

    return {
      valid: unsupported.length === 0,
      unsupported,
    };
  }

  /**
   * Builds a flat context object for variable resolution
   */
  private buildFlatContext(
    context: EmailTemplateContext,
  ): Record<string, unknown> {
    return {
      person: context.person ?? {},
      company: context.company ?? {},
      sender: context.sender ?? {},
      ...context.custom,
    };
  }

  /**
   * Checks if the body is TipTap JSON format
   */
  private isRichTextJson(body: string): boolean {
    if (!body) return false;
    const trimmed = body.trim();
    return trimmed.startsWith('{') || trimmed.startsWith('[');
  }
}
