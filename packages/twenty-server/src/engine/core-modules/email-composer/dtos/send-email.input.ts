import { Field, InputType } from '@nestjs/graphql';

import GraphQLJSON from 'graphql-type-json';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

/**
 * Input for file attachments in emails.
 */
@InputType()
export class EmailFileInput {
  @Field()
  @IsUUID()
  id: string;

  @Field()
  @IsString()
  name: string;

  @Field()
  @IsString()
  type: string;
}

/**
 * Template context for variable substitution.
 * Supports person, company, sender, and custom variables.
 *
 * @example
 * ```json
 * {
 *   "person": { "firstName": "John", "email": "john@example.com" },
 *   "company": { "name": "Acme Corp" },
 *   "sender": { "firstName": "Jane" }
 * }
 * ```
 */
@InputType()
export class EmailTemplateContextInput {
  @Field(() => GraphQLJSON, { nullable: true })
  @IsOptional()
  person?: {
    id?: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    jobTitle?: string;
    city?: string;
  };

  @Field(() => GraphQLJSON, { nullable: true })
  @IsOptional()
  company?: {
    id?: string;
    name?: string;
    domainName?: string;
    address?: string;
    employees?: number;
  };

  @Field(() => GraphQLJSON, { nullable: true })
  @IsOptional()
  sender?: {
    firstName?: string;
    lastName?: string;
    email?: string;
  };

  @Field(() => GraphQLJSON, { nullable: true })
  @IsOptional()
  custom?: Record<string, unknown>;
}

/**
 * Input for sending an email through the composer.
 */
@InputType()
export class SendEmailInput {
  @Field()
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  subject: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  body: string;

  @Field({ nullable: true })
  @IsUUID()
  @IsOptional()
  connectedAccountId?: string;

  @Field(() => [EmailFileInput], { nullable: true })
  @IsOptional()
  files?: EmailFileInput[];

  @Field(() => EmailTemplateContextInput, { nullable: true })
  @IsOptional()
  templateContext?: EmailTemplateContextInput;

  // Threading support for email replies
  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  inReplyTo?: string; // RFC 5322 Message-ID of email being replied to

  @Field(() => [String], { nullable: true })
  @IsOptional()
  references?: string[]; // Chain of Message-IDs for threading

  @Field({ nullable: true })
  @IsUUID()
  @IsOptional()
  messageThreadId?: string; // Twenty's internal thread ID for persistence

  // Additional recipients
  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  cc?: string; // CC recipients (comma-separated)

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  bcc?: string; // BCC recipients (comma-separated)
}
