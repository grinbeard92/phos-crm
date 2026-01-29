import { gql } from '@apollo/client';

export const UPSERT_OBJECT_LAYOUT_CONFIG = gql`
  mutation UpsertObjectLayoutConfig($input: UpsertObjectLayoutConfigInput!) {
    upsertObjectLayoutConfig(input: $input) {
      id
      workspaceId
      objectMetadataId
      categoryId
      uiParentObjectMetadataId
      positionInCategory
      positionUnderParent
      createdAt
      updatedAt
    }
  }
`;
