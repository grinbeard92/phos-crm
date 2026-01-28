import { Transform } from 'class-transformer';
import snakeCase from 'lodash.snakecase';

export const CastToUpperSnakeCase = () =>
  Transform(({ value }: { value: string }) => toUpperSnakeCase(value));

const toUpperSnakeCase = (value: unknown): string | undefined => {
  if (typeof value === 'string') {
    const trimmed = value.trim();

    // If already in UPPER_SNAKE_CASE format (only uppercase, numbers, and underscores), return as-is
    // This prevents lodash.snakeCase from splitting numbers (e.g., OAUTH2 -> oauth_2)
    if (/^[A-Z0-9_]+$/.test(trimmed)) {
      return trimmed;
    }

    return snakeCase(trimmed).toUpperCase();
  }

  return undefined;
};
