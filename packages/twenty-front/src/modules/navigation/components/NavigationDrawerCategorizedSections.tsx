import { useFilteredObjectMetadataItems } from '@/object-metadata/hooks/useFilteredObjectMetadataItems';
import { NavigationDrawerSectionForObjectMetadataItems } from '@/object-metadata/components/NavigationDrawerSectionForObjectMetadataItems';
import { NavigationDrawerObjectTreeItem } from '@/navigation/components/NavigationDrawerObjectTreeItem';
import { NavigationDrawerSection } from '@/ui/navigation/navigation-drawer/components/NavigationDrawerSection';
import { NavigationDrawerAnimatedCollapseWrapper } from '@/ui/navigation/navigation-drawer/components/NavigationDrawerAnimatedCollapseWrapper';
import { NavigationDrawerSectionTitle } from '@/ui/navigation/navigation-drawer/components/NavigationDrawerSectionTitle';
import { useNavigationSection } from '@/ui/navigation/navigation-drawer/hooks/useNavigationSection';
import {
  useNavigationHierarchy,
  type NavigationTreeNode,
} from '@/navigation/hooks/useNavigationHierarchy';
import { useIsFeatureEnabled } from '@/workspace/hooks/useIsFeatureEnabled';
import { type NavigationCategory } from '@/navigation/types/NavigationCategory';
import { type ObjectMetadataItem } from '@/object-metadata/types/ObjectMetadataItem';
import { getObjectPermissionsForObject } from '@/object-metadata/utils/getObjectPermissionsForObject';
import { useObjectPermissions } from '@/object-record/hooks/useObjectPermissions';
import { useRecoilValue } from 'recoil';
import { useMemo } from 'react';
import { FeatureFlagKey } from '~/generated/graphql';

type CategorySectionProps = {
  category: NavigationCategory;
  categoryNodes: NavigationTreeNode[];
  extraItems: ObjectMetadataItem[];
  objectMetadataById: Map<string, ObjectMetadataItem>;
};

const CategorySection = ({
  category,
  categoryNodes,
  extraItems,
  objectMetadataById,
}: CategorySectionProps) => {
  const { toggleNavigationSection, isNavigationSectionOpenState } =
    useNavigationSection(`HierarchyCategory-${category.id}`);
  const isNavigationSectionOpen = useRecoilValue(isNavigationSectionOpenState);

  const { objectPermissionsByObjectMetadataId } = useObjectPermissions();

  const resolvedItems = useMemo(() => {
    const items: {
      parentObj: ObjectMetadataItem;
      childObjs: ObjectMetadataItem[];
    }[] = [];

    for (const node of categoryNodes) {
      const parentObj = objectMetadataById.get(node.objectMetadataId);

      if (!parentObj) {
        continue;
      }

      const canReadParent = getObjectPermissionsForObject(
        objectPermissionsByObjectMetadataId,
        parentObj.id,
      ).canReadObjectRecords;

      if (!canReadParent) {
        continue;
      }

      const childObjs = node.children
        .map((child) => objectMetadataById.get(child.objectMetadataId))
        .filter(
          (child): child is ObjectMetadataItem =>
            child !== undefined &&
            getObjectPermissionsForObject(
              objectPermissionsByObjectMetadataId,
              child.id,
            ).canReadObjectRecords,
        );

      items.push({ parentObj, childObjs });
    }

    for (const obj of extraItems) {
      const canRead = getObjectPermissionsForObject(
        objectPermissionsByObjectMetadataId,
        obj.id,
      ).canReadObjectRecords;

      if (canRead) {
        items.push({ parentObj: obj, childObjs: [] });
      }
    }

    return items;
  }, [
    categoryNodes,
    extraItems,
    objectMetadataById,
    objectPermissionsByObjectMetadataId,
  ]);

  if (resolvedItems.length === 0) {
    return null;
  }

  return (
    <NavigationDrawerSection>
      <NavigationDrawerAnimatedCollapseWrapper>
        <NavigationDrawerSectionTitle
          label={category.name}
          onClick={() => toggleNavigationSection()}
        />
      </NavigationDrawerAnimatedCollapseWrapper>
      {isNavigationSectionOpen &&
        resolvedItems.map((item) => (
          <NavigationDrawerObjectTreeItem
            key={item.parentObj.id}
            objectMetadataItem={item.parentObj}
            childObjectMetadataItems={item.childObjs}
          />
        ))}
    </NavigationDrawerSection>
  );
};

type NavigationDrawerCategorizedSectionsProps = {
  sectionTitle: string;
  isRemote: boolean;
  objectMetadataItems: ObjectMetadataItem[];
};

export const NavigationDrawerCategorizedSections = ({
  sectionTitle,
  isRemote,
  objectMetadataItems,
}: NavigationDrawerCategorizedSectionsProps) => {
  const isNavigationHierarchyEnabled = useIsFeatureEnabled(
    FeatureFlagKey.IS_NAVIGATION_HIERARCHY_ENABLED,
  );

  const { categories, configsByCategory, uncategorizedConfigs, isLoading } =
    useNavigationHierarchy();

  const { activeObjectMetadataItems } = useFilteredObjectMetadataItems();

  // Fall back to existing flat rendering when the flag is off,
  // no categories are configured, or data is still loading
  if (!isNavigationHierarchyEnabled || categories.length === 0 || isLoading) {
    return (
      <NavigationDrawerSectionForObjectMetadataItems
        sectionTitle={sectionTitle}
        isRemote={isRemote}
        objectMetadataItems={objectMetadataItems}
      />
    );
  }

  const objectMetadataById = new Map(
    activeObjectMetadataItems.map((item) => [item.id, item]),
  );

  // Track which object IDs are assigned to categories or parents
  const assignedObjectIds = new Set<string>();

  for (const nodes of Object.values(configsByCategory)) {
    for (const node of nodes) {
      assignedObjectIds.add(node.objectMetadataId);

      for (const child of node.children) {
        assignedObjectIds.add(child.objectMetadataId);
      }
    }
  }

  for (const node of uncategorizedConfigs) {
    assignedObjectIds.add(node.objectMetadataId);

    for (const child of node.children) {
      assignedObjectIds.add(child.objectMetadataId);
    }
  }

  // Objects not assigned to any layout config go to the default category
  const unassignedObjects = activeObjectMetadataItems.filter(
    (item) => !assignedObjectIds.has(item.id) && !item.isSystem,
  );

  const defaultCategory = categories.find((c) => c.isDefault);

  return (
    <>
      {categories.map((category) => {
        const categoryNodes = configsByCategory[category.id] ?? [];

        const extraItems =
          category.isDefault && defaultCategory?.id === category.id
            ? unassignedObjects
            : [];

        return (
          <CategorySection
            key={category.id}
            category={category}
            categoryNodes={categoryNodes}
            extraItems={extraItems}
            objectMetadataById={objectMetadataById}
          />
        );
      })}
    </>
  );
};
