import { drizzle } from 'drizzle-orm/expo-sqlite';
import { useMigrations } from 'drizzle-orm/expo-sqlite/migrator';
import { openDatabaseSync } from 'expo-sqlite';

import type { Database } from './database';
import migrations from './migrations/migrations';
import * as schema from './schema';

const sqlite = openDatabaseSync('shift-tracker.db', { enableChangeListener: true });

const expoDb = drizzle(sqlite, { schema });

/** The app's on-device database. */
export const db: Database = expoDb;

/** Runs pending migrations on startup; render the app once `success` is true. */
export function useDatabaseMigrations() {
  return useMigrations(expoDb, migrations);
}
