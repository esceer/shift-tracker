import type { Database } from '@/data/database';
import { listScheduleVersions, saveScheduleVersion } from '@/data/repositories/scheduleRepository';
import type { ISODate, Minutes, WeeklyMinutes } from '@/domain/types';

/**
 * Saves the weekly hours and munkarend as valid from `effectiveFrom`. Updates the version starting on
 * that exact date if there is one; otherwise adds a new version, so earlier days keep
 * their old schedule.
 */
export function saveScheduleFrom(
  db: Database,
  effectiveFrom: ISODate,
  minutesByWeekday: WeeklyMinutes,
  dailyMinutes: Minutes,
  newId: () => string,
): void {
  const existing = listScheduleVersions(db).find((v) => v.effectiveFrom === effectiveFrom);
  saveScheduleVersion(db, {
    id: existing?.id ?? newId(),
    effectiveFrom,
    minutesByWeekday,
    dailyMinutes,
  });
}
