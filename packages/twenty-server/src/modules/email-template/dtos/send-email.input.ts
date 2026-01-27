import { ArgsType, Field, InputType } from '@nestjs/graphql';

import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

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

@ArgsType()
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

  // Threading support
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
