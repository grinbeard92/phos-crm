import { useLingui } from '@lingui/react/macro';

import { NavigationDrawerCategorizedSections } from '@/navigation/components/NavigationDrawerCategorizedSections';
import { useWorkspaceNavigationMenuItems } from '@/navigation-menu-item/hooks/useWorkspaceNavigationMenuItems';
import { NavigationDrawerSectionForObjectMetadataItemsSkeletonLoader } from '@/object-metadata/components/NavigationDrawerSectionForObjectMetadataItemsSkeletonLoader';
import { useIsPrefetchLoading } from '@/prefetch/hooks/useIsPrefetchLoading';

export const WorkspaceNavigationMenuItems = () => {
  const { workspaceNavigationMenuItemsObjectMetadataItems } =
    useWorkspaceNavigationMenuItems();

  const loading = useIsPrefetchLoading();
  const { t } = useLingui();

  if (loading) {
    return <NavigationDrawerSectionForObjectMetadataItemsSkeletonLoader />;
  }

  return (
    <NavigationDrawerCategorizedSections
      sectionTitle={t`Workspace`}
      objectMetadataItems={workspaceNavigationMenuItemsObjectMetadataItems}
      isRemote={false}
    />
  );
};
