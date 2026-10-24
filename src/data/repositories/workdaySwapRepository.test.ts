/** @jest-environment node */
import type { Database } from '../database';
import { createTestDb } from '../testDb';
import { listWorkdaySwaps, replaceWorkdaySwaps } from './workdaySwapRepository';

const swaps = [
  { date: '2026-01-02', kind: 'rest' },
  { date: '2026-01-10', kind: 'work' },
  { date: '2026-12-24', kind: 'rest' },
] as const;

describe('workdaySwapRepository', () => {
  let db: Database;
  beforeEach(async () => {
    db = await createTestDb();
    replaceWorkdaySwaps(db, swaps);
  });

  it('lists swaps, optionally by range', () => {
    expect(listWorkdaySwaps(db)).toEqual(swaps);
    expect(listWorkdaySwaps(db, { start: '2026-12-01', end: '2026-12-31' })).toEqual([swaps[2]]);
  });

  it('replaces all swaps', () => {
    replaceWorkdaySwaps(db, [{ date: '2027-01-02', kind: 'work' }]);
    expect(listWorkdaySwaps(db)).toEqual([{ date: '2027-01-02', kind: 'work' }]);
    replaceWorkdaySwaps(db, []);
    expect(listWorkdaySwaps(db)).toEqual([]);
  });
});
