import { Field, InputType, Int } from '@nestjs/graphql';

import { IsOptional, IsString, MaxLength } from 'class-validator';

import { UUIDScalarType } from 'src/engine/api/graphql/workspace-schema-builder/graphql-types/scalars';

@InputType()
export class UpdateNavigationCategoryInput {
  @Field(() => UUIDScalarType, { nullable: false })
  id: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  icon?: string;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  position?: number;
}
