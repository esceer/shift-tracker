/** @jest-environment node */
import type { PublicHoliday } from '@/domain/types';

import type { Database } from '../database';
import { listHolidays, replaceHolidaysForYear } from '../repositories/holidayRepository';
import { getSettings, setSetting } from '../repositories/settingsRepository';
import { listWorkdaySwaps } from '../repositories/workdaySwapRepository';
import { createTestDb } from '../testDb';
import { parseHolidays, type HolidayFetcher } from './nagerClient';
import { parseWorkdaySwaps, type SwapFetcher } from './swapClient';
import { autoSyncHolidays, syncHolidays } from './syncHolidays';
import publishedSwaps from '../../../data/hu-workday-swaps.json';

const now = new Date('2026-10-22T10:00:00Z');
const fakeFetch: HolidayFetcher = async (year) => [
  { date: `${year}-01-01`, name: 'Újév' },
  { date: `${year}-10-23`, name: 'Nemzeti ünnep' },
];

const fakeSwaps: SwapFetcher = async () => [
  { date: '2026-12-12', kind: 'work' },
  { date: '2026-12-24', kind: 'rest' },
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

describe('parseWorkdaySwaps', () => {
  it('reads the date → kind map, sorted', () => {
    expect(parseWorkdaySwaps({ '2026-12-24': 'rest', '2026-01-10': 'work' })).toEqual([
      { date: '2026-01-10', kind: 'work' },
      { date: '2026-12-24', kind: 'rest' },
    ]);
  });

  it('accepts the file published in this repository', () => {
    expect(parseWorkdaySwaps(publishedSwaps).length).toBeGreaterThan(0);
  });

  it('rejects unknown kinds and bad dates', () => {
    expect(() => parseWorkdaySwaps({ '2026-12-24': 'party' })).toThrow();
    expect(() => parseWorkdaySwaps({ 'Dec 24': 'rest' })).toThrow();
  });
});

describe('syncHolidays', () => {
  let db: Database;
  beforeEach(async () => {
    db = await createTestDb();
  });

  it('stores this and next year and records the time', async () => {
    replaceHolidaysForYear(db, 2026, [{ date: '2026-05-01', name: 'Old' }]);
    await syncHolidays(db, fakeFetch, fakeSwaps, now);

    expect(listHolidays(db).map((h) => h.date)).toEqual([
      '2026-01-01',
      '2026-10-23',
      '2027-01-01',
      '2027-10-23',
    ]);
    expect(listWorkdaySwaps(db)).toEqual(await fakeSwaps());
    expect(getSettings(db).holidaysSyncedAt).toBe(now.toISOString());
  });

  it('keeps the cache when a download fails', async () => {
    replaceHolidaysForYear(db, 2026, [{ date: '2026-05-01', name: 'Cached' }]);
    const failing: HolidayFetcher = async (year) => {
      if (year === 2027) throw new Error('offline');
      return fakeFetch(year);
    };
    await expect(syncHolidays(db, failing, fakeSwaps, now)).rejects.toThrow('offline');
    expect(listHolidays(db)).toEqual([{ date: '2026-05-01', name: 'Cached' }]);
    expect(listWorkdaySwaps(db)).toEqual([]);
  });

  it('keeps the cache when the swapped days fail to download', async () => {
    replaceHolidaysForYear(db, 2026, [{ date: '2026-05-01', name: 'Cached' }]);
    const failing: SwapFetcher = () => Promise.reject(new Error('404'));
    await expect(syncHolidays(db, fakeFetch, failing, now)).rejects.toThrow('404');
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
    await autoSyncHolidays(db, countingFetch, fakeSwaps, now);
    expect(calls).toEqual([]);
  });

  it('syncs when next year is missing, and not again afterwards', async () => {
    setSetting(db, 'holidaySyncEnabled', true);
    await autoSyncHolidays(db, countingFetch, fakeSwaps, now);
    await autoSyncHolidays(db, countingFetch, fakeSwaps, now);
    expect(calls).toEqual([2026, 2027]);
  });

  it('syncs again a month after the last sync', async () => {
    setSetting(db, 'holidaySyncEnabled', true);
    await autoSyncHolidays(db, countingFetch, fakeSwaps, now);
    await autoSyncHolidays(db, countingFetch, fakeSwaps, new Date('2026-11-20T10:00:00Z'));
    await autoSyncHolidays(db, countingFetch, fakeSwaps, new Date('2026-11-22T10:00:00Z'));
    expect(calls).toEqual([2026, 2027, 2026, 2027]);
  });

  it('swallows network errors', async () => {
    setSetting(db, 'holidaySyncEnabled', true);
    await expect(
      autoSyncHolidays(db, () => Promise.reject(new Error('offline')), fakeSwaps, now),
    ).resolves.toBeUndefined();
  });
});
