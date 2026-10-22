import type { Database } from '@/data/database';
import { listScheduleVersions, saveScheduleVersion } from '@/data/repositories/scheduleRepository';
import type { ISODate, WeeklyMinutes } from '@/domain/types';

/**
 * Saves the weekly hours as valid from `effectiveFrom`. Updates the version starting on
 * that exact date if there is one; otherwise adds a new version, so earlier days keep
 * their old schedule.
 */
export function saveScheduleFrom(
  db: Database,
  effectiveFrom: ISODate,
  minutesByWeekday: WeeklyMinutes,
  newId: () => string,
): void {
  const existing = listScheduleVersions(db).find((v) => v.effectiveFrom === effectiveFrom);
  saveScheduleVersion(db, { id: existing?.id ?? newId(), effectiveFrom, minutesByWeekday });
}
