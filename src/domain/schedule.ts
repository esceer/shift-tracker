import { weekdayOf } from './dates';
import type { ISODate, LegalRules, Minutes, PlannedDays, ScheduleVersion } from './types';

/** Full-time munkarend (8h) without a national calendar. */
export const defaultRules: LegalRules = {
  dailyMinutes: 480,
  holidays: new Set(),
  swaps: new Map(),
};

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

/**
 * Planned minutes for `date`: a monthly plan wins over the weekly schedule; 0 before any.
 * On swapped days the weekly schedule gives way: rest days are off, working Saturdays
 * count the munkarend hours.
 */
export function scheduledMinutesOn(
  versions: readonly ScheduleVersion[],
  date: ISODate,
  plannedDays: PlannedDays = new Map(),
  rules: LegalRules = defaultRules,
): Minutes {
  const planned = plannedDays.get(date);
  if (planned !== undefined) return planned;
  const version = activeScheduleOn(versions, date);
  if (!version) return 0;
  switch (rules.swaps.get(date)) {
    case 'rest':
      return 0;
    case 'work':
      return rules.dailyMinutes;
    default:
      return version.minutesByWeekday[weekdayOf(date)];
  }
}

/**
 * Legally required minutes for `date` (törvényes munkaidő): the munkarend hours on Mon–Fri
 * and on swapped working Saturdays; 0 on weekends, public holidays and swapped rest days,
 * and before the first schedule version (when tracking starts).
 */
export function requiredMinutesOn(
  versions: readonly ScheduleVersion[],
  date: ISODate,
  rules: LegalRules = defaultRules,
): Minutes {
  if (!activeScheduleOn(versions, date)) return 0;
  const swap = rules.swaps.get(date);
  if (swap) return swap === 'work' ? rules.dailyMinutes : 0;
  if (rules.holidays.has(date)) return 0;
  return weekdayOf(date) <= 5 ? rules.dailyMinutes : 0;
}
