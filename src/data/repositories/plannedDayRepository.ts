import { and, asc, gte, like, lte } from 'drizzle-orm';

import type { ISODate, Minutes, PlannedDays } from '@/domain/types';

import type { Database } from '../database';
import { plannedDays } from '../schema';

const monthPattern = (year: number, month: number) => `${year}-${String(month).padStart(2, '0')}-%`;

/** Planned hours per date (from monthly plans), optionally limited to an inclusive range. */
export function listPlannedDays(
  db: Database,
  range?: { start: ISODate; end: ISODate },
): PlannedDays {
  const where = range
    ? and(gte(plannedDays.date, range.start), lte(plannedDays.date, range.end))
    : undefined;
  const rows = db.select().from(plannedDays).where(where).orderBy(asc(plannedDays.date)).all();
  return new Map(rows.map((row) => [row.date, row.minutes]));
}

/** Replaces the plan of one month with `days` (every day of that month). */
export function saveMonthPlan(
  db: Database,
  year: number,
  month: number,
  days: { date: ISODate; minutes: Minutes }[],
): void {
  db.transaction((tx) => {
    tx.delete(plannedDays)
      .where(like(plannedDays.date, monthPattern(year, month)))
      .run();
    if (days.length > 0) tx.insert(plannedDays).values(days).run();
  });
}

/** Removes a month's plan; the weekly schedule applies again. */
export function deleteMonthPlan(db: Database, year: number, month: number): void {
  db.delete(plannedDays)
    .where(like(plannedDays.date, monthPattern(year, month)))
    .run();
}
