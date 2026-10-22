import {
  addDays as addDaysToDate,
  eachDayOfInterval,
  endOfMonth,
  format,
  getISODay,
  parseISO,
} from 'date-fns';

import type { ISODate, Period, Weekday } from './types';

export function toISODate(date: Date): ISODate {
  return format(date, 'yyyy-MM-dd');
}

/** Parses `YYYY-MM-DD` as a local date (midnight). */
export function fromISODate(date: ISODate): Date {
  return parseISO(date);
}

export function weekdayOf(date: ISODate): Weekday {
  return getISODay(fromISODate(date)) as Weekday;
}

export function quarterOfMonth(month: number): 1 | 2 | 3 | 4 {
  return Math.ceil(month / 3) as 1 | 2 | 3 | 4;
}

/** The months (as month periods) that make up a period. */
export function monthsInPeriod(period: Period): Extract<Period, { type: 'month' }>[] {
  if (period.type === 'month') return [period];
  const first = (period.quarter - 1) * 3 + 1;
  return [first, first + 1, first + 2].map((month) => ({
    type: 'month',
    year: period.year,
    month,
  }));
}

/** First and last date of a period, inclusive. */
export function periodRange(period: Period): { start: ISODate; end: ISODate } {
  const months = monthsInPeriod(period);
  const first = months[0]!;
  const last = months[months.length - 1]!;
  const start = new Date(first.year, first.month - 1, 1);
  return {
    start: toISODate(start),
    end: toISODate(endOfMonth(new Date(last.year, last.month - 1, 1))),
  };
}

export function datesInPeriod(period: Period): ISODate[] {
  const { start, end } = periodRange(period);
  return datesBetween(start, end);
}

/** All dates from `start` to `end`, inclusive. */
export function datesBetween(start: ISODate, end: ISODate): ISODate[] {
  return eachDayOfInterval({ start: fromISODate(start), end: fromISODate(end) }).map(toISODate);
}

export function addDays(date: ISODate, days: number): ISODate {
  return toISODate(addDaysToDate(fromISODate(date), days));
}

/** Monday of the week containing `date`. */
export function weekStart(date: ISODate): ISODate {
  return addDays(date, 1 - weekdayOf(date));
}

/** The period `delta` months or quarters before/after `period`. */
export function shiftPeriod(period: Period, delta: number): Period {
  if (period.type === 'month') {
    const index = period.year * 12 + (period.month - 1) + delta;
    return { type: 'month', year: Math.floor(index / 12), month: (index % 12) + 1 };
  }
  const index = period.year * 4 + (period.quarter - 1) + delta;
  return {
    type: 'quarter',
    year: Math.floor(index / 4),
    quarter: ((index % 4) + 1) as 1 | 2 | 3 | 4,
  };
}
