/** @jest-environment node */
import { octoberEntries, standardSchedule } from '@/domain/testFixtures';

import type { Database } from '../database';
import { listEntries, saveEntry } from '../repositories/entryRepository';
import { listHolidays, replaceHolidaysForYear } from '../repositories/holidayRepository';
import { listScheduleVersions, saveScheduleVersion } from '../repositories/scheduleRepository';
import { getSettings, setSetting } from '../repositories/settingsRepository';
import { createTestDb } from '../testDb';
import { buildBackup, InvalidBackupError, restoreBackup } from './backup';

const now = new Date('2026-10-22T10:00:00Z');

async function seededDb(): Promise<Database> {
  const db = await createTestDb();
  saveScheduleVersion(db, standardSchedule);
  octoberEntries.forEach((entry) => saveEntry(db, entry));
  saveEntry(db, { date: '2026-10-06', kind: 'vacation', minutes: null, note: null });
  setSetting(db, 'language', 'hu');
  setSetting(db, 'holidaySyncEnabled', true);
  return db;
}

describe('backup', () => {
  it('round-trips through JSON into an empty database', async () => {
    const source = await seededDb();
    const json = JSON.parse(JSON.stringify(buildBackup(source, now)));

    const target = await createTestDb();
    restoreBackup(target, json);

    expect(listScheduleVersions(target)).toEqual(listScheduleVersions(source));
    expect(listEntries(target)).toEqual(listEntries(source));
    expect(getSettings(target)).toMatchObject({ language: 'hu', holidaySyncEnabled: true });
  });

  it('replaces existing data but keeps cached holidays', async () => {
    const target = await createTestDb();
    saveEntry(target, { date: '2025-01-02', kind: 'sick', minutes: null, note: null });
    replaceHolidaysForYear(target, 2026, [{ date: '2026-10-23', name: 'Nemzeti ünnep' }]);

    restoreBackup(target, buildBackup(await seededDb(), now));

    expect(listEntries(target).map((e) => e.date)).not.toContain('2025-01-02');
    expect(listHolidays(target)).toHaveLength(1);
  });

  it('rejects files that are not a backup and leaves data untouched', async () => {
    const target = await seededDb();
    const before = listEntries(target);

    expect(() => restoreBackup(target, { hello: 'world' })).toThrow(InvalidBackupError);
    const broken = { ...buildBackup(target, now), dayEntries: [{ date: 'x', kind: 'sick' }] };
    expect(() => restoreBackup(target, broken)).toThrow(InvalidBackupError);

    expect(listEntries(target)).toEqual(before);
  });
});
