/** @jest-environment node */
import { sql } from 'drizzle-orm';

import { octoberEntries } from '@/domain/testFixtures';
import type { DayEntry } from '@/domain/types';

import type { Database } from '../database';
import { createTestDb } from '../testDb';
import { deleteEntry, getEntry, listEntries, saveEntry } from './entryRepository';

const vacation: DayEntry = { date: '2026-11-02', kind: 'vacation', minutes: null, note: null };

describe('entryRepository', () => {
  let db: Database;
  beforeEach(async () => {
    db = await createTestDb();
    [...octoberEntries, vacation].forEach((entry) => saveEntry(db, entry));
  });

  it('round-trips all entry kinds', () => {
    expect(listEntries(db)).toEqual([...octoberEntries, vacation]);
  });

  it('filters by an inclusive date range', () => {
    const dates = listEntries(db, { start: '2026-10-14', end: '2026-10-20' }).map((e) => e.date);
    expect(dates).toEqual(['2026-10-14', '2026-10-15', '2026-10-20']);
  });

  it('keeps one entry per day (save replaces)', () => {
    const replacement: DayEntry = { date: '2026-10-05', kind: 'sick', minutes: null, note: null };
    saveEntry(db, replacement);
    expect(getEntry(db, '2026-10-05')).toEqual(replacement);
    expect(listEntries(db)).toHaveLength(6);
  });

  it('deletes an entry', () => {
    deleteEntry(db, '2026-11-02');
    expect(getEntry(db, '2026-11-02')).toBeUndefined();
  });

  it('enforces minutes by kind at the database level', () => {
    expect(() =>
      db.run(
        sql`INSERT INTO day_entries (date, kind, minutes) VALUES ('2026-12-01', 'vacation', 60)`,
      ),
    ).toThrow();
    expect(() =>
      db.run(
        sql`INSERT INTO day_entries (date, kind, minutes) VALUES ('2026-12-01', 'actual', NULL)`,
      ),
    ).toThrow();
  });
});
