import { Field, InputType, Int } from '@nestjs/graphql';

import { IsOptional } from 'class-validator';

import { UUIDScalarType } from 'src/engine/api/graphql/workspace-schema-builder/graphql-types/scalars';

@InputType()
export class UpsertObjectLayoutConfigInput {
  @Field(() => UUIDScalarType, { nullable: false })
  objectMetadataId: string;

  @Field(() => UUIDScalarType, { nullable: true })
  @IsOptional()
  categoryId?: string;

  @Field(() => UUIDScalarType, { nullable: true })
  @IsOptional()
  uiParentObjectMetadataId?: string;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  positionInCategory?: number;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  positionUnderParent?: number;
}
