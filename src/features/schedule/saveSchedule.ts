import type { Database } from '@/data/database';
import { listPlannedDays } from '@/data/repositories/plannedDayRepository';
import {
  deleteScheduleVersion,
  listScheduleVersions,
  saveScheduleVersion,
} from '@/data/repositories/scheduleRepository';
import type { ISODate, WeeklyMinutes } from '@/domain/types';

/**
 * Saves the weekly hours as valid from `effectiveFrom` on. Updates the version starting on
 * that exact date if there is one, otherwise adds a new version, so earlier days keep
 * their old schedule. Versions starting later are replaced.
 */
export function saveScheduleFrom(
  db: Database,
  effectiveFrom: ISODate,
  minutesByWeekday: WeeklyMinutes,
  newId: () => string,
): void {
  const versions = listScheduleVersions(db);
  const existing = versions.find((v) => v.effectiveFrom === effectiveFrom);
  db.transaction((tx) => {
    versions
      .filter((v) => v.effectiveFrom > effectiveFrom)
      .forEach((v) => deleteScheduleVersion(tx, v.id));
    saveScheduleVersion(tx, { id: existing?.id ?? newId(), effectiveFrom, minutesByWeekday });
  });
}

/** First days of the months with a monthly plan on or after `from` (the weekly schedule doesn't apply there). */
export function plannedMonthsFrom(db: Database, from: ISODate): ISODate[] {
  const dates = [...listPlannedDays(db, { start: from, end: '9999-12-31' }).keys()];
  return [...new Set(dates.map((date) => `${date.slice(0, 7)}-01`))];
}
