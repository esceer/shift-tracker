/** @jest-environment node */
import type { Database } from '../database';
import { createTestDb } from '../testDb';
import { listHolidays, replaceHolidaysForYear } from './holidayRepository';

const holidays2026 = [
  { date: '2026-03-15', name: 'Nemzeti ünnep' },
  { date: '2026-10-23', name: 'Nemzeti ünnep' },
];
const holidays2027 = [{ date: '2027-01-01', name: 'Újév' }];

describe('holidayRepository', () => {
  let db: Database;
  beforeEach(async () => {
    db = await createTestDb();
    replaceHolidaysForYear(db, 2026, holidays2026);
    replaceHolidaysForYear(db, 2027, holidays2027);
  });

  it('lists holidays, optionally by range', () => {
    expect(listHolidays(db)).toEqual([...holidays2026, ...holidays2027]);
    expect(listHolidays(db, { start: '2026-10-01', end: '2026-12-31' })).toEqual([holidays2026[1]]);
  });

  it('replaces only the given year', () => {
    replaceHolidaysForYear(db, 2026, [{ date: '2026-12-25', name: 'Karácsony' }]);
    expect(listHolidays(db)).toEqual([{ date: '2026-12-25', name: 'Karácsony' }, ...holidays2027]);
  });

  it('can clear a year', () => {
    replaceHolidaysForYear(db, 2027, []);
    expect(listHolidays(db)).toEqual(holidays2026);
  });
});
