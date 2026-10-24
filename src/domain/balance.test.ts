import { buildPeriodReport, dayDelta, dayWorked, describeDays } from './balance';
import { monthsInPeriod } from './dates';
import { mergeEntries } from './holidays';
import { octoberEntries, standardSchedule } from './testFixtures';
import type { DayEntry, EffectiveEntry, NationalCalendar, Period, ScheduleVersion } from './types';

const october: Period = { type: 'month', year: 2026, month: 10 };
const user = (entry: DayEntry): EffectiveEntry => ({ ...entry, synced: false });

describe('dayDelta', () => {
  it('is 0 without an entry', () => {
    expect(dayDelta(undefined, 480)).toBe(0);
  });

  it('uses the delta of an adjustment', () => {
    expect(dayDelta(user({ date: 'x', kind: 'adjustment', minutes: -120, note: null }), 480)).toBe(
      -120,
    );
  });

  it('compares actual hours with the schedule', () => {
    expect(dayDelta(user({ date: 'x', kind: 'actual', minutes: 570, note: null }), 480)).toBe(90);
    expect(dayDelta(user({ date: 'x', kind: 'actual', minutes: 240, note: null }), 0)).toBe(240);
  });

  it.each(['vacation', 'sick', 'holiday'] as const)('treats %s as fulfilled', (kind) => {
    expect(dayDelta(user({ date: 'x', kind, minutes: null, note: null }), 480)).toBe(0);
  });
});

describe('dayWorked', () => {
  it('is the plan plus its delta', () => {
    expect(dayWorked(undefined, 540, 480)).toBe(540);
    expect(dayWorked(user({ date: 'x', kind: 'actual', minutes: 600, note: null }), 540, 480)).toBe(
      600,
    );
    expect(
      dayWorked(user({ date: 'x', kind: 'adjustment', minutes: -60, note: null }), 540, 480),
    ).toBe(480);
  });

  it.each(['vacation', 'sick', 'holiday'] as const)('counts %s as the required time', (kind) => {
    expect(dayWorked(user({ date: 'x', kind, minutes: null, note: null }), 540, 480)).toBe(480);
  });
});

describe('buildPeriodReport', () => {
  // October 2026 has 22 weekdays: 22 × 6h munkarend = 132h required; the plan is 126h.
  const empty = buildPeriodReport(october, [standardSchedule], []);

  it('compares the plan with the legally required hours', () => {
    expect(empty.scheduledMinutes).toBe(126 * 60);
    expect(empty.requiredMinutes).toBe(132 * 60);
    expect(empty.workedMinutes).toBe(126 * 60);
    expect(empty.balanceMinutes).toBe(-6 * 60);
  });

  it('adds the changes (+2h 45m in the October example)', () => {
    const report = buildPeriodReport(october, [standardSchedule], octoberEntries.map(user));
    expect(report.workedMinutes).toBe(126 * 60 + 165);
    expect(report.balanceMinutes).toBe(-6 * 60 + 165);
    expect(report.entries).toHaveLength(5);
  });

  it('includes future-dated entries', () => {
    const onlyFuture = octoberEntries.filter((e) => e.date === '2026-10-28').map(user);
    expect(buildPeriodReport(october, [standardSchedule], onlyFuture).balanceMinutes).toBe(
      empty.balanceMinutes - 120,
    );
  });

  it('ignores entries outside the period', () => {
    const november = user({ date: '2026-11-03', kind: 'adjustment', minutes: 60, note: null });
    const report = buildPeriodReport(october, [standardSchedule], [november]);
    expect(report.balanceMinutes).toBe(empty.balanceMinutes);
    expect(report.entries).toEqual([]);
  });

  it('matches a usual 40h week on 8h munkarend with the 23 October holiday', () => {
    const usual: ScheduleVersion = {
      id: 'v1',
      effectiveFrom: '2026-01-01',
      minutesByWeekday: { 1: 540, 2: 540, 3: 540, 4: 540, 5: 240, 6: 0, 7: 0 },
      dailyMinutes: 480,
    };
    const holidays = [{ date: '2026-10-23', name: 'Nemzeti ünnep' }];
    const calendar: NationalCalendar = { holidays: new Set(['2026-10-23']), swaps: new Map() };
    const report = buildPeriodReport(
      october,
      [usual],
      mergeEntries([], holidays, true),
      undefined,
      calendar,
    );
    // 21 working days × 8h; worked: 17 Mon–Thu × 9h + 4 Fridays × 4h (the holiday counts 0)
    expect(report.requiredMinutes).toBe(168 * 60);
    expect(report.workedMinutes).toBe(169 * 60);
    expect(report.balanceMinutes).toBe(60);
  });

  it('counts swapped days in the plan and the required hours', () => {
    const december: Period = { type: 'month', year: 2026, month: 12 };
    const calendar: NationalCalendar = {
      holidays: new Set(['2026-12-25']),
      swaps: new Map([
        ['2026-12-12', 'work'],
        ['2026-12-24', 'rest'],
      ]),
    };
    const plain = buildPeriodReport(december, [standardSchedule], []);
    const report = buildPeriodReport(december, [standardSchedule], [], undefined, calendar);
    // +6h on Sat 12th; −6h on Thu 24th and Fri 25th
    expect(report.requiredMinutes).toBe(plain.requiredMinutes - 6 * 60);
    // plan: +6h on Sat 12th, −8h on Thu 24th (Fri 25th stays planned; untouched holidays are merged in as entries)
    expect(report.scheduledMinutes).toBe(plain.scheduledMinutes + 6 * 60 - 8 * 60);
  });

  it('switches schedule version mid-period', () => {
    const mondaysOnly: ScheduleVersion = {
      id: 'v2',
      effectiveFrom: '2026-10-15',
      minutesByWeekday: { 1: 480, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0 },
      dailyMinutes: 240,
    };
    const report = buildPeriodReport(october, [standardSchedule, mondaysOnly], []);
    // 1–14 Oct on v1: 56h; 15–31 Oct on v2: Mondays 19 and 26 → 16h
    expect(report.scheduledMinutes).toBe(72 * 60);
    // 1–14 Oct: 10 weekdays × 6h; 15–31 Oct: 12 weekdays × 4h
    expect(report.requiredMinutes).toBe(60 * 60 + 48 * 60);
  });

  it('handles leap-year February', () => {
    const feb2028: Period = { type: 'month', year: 2028, month: 2 };
    expect(buildPeriodReport(feb2028, [standardSchedule], []).scheduledMinutes).toBe(118 * 60);
  });

  it('makes a quarter equal the sum of its months', () => {
    const q3: Period = { type: 'quarter', year: 2026, quarter: 3 };
    const entries = [
      { date: '2026-07-07', kind: 'adjustment', minutes: 210, note: null },
      { date: '2026-08-12', kind: 'actual', minutes: 375, note: null },
      { date: '2026-09-02', kind: 'vacation', minutes: null, note: null },
      { date: '2026-09-03', kind: 'adjustment', minutes: 45, note: null },
    ].map((e) => user(e as DayEntry));

    const quarter = buildPeriodReport(q3, [standardSchedule], entries);
    const months = monthsInPeriod(q3).map((m) => buildPeriodReport(m, [standardSchedule], entries));

    const empty = buildPeriodReport(q3, [standardSchedule], []);
    expect(quarter.scheduledMinutes).toBe(372 * 60);
    // the Wednesday vacation counts the 6h required instead of the 8h planned
    expect(quarter.balanceMinutes).toBe(empty.balanceMinutes + 210 - 105 + 45 - 120);
    expect(quarter.scheduledMinutes).toBe(months.reduce((sum, m) => sum + m.scheduledMinutes, 0));
    expect(quarter.balanceMinutes).toBe(months.reduce((sum, m) => sum + m.balanceMinutes, 0));
  });

  it('counts absences only on scheduled working days', () => {
    const entries = mergeEntries(
      [
        { date: '2026-10-06', kind: 'vacation', minutes: null, note: null }, // Tue
        { date: '2026-10-07', kind: 'sick', minutes: null, note: null }, // Wed
        { date: '2026-10-19', kind: 'vacation', minutes: null, note: null }, // Mon (day off)
      ],
      [
        { date: '2026-10-23', name: 'Nemzeti ünnep' }, // Fri
        { date: '2026-10-24', name: 'Test holiday on Saturday' },
      ],
      true,
    );
    const report = buildPeriodReport(october, [standardSchedule], entries);
    const empty = buildPeriodReport(october, [standardSchedule], []);

    expect(report.absenceDays).toEqual({ vacation: 1, sick: 1, holiday: 1 });
    // absences count the 6h required: Wed −2h vs the plan, the planned-off Monday +6h
    expect(report.balanceMinutes).toBe(empty.balanceMinutes - 120 + 360);
    // the synced Saturday holiday is hidden; the user's Monday vacation is kept
    expect(report.entries.map((e) => e.date)).toEqual([
      '2026-10-06',
      '2026-10-07',
      '2026-10-19',
      '2026-10-23',
    ]);
  });
});

describe('describeDays', () => {
  it('combines schedule, entry and delta per day', () => {
    const entries = mergeEntries(
      octoberEntries,
      [{ date: '2026-10-23', name: 'Nemzeti ünnep' }],
      true,
    );
    const days = describeDays(
      ['2026-10-14', '2026-10-15', '2026-10-22', '2026-10-23'],
      [standardSchedule],
      entries,
    );

    expect(
      days.map((d) => [
        d.date,
        d.scheduledMinutes,
        d.requiredMinutes,
        d.entry?.kind,
        d.deltaMinutes,
      ]),
    ).toEqual([
      ['2026-10-14', 480, 360, 'adjustment', -120],
      ['2026-10-15', 480, 360, 'actual', 90],
      ['2026-10-22', 480, 360, undefined, 0],
      ['2026-10-23', 360, 360, 'holiday', 0],
    ]);
  });

  it('takes the required hours from the national calendar', () => {
    const calendar: NationalCalendar = { holidays: new Set(['2026-10-23']), swaps: new Map() };
    const [day] = describeDays(['2026-10-23'], [standardSchedule], [], undefined, calendar);
    expect(day).toMatchObject({ scheduledMinutes: 360, requiredMinutes: 0 });
  });
});

describe('buildPeriodReport with a monthly plan', () => {
  it('replaces the weekly schedule on planned dates', () => {
    const plan = new Map([
      ['2026-10-19', 300], // Mon: 0 → 5h
      ['2026-10-20', 0], // Tue: 6h → 0
    ]);
    const report = buildPeriodReport(october, [standardSchedule], [], plan);
    expect(report.scheduledMinutes).toBe(126 * 60 + 300 - 360);
  });
});
