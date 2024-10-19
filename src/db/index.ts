import { drizzle as d1Drizzle } from 'drizzle-orm/d1';
import * as schema from './schema';
import * as relations from './relations';
import { drizzle as drizzleProxy } from 'drizzle-orm/sqlite-proxy';

export const getDrizzleInstnace = (db: D1Database) =>
	d1Drizzle(db, { schema: { ...schema, ...relations }, logger: true });
export type DB = ReturnType<typeof getDrizzleInstnace>;

/**
 * @description only used for generating graphql schemas, do not use for querying
 *
 */
export const drizzleInstanceForGql = drizzleProxy(async () => ({ rows: [] }), {
	schema: { ...schema, ...relations },
});
