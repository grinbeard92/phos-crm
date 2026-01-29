import { useState } from 'react';

import { NavigationDrawerItemForObjectMetadataItem } from '@/object-metadata/components/NavigationDrawerItemForObjectMetadataItem';
import { type ObjectMetadataItem } from '@/object-metadata/types/ObjectMetadataItem';
import styled from '@emotion/styled';
import { AnimatedExpandableContainer } from 'twenty-ui/layout';
import { useIcons } from 'twenty-ui/display';
import { NavigationDrawerItem } from '@/ui/navigation/navigation-drawer/components/NavigationDrawerItem';
import { NavigationDrawerItemsCollapsableContainer } from '@/ui/navigation/navigation-drawer/components/NavigationDrawerItemsCollapsableContainer';
import { useLocation } from 'react-router-dom';
import { AppPath } from 'twenty-shared/types';
import { getAppPath } from 'twenty-shared/utils';

const StyledChildrenContainer = styled.div`
  padding-left: ${({ theme }) => theme.spacing(3)};
`;

type NavigationDrawerObjectTreeItemProps = {
  objectMetadataItem: ObjectMetadataItem;
  childObjectMetadataItems?: ObjectMetadataItem[];
};

export const NavigationDrawerObjectTreeItem = ({
  objectMetadataItem,
  childObjectMetadataItems = [],
}: NavigationDrawerObjectTreeItemProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const hasChildren = childObjectMetadataItems.length > 0;
  const { getIcon } = useIcons();
  const currentPath = useLocation().pathname;

  const isParentActive =
    currentPath ===
      getAppPath(AppPath.RecordIndexPage, {
        objectNamePlural: objectMetadataItem.namePlural,
      }) ||
    currentPath.includes(
      getAppPath(AppPath.RecordShowPage, {
        objectNameSingular: objectMetadataItem.nameSingular,
        objectRecordId: '',
      }) + '/',
    );

  const isChildActive = childObjectMetadataItems.some(
    (child) =>
      currentPath ===
        getAppPath(AppPath.RecordIndexPage, {
          objectNamePlural: child.namePlural,
        }) ||
      currentPath.includes(
        getAppPath(AppPath.RecordShowPage, {
          objectNameSingular: child.nameSingular,
          objectRecordId: '',
        }) + '/',
      ),
  );

  const shouldShowChildren = hasChildren && (isExpanded || isChildActive);

  if (!hasChildren) {
    return (
      <NavigationDrawerItemForObjectMetadataItem
        key={objectMetadataItem.id}
        objectMetadataItem={objectMetadataItem}
      />
    );
  }

  return (
    <NavigationDrawerItemsCollapsableContainer
      isGroup={shouldShowChildren}
    >
      <NavigationDrawerItem
        key={objectMetadataItem.id}
        label={objectMetadataItem.labelPlural}
        to={getAppPath(AppPath.RecordIndexPage, {
          objectNamePlural: objectMetadataItem.namePlural,
        })}
        Icon={getIcon(objectMetadataItem.icon)}
        active={isParentActive}
        onClick={() => setIsExpanded((prev) => !prev)}
      />
      <AnimatedExpandableContainer
        isExpanded={shouldShowChildren}
        dimension="height"
        mode="fit-content"
        containAnimation
      >
        <StyledChildrenContainer>
          {childObjectMetadataItems.map((child) => (
            <NavigationDrawerItemForObjectMetadataItem
              key={child.id}
              objectMetadataItem={child}
            />
          ))}
        </StyledChildrenContainer>
      </AnimatedExpandableContainer>
    </NavigationDrawerItemsCollapsableContainer>
  );
};
