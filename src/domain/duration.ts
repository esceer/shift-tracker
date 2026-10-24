import type { Minutes } from './types';

/** Smallest time step the app works with. */
export const STEP_MINUTES = 15;

/** Rounds to the nearest 15-minute step. */
export function snapToStep(minutes: Minutes): Minutes {
  return Math.round(minutes / STEP_MINUTES) * STEP_MINUTES || 0;
}

/** Splits a (possibly negative) duration into sign, whole hours and remaining minutes. */
export function splitDuration(minutes: Minutes): {
  sign: -1 | 0 | 1;
  hours: number;
  minutes: number;
} {
  const abs = Math.abs(minutes);
  return {
    sign: minutes > 0 ? 1 : minutes < 0 ? -1 : 0,
    hours: Math.floor(abs / 60),
    minutes: abs % 60,
  };
}

/** Parses typed hours ("7:30", "7,5", "7.5", "7") into minutes, rounded to 15; `null` if invalid. */
export function parseDuration(text: string): Minutes | null {
  const trimmed = text.trim();
  const clock = /^(\d{1,2})(?::(\d{1,2}))?$/.exec(trimmed);
  if (clock) {
    const minutes = Number(clock[2] ?? 0);
    return minutes < 60 ? snapToStep(Number(clock[1]) * 60 + minutes) : null;
  }
  const decimal = /^(\d{1,2})?[.,](\d+)$/.exec(trimmed);
  return decimal ? snapToStep(Number(`${decimal[1] ?? 0}.${decimal[2]}`) * 60) : null;
}

/** "H:MM", the form `parseDuration` reads back. */
export function toClock(minutes: Minutes): string {
  return `${Math.floor(minutes / 60)}:${String(minutes % 60).padStart(2, '0')}`;
}

/** Rounds to the nearest whole hour. */
export function roundToHour(minutes: Minutes): Minutes {
  return Math.round(minutes / 60) * 60;
}

/** Steps by whole hours, landing on a whole hour (5:30 + 1 → 6:00, 5:30 − 1 → 5:00). */
export function stepWholeHours(minutes: Minutes, steps: number): Minutes {
  const hours = minutes / 60 + steps;
  return (steps > 0 ? Math.floor(hours) : Math.ceil(hours)) * 60;
}
