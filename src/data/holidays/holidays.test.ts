/** @jest-environment node */
import type { PublicHoliday } from '@/domain/types';

import type { Database } from '../database';
import { listHolidays, replaceHolidaysForYear } from '../repositories/holidayRepository';
import { getSettings, setSetting } from '../repositories/settingsRepository';
import { createTestDb } from '../testDb';
import { parseHolidays, type HolidayFetcher } from './nagerClient';
import { autoSyncHolidays, syncHolidays } from './syncHolidays';

const now = new Date('2026-10-22T10:00:00Z');
const fakeFetch: HolidayFetcher = async (year) => [
  { date: `${year}-01-01`, name: 'Újév' },
  { date: `${year}-10-23`, name: 'Nemzeti ünnep' },
];

describe('parseHolidays', () => {
  it('keeps public holidays with their Hungarian name, one per date', () => {
    const json = [
      { date: '2026-01-01', localName: 'Újév', name: "New Year's Day", types: ['Public'] },
      { date: '2026-01-01', localName: 'Duplicate', name: 'x', types: ['Public'] },
      { date: '2026-02-14', localName: 'Valentin-nap', name: 'x', types: ['Observance'] },
    ];
    expect(parseHolidays(json)).toEqual<PublicHoliday[]>([{ date: '2026-01-01', name: 'Újév' }]);
  });

  it('rejects an unexpected response', () => {
    expect(() => parseHolidays({ error: 'nope' })).toThrow();
  });
});

describe('syncHolidays', () => {
  let db: Database;
  beforeEach(async () => {
    db = await createTestDb();
  });

  it('stores this and next year and records the time', async () => {
    replaceHolidaysForYear(db, 2026, [{ date: '2026-05-01', name: 'Old' }]);
    await syncHolidays(db, fakeFetch, now);

    expect(listHolidays(db).map((h) => h.date)).toEqual([
      '2026-01-01',
      '2026-10-23',
      '2027-01-01',
      '2027-10-23',
    ]);
    expect(getSettings(db).holidaysSyncedAt).toBe(now.toISOString());
  });

  it('keeps the cache when a download fails', async () => {
    replaceHolidaysForYear(db, 2026, [{ date: '2026-05-01', name: 'Cached' }]);
    const failing: HolidayFetcher = async (year) => {
      if (year === 2027) throw new Error('offline');
      return fakeFetch(year);
    };
    await expect(syncHolidays(db, failing, now)).rejects.toThrow('offline');
    expect(listHolidays(db)).toEqual([{ date: '2026-05-01', name: 'Cached' }]);
  });
});

describe('autoSyncHolidays', () => {
  let db: Database;
  let calls: number[];
  const countingFetch: HolidayFetcher = async (year) => {
    calls.push(year);
    return fakeFetch(year);
  };

  beforeEach(async () => {
    db = await createTestDb();
    calls = [];
  });

  it('does nothing while sync is off', async () => {
    await autoSyncHolidays(db, countingFetch, now);
    expect(calls).toEqual([]);
  });

  it('syncs when next year is missing, and not again afterwards', async () => {
    setSetting(db, 'holidaySyncEnabled', true);
    await autoSyncHolidays(db, countingFetch, now);
    await autoSyncHolidays(db, countingFetch, now);
    expect(calls).toEqual([2026, 2027]);
  });

  it('swallows network errors', async () => {
    setSetting(db, 'holidaySyncEnabled', true);
    await expect(
      autoSyncHolidays(db, () => Promise.reject(new Error('offline')), now),
    ).resolves.toBeUndefined();
  });
});
