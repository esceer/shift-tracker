/** Calendar date as `YYYY-MM-DD` (local, no time zone). Lexicographic order = chronological order. */
export type ISODate = string;

/** Whole minutes. Durations are always stored and calculated in minutes. */
export type Minutes = number;

/** ISO weekday: 1 = Monday … 7 = Sunday. */
export type Weekday = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export type WeeklyMinutes = Record<Weekday, Minutes>;

/** Planned minutes per date from monthly plans; these dates ignore the weekly schedule. */
export type PlannedDays = ReadonlyMap<ISODate, Minutes>;

export interface ScheduleVersion {
  id: string;
  /** Active from this date until the next version's `effectiveFrom`. */
  effectiveFrom: ISODate;
  /** The usual hours per weekday (the plan). */
  minutesByWeekday: WeeklyMinutes;
}

/** Áthelyezett munkanap: a Saturday that is a working day (`work`) or a weekday off (`rest`). */
export type SwapKind = 'work' | 'rest';

export interface WorkdaySwap {
  date: ISODate;
  kind: SwapKind;
}

/** What the legally required time depends on. Holidays and swaps are empty while sync is off. */
export interface LegalRules {
  /** Munkarend: required minutes per working day (480, 360 or 240). */
  dailyMinutes: Minutes;
  holidays: ReadonlySet<ISODate>;
  swaps: ReadonlyMap<ISODate, SwapKind>;
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
  /** Legally required minutes (munkarend on working days). */
  requiredMinutes: Minutes;
  entry: EffectiveEntry | undefined;
  deltaMinutes: Minutes;
}

export type Period =
  | { type: 'month'; year: number; month: number } // month: 1–12
  | { type: 'quarter'; year: number; quarter: 1 | 2 | 3 | 4 };

export interface PeriodReport {
  period: Period;
  scheduledMinutes: Minutes;
  requiredMinutes: Minutes;
  /** Planned time plus all deltas; absences count as the required time. */
  workedMinutes: Minutes;
  /** `workedMinutes − requiredMinutes`. */
  balanceMinutes: Minutes;
  /** Absence days that fell on scheduled working days. */
  absenceDays: Record<AbsenceKind, number>;
  /** Entries in the period, sorted by date. Synced holidays on days off are left out. */
  entries: EffectiveEntry[];
}
