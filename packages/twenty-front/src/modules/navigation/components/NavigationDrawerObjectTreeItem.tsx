import { useEffect, useState } from 'react';

import { NavigationDrawerItemForObjectMetadataItem } from '@/object-metadata/components/NavigationDrawerItemForObjectMetadataItem';
import { type ObjectMetadataItem } from '@/object-metadata/types/ObjectMetadataItem';
import { useTheme } from '@emotion/react';
import styled from '@emotion/styled';
import { AnimatedExpandableContainer } from 'twenty-ui/layout';
import { IconChevronDown, IconChevronRight, useIcons } from 'twenty-ui/display';
import { NavigationDrawerItem } from '@/ui/navigation/navigation-drawer/components/NavigationDrawerItem';
import { NavigationDrawerItemsCollapsableContainer } from '@/ui/navigation/navigation-drawer/components/NavigationDrawerItemsCollapsableContainer';
import { useLocation } from 'react-router-dom';
import { AppPath } from 'twenty-shared/types';
import { getAppPath } from 'twenty-shared/utils';
import { MOBILE_VIEWPORT } from 'twenty-ui/theme';

const StyledChildrenContainer = styled.div`
  padding-left: ${({ theme }) => theme.spacing(3)};
`;

const StyledChevronButton = styled.button`
  all: unset;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: ${({ theme }) => theme.border.radius.sm};
  padding: ${({ theme }) => theme.spacing(0.5)};
  color: ${({ theme }) => theme.font.color.light};

  &:hover {
    background: ${({ theme }) => theme.background.transparent.medium};
    color: ${({ theme }) => theme.font.color.primary};
  }

  @media (max-width: ${MOBILE_VIEWPORT}px) {
    padding: ${({ theme }) => theme.spacing(1.5)};
    border: 1px solid ${({ theme }) => theme.border.color.medium};
    border-radius: ${({ theme }) => theme.border.radius.md};
  }
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
  const theme = useTheme();
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

  // Auto-expand when navigating to a child object
  useEffect(() => {
    if (isChildActive && !isExpanded) {
      setIsExpanded(true);
    }
  }, [isChildActive, isExpanded]);

  const shouldShowChildren = hasChildren && (isExpanded || isChildActive);

  if (!hasChildren) {
    return (
      <NavigationDrawerItemForObjectMetadataItem
        key={objectMetadataItem.id}
        objectMetadataItem={objectMetadataItem}
      />
    );
  }

  const ChevronIcon = shouldShowChildren ? IconChevronDown : IconChevronRight;

  return (
    <NavigationDrawerItemsCollapsableContainer
      isGroup={shouldShowChildren}
    >
      <NavigationDrawerItem
        key={objectMetadataItem.id}
        label={objectMetadataItem.labelPlural}
        Icon={getIcon(objectMetadataItem.icon)}
        active={isParentActive || isChildActive}
        onClick={() => setIsExpanded((prev) => !prev)}
        rightOptions={
          <StyledChevronButton
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              setIsExpanded((prev) => !prev);
            }}
          >
            <ChevronIcon
              size={theme.icon.size.sm}
              stroke={theme.icon.stroke.md}
            />
          </StyledChevronButton>
        }
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
