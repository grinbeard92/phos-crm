import { useQuery } from '@apollo/client';
import { useEffect, useMemo } from 'react';
import { useRecoilState } from 'recoil';

import { GET_NAVIGATION_CATEGORIES } from '@/navigation/graphql/queries/getNavigationCategories';
import { GET_OBJECT_LAYOUT_CONFIGS } from '@/navigation/graphql/queries/getObjectLayoutConfigs';
import { navigationCategoriesState } from '@/navigation/states/navigationCategoriesState';
import { objectLayoutConfigsState } from '@/navigation/states/objectLayoutConfigsState';
import { type NavigationCategory } from '@/navigation/types/NavigationCategory';
import { type ObjectLayoutConfig } from '@/navigation/types/ObjectLayoutConfig';

export type NavigationTreeNode = {
  objectMetadataId: string;
  categoryId: string | null;
  uiParentObjectMetadataId: string | null;
  positionInCategory: number;
  positionUnderParent: number;
  children: NavigationTreeNode[];
};

export type CategorizedNavigationData = {
  categories: NavigationCategory[];
  configsByCategory: Record<string, NavigationTreeNode[]>;
  uncategorizedConfigs: NavigationTreeNode[];
  getConfigForObject: (
    objectMetadataId: string,
  ) => ObjectLayoutConfig | undefined;
  isLoading: boolean;
};

export const useNavigationHierarchy = (): CategorizedNavigationData => {
  const [categories, setCategories] = useRecoilState(
    navigationCategoriesState,
  );
  const [configs, setConfigs] = useRecoilState(objectLayoutConfigsState);

  const { data: categoriesData, loading: categoriesLoading } = useQuery(
    GET_NAVIGATION_CATEGORIES,
  );
  const { data: configsData, loading: configsLoading } = useQuery(
    GET_OBJECT_LAYOUT_CONFIGS,
  );

  useEffect(() => {
    if (categoriesData?.navigationCategories) {
      setCategories(categoriesData.navigationCategories);
    }
  }, [categoriesData, setCategories]);

  useEffect(() => {
    if (configsData?.objectLayoutConfigs) {
      setConfigs(configsData.objectLayoutConfigs);
    }
  }, [configsData, setConfigs]);

  const configsByCategory = useMemo(() => {
    const result: Record<string, NavigationTreeNode[]> = {};

    // Group configs by category, build tree per category
    const configsWithCategory = configs.filter((c) => c.categoryId !== null);
    const parentConfigs = configsWithCategory.filter(
      (c) => c.uiParentObjectMetadataId === null,
    );
    const childConfigs = configsWithCategory.filter(
      (c) => c.uiParentObjectMetadataId !== null,
    );

    for (const parent of parentConfigs) {
      const catId = parent.categoryId!;

      if (!result[catId]) {
        result[catId] = [];
      }

      const children = childConfigs
        .filter((c) => c.uiParentObjectMetadataId === parent.objectMetadataId)
        .sort((a, b) => a.positionUnderParent - b.positionUnderParent)
        .map((c) => ({
          objectMetadataId: c.objectMetadataId,
          categoryId: c.categoryId,
          uiParentObjectMetadataId: c.uiParentObjectMetadataId,
          positionInCategory: c.positionInCategory,
          positionUnderParent: c.positionUnderParent,
          children: [],
        }));

      result[catId].push({
        objectMetadataId: parent.objectMetadataId,
        categoryId: parent.categoryId,
        uiParentObjectMetadataId: parent.uiParentObjectMetadataId,
        positionInCategory: parent.positionInCategory,
        positionUnderParent: parent.positionUnderParent,
        children,
      });
    }

    // Sort each category's items by positionInCategory
    for (const catId of Object.keys(result)) {
      result[catId].sort(
        (a, b) => a.positionInCategory - b.positionInCategory,
      );
    }

    return result;
  }, [configs]);

  const uncategorizedConfigs = useMemo(() => {
    return configs
      .filter(
        (c) => c.categoryId === null && c.uiParentObjectMetadataId === null,
      )
      .sort((a, b) => a.positionInCategory - b.positionInCategory)
      .map((c) => ({
        objectMetadataId: c.objectMetadataId,
        categoryId: c.categoryId,
        uiParentObjectMetadataId: c.uiParentObjectMetadataId,
        positionInCategory: c.positionInCategory,
        positionUnderParent: c.positionUnderParent,
        children: configs
          .filter(
            (child) =>
              child.uiParentObjectMetadataId === c.objectMetadataId &&
              child.categoryId === null,
          )
          .sort((a, b) => a.positionUnderParent - b.positionUnderParent)
          .map((child) => ({
            objectMetadataId: child.objectMetadataId,
            categoryId: child.categoryId,
            uiParentObjectMetadataId: child.uiParentObjectMetadataId,
            positionInCategory: child.positionInCategory,
            positionUnderParent: child.positionUnderParent,
            children: [],
          })),
      }));
  }, [configs]);

  const getConfigForObject = useMemo(() => {
    const map = new Map(configs.map((c) => [c.objectMetadataId, c]));

    return (objectMetadataId: string) => map.get(objectMetadataId);
  }, [configs]);

  return {
    categories: [...categories].sort((a, b) => a.position - b.position),
    configsByCategory,
    uncategorizedConfigs,
    getConfigForObject,
    isLoading: categoriesLoading || configsLoading,
  };
};
