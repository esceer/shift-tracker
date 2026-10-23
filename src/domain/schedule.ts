import { weekdayOf } from './dates';
import type { ISODate, Minutes, PlannedDays, ScheduleVersion } from './types';

/** The version active on `date`: the one with the latest `effectiveFrom` on or before it. */
export function activeScheduleOn(
  versions: readonly ScheduleVersion[],
  date: ISODate,
): ScheduleVersion | undefined {
  let active: ScheduleVersion | undefined;
  for (const version of versions) {
    if (
      version.effectiveFrom <= date &&
      (!active || version.effectiveFrom > active.effectiveFrom)
    ) {
      active = version;
    }
  }
  return active;
}

/** Scheduled minutes for `date`: a monthly plan wins over the weekly schedule; 0 before any. */
export function scheduledMinutesOn(
  versions: readonly ScheduleVersion[],
  date: ISODate,
  plannedDays: PlannedDays = new Map(),
): Minutes {
  const planned = plannedDays.get(date);
  if (planned !== undefined) return planned;
  return activeScheduleOn(versions, date)?.minutesByWeekday[weekdayOf(date)] ?? 0;
}
