import type { Database } from '../database';
import { listHolidays, replaceHolidaysForYear } from '../repositories/holidayRepository';
import { getSettings, setSetting } from '../repositories/settingsRepository';
import type { HolidayFetcher } from './nagerClient';

/** Downloads this year's and next year's holidays and replaces the cached ones. */
export async function syncHolidays(db: Database, fetch: HolidayFetcher, now: Date): Promise<void> {
  const year = now.getFullYear();
  // Fetch both years first so a failure leaves the cache untouched.
  const [current, next] = await Promise.all([fetch(year), fetch(year + 1)]);
  replaceHolidaysForYear(db, year, current);
  replaceHolidaysForYear(db, year + 1, next);
  setSetting(db, 'holidaysSyncedAt', now.toISOString());
}

/** On startup: syncs when enabled and next year is not cached yet. Never throws. */
export async function autoSyncHolidays(
  db: Database,
  fetch: HolidayFetcher,
  now: Date,
): Promise<void> {
  if (!getSettings(db).holidaySyncEnabled) return;
  const nextYear = now.getFullYear() + 1;
  const cached = listHolidays(db, { start: `${nextYear}-01-01`, end: `${nextYear}-12-31` });
  if (cached.length > 0) return;
  try {
    await syncHolidays(db, fetch, now);
  } catch {
    // Offline or API down: keep using the cached holidays and try again next start.
  }
}
