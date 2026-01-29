import { gql } from '@apollo/client';

export const GET_NAVIGATION_CATEGORIES = gql`
  query GetNavigationCategories {
    navigationCategories {
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
