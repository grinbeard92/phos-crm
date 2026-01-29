import { Field, Int, ObjectType } from '@nestjs/graphql';

import { IDField } from '@ptc-org/nestjs-query-graphql';

import { UUIDScalarType } from 'src/engine/api/graphql/workspace-schema-builder/graphql-types/scalars';

@ObjectType('NavigationCategory')
export class NavigationCategoryDTO {
  @IDField(() => UUIDScalarType)
  id: string;

  @Field(() => UUIDScalarType)
  workspaceId: string;

  @Field({ nullable: false })
  name: string;

  @Field({ nullable: true })
  icon: string | null;

  @Field(() => Int, { nullable: false })
  position: number;

  @Field({ nullable: false })
  isDefault: boolean;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}
