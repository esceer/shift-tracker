/** @jest-environment node */
import type { Database } from '@/data/database';
import { listEntries } from '@/data/repositories/entryRepository';
import { saveMonthPlan } from '@/data/repositories/plannedDayRepository';
import { listScheduleVersions } from '@/data/repositories/scheduleRepository';
import { createTestDb } from '@/data/testDb';
import { buildPeriodReport } from '@/domain/balance';
import { mergeEntries } from '@/domain/holidays';
import { standardSchedule } from '@/domain/testFixtures';
import type { Period, WeeklyMinutes } from '@/domain/types';

import { plannedMonthsFrom, saveScheduleFrom } from './saveSchedule';

const fullTime: WeeklyMinutes = { 1: 480, 2: 480, 3: 480, 4: 480, 5: 480, 6: 0, 7: 0 };
let nextId = 0;
const newId = () => `id-${++nextId}`;

function scheduledIn(db: Database, period: Period) {
  const entries = mergeEntries(listEntries(db), [], false);
  return buildPeriodReport(period, listScheduleVersions(db), entries).scheduledMinutes;
}

describe('saveScheduleFrom', () => {
  let db: Database;
  beforeEach(async () => {
    db = await createTestDb();
    saveScheduleFrom(db, '2026-01-01', standardSchedule.minutesByWeekday, newId);
  });

  it('adds a new version without changing earlier months', () => {
    const october = { type: 'month', year: 2026, month: 10 } as const;
    const before = scheduledIn(db, october);

    saveScheduleFrom(db, '2026-11-01', fullTime, newId);

    expect(listScheduleVersions(db)).toHaveLength(2);
    expect(scheduledIn(db, october)).toBe(before);
    expect(scheduledIn(db, { type: 'month', year: 2026, month: 11 })).toBe(21 * 480);
  });

  it('replaces versions that start later', () => {
    saveScheduleFrom(db, '2026-10-24', fullTime, newId);
    saveScheduleFrom(db, '2026-10-01', standardSchedule.minutesByWeekday, newId);

    expect(listScheduleVersions(db).map((v) => v.effectiveFrom)).toEqual([
      '2026-01-01',
      '2026-10-01',
    ]);
  });

  it('updates the version that starts on the same date', () => {
    saveScheduleFrom(db, '2026-01-01', fullTime, newId);
    const versions = listScheduleVersions(db);
    expect(versions).toHaveLength(1);
    expect(versions[0]?.minutesByWeekday).toEqual(fullTime);
  });
});

describe('plannedMonthsFrom', () => {
  it('lists the months with a monthly plan on or after the date', async () => {
    const db = await createTestDb();
    saveMonthPlan(db, 2026, 9, [{ date: '2026-09-30', minutes: 480 }]);
    saveMonthPlan(db, 2026, 10, [
      { date: '2026-10-14', minutes: 480 },
      { date: '2026-10-20', minutes: 360 },
    ]);
    saveMonthPlan(db, 2027, 1, [{ date: '2027-01-05', minutes: 480 }]);

    expect(plannedMonthsFrom(db, '2026-10-15')).toEqual(['2026-10-01', '2027-01-01']);
    expect(plannedMonthsFrom(db, '2027-02-01')).toEqual([]);
  });
});
