import { getTableName, type Table } from 'drizzle-orm';
import { addDatabaseChangeListener } from 'expo-sqlite';
import { useEffect, useMemo, useState } from 'react';

import type { ScheduleVersion } from '@/domain/types';

import type { Database } from './database';
import { db } from './db';
import { listScheduleVersions } from './repositories/scheduleRepository';
import { getSettings, type AppSettings } from './repositories/settingsRepository';
import { scheduleVersions, settings } from './schema';

/**
 * Reads synchronously on first render and again whenever one of `tables` changes.
 * `read` must be stable (module-level or `useCallback`).
 */
export function useLiveData<T>(tables: readonly Table[], read: (db: Database) => T): T {
  const [version, setVersion] = useState(0);
  const tableNames = tables.map(getTableName).join(',');

  useEffect(() => {
    const names = tableNames.split(',');
    const subscription = addDatabaseChangeListener(({ tableName }) => {
      if (names.includes(tableName)) setVersion((v) => v + 1);
    });
    return () => subscription.remove();
  }, [tableNames]);

  // eslint-disable-next-line react-hooks/exhaustive-deps -- `version` is the change signal
  return useMemo(() => read(db), [read, version]);
}

export function useScheduleVersions(): ScheduleVersion[] {
  return useLiveData([scheduleVersions], listScheduleVersions);
}

export function useSettings(): AppSettings {
  return useLiveData([settings], getSettings);
}
