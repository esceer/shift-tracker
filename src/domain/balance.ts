import { datesInPeriod } from './dates';
import { requiredMinutesOn, scheduledMinutesOn } from './schedule';
import type {
  DayInfo,
  EffectiveEntry,
  ISODate,
  LegalRules,
  Minutes,
  Period,
  PeriodReport,
  PlannedDays,
  ScheduleVersion,
} from './types';

/** Difference between worked and planned time for one day. */
export function dayDelta(entry: EffectiveEntry | undefined, scheduled: Minutes): Minutes {
  if (!entry) return 0;
  switch (entry.kind) {
    case 'adjustment':
      return entry.minutes;
    case 'actual':
      return entry.minutes - scheduled;
    default:
      return 0; // absences: scheduled time counts as fulfilled
  }
}

/** Time counted as worked on one day: the plan plus its delta; absences count as the required time. */
export function dayWorked(
  entry: EffectiveEntry | undefined,
  scheduled: Minutes,
  required: Minutes,
): Minutes {
  return entry?.minutes === null ? required : scheduled + dayDelta(entry, scheduled);
}

/** Planned and required time, effective entry and delta for each date. `entries` must already be merged. */
export function describeDays(
  dates: readonly ISODate[],
  schedules: readonly ScheduleVersion[],
  entries: readonly EffectiveEntry[],
  plannedDays?: PlannedDays,
  rules?: LegalRules,
): DayInfo[] {
  const entriesByDate = new Map(entries.map((entry) => [entry.date, entry]));
  return dates.map((date) => {
    const scheduledMinutes = scheduledMinutesOn(schedules, date, plannedDays, rules);
    const requiredMinutes = requiredMinutesOn(schedules, date, rules);
    const entry = entriesByDate.get(date);
    return {
      date,
      scheduledMinutes,
      requiredMinutes,
      entry,
      deltaMinutes: dayDelta(entry, scheduledMinutes),
    };
  });
}

/** Builds the report for a month or quarter. `entries` must already be merged (see `mergeEntries`). */
export function buildPeriodReport(
  period: Period,
  schedules: readonly ScheduleVersion[],
  entries: readonly EffectiveEntry[],
  plannedDays?: PlannedDays,
  rules?: LegalRules,
): PeriodReport {
  const entriesByDate = new Map(entries.map((entry) => [entry.date, entry]));
  const report: PeriodReport = {
    period,
    scheduledMinutes: 0,
    requiredMinutes: 0,
    workedMinutes: 0,
    balanceMinutes: 0,
    absenceDays: { vacation: 0, sick: 0, holiday: 0 },
    entries: [],
  };

  for (const date of datesInPeriod(period)) {
    const scheduled = scheduledMinutesOn(schedules, date, plannedDays, rules);
    const required = requiredMinutesOn(schedules, date, rules);
    const entry = entriesByDate.get(date);

    report.scheduledMinutes += scheduled;
    report.requiredMinutes += required;
    report.workedMinutes += dayWorked(entry, scheduled, required);

    if (!entry) continue;
    const isAbsence = entry.minutes === null;
    if (isAbsence && scheduled > 0) report.absenceDays[entry.kind]++;
    if (!(entry.synced && scheduled === 0)) report.entries.push(entry);
  }

  report.balanceMinutes = report.workedMinutes - report.requiredMinutes;
  return report;
}
