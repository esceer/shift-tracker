/** @jest-environment node */
import type { Database } from '@/data/database';
import { listEntries } from '@/data/repositories/entryRepository';
import { listScheduleVersions } from '@/data/repositories/scheduleRepository';
import { createTestDb } from '@/data/testDb';
import { buildPeriodReport } from '@/domain/balance';
import { mergeEntries } from '@/domain/holidays';
import { standardSchedule } from '@/domain/testFixtures';
import type { Period, WeeklyMinutes } from '@/domain/types';

import { saveScheduleFrom } from './saveSchedule';

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

  it('updates the version that starts on the same date', () => {
    saveScheduleFrom(db, '2026-01-01', fullTime, newId);
    const versions = listScheduleVersions(db);
    expect(versions).toHaveLength(1);
    expect(versions[0]?.minutesByWeekday).toEqual(fullTime);
  });
});
