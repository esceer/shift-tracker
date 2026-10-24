import { and, asc, gte, lte } from 'drizzle-orm';

import type { ISODate, WorkdaySwap } from '@/domain/types';

import type { Database } from '../database';
import { workdaySwaps } from '../schema';

/** Cached swapped days ordered by date; optionally limited to an inclusive date range. */
export function listWorkdaySwaps(
  db: Database,
  range?: { start: ISODate; end: ISODate },
): WorkdaySwap[] {
  const where = range
    ? and(gte(workdaySwaps.date, range.start), lte(workdaySwaps.date, range.end))
    : undefined;
  return db.select().from(workdaySwaps).where(where).orderBy(asc(workdaySwaps.date)).all();
}

/** Replaces all cached swapped days in a single transaction. */
export function replaceWorkdaySwaps(db: Database, swaps: readonly WorkdaySwap[]): void {
  db.transaction((tx) => {
    tx.delete(workdaySwaps).run();
    if (swaps.length > 0) {
      tx.insert(workdaySwaps)
        .values(swaps.map(({ date, kind }) => ({ date, kind })))
        .run();
    }
  });
}
