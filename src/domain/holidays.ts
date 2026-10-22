import type { DayEntry, EffectiveEntry, PublicHoliday } from './types';

/**
 * Merges user entries with synced public holidays. A user entry always wins;
 * a holiday on a date without one becomes a virtual `holiday` entry.
 */
export function mergeEntries(
  userEntries: readonly DayEntry[],
  holidays: readonly PublicHoliday[],
  holidaySyncEnabled: boolean,
): EffectiveEntry[] {
  const byDate = new Map<string, EffectiveEntry>();
  if (holidaySyncEnabled) {
    for (const holiday of holidays) {
      byDate.set(holiday.date, {
        date: holiday.date,
        kind: 'holiday',
        minutes: null,
        note: holiday.name,
        synced: true,
      });
    }
  }
  for (const entry of userEntries) {
    byDate.set(entry.date, { ...entry, synced: false });
  }
  return [...byDate.values()].sort((a, b) => a.date.localeCompare(b.date));
}
