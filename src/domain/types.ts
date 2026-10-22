/** Calendar date as `YYYY-MM-DD` (local, no time zone). Lexicographic order = chronological order. */
export type ISODate = string;

/** Whole minutes. Durations are always stored and calculated in minutes. */
export type Minutes = number;

/** ISO weekday: 1 = Monday … 7 = Sunday. */
export type Weekday = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export type WeeklyMinutes = Record<Weekday, Minutes>;

export interface ScheduleVersion {
  id: string;
  /** Active from this date until the next version's `effectiveFrom`. */
  effectiveFrom: ISODate;
  minutesByWeekday: WeeklyMinutes;
}

export type AbsenceKind = 'vacation' | 'sick' | 'holiday';
export type EntryKind = 'adjustment' | 'actual' | AbsenceKind;

interface EntryBase {
  date: ISODate;
  note: string | null;
}

/** A user-recorded change for one day (at most one per date). */
export type DayEntry =
  /** `minutes` is the delta vs. schedule (may be negative). */
  | (EntryBase & { kind: 'adjustment'; minutes: Minutes })
  /** `minutes` is the time actually worked that day. */
  | (EntryBase & { kind: 'actual'; minutes: Minutes })
  /** Whole-day absence; scheduled time counts as fulfilled. */
  | (EntryBase & { kind: AbsenceKind; minutes: null });

export interface PublicHoliday {
  date: ISODate;
  name: string;
}

/** A user entry, or a holiday entry derived from the synced public-holiday calendar. */
export type EffectiveEntry = DayEntry & { synced: boolean };

/** Everything the UI needs to show one day. */
export interface DayInfo {
  date: ISODate;
  scheduledMinutes: Minutes;
  entry: EffectiveEntry | undefined;
  deltaMinutes: Minutes;
}

export type Period =
  | { type: 'month'; year: number; month: number } // month: 1–12
  | { type: 'quarter'; year: number; quarter: 1 | 2 | 3 | 4 };

export interface PeriodReport {
  period: Period;
  scheduledMinutes: Minutes;
  /** Scheduled time plus all deltas (absences count as fulfilled). */
  workedMinutes: Minutes;
  /** `workedMinutes − scheduledMinutes`. */
  balanceMinutes: Minutes;
  /** Absence days that fell on scheduled working days. */
  absenceDays: Record<AbsenceKind, number>;
  /** Entries in the period, sorted by date. Synced holidays on days off are left out. */
  entries: EffectiveEntry[];
}
