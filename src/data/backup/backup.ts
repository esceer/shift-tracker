import { z } from 'zod';

import type { DayEntry, ScheduleVersion } from '@/domain/types';

import type { Database } from '../database';
import { listEntries } from '../repositories/entryRepository';
import { listPlannedDays } from '../repositories/plannedDayRepository';
import { listScheduleVersions, toScheduleRow } from '../repositories/scheduleRepository';
import { getSettings, setSetting } from '../repositories/settingsRepository';
import { dayEntries, plannedDays, scheduleVersions } from '../schema';

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const dayMinutes = z
  .number()
  .int()
  .min(0)
  .max(24 * 60);
const note = z.string().nullable();

const backupSchema = z.object({
  app: z.literal('shift-tracker'),
  version: z.literal(1),
  exportedAt: z.string(),
  scheduleVersions: z.array(
    z.object({
      id: z.string().min(1),
      effectiveFrom: isoDate,
      minutesByWeekday: z.object({
        1: dayMinutes,
        2: dayMinutes,
        3: dayMinutes,
        4: dayMinutes,
        5: dayMinutes,
        6: dayMinutes,
        7: dayMinutes,
      }),
    }),
  ),
  dayEntries: z.array(
    z.union([
      z.object({
        date: isoDate,
        kind: z.literal('adjustment'),
        minutes: z
          .number()
          .int()
          .min(-24 * 60)
          .max(24 * 60),
        note,
      }),
      z.object({ date: isoDate, kind: z.literal('actual'), minutes: dayMinutes, note }),
      z.object({
        date: isoDate,
        kind: z.enum(['vacation', 'sick', 'holiday']),
        minutes: z.null(),
        note,
      }),
    ]),
  ),
  // Added after the first release; older backups have no monthly plans.
  plannedDays: z.array(z.object({ date: isoDate, minutes: dayMinutes })).default([]),
  settings: z.object({
    language: z.enum(['en', 'hu']).nullable(),
    holidaySyncEnabled: z.boolean(),
  }),
});

export type Backup = z.infer<typeof backupSchema>;

/** Everything the user entered. Cached public holidays are left out; they are re-synced. */
export function buildBackup(db: Database, now: Date): Backup {
  const { language, holidaySyncEnabled } = getSettings(db);
  return {
    app: 'shift-tracker',
    version: 1,
    exportedAt: now.toISOString(),
    scheduleVersions: listScheduleVersions(db),
    dayEntries: listEntries(db),
    plannedDays: [...listPlannedDays(db)].map(([date, minutes]) => ({ date, minutes })),
    settings: { language, holidaySyncEnabled },
  };
}

/** Thrown when a file is not a valid Tempo backup. */
export class InvalidBackupError extends Error {}

/** Replaces all schedules, entries and settings with the backup's. All or nothing. */
export function restoreBackup(db: Database, json: unknown): void {
  const parsed = backupSchema.safeParse(json);
  if (!parsed.success) throw new InvalidBackupError(parsed.error.message);
  const backup = parsed.data;

  db.transaction((tx) => {
    tx.delete(dayEntries).run();
    tx.delete(scheduleVersions).run();
    tx.delete(plannedDays).run();
    if (backup.scheduleVersions.length > 0) {
      tx.insert(scheduleVersions)
        .values(backup.scheduleVersions.map((v) => toScheduleRow(v as ScheduleVersion)))
        .run();
    }
    if (backup.dayEntries.length > 0) {
      tx.insert(dayEntries)
        .values(backup.dayEntries as DayEntry[])
        .run();
    }
    if (backup.plannedDays.length > 0) {
      tx.insert(plannedDays).values(backup.plannedDays).run();
    }
    setSetting(tx, 'language', backup.settings.language);
    setSetting(tx, 'holidaySyncEnabled', backup.settings.holidaySyncEnabled);
  });
}
