import type { Database } from '../database';
import { listHolidays, replaceHolidaysForYear } from '../repositories/holidayRepository';
import { getSettings, setSetting } from '../repositories/settingsRepository';
import { replaceWorkdaySwaps } from '../repositories/workdaySwapRepository';
import type { HolidayFetcher } from './nagerClient';
import type { SwapFetcher } from './swapClient';

/** Re-sync this often, so swapped days published later in the year arrive. */
const RESYNC_AFTER_MS = 30 * 24 * 60 * 60 * 1000;

/** Downloads this year's and next year's holidays and the swapped days, replacing the cached ones. */
export async function syncHolidays(
  db: Database,
  fetch: HolidayFetcher,
  fetchSwaps: SwapFetcher,
  now: Date,
): Promise<void> {
  const year = now.getFullYear();
  // Fetch everything first so a failure leaves the cache untouched.
  const [current, next, swaps] = await Promise.all([fetch(year), fetch(year + 1), fetchSwaps()]);
  replaceHolidaysForYear(db, year, current);
  replaceHolidaysForYear(db, year + 1, next);
  replaceWorkdaySwaps(db, swaps);
  setSetting(db, 'holidaysSyncedAt', now.toISOString());
}

/** On startup: syncs when enabled and next year is not cached yet or the last sync is old. Never throws. */
export async function autoSyncHolidays(
  db: Database,
  fetch: HolidayFetcher,
  fetchSwaps: SwapFetcher,
  now: Date,
): Promise<void> {
  const { holidaySyncEnabled, holidaysSyncedAt } = getSettings(db);
  if (!holidaySyncEnabled) return;
  const nextYear = now.getFullYear() + 1;
  const cached = listHolidays(db, { start: `${nextYear}-01-01`, end: `${nextYear}-12-31` });
  const recent =
    holidaysSyncedAt !== null && now.getTime() - Date.parse(holidaysSyncedAt) < RESYNC_AFTER_MS;
  if (cached.length > 0 && recent) return;
  try {
    await syncHolidays(db, fetch, fetchSwaps, now);
  } catch {
    // Offline or API down: keep using the cached holidays and try again next start.
  }
}
