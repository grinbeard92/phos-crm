import styled from '@emotion/styled';
import { useMutation, useQuery } from '@apollo/client';
import { useState } from 'react';

import { useFilteredObjectMetadataItems } from '@/object-metadata/hooks/useFilteredObjectMetadataItems';
import { GET_NAVIGATION_CATEGORIES } from '@/navigation/graphql/queries/getNavigationCategories';
import { GET_OBJECT_LAYOUT_CONFIGS } from '@/navigation/graphql/queries/getObjectLayoutConfigs';
import { CREATE_NAVIGATION_CATEGORY } from '@/navigation/graphql/mutations/createNavigationCategory';
import { DELETE_NAVIGATION_CATEGORY } from '@/navigation/graphql/mutations/deleteNavigationCategory';
import { UPSERT_OBJECT_LAYOUT_CONFIG } from '@/navigation/graphql/mutations/upsertObjectLayoutConfig';
import { type NavigationCategory } from '@/navigation/types/NavigationCategory';
import { type ObjectLayoutConfig } from '@/navigation/types/ObjectLayoutConfig';
import { SettingsPageContainer } from '@/settings/components/SettingsPageContainer';
import { SubMenuTopBarContainer } from '@/ui/layout/page/components/SubMenuTopBarContainer';
import { SettingsPath } from 'twenty-shared/types';
import { getSettingsPath } from 'twenty-shared/utils';
import { H2Title, IconPlus, IconTrash } from 'twenty-ui/display';
import { Section } from 'twenty-ui/layout';
import { Button } from 'twenty-ui/input';

const StyledCategoryRow = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing(2)};
  padding: ${({ theme }) => theme.spacing(2)} 0;
  border-bottom: 1px solid ${({ theme }) => theme.border.color.light};
`;

const StyledCategoryName = styled.span`
  flex: 1;
  font-size: ${({ theme }) => theme.font.size.md};
  color: ${({ theme }) => theme.font.color.primary};
`;

const StyledDefaultBadge = styled.span`
  font-size: ${({ theme }) => theme.font.size.xs};
  color: ${({ theme }) => theme.font.color.tertiary};
  background: ${({ theme }) => theme.background.transparent.light};
  padding: ${({ theme }) => theme.spacing(0.5)} ${({ theme }) => theme.spacing(1)};
  border-radius: ${({ theme }) => theme.border.radius.xs};
`;

const StyledObjectRow = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing(2)};
  padding: ${({ theme }) => theme.spacing(1)} 0;
  padding-left: ${({ theme }) => theme.spacing(2)};
`;

const StyledObjectLabel = styled.span`
  flex: 1;
  font-size: ${({ theme }) => theme.font.size.sm};
  color: ${({ theme }) => theme.font.color.secondary};
`;

const StyledNewCategoryRow = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing(2)};
  align-items: center;
  padding-top: ${({ theme }) => theme.spacing(2)};
`;

const StyledTextInput = styled.input`
  padding: ${({ theme }) => theme.spacing(2)};
  border: 1px solid ${({ theme }) => theme.border.color.medium};
  border-radius: ${({ theme }) => theme.border.radius.sm};
  font-size: ${({ theme }) => theme.font.size.md};
  color: ${({ theme }) => theme.font.color.primary};
  background: ${({ theme }) => theme.background.primary};
  font-family: ${({ theme }) => theme.font.family};
  outline: none;
  flex: 1;

  &:focus {
    border-color: ${({ theme }) => theme.color.blue};
  }

  &::placeholder {
    color: ${({ theme }) => theme.font.color.light};
  }
`;

const StyledSelectContainer = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing(1)};
  align-items: center;
`;

const StyledSelect = styled.select`
  padding: ${({ theme }) => theme.spacing(1)} ${({ theme }) => theme.spacing(2)};
  border: 1px solid ${({ theme }) => theme.border.color.medium};
  border-radius: ${({ theme }) => theme.border.radius.sm};
  font-size: ${({ theme }) => theme.font.size.sm};
  color: ${({ theme }) => theme.font.color.primary};
  background: ${({ theme }) => theme.background.primary};
`;

export const SettingsLayoutModel = () => {
  const [newCategoryName, setNewCategoryName] = useState('');

  const { activeObjectMetadataItems } = useFilteredObjectMetadataItems();

  const { data: categoriesData, refetch: refetchCategories } = useQuery(
    GET_NAVIGATION_CATEGORIES,
  );
  const { data: configsData, refetch: refetchConfigs } = useQuery(
    GET_OBJECT_LAYOUT_CONFIGS,
  );

  const [createCategory] = useMutation(CREATE_NAVIGATION_CATEGORY);
  const [deleteCategory] = useMutation(DELETE_NAVIGATION_CATEGORY);
  const [upsertConfig] = useMutation(UPSERT_OBJECT_LAYOUT_CONFIG);

  const categories: NavigationCategory[] =
    categoriesData?.navigationCategories ?? [];
  const configs: ObjectLayoutConfig[] =
    configsData?.objectLayoutConfigs ?? [];

  const sortedCategories = [...categories].sort(
    (a, b) => a.position - b.position,
  );

  const configByObjectId = new Map(
    configs.map((c) => [c.objectMetadataId, c]),
  );

  const visibleObjects = activeObjectMetadataItems.filter(
    (item) => !item.isSystem,
  );

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) return;

    await createCategory({
      variables: {
        input: { name: newCategoryName.trim() },
      },
    });

    setNewCategoryName('');
    await refetchCategories();
  };

  const handleDeleteCategory = async (id: string) => {
    await deleteCategory({ variables: { id } });
    await Promise.all([refetchCategories(), refetchConfigs()]);
  };

  const handleAssignObjectToCategory = async (
    objectMetadataId: string,
    categoryId: string | null,
  ) => {
    await upsertConfig({
      variables: {
        input: {
          objectMetadataId,
          categoryId,
        },
      },
    });
    await refetchConfigs();
  };

  const handleSetParentObject = async (
    objectMetadataId: string,
    parentObjectMetadataId: string | null,
  ) => {
    await upsertConfig({
      variables: {
        input: {
          objectMetadataId,
          uiParentObjectMetadataId: parentObjectMetadataId,
        },
      },
    });
    await refetchConfigs();
  };

  return (
    <SubMenuTopBarContainer
      title="Layout Model"
      links={[
        {
          children: 'Workspace',
          href: getSettingsPath(SettingsPath.Workspace),
        },
        { children: 'Layout Model' },
      ]}
    >
      <SettingsPageContainer>
        <Section>
          <H2Title
            title="Navigation Categories"
            description="Organize sidebar objects into named categories"
          />
          {sortedCategories.map((category) => (
            <StyledCategoryRow key={category.id}>
              <StyledCategoryName>{category.name}</StyledCategoryName>
              {category.isDefault && (
                <StyledDefaultBadge>Default</StyledDefaultBadge>
              )}
              {!category.isDefault && (
                <Button
                  Icon={IconTrash}
                  variant="tertiary"
                  size="small"
                  onClick={() => handleDeleteCategory(category.id)}
                />
              )}
            </StyledCategoryRow>
          ))}
          <StyledNewCategoryRow>
            <StyledTextInput
              type="text"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              placeholder="New category name"
            />
            <Button
              Icon={IconPlus}
              title="Add"
              variant="secondary"
              size="small"
              onClick={handleCreateCategory}
            />
          </StyledNewCategoryRow>
        </Section>

        <Section>
          <H2Title
            title="Object Assignment"
            description="Assign objects to categories and set parent-child hierarchy"
          />
          {visibleObjects.map((obj) => {
            const config = configByObjectId.get(obj.id);
            const currentCategoryId = config?.categoryId ?? '';
            const currentParentId = config?.uiParentObjectMetadataId ?? '';

            const possibleParents = visibleObjects.filter(
              (p) => p.id !== obj.id,
            );

            return (
              <StyledObjectRow key={obj.id}>
                <StyledObjectLabel>{obj.labelPlural}</StyledObjectLabel>
                <StyledSelectContainer>
                  <StyledSelect
                    value={currentCategoryId}
                    onChange={(e) =>
                      handleAssignObjectToCategory(
                        obj.id,
                        e.target.value || null,
                      )
                    }
                  >
                    <option value="">No Category</option>
                    {sortedCategories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </StyledSelect>
                  <StyledSelect
                    value={currentParentId}
                    onChange={(e) =>
                      handleSetParentObject(
                        obj.id,
                        e.target.value || null,
                      )
                    }
                  >
                    <option value="">No Parent</option>
                    {possibleParents.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.labelSingular}
                      </option>
                    ))}
                  </StyledSelect>
                </StyledSelectContainer>
              </StyledObjectRow>
            );
          })}
        </Section>
      </SettingsPageContainer>
    </SubMenuTopBarContainer>
  );
};
