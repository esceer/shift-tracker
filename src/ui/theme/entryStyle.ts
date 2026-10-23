import type { DayInfo, EntryKind } from '@/domain/types';
import type { IconName } from '@/ui/components/Icon';

import type { Tint } from './tokens';

/** Tile colour of each entry kind (kind pickers, legends). */
export const kindTint: Record<EntryKind, Tint> = {
  adjustment: 'lavender',
  actual: 'lavender',
  vacation: 'butter',
  sick: 'orange',
  holiday: 'mint',
};

export const kindIcon: Record<EntryKind, IconName> = {
  adjustment: 'plusMinus',
  actual: 'plusMinus',
  vacation: 'sun',
  sick: 'thermometer',
  holiday: 'flag',
};

/** Colour of a day in calendars: overtime red, less time blue, absences by kind. */
export function dayTint(day: DayInfo): Tint | undefined {
  if (!day.entry) return undefined;
  if (day.entry.minutes === null) return kindTint[day.entry.kind];
  if (day.deltaMinutes > 0) return 'red';
  if (day.deltaMinutes < 0) return 'sky';
  return undefined;
}
