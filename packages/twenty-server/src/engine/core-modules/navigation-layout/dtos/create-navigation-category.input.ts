import { Field, InputType, Int } from '@nestjs/graphql';

import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

@InputType()
export class CreateNavigationCategoryInput {
  @Field({ nullable: false })
  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  name: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  icon?: string;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  position?: number;
}
