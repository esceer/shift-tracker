import { and, asc, eq, gte, lte } from 'drizzle-orm';

import type { DayEntry, ISODate } from '@/domain/types';

import type { Database } from '../database';
import { dayEntries } from '../schema';

type Row = typeof dayEntries.$inferSelect;

function toDomain(row: Row): DayEntry {
  const base = { date: row.date, note: row.note };
  switch (row.kind) {
    case 'adjustment':
    case 'actual':
      // The table's CHECK constraint guarantees minutes is set for these kinds.
      return { ...base, kind: row.kind, minutes: row.minutes! };
    default:
      return { ...base, kind: row.kind, minutes: null };
  }
}

/** Entries ordered by date; optionally limited to an inclusive date range. */
export function listEntries(db: Database, range?: { start: ISODate; end: ISODate }): DayEntry[] {
  const where = range
    ? and(gte(dayEntries.date, range.start), lte(dayEntries.date, range.end))
    : undefined;
  return db
    .select()
    .from(dayEntries)
    .where(where)
    .orderBy(asc(dayEntries.date))
    .all()
    .map(toDomain);
}

export function getEntry(db: Database, date: ISODate): DayEntry | undefined {
  const row = db.select().from(dayEntries).where(eq(dayEntries.date, date)).get();
  return row && toDomain(row);
}

/** Inserts or replaces the entry for its date (one entry per day). */
export function saveEntry(db: Database, entry: DayEntry): void {
  db.insert(dayEntries)
    .values(entry)
    .onConflictDoUpdate({ target: dayEntries.date, set: entry })
    .run();
}

export function deleteEntry(db: Database, date: ISODate): void {
  db.delete(dayEntries).where(eq(dayEntries.date, date)).run();
}
