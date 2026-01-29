import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';

import { WorkspaceRelatedEntity } from 'src/engine/workspace-manager/types/workspace-related-entity';

@Entity({ name: 'navigationCategory', schema: 'core' })
@Unique('IDX_NAVIGATION_CATEGORY_WORKSPACE_ID_NAME_UNIQUE', [
  'workspaceId',
  'name',
])
export class NavigationCategoryEntity extends WorkspaceRelatedEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', nullable: false })
  name: string;

  @Column({ type: 'varchar', nullable: true })
  icon: string | null;

  @Column({ type: 'integer', nullable: false, default: 0 })
  position: number;

  @Column({ type: 'boolean', nullable: false, default: false })
  isDefault: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
