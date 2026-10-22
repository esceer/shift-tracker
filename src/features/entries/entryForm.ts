import { STEP_MINUTES } from '@/domain/duration';
import type { DayEntry, EntryKind, ISODate, Minutes } from '@/domain/types';

const MAX_DAY_MINUTES = 24 * 60;

/** Editor state. Adjustments are a direction (Less/More) plus a positive amount. */
export interface EntryForm {
  kind: EntryKind;
  sign: 1 | -1;
  adjustMinutes: Minutes;
  actualMinutes: Minutes;
  note: string;
}

export function initialForm(entry: DayEntry | undefined, scheduled: Minutes): EntryForm {
  const form: EntryForm = {
    kind: entry?.kind ?? 'adjustment',
    sign: 1,
    adjustMinutes: 0,
    actualMinutes: scheduled,
    note: entry?.note ?? '',
  };
  if (entry?.kind === 'adjustment') {
    form.sign = entry.minutes < 0 ? -1 : 1;
    form.adjustMinutes = Math.abs(entry.minutes);
  }
  if (entry?.kind === 'actual') form.actualMinutes = entry.minutes;
  return form;
}

/** Largest adjustment in the current direction: can't work less than 0 or more than 24h. */
function maxAdjust(sign: 1 | -1, scheduled: Minutes): Minutes {
  return sign < 0 ? scheduled : MAX_DAY_MINUTES - scheduled;
}

const clamp = (value: number, max: number) => Math.min(max, Math.max(0, value));

/** −/+ by 15-minute steps on the active value (adjustment amount or actual hours). */
export function stepForm(form: EntryForm, steps: number, scheduled: Minutes): EntryForm {
  const change = steps * STEP_MINUTES;
  if (form.kind === 'adjustment') {
    return {
      ...form,
      adjustMinutes: clamp(form.adjustMinutes + change, maxAdjust(form.sign, scheduled)),
    };
  }
  if (form.kind === 'actual') {
    return { ...form, actualMinutes: clamp(form.actualMinutes + change, MAX_DAY_MINUTES) };
  }
  return form;
}

export function setSign(form: EntryForm, sign: 1 | -1, scheduled: Minutes): EntryForm {
  return { ...form, sign, adjustMinutes: Math.min(form.adjustMinutes, maxAdjust(sign, scheduled)) };
}

/** Time the user will have worked that day if saved. */
export function workedMinutes(form: EntryForm, scheduled: Minutes): Minutes {
  if (form.kind === 'adjustment') return scheduled + form.sign * form.adjustMinutes;
  if (form.kind === 'actual') return form.actualMinutes;
  return scheduled;
}

/** The entry to store, or `null` when there is nothing to save (a ±0 adjustment). */
export function toEntry(form: EntryForm, date: ISODate): DayEntry | null {
  const note = form.note.trim() || null;
  switch (form.kind) {
    case 'adjustment':
      if (form.adjustMinutes === 0) return null;
      return { date, kind: 'adjustment', minutes: form.sign * form.adjustMinutes, note };
    case 'actual':
      return { date, kind: 'actual', minutes: form.actualMinutes, note };
    default:
      return { date, kind: form.kind, minutes: null, note };
  }
}
