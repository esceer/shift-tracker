import { getTableName, type Table } from 'drizzle-orm';
import { addDatabaseChangeListener } from 'expo-sqlite';
import { useCallback, useEffect, useMemo, useState } from 'react';

import type {
  DayInfo,
  ISODate,
  NationalCalendar,
  Period,
  PeriodReport,
  PlannedDays,
  ScheduleVersion,
} from '@/domain/types';

import type { Database } from './database';
import { db } from './db';
import {
  readDayForEditing,
  readDays,
  readNationalCalendar,
  readPeriodReport,
  readUpcoming,
} from './queries';
import { listPlannedDays } from './repositories/plannedDayRepository';
import { listScheduleVersions } from './repositories/scheduleRepository';
import { getSettings, type AppSettings } from './repositories/settingsRepository';
import {
  dayEntries,
  plannedDays,
  publicHolidays,
  scheduleVersions,
  settings,
  workdaySwaps,
} from './schema';

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

const dayTables = [
  scheduleVersions,
  plannedDays,
  dayEntries,
  publicHolidays,
  workdaySwaps,
  settings,
];

export function useDays(start: ISODate, end: ISODate): DayInfo[] {
  const read = useCallback((db: Database) => readDays(db, start, end), [start, end]);
  return useLiveData(dayTables, read);
}

export function usePeriodReport(period: Period): PeriodReport {
  const key = JSON.stringify(period);
  // eslint-disable-next-line react-hooks/exhaustive-deps -- `key` captures the period by value
  const read = useCallback((db: Database) => readPeriodReport(db, period), [key]);
  return useLiveData(dayTables, read);
}

export function useUpcoming(today: ISODate) {
  const read = useCallback((db: Database) => readUpcoming(db, today), [today]);
  return useLiveData(dayTables, read);
}

export function useDayForEditing(date: ISODate) {
  const read = useCallback((db: Database) => readDayForEditing(db, date), [date]);
  return useLiveData(dayTables, read);
}

/** Monthly-plan days in an inclusive range (empty when the weekly schedule applies). */
export function usePlannedDays(start: ISODate, end: ISODate): PlannedDays {
  const read = useCallback((db: Database) => listPlannedDays(db, { start, end }), [start, end]);
  return useLiveData([plannedDays], read);
}

/** Synced holidays and swapped days in an inclusive range (empty when sync is off). */
export function useNationalCalendar(start: ISODate, end: ISODate): NationalCalendar {
  const read = useCallback(
    (db: Database) => readNationalCalendar(db, { start, end }),
    [start, end],
  );
  return useLiveData([publicHolidays, workdaySwaps, settings], read);
}

export function useScheduleVersions(): ScheduleVersion[] {
  return useLiveData([scheduleVersions], listScheduleVersions);
}

export function useSettings(): AppSettings {
  return useLiveData([settings], getSettings);
}
