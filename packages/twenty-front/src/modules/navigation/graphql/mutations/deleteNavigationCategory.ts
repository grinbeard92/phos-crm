import { gql } from '@apollo/client';

export const DELETE_NAVIGATION_CATEGORY = gql`
  mutation DeleteNavigationCategory($id: UUID!) {
    deleteNavigationCategory(id: $id)
  }
`;
