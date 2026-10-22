import { datesInPeriod } from './dates';
import { scheduledMinutesOn } from './schedule';
import type { EffectiveEntry, Minutes, Period, PeriodReport, ScheduleVersion } from './types';

/** Difference between worked and scheduled time for one day. */
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

/** Builds the report for a month or quarter. `entries` must already be merged (see `mergeEntries`). */
export function buildPeriodReport(
  period: Period,
  schedules: readonly ScheduleVersion[],
  entries: readonly EffectiveEntry[],
): PeriodReport {
  const entriesByDate = new Map(entries.map((entry) => [entry.date, entry]));
  const report: PeriodReport = {
    period,
    scheduledMinutes: 0,
    workedMinutes: 0,
    balanceMinutes: 0,
    absenceDays: { vacation: 0, sick: 0, holiday: 0 },
    entries: [],
  };

  for (const date of datesInPeriod(period)) {
    const scheduled = scheduledMinutesOn(schedules, date);
    const entry = entriesByDate.get(date);
    const delta = dayDelta(entry, scheduled);

    report.scheduledMinutes += scheduled;
    report.balanceMinutes += delta;

    if (!entry) continue;
    const isAbsence = entry.minutes === null;
    if (isAbsence && scheduled > 0) report.absenceDays[entry.kind]++;
    if (!(entry.synced && scheduled === 0)) report.entries.push(entry);
  }

  report.workedMinutes = report.scheduledMinutes + report.balanceMinutes;
  return report;
}
