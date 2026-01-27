import { type ObjectMetadataSeed } from 'src/engine/workspace-manager/dev-seeder/metadata/types/object-metadata-seed.type';

/**
 * Junction object for many-to-many relationship between ProjectMilestone and WorkspaceMember
 * This enables assigning multiple team members to a milestone for Gantt chart resource allocation
 */
export const MILESTONE_ASSIGNEE_CUSTOM_OBJECT_SEED: ObjectMetadataSeed = {
  labelPlural: 'Milestone Assignees',
  labelSingular: 'Milestone Assignee',
  namePlural: 'milestoneAssignees',
  nameSingular: 'milestoneAssignee',
  icon: 'IconUsers',
  description:
    'Junction table for many-to-many milestone-to-member assignments',
};
