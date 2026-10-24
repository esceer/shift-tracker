/** @jest-environment node */
import { octoberEntries, standardSchedule } from '@/domain/testFixtures';

import type { Database } from './database';
import { readDayForEditing, readDays, readPeriodReport, readUpcoming } from './queries';
import { saveEntry } from './repositories/entryRepository';
import { replaceHolidaysForYear } from './repositories/holidayRepository';
import { saveScheduleVersion } from './repositories/scheduleRepository';
import { setSetting } from './repositories/settingsRepository';
import { replaceWorkdaySwaps } from './repositories/workdaySwapRepository';
import { createTestDb } from './testDb';

describe('queries', () => {
  let db: Database;
  beforeEach(async () => {
    db = await createTestDb();
    saveScheduleVersion(db, standardSchedule);
    setSetting(db, 'dailyMinutes', 360);
    octoberEntries.forEach((entry) => saveEntry(db, entry));
    replaceHolidaysForYear(db, 2026, [
      { date: '2026-10-23', name: 'Nemzeti ünnep' },
      { date: '2026-11-01', name: 'Mindenszentek' },
    ]);
  });

  it('builds the month report from stored data', () => {
    const report = readPeriodReport(db, { type: 'month', year: 2026, month: 10 });
    // +2h 45m of changes on a plan 6h under the 22 × 6h required
    expect(report.requiredMinutes).toBe(132 * 60);
    expect(report.balanceMinutes).toBe(165 - 360);
    expect(report.absenceDays.holiday).toBe(0); // sync is off by default
  });

  it('includes synced holidays once sync is enabled', () => {
    setSetting(db, 'holidaySyncEnabled', true);
    const days = readDays(db, '2026-10-22', '2026-10-23');
    expect(days[1]?.entry).toMatchObject({ kind: 'holiday', synced: true, note: 'Nemzeti ünnep' });
  });

  it('applies synced holidays and swapped days to the required hours', () => {
    replaceWorkdaySwaps(db, [{ date: '2026-12-24', kind: 'rest' }]);
    const minutes = () =>
      readDays(db, '2026-10-23', '2026-10-23')
        .concat(readDays(db, '2026-12-24', '2026-12-24'))
        .map((d) => [d.scheduledMinutes, d.requiredMinutes]);

    expect(minutes()).toEqual([
      [360, 360],
      [480, 360],
    ]);
    setSetting(db, 'holidaySyncEnabled', true);
    expect(minutes()).toEqual([
      [360, 0],
      [0, 0],
    ]);
  });

  it('finds the next change and holiday from today', () => {
    setSetting(db, 'holidaySyncEnabled', true);
    const { nextChange, nextHoliday } = readUpcoming(db, '2026-10-22');
    expect(nextChange).toMatchObject({ date: '2026-10-28', deltaMinutes: -120 });
    expect(nextHoliday).toEqual({ date: '2026-10-23', name: 'Nemzeti ünnep' });
  });

  it('hides the next holiday while sync is off', () => {
    expect(readUpcoming(db, '2026-10-22').nextHoliday).toBeUndefined();
  });

  it('reads one day for editing', () => {
    expect(readDayForEditing(db, '2026-10-28')).toEqual({
      scheduledMinutes: 480,
      requiredMinutes: 360,
      entry: octoberEntries[4],
      holidayName: undefined,
    });
    expect(readDayForEditing(db, '2026-10-23').holidayName).toBe('Nemzeti ünnep');
  });
});
