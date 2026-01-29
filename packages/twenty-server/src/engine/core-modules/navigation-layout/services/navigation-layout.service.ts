import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { EntityManager, Repository } from 'typeorm';

import { NavigationCategoryEntity } from 'src/engine/core-modules/navigation-layout/entities/navigation-category.entity';
import { ObjectLayoutConfigEntity } from 'src/engine/core-modules/navigation-layout/entities/object-layout-config.entity';

@Injectable()
export class NavigationLayoutService {
  constructor(
    @InjectRepository(NavigationCategoryEntity)
    private readonly navigationCategoryRepository: Repository<NavigationCategoryEntity>,
    @InjectRepository(ObjectLayoutConfigEntity)
    private readonly objectLayoutConfigRepository: Repository<ObjectLayoutConfigEntity>,
    private readonly entityManager: EntityManager,
  ) {}

  async getCategoriesForWorkspace(
    workspaceId: string,
  ): Promise<NavigationCategoryEntity[]> {
    return this.navigationCategoryRepository.find({
      where: { workspaceId },
      order: { position: 'ASC' },
    });
  }

  async getLayoutConfigsForWorkspace(
    workspaceId: string,
  ): Promise<ObjectLayoutConfigEntity[]> {
    return this.objectLayoutConfigRepository.find({
      where: { workspaceId },
      order: { positionInCategory: 'ASC', positionUnderParent: 'ASC' },
    });
  }

  async ensureDefaultCategory(
    workspaceId: string,
  ): Promise<NavigationCategoryEntity> {
    const existingDefault = await this.navigationCategoryRepository.findOne({
      where: { workspaceId, isDefault: true },
    });

    if (existingDefault) {
      return existingDefault;
    }

    return this.navigationCategoryRepository.save({
      workspaceId,
      name: 'Workspace',
      icon: null,
      position: 0,
      isDefault: true,
    });
  }

  async createCategory(
    workspaceId: string,
    input: { name: string; icon?: string; position?: number },
  ): Promise<NavigationCategoryEntity> {
    const existingWithName = await this.navigationCategoryRepository.findOne({
      where: { workspaceId, name: input.name },
    });

    if (existingWithName) {
      throw new BadRequestException(
        `A category with name "${input.name}" already exists in this workspace`,
      );
    }

    let position = input.position;

    if (position === undefined) {
      const maxPositionResult = await this.navigationCategoryRepository
        .createQueryBuilder('category')
        .select('MAX(category.position)', 'maxPosition')
        .where('category.workspaceId = :workspaceId', { workspaceId })
        .getRawOne();

      position = (maxPositionResult?.maxPosition ?? -1) + 1;
    }

    return this.navigationCategoryRepository.save({
      workspaceId,
      name: input.name,
      icon: input.icon ?? null,
      position,
      isDefault: false,
    });
  }

  async updateCategory(
    id: string,
    workspaceId: string,
    input: { name?: string; icon?: string; position?: number },
  ): Promise<NavigationCategoryEntity> {
    const category = await this.navigationCategoryRepository.findOne({
      where: { id, workspaceId },
    });

    if (!category) {
      throw new NotFoundException(
        `Navigation category with id "${id}" not found`,
      );
    }

    if (input.name !== undefined && input.name !== category.name) {
      const existingWithName = await this.navigationCategoryRepository.findOne({
        where: { workspaceId, name: input.name },
      });

      if (existingWithName) {
        throw new BadRequestException(
          `A category with name "${input.name}" already exists in this workspace`,
        );
      }
    }

    if (input.name !== undefined) {
      category.name = input.name;
    }

    if (input.icon !== undefined) {
      category.icon = input.icon;
    }

    if (input.position !== undefined) {
      category.position = input.position;
    }

    return this.navigationCategoryRepository.save(category);
  }

  async deleteCategory(id: string, workspaceId: string): Promise<boolean> {
    return this.entityManager.transaction(async (transactionalManager) => {
      const category = await transactionalManager.findOne(
        NavigationCategoryEntity,
        { where: { id, workspaceId } },
      );

      if (!category) {
        throw new NotFoundException(
          `Navigation category with id "${id}" not found`,
        );
      }

      if (category.isDefault) {
        throw new BadRequestException('Cannot delete the default category');
      }

      const defaultCategory = await transactionalManager.findOne(
        NavigationCategoryEntity,
        { where: { workspaceId, isDefault: true } },
      );

      if (!defaultCategory) {
        throw new BadRequestException(
          'No default category found. Ensure a default category exists before deleting other categories.',
        );
      }

      await transactionalManager.update(
        ObjectLayoutConfigEntity,
        { categoryId: id, workspaceId },
        { categoryId: defaultCategory.id },
      );

      await transactionalManager.delete(NavigationCategoryEntity, {
        id,
        workspaceId,
      });

      return true;
    });
  }

  async upsertLayoutConfig(
    workspaceId: string,
    input: {
      objectMetadataId: string;
      categoryId?: string;
      uiParentObjectMetadataId?: string;
      positionInCategory?: number;
      positionUnderParent?: number;
    },
  ): Promise<ObjectLayoutConfigEntity> {
    if (input.uiParentObjectMetadataId) {
      await this.validateNoCircularParent(
        workspaceId,
        input.objectMetadataId,
        input.uiParentObjectMetadataId,
      );
    }

    if (input.categoryId) {
      const category = await this.navigationCategoryRepository.findOne({
        where: { id: input.categoryId, workspaceId },
      });

      if (!category) {
        throw new NotFoundException(
          `Navigation category with id "${input.categoryId}" not found`,
        );
      }
    }

    const existingConfig = await this.objectLayoutConfigRepository.findOne({
      where: { workspaceId, objectMetadataId: input.objectMetadataId },
    });

    if (existingConfig) {
      if (input.categoryId !== undefined) {
        existingConfig.categoryId = input.categoryId ?? null;
      }

      if (input.uiParentObjectMetadataId !== undefined) {
        existingConfig.uiParentObjectMetadataId =
          input.uiParentObjectMetadataId ?? null;
      }

      if (input.positionInCategory !== undefined) {
        existingConfig.positionInCategory = input.positionInCategory;
      }

      if (input.positionUnderParent !== undefined) {
        existingConfig.positionUnderParent = input.positionUnderParent;
      }

      return this.objectLayoutConfigRepository.save(existingConfig);
    }

    return this.objectLayoutConfigRepository.save({
      workspaceId,
      objectMetadataId: input.objectMetadataId,
      categoryId: input.categoryId ?? null,
      uiParentObjectMetadataId: input.uiParentObjectMetadataId ?? null,
      positionInCategory: input.positionInCategory ?? 0,
      positionUnderParent: input.positionUnderParent ?? 0,
    });
  }

  async removeLayoutConfig(
    workspaceId: string,
    objectMetadataId: string,
  ): Promise<boolean> {
    const config = await this.objectLayoutConfigRepository.findOne({
      where: { workspaceId, objectMetadataId },
    });

    if (!config) {
      throw new NotFoundException(
        `Layout config for objectMetadataId "${objectMetadataId}" not found`,
      );
    }

    await this.objectLayoutConfigRepository.delete({
      workspaceId,
      objectMetadataId,
    });

    return true;
  }

  async validateNoCircularParent(
    workspaceId: string,
    objectMetadataId: string,
    proposedParentId: string,
  ): Promise<void> {
    if (objectMetadataId === proposedParentId) {
      throw new BadRequestException(
        'An object cannot be its own parent in the navigation hierarchy',
      );
    }

    const visited = new Set<string>([objectMetadataId]);
    let currentParentId: string | null = proposedParentId;

    while (currentParentId) {
      if (visited.has(currentParentId)) {
        throw new BadRequestException(
          'Circular parent reference detected in the navigation hierarchy',
        );
      }

      visited.add(currentParentId);

      const parentConfig = await this.objectLayoutConfigRepository.findOne({
        where: {
          workspaceId,
          objectMetadataId: currentParentId,
        },
      });

      currentParentId = parentConfig?.uiParentObjectMetadataId ?? null;
    }
  }
}
