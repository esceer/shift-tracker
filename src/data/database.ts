import type { BaseSQLiteDatabase } from 'drizzle-orm/sqlite-core';

import type * as schema from './schema';

/**
 * Any synchronous Drizzle SQLite database with our schema: expo-sqlite in the app,
 * sql.js in tests. Repositories depend on this type only.
 */
export type Database = BaseSQLiteDatabase<'sync', unknown, typeof schema>;
