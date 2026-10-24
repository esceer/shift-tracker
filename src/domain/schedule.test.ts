import { activeScheduleOn, requiredMinutesOn, scheduledMinutesOn } from './schedule';
import { partTimeRules, standardSchedule } from './testFixtures';
import type { LegalRules, ScheduleVersion } from './types';

const fromNovember: ScheduleVersion = {
  id: 'v2',
  effectiveFrom: '2026-11-01',
  minutesByWeekday: { 1: 480, 2: 480, 3: 480, 4: 480, 5: 480, 6: 0, 7: 0 },
};

/** 2026: Oct 23 holiday (Fri), Dec 12 working Saturday, Dec 24 rest day (Thu). */
const calendar: LegalRules = {
  ...partTimeRules,
  holidays: new Set(['2026-10-23']),
  swaps: new Map([
    ['2026-12-12', 'work'],
    ['2026-12-24', 'rest'],
  ]),
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

describe('scheduledMinutesOn with a monthly plan', () => {
  const plan = new Map([
    ['2026-10-19', 300], // Monday, normally off
    ['2026-10-20', 0], // Tuesday, normally 6h
  ]);

  it('uses the planned minutes for planned dates, the weekly schedule otherwise', () => {
    expect(scheduledMinutesOn([standardSchedule], '2026-10-19', plan)).toBe(300);
    expect(scheduledMinutesOn([standardSchedule], '2026-10-20', plan)).toBe(0);
    expect(scheduledMinutesOn([standardSchedule], '2026-10-21', plan)).toBe(480);
  });

  it('applies even before the first weekly version', () => {
    expect(scheduledMinutesOn([], '2026-10-19', plan)).toBe(300);
  });
});

describe('scheduledMinutesOn on swapped days', () => {
  it('is off on a rest day and the munkarend hours on a working Saturday', () => {
    expect(scheduledMinutesOn([standardSchedule], '2026-12-24', undefined, calendar)).toBe(0);
    expect(scheduledMinutesOn([standardSchedule], '2026-12-12', undefined, calendar)).toBe(360);
  });

  it('lets a monthly plan win', () => {
    const plan = new Map([['2026-12-12', 120]]);
    expect(scheduledMinutesOn([standardSchedule], '2026-12-12', plan, calendar)).toBe(120);
  });

  it('is 0 before the first version', () => {
    expect(scheduledMinutesOn([], '2026-12-12', undefined, calendar)).toBe(0);
  });
});

describe('requiredMinutesOn', () => {
  it('is the munkarend hours on Mon–Fri, whatever the plan', () => {
    const s = [standardSchedule];
    expect(requiredMinutesOn(s, '2026-10-19', partTimeRules)).toBe(360); // Mon, planned off
    expect(requiredMinutesOn(s, '2026-10-21', partTimeRules)).toBe(360); // Wed, planned 8h
    expect(requiredMinutesOn(s, '2026-10-24', partTimeRules)).toBe(0); // Sat
    expect(requiredMinutesOn(s, '2026-10-25', partTimeRules)).toBe(0); // Sun
  });

  it('defaults to the full-time 8h', () => {
    expect(requiredMinutesOn([standardSchedule, fromNovember], '2026-11-02')).toBe(480);
  });

  it('is 0 on public holidays and rest days, the munkarend on working Saturdays', () => {
    expect(requiredMinutesOn([standardSchedule], '2026-10-23', calendar)).toBe(0);
    expect(requiredMinutesOn([standardSchedule], '2026-12-24', calendar)).toBe(0);
    expect(requiredMinutesOn([standardSchedule], '2026-12-12', calendar)).toBe(360);
  });

  it('is 0 before tracking starts (no schedule yet)', () => {
    expect(requiredMinutesOn([], '2026-10-21')).toBe(0);
    expect(requiredMinutesOn([standardSchedule], '2025-12-31')).toBe(0);
  });
});
