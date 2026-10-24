import { asc, eq } from 'drizzle-orm';

import type { ScheduleVersion } from '@/domain/types';

import type { Database } from '../database';
import { scheduleVersions } from '../schema';

type Row = typeof scheduleVersions.$inferSelect;

function toDomain(row: Row): ScheduleVersion {
  return {
    id: row.id,
    effectiveFrom: row.effectiveFrom,
    minutesByWeekday: {
      1: row.monMinutes,
      2: row.tueMinutes,
      3: row.wedMinutes,
      4: row.thuMinutes,
      5: row.friMinutes,
      6: row.satMinutes,
      7: row.sunMinutes,
    },
    dailyMinutes: row.dailyMinutes,
  };
}

export function toScheduleRow(version: ScheduleVersion): Row {
  const m = version.minutesByWeekday;
  return {
    id: version.id,
    effectiveFrom: version.effectiveFrom,
    monMinutes: m[1],
    tueMinutes: m[2],
    wedMinutes: m[3],
    thuMinutes: m[4],
    friMinutes: m[5],
    satMinutes: m[6],
    sunMinutes: m[7],
    dailyMinutes: version.dailyMinutes,
  };
}

/** All versions, oldest first. */
export function listScheduleVersions(db: Database): ScheduleVersion[] {
  return db
    .select()
    .from(scheduleVersions)
    .orderBy(asc(scheduleVersions.effectiveFrom))
    .all()
    .map(toDomain);
}

/** Inserts or updates (by id). Two versions cannot share an `effectiveFrom`. */
export function saveScheduleVersion(db: Database, version: ScheduleVersion): void {
  const row = toScheduleRow(version);
  db.insert(scheduleVersions)
    .values(row)
    .onConflictDoUpdate({ target: scheduleVersions.id, set: row })
    .run();
}

export function deleteScheduleVersion(db: Database, id: string): void {
  db.delete(scheduleVersions).where(eq(scheduleVersions.id, id)).run();
}
