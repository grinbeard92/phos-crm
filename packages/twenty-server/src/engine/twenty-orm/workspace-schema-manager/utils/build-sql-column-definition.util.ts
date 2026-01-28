import { isDefined } from 'twenty-shared/utils';

import { type WorkspaceSchemaColumnDefinition } from 'src/engine/twenty-orm/workspace-schema-manager/types/workspace-schema-column-definition.type';
import { removeSqlDDLInjection } from 'src/engine/workspace-manager/workspace-migration/utils/remove-sql-injection.util';

export const buildSqlColumnDefinition = (
  column: WorkspaceSchemaColumnDefinition,
): string => {
  const safeName = removeSqlDDLInjection(column.name);
  const parts = [`"${safeName}"`];

  parts.push(column.isArray ? `${column.type}[]` : column.type);

  // Support GENERATED ALWAYS AS for tsvector and calculated fields
  if (column.asExpression) {
    parts.push(`GENERATED ALWAYS AS (${column.asExpression})`); // TODO: to sanitize
    if (column.generatedType) {
      parts.push(column.generatedType);
    }
  }

  if (column.isPrimary) {
    parts.push('PRIMARY KEY');
  }

  // Generated columns cannot have NOT NULL or DEFAULT constraints
  if (column.isNullable === false && !column.asExpression) {
    parts.push('NOT NULL');
  }

  if (isDefined(column.default) && !column.asExpression) {
    parts.push(`DEFAULT ${column.default}`);
  }

  return parts.join(' ');
};
