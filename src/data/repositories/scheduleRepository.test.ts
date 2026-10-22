/** @jest-environment node */
import { standardSchedule } from '@/domain/testFixtures';

import type { Database } from '../database';
import { createTestDb } from '../testDb';
import {
  deleteScheduleVersion,
  listScheduleVersions,
  saveScheduleVersion,
} from './scheduleRepository';

const later = {
  ...standardSchedule,
  id: 'v2',
  effectiveFrom: '2027-01-01',
  minutesByWeekday: { ...standardSchedule.minutesByWeekday, 1: 240 },
};

describe('scheduleRepository', () => {
  let db: Database;
  beforeEach(async () => {
    db = await createTestDb();
  });

  it('round-trips versions, oldest first', () => {
    saveScheduleVersion(db, later);
    saveScheduleVersion(db, standardSchedule);
    expect(listScheduleVersions(db)).toEqual([standardSchedule, later]);
  });

  it('updates a version by id', () => {
    saveScheduleVersion(db, standardSchedule);
    const edited = { ...standardSchedule, effectiveFrom: '2026-02-01' };
    saveScheduleVersion(db, edited);
    expect(listScheduleVersions(db)).toEqual([edited]);
  });

  it('rejects two versions with the same start date', () => {
    saveScheduleVersion(db, standardSchedule);
    expect(() => saveScheduleVersion(db, { ...later, effectiveFrom: '2026-01-01' })).toThrow();
  });

  it('deletes a version', () => {
    saveScheduleVersion(db, standardSchedule);
    deleteScheduleVersion(db, standardSchedule.id);
    expect(listScheduleVersions(db)).toEqual([]);
  });
});
