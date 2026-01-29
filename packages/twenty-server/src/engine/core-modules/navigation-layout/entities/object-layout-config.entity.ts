import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  type Relation,
  Unique,
  UpdateDateColumn,
} from 'typeorm';

import { NavigationCategoryEntity } from 'src/engine/core-modules/navigation-layout/entities/navigation-category.entity';
import { WorkspaceRelatedEntity } from 'src/engine/workspace-manager/types/workspace-related-entity';

@Entity({ name: 'objectLayoutConfig', schema: 'core' })
@Unique('IDX_OBJECT_LAYOUT_CONFIG_WORKSPACE_ID_OBJECT_METADATA_ID_UNIQUE', [
  'workspaceId',
  'objectMetadataId',
])
export class ObjectLayoutConfigEntity extends WorkspaceRelatedEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', nullable: false })
  objectMetadataId: string;

  @Column({ type: 'uuid', nullable: true })
  categoryId: string | null;

  @ManyToOne(() => NavigationCategoryEntity, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'categoryId' })
  category: Relation<NavigationCategoryEntity> | null;

  @Column({ type: 'uuid', nullable: true })
  uiParentObjectMetadataId: string | null;

  @Column({ type: 'integer', nullable: false, default: 0 })
  positionInCategory: number;

  @Column({ type: 'integer', nullable: false, default: 0 })
  positionUnderParent: number;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
