import { activeScheduleOn, scheduledMinutesOn } from './schedule';
import { standardSchedule } from './testFixtures';
import type { ScheduleVersion } from './types';

const fromNovember: ScheduleVersion = {
  id: 'v2',
  effectiveFrom: '2026-11-01',
  minutesByWeekday: { 1: 480, 2: 480, 3: 480, 4: 480, 5: 480, 6: 0, 7: 0 },
};

describe('activeScheduleOn', () => {
  const versions = [fromNovember, standardSchedule]; // order must not matter

  it('returns nothing before the first version', () => {
    expect(activeScheduleOn(versions, '2025-12-31')).toBeUndefined();
  });

  it('picks the latest version that has started', () => {
    expect(activeScheduleOn(versions, '2026-01-01')?.id).toBe('v1');
    expect(activeScheduleOn(versions, '2026-10-31')?.id).toBe('v1');
    expect(activeScheduleOn(versions, '2026-11-01')?.id).toBe('v2');
  });
});

describe('scheduledMinutesOn', () => {
  it('returns the minutes for that weekday', () => {
    expect(scheduledMinutesOn([standardSchedule], '2026-10-19')).toBe(0); // Mon
    expect(scheduledMinutesOn([standardSchedule], '2026-10-20')).toBe(360); // Tue
    expect(scheduledMinutesOn([standardSchedule], '2026-10-21')).toBe(480); // Wed
  });

  it('returns 0 without any schedule', () => {
    expect(scheduledMinutesOn([], '2026-10-21')).toBe(0);
  });
});
