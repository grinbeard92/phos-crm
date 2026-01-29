import { gql } from '@apollo/client';

export const CREATE_NAVIGATION_CATEGORY = gql`
  mutation CreateNavigationCategory($input: CreateNavigationCategoryInput!) {
    createNavigationCategory(input: $input) {
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
