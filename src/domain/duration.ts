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
