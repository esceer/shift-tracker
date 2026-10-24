import type { Database } from '@/data/database';
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
