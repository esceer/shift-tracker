import { buildPeriodReport, describeDays } from '@/domain/balance';
import { datesBetween, monthsInPeriod, periodRange } from '@/domain/dates';
import { mergeEntries } from '@/domain/holidays';
import type {
  DayInfo,
  ISODate,
  LegalRules,
  Period,
  PeriodReport,
  PublicHoliday,
} from '@/domain/types';

import type { Database } from './database';
import { getEntry, listEntries } from './repositories/entryRepository';
import { listHolidays } from './repositories/holidayRepository';
import { listPlannedDays } from './repositories/plannedDayRepository';
import { listScheduleVersions } from './repositories/scheduleRepository';
import { getSettings } from './repositories/settingsRepository';
import { listWorkdaySwaps } from './repositories/workdaySwapRepository';

const FAR_FUTURE = '9999-12-31';

/** User entries merged with synced holidays (when enabled) for an inclusive date range. */
function effectiveEntries(db: Database, range: { start: ISODate; end: ISODate }) {
  const { holidaySyncEnabled } = getSettings(db);
  return mergeEntries(listEntries(db, range), listHolidays(db, range), holidaySyncEnabled);
}

/** The munkarend, plus synced holidays and swapped days in an inclusive date range while sync is on. */
export function readLegalRules(db: Database, range: { start: ISODate; end: ISODate }): LegalRules {
  const { dailyMinutes, holidaySyncEnabled } = getSettings(db);
  if (!holidaySyncEnabled) return { dailyMinutes, holidays: new Set(), swaps: new Map() };
  return {
    dailyMinutes,
    holidays: new Set(listHolidays(db, range).map((holiday) => holiday.date)),
    swaps: new Map(listWorkdaySwaps(db, range).map((swap) => [swap.date, swap.kind])),
  };
}

export function readDays(db: Database, start: ISODate, end: ISODate): DayInfo[] {
  return describeDays(
    datesBetween(start, end),
    listScheduleVersions(db),
    effectiveEntries(db, { start, end }),
    listPlannedDays(db, { start, end }),
    readLegalRules(db, { start, end }),
  );
}

export function readPeriodReport(db: Database, period: Period): PeriodReport {
  const range = periodRange(period);
  return buildPeriodReport(
    period,
    listScheduleVersions(db),
    effectiveEntries(db, range),
    listPlannedDays(db, range),
    readLegalRules(db, range),
  );
}

/** The next user-recorded change and the next synced holiday, from `today` on. */
export function readUpcoming(
  db: Database,
  today: ISODate,
): { nextChange: DayInfo | undefined; nextHoliday: PublicHoliday | undefined } {
  const next = listEntries(db, { start: today, end: FAR_FUTURE })[0];
  const nextChange = next && readDays(db, next.date, next.date)[0];
  const nextHoliday = getSettings(db).holidaySyncEnabled
    ? listHolidays(db, { start: today, end: FAR_FUTURE })[0]
    : undefined;
  return { nextChange, nextHoliday };
}

/** What the entry editor needs about one date. */
export function readDayForEditing(db: Database, date: ISODate) {
  const day = readDays(db, date, date)[0]!;
  return {
    scheduledMinutes: day.scheduledMinutes,
    requiredMinutes: day.requiredMinutes,
    entry: getEntry(db, date),
    holidayName: listHolidays(db, { start: date, end: date })[0]?.name,
  };
}

/** Everything a printable report needs: totals, per-month totals for quarters, and the changes. */
export function readReportExport(db: Database, period: Period) {
  const { start, end } = periodRange(period);
  const days = readDays(db, start, end);
  return {
    report: readPeriodReport(db, period),
    months:
      period.type === 'quarter' ? monthsInPeriod(period).map((m) => readPeriodReport(db, m)) : [],
    /** Every day of the period, for the calendar view. */
    days,
    changes: days.filter((day) => day.entry && !day.entry.synced),
  };
}
