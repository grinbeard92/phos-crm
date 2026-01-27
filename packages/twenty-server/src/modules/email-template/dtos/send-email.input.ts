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
}
