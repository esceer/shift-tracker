/** @jest-environment node */
import type { Database } from '../database';
import { createTestDb } from '../testDb';
import { deleteMonthPlan, listPlannedDays, saveMonthPlan } from './plannedDayRepository';

describe('plannedDayRepository', () => {
  let db: Database;
  beforeEach(async () => {
    db = await createTestDb();
    saveMonthPlan(db, 2026, 10, [
      { date: '2026-10-01', minutes: 480 },
      { date: '2026-10-02', minutes: 0 },
    ]);
    saveMonthPlan(db, 2026, 11, [{ date: '2026-11-02', minutes: 300 }]);
  });

  it('lists planned days, optionally by range', () => {
    expect([...listPlannedDays(db)]).toEqual([
      ['2026-10-01', 480],
      ['2026-10-02', 0],
      ['2026-11-02', 300],
    ]);
    expect([...listPlannedDays(db, { start: '2026-11-01', end: '2026-11-30' })]).toEqual([
      ['2026-11-02', 300],
    ]);
  });

  it('replaces only the given month', () => {
    saveMonthPlan(db, 2026, 10, [{ date: '2026-10-05', minutes: 360 }]);
    expect([...listPlannedDays(db).keys()]).toEqual(['2026-10-05', '2026-11-02']);
  });

  it('removes a month plan', () => {
    deleteMonthPlan(db, 2026, 10);
    expect([...listPlannedDays(db).keys()]).toEqual(['2026-11-02']);
  });
});
