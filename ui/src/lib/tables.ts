import type { Driver, TableSummary } from './api/types';

/**
 * The string used to reference a table in configs and wizard requests.
 * MySQL: schema is the database itself, so the bare name is used.
 * Postgres: bare name for `public`, otherwise `schema.name`.
 */
export function tableRef(t: Pick<TableSummary, 'schema' | 'name'>, driver?: Driver): string {
  if (!t.schema) return t.name;
  if (driver === 'mysql') return t.name;
  if (driver === 'postgres' && t.schema === 'public') return t.name;
  return driver ? `${t.schema}.${t.name}` : t.name;
}
