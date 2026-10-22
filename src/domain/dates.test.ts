import {
  addDays,
  datesBetween,
  datesInPeriod,
  monthsInPeriod,
  periodRange,
  quarterOfMonth,
  weekStart,
  weekdayOf,
} from './dates';

describe('weekdayOf', () => {
  it('uses ISO weekdays (Mon = 1, Sun = 7)', () => {
    expect(weekdayOf('2026-10-19')).toBe(1);
    expect(weekdayOf('2026-10-22')).toBe(4);
    expect(weekdayOf('2026-10-25')).toBe(7);
  });
});

describe('quarterOfMonth', () => {
  it.each([
    [1, 1],
    [3, 1],
    [4, 2],
    [9, 3],
    [10, 4],
    [12, 4],
  ])('month %i is in Q%i', (month, quarter) => {
    expect(quarterOfMonth(month)).toBe(quarter);
  });
});

describe('periodRange / datesInPeriod', () => {
  it('covers a whole month', () => {
    const october = { type: 'month', year: 2026, month: 10 } as const;
    expect(periodRange(october)).toEqual({ start: '2026-10-01', end: '2026-10-31' });
    expect(datesInPeriod(october)).toHaveLength(31);
  });

  it('handles leap-year February', () => {
    expect(datesInPeriod({ type: 'month', year: 2028, month: 2 })).toHaveLength(29);
    expect(datesInPeriod({ type: 'month', year: 2026, month: 2 })).toHaveLength(28);
  });

  it('covers a whole quarter', () => {
    const q4 = { type: 'quarter', year: 2026, quarter: 4 } as const;
    expect(periodRange(q4)).toEqual({ start: '2026-10-01', end: '2026-12-31' });
    expect(datesInPeriod(q4)).toHaveLength(92);
  });
});

describe('monthsInPeriod', () => {
  it('splits a quarter into its three months', () => {
    expect(monthsInPeriod({ type: 'quarter', year: 2026, quarter: 3 })).toEqual([
      { type: 'month', year: 2026, month: 7 },
      { type: 'month', year: 2026, month: 8 },
      { type: 'month', year: 2026, month: 9 },
    ]);
  });
});

describe('addDays / weekStart / datesBetween', () => {
  it('adds days across month and year ends', () => {
    expect(addDays('2026-10-31', 1)).toBe('2026-11-01');
    expect(addDays('2027-01-01', -1)).toBe('2026-12-31');
  });

  it('finds the Monday of the week', () => {
    expect(weekStart('2026-10-22')).toBe('2026-10-19'); // Thu
    expect(weekStart('2026-10-19')).toBe('2026-10-19'); // Mon
    expect(weekStart('2026-10-25')).toBe('2026-10-19'); // Sun
    expect(weekStart('2026-11-01')).toBe('2026-10-26'); // Sun, previous month
  });

  it('lists dates inclusively', () => {
    expect(datesBetween('2026-10-30', '2026-11-02')).toEqual([
      '2026-10-30',
      '2026-10-31',
      '2026-11-01',
      '2026-11-02',
    ]);
  });
});
