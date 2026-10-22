/** @jest-environment node */
import type { Database } from '../database';
import { createTestDb } from '../testDb';
import { defaultSettings, getSettings, setSetting } from './settingsRepository';

describe('settingsRepository', () => {
  let db: Database;
  beforeEach(async () => {
    db = await createTestDb();
  });

  it('returns defaults when nothing is stored', () => {
    expect(getSettings(db)).toEqual(defaultSettings);
  });

  it('stores and overwrites values', () => {
    setSetting(db, 'language', 'hu');
    setSetting(db, 'holidaySyncEnabled', true);
    setSetting(db, 'language', 'en');
    expect(getSettings(db)).toEqual({
      ...defaultSettings,
      language: 'en',
      holidaySyncEnabled: true,
    });
  });
});
