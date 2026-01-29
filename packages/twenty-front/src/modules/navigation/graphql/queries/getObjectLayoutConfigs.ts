import { gql } from '@apollo/client';

export const GET_OBJECT_LAYOUT_CONFIGS = gql`
  query GetObjectLayoutConfigs {
    objectLayoutConfigs {
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
