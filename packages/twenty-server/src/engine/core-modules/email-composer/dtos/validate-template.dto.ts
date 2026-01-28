import { Field, InputType, ObjectType } from '@nestjs/graphql';

import { IsNotEmpty, IsString } from 'class-validator';

/**
 * Input for validating an email template.
 */
@InputType()
export class ValidateTemplateInput {
  @Field()
  @IsString()
  @IsNotEmpty()
  subject: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  body: string;
}

/**
 * Output for template validation.
 */
@ObjectType()
export class ValidateTemplateOutput {
  @Field()
  valid: boolean;

  @Field(() => [String])
  variables: string[];

  @Field(() => [String])
  invalidVariables: string[];
}
