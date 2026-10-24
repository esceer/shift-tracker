import { STEP_MINUTES } from '@/domain/duration';
import type { AbsenceKind, DayEntry, ISODate, Minutes } from '@/domain/types';

const MAX_DAY_MINUTES = 24 * 60;

/** Kinds offered in the editor. A "change" is stored as the hours actually worked (`actual`). */
export type FormKind = 'actual' | AbsenceKind;

export interface EntryForm {
  kind: FormKind;
  /** Hours worked that day (for `actual`). Starts at the planned hours. */
  workedMinutes: Minutes;
  note: string;
}

const clamp = (value: number) => Math.min(MAX_DAY_MINUTES, Math.max(0, value));

export function initialForm(entry: DayEntry | undefined, scheduled: Minutes): EntryForm {
  if (!entry) return { kind: 'actual', workedMinutes: scheduled, note: '' };
  const note = entry.note ?? '';
  switch (entry.kind) {
    case 'adjustment': // older entries stored the difference; show it as hours worked
      return { kind: 'actual', workedMinutes: clamp(scheduled + entry.minutes), note };
    case 'actual':
      return { kind: 'actual', workedMinutes: entry.minutes, note };
    default:
      return { kind: entry.kind, workedMinutes: scheduled, note };
  }
}

/** −/+ by 15-minute steps, between 0 and 24 hours. */
export function stepForm(form: EntryForm, steps: number): EntryForm {
  return { ...form, workedMinutes: clamp(form.workedMinutes + steps * STEP_MINUTES) };
}

/** Typed hours worked, kept between 0 and 24 hours. */
export function setWorkedMinutes(form: EntryForm, minutes: Minutes): EntryForm {
  return { ...form, workedMinutes: clamp(minutes) };
}

/** Time counted as worked that day if saved (absences count as the planned hours). */
export function workedMinutes(form: EntryForm, scheduled: Minutes): Minutes {
  return form.kind === 'actual' ? form.workedMinutes : scheduled;
}

/** The entry to store, or `null` when there is nothing to save (worked exactly as planned). */
export function toEntry(form: EntryForm, date: ISODate, scheduled: Minutes): DayEntry | null {
  const note = form.note.trim() || null;
  if (form.kind !== 'actual') return { date, kind: form.kind, minutes: null, note };
  if (form.workedMinutes === scheduled) return null;
  return { date, kind: 'actual', minutes: form.workedMinutes, note };
}
