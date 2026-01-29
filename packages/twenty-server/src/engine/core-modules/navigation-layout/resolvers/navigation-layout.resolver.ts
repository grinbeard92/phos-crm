import { UseGuards } from '@nestjs/common';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';

import { CreateNavigationCategoryInput } from 'src/engine/core-modules/navigation-layout/dtos/create-navigation-category.input';
import { NavigationCategoryDTO } from 'src/engine/core-modules/navigation-layout/dtos/navigation-category.dto';
import { ObjectLayoutConfigDTO } from 'src/engine/core-modules/navigation-layout/dtos/object-layout-config.dto';
import { UpdateNavigationCategoryInput } from 'src/engine/core-modules/navigation-layout/dtos/update-navigation-category.input';
import { UpsertObjectLayoutConfigInput } from 'src/engine/core-modules/navigation-layout/dtos/upsert-object-layout-config.input';
import { NavigationLayoutService } from 'src/engine/core-modules/navigation-layout/services/navigation-layout.service';
import { WorkspaceEntity } from 'src/engine/core-modules/workspace/workspace.entity';
import { AuthWorkspace } from 'src/engine/decorators/auth/auth-workspace.decorator';
import { UserAuthGuard } from 'src/engine/guards/user-auth.guard';
import { WorkspaceAuthGuard } from 'src/engine/guards/workspace-auth.guard';

@UseGuards(WorkspaceAuthGuard, UserAuthGuard)
@Resolver()
export class NavigationLayoutResolver {
  constructor(
    private readonly navigationLayoutService: NavigationLayoutService,
  ) {}

  @Query(() => [NavigationCategoryDTO])
  async navigationCategories(
    @AuthWorkspace() { id: workspaceId }: WorkspaceEntity,
  ): Promise<NavigationCategoryDTO[]> {
    return this.navigationLayoutService.getCategoriesForWorkspace(workspaceId);
  }

  @Query(() => [ObjectLayoutConfigDTO])
  async objectLayoutConfigs(
    @AuthWorkspace() { id: workspaceId }: WorkspaceEntity,
  ): Promise<ObjectLayoutConfigDTO[]> {
    return this.navigationLayoutService.getLayoutConfigsForWorkspace(
      workspaceId,
    );
  }

  @Mutation(() => NavigationCategoryDTO)
  async createNavigationCategory(
    @Args('input') input: CreateNavigationCategoryInput,
    @AuthWorkspace() { id: workspaceId }: WorkspaceEntity,
  ): Promise<NavigationCategoryDTO> {
    return this.navigationLayoutService.createCategory(workspaceId, {
      name: input.name,
      icon: input.icon,
      position: input.position,
    });
  }

  @Mutation(() => NavigationCategoryDTO)
  async updateNavigationCategory(
    @Args('input') input: UpdateNavigationCategoryInput,
    @AuthWorkspace() { id: workspaceId }: WorkspaceEntity,
  ): Promise<NavigationCategoryDTO> {
    return this.navigationLayoutService.updateCategory(
      input.id,
      workspaceId,
      {
        name: input.name,
        icon: input.icon,
        position: input.position,
      },
    );
  }

  @Mutation(() => Boolean)
  async deleteNavigationCategory(
    @Args('id') id: string,
    @AuthWorkspace() { id: workspaceId }: WorkspaceEntity,
  ): Promise<boolean> {
    return this.navigationLayoutService.deleteCategory(id, workspaceId);
  }

  @Mutation(() => ObjectLayoutConfigDTO)
  async upsertObjectLayoutConfig(
    @Args('input') input: UpsertObjectLayoutConfigInput,
    @AuthWorkspace() { id: workspaceId }: WorkspaceEntity,
  ): Promise<ObjectLayoutConfigDTO> {
    return this.navigationLayoutService.upsertLayoutConfig(workspaceId, {
      objectMetadataId: input.objectMetadataId,
      categoryId: input.categoryId,
      uiParentObjectMetadataId: input.uiParentObjectMetadataId,
      positionInCategory: input.positionInCategory,
      positionUnderParent: input.positionUnderParent,
    });
  }

  @Mutation(() => Boolean)
  async removeObjectLayoutConfig(
    @Args('objectMetadataId') objectMetadataId: string,
    @AuthWorkspace() { id: workspaceId }: WorkspaceEntity,
  ): Promise<boolean> {
    return this.navigationLayoutService.removeLayoutConfig(
      workspaceId,
      objectMetadataId,
    );
  }
}
