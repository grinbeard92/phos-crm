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

  // Threading information for future replies
  @Field({ nullable: true })
  messageId?: string; // RFC 5322 Message-ID we generated

  @Field({ nullable: true })
  messageThreadId?: string; // Twenty's internal thread ID
}
