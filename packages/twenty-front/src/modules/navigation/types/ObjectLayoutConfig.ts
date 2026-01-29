export type ObjectLayoutConfig = {
  id: string;
  workspaceId: string;
  objectMetadataId: string;
  categoryId: string | null;
  uiParentObjectMetadataId: string | null;
  positionInCategory: number;
  positionUnderParent: number;
  createdAt: string;
  updatedAt: string;
};
