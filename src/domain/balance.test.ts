import { buildPeriodReport, dayDelta } from './balance';
import { monthsInPeriod } from './dates';
import { mergeEntries } from './holidays';
import { octoberEntries, standardSchedule } from './testFixtures';
import type { DayEntry, EffectiveEntry, Period, ScheduleVersion } from './types';

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

describe('buildPeriodReport', () => {
  it('matches the October 2026 example (+2h 45m)', () => {
    const report = buildPeriodReport(october, [standardSchedule], octoberEntries.map(user));
    expect(report.scheduledMinutes).toBe(126 * 60);
    expect(report.balanceMinutes).toBe(165);
    expect(report.workedMinutes).toBe(126 * 60 + 165);
    expect(report.entries).toHaveLength(5);
  });

  it('includes future-dated entries', () => {
    const onlyFuture = octoberEntries.filter((e) => e.date === '2026-10-28').map(user);
    expect(buildPeriodReport(october, [standardSchedule], onlyFuture).balanceMinutes).toBe(-120);
  });

  it('ignores entries outside the period', () => {
    const november = user({ date: '2026-11-03', kind: 'adjustment', minutes: 60, note: null });
    const report = buildPeriodReport(october, [standardSchedule], [november]);
    expect(report.balanceMinutes).toBe(0);
    expect(report.entries).toEqual([]);
  });

  it('switches schedule version mid-period', () => {
    const mondaysOnly: ScheduleVersion = {
      id: 'v2',
      effectiveFrom: '2026-10-15',
      minutesByWeekday: { 1: 480, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0 },
    };
    const report = buildPeriodReport(october, [standardSchedule, mondaysOnly], []);
    // 1–14 Oct on v1: 56h; 15–31 Oct on v2: Mondays 19 and 26 → 16h
    expect(report.scheduledMinutes).toBe(72 * 60);
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

    expect(quarter.scheduledMinutes).toBe(372 * 60);
    expect(quarter.balanceMinutes).toBe(210 - 105 + 45);
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

    expect(report.absenceDays).toEqual({ vacation: 1, sick: 1, holiday: 1 });
    expect(report.balanceMinutes).toBe(0);
    // the synced Saturday holiday is hidden; the user's Monday vacation is kept
    expect(report.entries.map((e) => e.date)).toEqual([
      '2026-10-06',
      '2026-10-07',
      '2026-10-19',
      '2026-10-23',
    ]);
  });
});
