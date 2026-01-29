import { gql } from '@apollo/client';

export const UPDATE_NAVIGATION_CATEGORY = gql`
  mutation UpdateNavigationCategory($input: UpdateNavigationCategoryInput!) {
    updateNavigationCategory(input: $input) {
      id
      workspaceId
      name
      icon
      position
      isDefault
      createdAt
      updatedAt
    }
  }
`;
