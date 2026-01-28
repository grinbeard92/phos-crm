import {
  type CalculatedReturnType,
  type CompositeProperty,
  FieldMetadataType,
  type FieldMetadataSettingsMapping,
} from 'twenty-shared/types';
import { type ColumnType } from 'typeorm';

import { type CompositeFieldMetadataType } from 'src/engine/metadata-modules/field-metadata/types/composite-field-metadata-type.type';
import { generateCalculatedExpression } from 'src/engine/workspace-manager/utils/calculated-field';
import {
  computeColumnName,
  computeCompositeColumnName,
} from 'src/engine/metadata-modules/field-metadata/utils/compute-column-name.util';
import { getCompositeTypeOrThrow } from 'src/engine/metadata-modules/field-metadata/utils/get-composite-type-or-throw.util';
import { type FlatFieldMetadata } from 'src/engine/metadata-modules/flat-field-metadata/types/flat-field-metadata.type';
import { isCompositeFlatFieldMetadata } from 'src/engine/metadata-modules/flat-field-metadata/utils/is-composite-flat-field-metadata.util';
import { isFlatFieldMetadataOfType } from 'src/engine/metadata-modules/flat-field-metadata/utils/is-flat-field-metadata-of-type.util';
import { isMorphOrRelationFlatFieldMetadata } from 'src/engine/metadata-modules/flat-field-metadata/utils/is-morph-or-relation-flat-field-metadata.util';
import { type FlatObjectMetadata } from 'src/engine/metadata-modules/flat-object-metadata/types/flat-object-metadata.type';
import { type WorkspaceSchemaColumnDefinition } from 'src/engine/twenty-orm/workspace-schema-manager/types/workspace-schema-column-definition.type';
import { computePostgresEnumName } from 'src/engine/workspace-manager/workspace-migration/utils/compute-postgres-enum-name.util';
import { serializeDefaultValue } from 'src/engine/workspace-manager/workspace-migration/workspace-migration-builder/utils/serialize-default-value.util';
import {
  WorkspaceMigrationActionExecutionException,
  WorkspaceMigrationActionExecutionExceptionCode,
} from 'src/engine/workspace-manager/workspace-migration/workspace-migration-runner/exceptions/workspace-migration-action-execution.exception';
import { fieldMetadataTypeToColumnType } from 'src/engine/workspace-manager/workspace-migration/workspace-migration-runner/utils/field-metadata-type-to-column-type.util';
import { getWorkspaceSchemaContextForMigration } from 'src/engine/workspace-manager/workspace-migration/workspace-migration-runner/utils/get-workspace-schema-context-for-migration.util';

export const generateCompositeColumnDefinition = ({
  compositeProperty,
  parentFieldMetadata,
  flatObjectMetadata,
}: {
  compositeProperty: CompositeProperty;
  parentFieldMetadata: FlatFieldMetadata<CompositeFieldMetadataType>;
  flatObjectMetadata: FlatObjectMetadata;
}): WorkspaceSchemaColumnDefinition => {
  const { tableName, schemaName } = getWorkspaceSchemaContextForMigration({
    workspaceId: flatObjectMetadata.workspaceId,
    flatObjectMetadata,
  });

  if (
    compositeProperty.type === FieldMetadataType.RELATION ||
    compositeProperty.type === FieldMetadataType.MORPH_RELATION
  ) {
    throw new WorkspaceMigrationActionExecutionException({
      message: `Relation type not supported for composite columns`,
      code: WorkspaceMigrationActionExecutionExceptionCode.UNSUPPORTED_COMPOSITE_COLUMN_TYPE,
    });
  }

  const columnName = computeCompositeColumnName(
    parentFieldMetadata.name,
    compositeProperty,
  );
  const defaultValue =
    // @ts-expect-error - TODO: fix this
    parentFieldMetadata.defaultValue?.[compositeProperty.name];
  const columnType = fieldMetadataTypeToColumnType(compositeProperty.type);
  const serializedDefaultValue = serializeDefaultValue({
    columnName,
    schemaName,
    tableName,
    columnType: columnType as ColumnType,
    defaultValue,
  });

  const isArrayFlag =
    compositeProperty.type === FieldMetadataType.ARRAY ||
    compositeProperty.type === FieldMetadataType.MULTI_SELECT ||
    Boolean(compositeProperty.isArray);

  const definition: WorkspaceSchemaColumnDefinition = {
    name: columnName,
    type:
      columnType === 'enum'
        ? `"${schemaName}"."${computePostgresEnumName({ tableName, columnName })}"`
        : columnType,
    isNullable: parentFieldMetadata.isNullable || !compositeProperty.isRequired,
    isUnique: parentFieldMetadata.isUnique ?? false,
    default: serializedDefaultValue,
    isArray: isArrayFlag,
    isPrimary: false,
  };

  return definition;
};

const generateTsVectorColumnDefinition = (
  flatFieldMetadata: FlatFieldMetadata<FieldMetadataType.TS_VECTOR>,
): WorkspaceSchemaColumnDefinition => {
  const columnName = computeColumnName(flatFieldMetadata.name);

  return {
    name: columnName,
    type: fieldMetadataTypeToColumnType(flatFieldMetadata.type),
    isNullable: true,
    isArray: false,
    isUnique: false,
    default: null,
    asExpression: flatFieldMetadata.settings?.asExpression ?? undefined,
    generatedType: flatFieldMetadata.settings?.generatedType ?? undefined,
    isPrimary: false,
  };
};

/**
 * Maps CALCULATED field returnType to PostgreSQL column type
 */
const calculatedReturnTypeToColumnType = (
  returnType: CalculatedReturnType,
): string => {
  const mapping: Record<CalculatedReturnType, string> = {
    [FieldMetadataType.TEXT]: 'text',
    [FieldMetadataType.NUMBER]: 'float',
    [FieldMetadataType.BOOLEAN]: 'boolean',
    [FieldMetadataType.DATE]: 'date',
    [FieldMetadataType.DATE_TIME]: 'timestamptz',
  };

  return mapping[returnType] ?? 'text';
};

/**
 * Generates column definition for CALCULATED fields
 * Similar to TS_VECTOR, uses GENERATED ALWAYS AS for computed values
 *
 * @param flatFieldMetadata - The CALCULATED field metadata
 * @param siblingFields - Other fields on the same object (for resolving field references)
 */
const generateCalculatedColumnDefinition = (
  flatFieldMetadata: FlatFieldMetadata<FieldMetadataType.CALCULATED>,
  siblingFields: FlatFieldMetadata[],
): WorkspaceSchemaColumnDefinition | null => {
  const columnName = computeColumnName(flatFieldMetadata.name);
  const settings =
    flatFieldMetadata.settings as FieldMetadataSettingsMapping['CALCULATED'];

  // CALCULATED fields require settings with formula and returnType
  if (!settings?.formula || !settings?.returnType) {
    return null;
  }

  // Build field map from sibling fields for resolving {{fieldName}} references
  const fieldMap: Record<
    string,
    { columnName: string; type: FieldMetadataType }
  > = {};

  for (const field of siblingFields) {
    // Skip the calculated field itself to prevent self-reference
    if (field.name === flatFieldMetadata.name) {
      continue;
    }

    // Skip relation fields - they don't have direct column storage
    if (
      field.type === FieldMetadataType.RELATION ||
      field.type === FieldMetadataType.MORPH_RELATION
    ) {
      continue;
    }

    // Skip other calculated fields to prevent circular dependencies
    if (field.type === FieldMetadataType.CALCULATED) {
      continue;
    }

    fieldMap[field.name] = {
      columnName: computeColumnName(field.name),
      type: field.type,
    };
  }

  try {
    // Generate the SQL expression with resolved column names
    const { expression, columnType } = generateCalculatedExpression({
      formula: settings.formula,
      returnType: settings.returnType,
      fieldMap,
    });

    return {
      name: columnName,
      type: columnType,
      isNullable: true,
      isArray: false,
      isUnique: false,
      default: null,
      asExpression: expression,
      generatedType: 'STORED',
      isPrimary: false,
    };
  } catch {
    // If expression generation fails, return null (field won't be created)
    // This can happen if referenced fields don't exist yet
    return null;
  }
};

const generateRelationColumnDefinition = (
  flatFieldMetadata: FlatFieldMetadata<
    FieldMetadataType.RELATION | FieldMetadataType.MORPH_RELATION
  >,
): WorkspaceSchemaColumnDefinition | null => {
  if (
    !flatFieldMetadata.settings ||
    !flatFieldMetadata.settings.joinColumnName
  ) {
    return null;
  }

  const joinColumnName = flatFieldMetadata.settings.joinColumnName;

  return {
    name: joinColumnName,
    type: fieldMetadataTypeToColumnType(FieldMetadataType.UUID),
    isNullable: true,
    isArray: false,
    isUnique: false,
    default: null,
    isPrimary: false,
  };
};

const generateColumnDefinition = ({
  flatFieldMetadata,
  schemaName,
  tableName,
}: {
  flatFieldMetadata: FlatFieldMetadata;
  tableName: string;
  schemaName: string;
}): WorkspaceSchemaColumnDefinition => {
  const columnName = computeColumnName(flatFieldMetadata.name);
  const columnType = fieldMetadataTypeToColumnType(
    flatFieldMetadata.type,
  ) as ColumnType;
  const serializedDefaultValue = serializeDefaultValue({
    columnName,
    schemaName,
    tableName,
    columnType,
    defaultValue: flatFieldMetadata.defaultValue,
  });

  return {
    name: columnName,
    type:
      columnType === 'enum'
        ? `"${schemaName}"."${computePostgresEnumName({ tableName, columnName })}"`
        : (columnType as string),
    isNullable: flatFieldMetadata.isNullable ?? true,
    isArray:
      flatFieldMetadata.type === FieldMetadataType.ARRAY ||
      flatFieldMetadata.type === FieldMetadataType.MULTI_SELECT,
    isUnique: flatFieldMetadata.isUnique ?? false,
    default: serializedDefaultValue,
    isPrimary: flatFieldMetadata.name === 'id',
  };
};

export const generateColumnDefinitions = ({
  flatFieldMetadata,
  flatObjectMetadata,
  siblingFields = [],
}: {
  flatFieldMetadata: FlatFieldMetadata;
  flatObjectMetadata: FlatObjectMetadata;
  /** Other fields on the same object - needed for CALCULATED field reference resolution */
  siblingFields?: FlatFieldMetadata[];
}): WorkspaceSchemaColumnDefinition[] => {
  const { tableName, schemaName } = getWorkspaceSchemaContextForMigration({
    workspaceId: flatObjectMetadata.workspaceId,
    flatObjectMetadata,
  });

  if (isCompositeFlatFieldMetadata(flatFieldMetadata)) {
    const compositeType = getCompositeTypeOrThrow(flatFieldMetadata.type);

    return compositeType.properties.map((property) =>
      generateCompositeColumnDefinition({
        compositeProperty: property,
        parentFieldMetadata: flatFieldMetadata,
        flatObjectMetadata,
      }),
    );
  }

  if (
    isFlatFieldMetadataOfType(flatFieldMetadata, FieldMetadataType.TS_VECTOR)
  ) {
    return [generateTsVectorColumnDefinition(flatFieldMetadata)];
  }

  if (
    isFlatFieldMetadataOfType(flatFieldMetadata, FieldMetadataType.CALCULATED)
  ) {
    const calculatedColumn = generateCalculatedColumnDefinition(
      flatFieldMetadata,
      siblingFields,
    );

    return calculatedColumn ? [calculatedColumn] : [];
  }

  if (isMorphOrRelationFlatFieldMetadata(flatFieldMetadata)) {
    const relationColumn = generateRelationColumnDefinition(flatFieldMetadata);

    return relationColumn ? [relationColumn] : [];
  }

  return [
    generateColumnDefinition({ flatFieldMetadata, tableName, schemaName }),
  ];
};
