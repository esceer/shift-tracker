import type { Database } from '../database';
import { settings } from '../schema';

export interface AppSettings {
  /** `null` = follow the device language. */
  language: 'en' | 'hu' | null;
  holidaySyncEnabled: boolean;
  /** Munkarend: legally required minutes per working day (480, 360 or 240). */
  dailyMinutes: number;
  /** ISO timestamp of the last successful holiday sync. */
  holidaysSyncedAt: string | null;
}

export const defaultSettings: AppSettings = {
  language: null,
  holidaySyncEnabled: false,
  dailyMinutes: 480,
  holidaysSyncedAt: null,
};

export function getSettings(db: Database): AppSettings {
  const result: Record<string, unknown> = { ...defaultSettings };
  for (const row of db.select().from(settings).all()) {
    if (row.key in defaultSettings) result[row.key] = JSON.parse(row.value);
  }
  return result as unknown as AppSettings;
}

export function setSetting<K extends keyof AppSettings>(
  db: Database,
  key: K,
  value: AppSettings[K],
): void {
  const row = { key, value: JSON.stringify(value) };
  db.insert(settings).values(row).onConflictDoUpdate({ target: settings.key, set: row }).run();
}
