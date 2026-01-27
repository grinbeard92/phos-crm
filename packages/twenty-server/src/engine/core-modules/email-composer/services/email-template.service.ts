import { Injectable } from '@nestjs/common';

/**
 * Email template context for variable substitution.
 * Supports person, company, sender, and custom variables.
 */
export interface EmailTemplateContext {
  person?: {
    id?: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    jobTitle?: string;
    city?: string;
  };
  company?: {
    id?: string;
    name?: string;
    domainName?: string;
    address?: string;
    employees?: number;
  };
  sender?: {
    firstName?: string;
    lastName?: string;
    email?: string;
  };
  custom?: Record<string, unknown>;
}

/**
 * Available template variables that can be used in email templates.
 */
export const AVAILABLE_VARIABLES = [
  'person.id',
  'person.firstName',
  'person.lastName',
  'person.email',
  'person.phone',
  'person.jobTitle',
  'person.city',
  'company.id',
  'company.name',
  'company.domainName',
  'company.address',
  'company.employees',
  'sender.firstName',
  'sender.lastName',
  'sender.email',
] as const;

export type AvailableVariable = (typeof AVAILABLE_VARIABLES)[number];

/**
 * Service for resolving email template variables.
 * Handles both plain text ({{variable}}) and rich text (TipTap JSON) formats.
 *
 * @example
 * ```typescript
 * const service = new EmailTemplateService();
 * const result = service.resolveTemplate(
 *   'Hello {{person.firstName}}!',
 *   'Your email is {{person.email}}',
 *   { person: { firstName: 'John', email: 'john@example.com' } }
 * );
 * // result.subject = 'Hello John!'
 * // result.body = 'Your email is john@example.com'
 * ```
 */
@Injectable()
export class EmailTemplateService {
  /**
   * Resolves template variables in subject and body.
   */
  resolveTemplate(
    subject: string,
    body: string,
    context: EmailTemplateContext,
  ): { subject: string; body: string } {
    const flatContext = this.buildFlatContext(context);

    return {
      subject: this.resolveInput(subject, flatContext),
      body: this.isRichTextJson(body)
        ? this.resolveRichTextVariables(body, flatContext)
        : this.resolveInput(body, flatContext),
    };
  }

  /**
   * Extracts all variable names from a template string.
   */
  extractVariables(content: string): string[] {
    const variableRegex = /\{\{([^}]+)\}\}/g;
    const variables: string[] = [];
    let match;

    while ((match = variableRegex.exec(content)) !== null) {
      variables.push(match[1].trim());
    }

    return [...new Set(variables)];
  }

  /**
   * Validates that all variables in the content are supported.
   */
  validateVariables(variables: string[]): {
    valid: boolean;
    invalid: string[];
  } {
    const invalid = variables.filter(
      (v) =>
        !AVAILABLE_VARIABLES.includes(v as AvailableVariable) &&
        !v.startsWith('custom.'),
    );

    return {
      valid: invalid.length === 0,
      invalid,
    };
  }

  /**
   * Builds a flat key-value map from nested context.
   */
  private buildFlatContext(
    context: EmailTemplateContext,
  ): Record<string, string> {
    const flat: Record<string, string> = {};

    if (context.person) {
      Object.entries(context.person).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          flat[`person.${key}`] = String(value);
        }
      });
    }

    if (context.company) {
      Object.entries(context.company).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          flat[`company.${key}`] = String(value);
        }
      });
    }

    if (context.sender) {
      Object.entries(context.sender).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          flat[`sender.${key}`] = String(value);
        }
      });
    }

    if (context.custom) {
      Object.entries(context.custom).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          flat[`custom.${key}`] = String(value);
        }
      });
    }

    return flat;
  }

  /**
   * Resolves {{variable}} syntax in plain text.
   */
  private resolveInput(
    input: string,
    flatContext: Record<string, string>,
  ): string {
    return input.replace(/\{\{([^}]+)\}\}/g, (_, variable) => {
      const trimmed = variable.trim();

      return flatContext[trimmed] ?? '';
    });
  }

  /**
   * Checks if content is TipTap/BlockNote JSON format.
   */
  private isRichTextJson(content: string): boolean {
    if (!content.startsWith('[') && !content.startsWith('{')) {
      return false;
    }

    try {
      const parsed = JSON.parse(content);

      return (
        Array.isArray(parsed) ||
        (typeof parsed === 'object' && parsed !== null && 'type' in parsed)
      );
    } catch {
      return false;
    }
  }

  /**
   * Resolves variables in TipTap/BlockNote JSON content.
   * Handles variableTag nodes and text content with {{variable}} syntax.
   */
  private resolveRichTextVariables(
    jsonContent: string,
    flatContext: Record<string, string>,
  ): string {
    try {
      const parsed = JSON.parse(jsonContent);
      const resolved = this.resolveJsonNode(parsed, flatContext);

      return JSON.stringify(resolved);
    } catch {
      return jsonContent;
    }
  }

  /**
   * Recursively resolves variables in JSON nodes.
   */
  private resolveJsonNode(
    node: unknown,
    flatContext: Record<string, string>,
  ): unknown {
    if (Array.isArray(node)) {
      return node.map((item) => this.resolveJsonNode(item, flatContext));
    }

    if (typeof node === 'object' && node !== null) {
      const obj = node as Record<string, unknown>;

      // Handle variableTag nodes (TipTap)
      if (obj.type === 'variableTag' && obj.attrs) {
        const attrs = obj.attrs as Record<string, unknown>;
        const variable = attrs.variable as string;

        if (variable && flatContext[variable] !== undefined) {
          return {
            type: 'text',
            text: flatContext[variable],
          };
        }
      }

      // Handle text nodes with {{variable}} syntax
      if (obj.type === 'text' && typeof obj.text === 'string') {
        return {
          ...obj,
          text: this.resolveInput(obj.text, flatContext),
        };
      }

      // Recursively process all properties
      const resolved: Record<string, unknown> = {};

      for (const [key, value] of Object.entries(obj)) {
        resolved[key] = this.resolveJsonNode(value, flatContext);
      }

      return resolved;
    }

    // Handle string values
    if (typeof node === 'string') {
      return this.resolveInput(node, flatContext);
    }

    return node;
  }
}
