import { weekdayOf } from './dates';
import type { ISODate, Minutes, ScheduleVersion } from './types';

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

/** Scheduled minutes for `date`; 0 before the first version. */
export function scheduledMinutesOn(versions: readonly ScheduleVersion[], date: ISODate): Minutes {
  return activeScheduleOn(versions, date)?.minutesByWeekday[weekdayOf(date)] ?? 0;
}
