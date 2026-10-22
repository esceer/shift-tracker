import { and, asc, gte, like, lte } from 'drizzle-orm';

import type { ISODate, PublicHoliday } from '@/domain/types';

import type { Database } from '../database';
import { publicHolidays } from '../schema';

/** Cached holidays ordered by date; optionally limited to an inclusive date range. */
export function listHolidays(
  db: Database,
  range?: { start: ISODate; end: ISODate },
): PublicHoliday[] {
  const where = range
    ? and(gte(publicHolidays.date, range.start), lte(publicHolidays.date, range.end))
    : undefined;
  return db.select().from(publicHolidays).where(where).orderBy(asc(publicHolidays.date)).all();
}

/** Replaces the cached holidays of one year in a single transaction. */
export function replaceHolidaysForYear(
  db: Database,
  year: number,
  holidays: readonly PublicHoliday[],
): void {
  db.transaction((tx) => {
    tx.delete(publicHolidays)
      .where(like(publicHolidays.date, `${year}-%`))
      .run();
    if (holidays.length > 0) {
      tx.insert(publicHolidays)
        .values(holidays.map(({ date, name }) => ({ date, name })))
        .run();
    }
  });
}
