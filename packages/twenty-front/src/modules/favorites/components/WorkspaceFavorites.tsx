import { useWorkspaceFavorites } from '@/favorites/hooks/useWorkspaceFavorites';
import { NavigationDrawerCategorizedSections } from '@/navigation/components/NavigationDrawerCategorizedSections';
import { NavigationDrawerSectionForObjectMetadataItemsSkeletonLoader } from '@/object-metadata/components/NavigationDrawerSectionForObjectMetadataItemsSkeletonLoader';
import { useIsPrefetchLoading } from '@/prefetch/hooks/useIsPrefetchLoading';
import { useLingui } from '@lingui/react/macro';

export const WorkspaceFavorites = () => {
  const { workspaceFavoritesObjectMetadataItems } = useWorkspaceFavorites();

  const loading = useIsPrefetchLoading();
  const { t } = useLingui();

  if (loading) {
    return <NavigationDrawerSectionForObjectMetadataItemsSkeletonLoader />;
  }

  return (
    <NavigationDrawerCategorizedSections
      sectionTitle={t`Workspace`}
      objectMetadataItems={workspaceFavoritesObjectMetadataItems}
      isRemote={false}
    />
  );
};
