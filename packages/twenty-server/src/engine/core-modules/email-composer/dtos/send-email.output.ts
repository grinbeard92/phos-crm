import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class SendEmailOutput {
  @Field()
  success: boolean;

  @Field()
  message: string;

  @Field({ nullable: true })
  error?: string;

  @Field({ nullable: true })
  recipient?: string;

  @Field({ nullable: true })
  connectedAccountId?: string;
}
