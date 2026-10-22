import { drizzle } from 'drizzle-orm/sql-js';
import { migrate } from 'drizzle-orm/sql-js/migrator';
import path from 'path';
import initSqlJs from 'sql.js';

import type { Database } from './database';
import * as schema from './schema';

/** Fresh in-memory database with all migrations applied. Tests only. */
export async function createTestDb(): Promise<Database> {
  const SQL = await initSqlJs();
  const db = drizzle(new SQL.Database(), { schema });
  migrate(db, { migrationsFolder: path.join(__dirname, 'migrations') });
  return db;
}
