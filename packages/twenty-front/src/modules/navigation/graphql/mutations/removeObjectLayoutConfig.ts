import { gql } from '@apollo/client';

export const REMOVE_OBJECT_LAYOUT_CONFIG = gql`
  mutation RemoveObjectLayoutConfig($objectMetadataId: UUID!) {
    removeObjectLayoutConfig(objectMetadataId: $objectMetadataId)
  }
`;
