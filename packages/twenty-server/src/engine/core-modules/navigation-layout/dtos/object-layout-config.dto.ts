import { Field, Int, ObjectType } from '@nestjs/graphql';

import { IDField } from '@ptc-org/nestjs-query-graphql';

import { UUIDScalarType } from 'src/engine/api/graphql/workspace-schema-builder/graphql-types/scalars';

@ObjectType('ObjectLayoutConfig')
export class ObjectLayoutConfigDTO {
  @IDField(() => UUIDScalarType)
  id: string;

  @Field(() => UUIDScalarType)
  workspaceId: string;

  @Field(() => UUIDScalarType, { nullable: false })
  objectMetadataId: string;

  @Field(() => UUIDScalarType, { nullable: true })
  categoryId: string | null;

  @Field(() => UUIDScalarType, { nullable: true })
  uiParentObjectMetadataId: string | null;

  @Field(() => Int, { nullable: false })
  positionInCategory: number;

  @Field(() => Int, { nullable: false })
  positionUnderParent: number;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}
