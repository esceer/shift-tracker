import { startOfMonth } from 'date-fns';
import { randomUUID } from 'expo-crypto';
import { useState } from 'react';

import { db } from '@/data/db';
import { useScheduleVersions } from '@/data/live';
import { toISODate } from '@/domain/dates';
import { roundToHour, stepWholeHours } from '@/domain/duration';
import { activeScheduleOn } from '@/domain/schedule';
import type { ISODate, Weekday, WeeklyMinutes } from '@/domain/types';

import { plannedMonthsFrom, saveScheduleFrom } from './saveSchedule';

const MAX_DAY_MINUTES = 24 * 60;
/** Starting point for a brand-new user: Mon–Fri 8h. */
const DEFAULT_WEEK: WeeklyMinutes = { 1: 480, 2: 480, 3: 480, 4: 480, 5: 480, 6: 0, 7: 0 };

/**
 * Editor state for the weekly schedule. Changes count from the start of the current month
 * by default, so a month is never split between two schedules unless the user picks a date.
 */
export function useScheduleEditor() {
  const versions = useScheduleVersions();
  const today = toISODate(new Date());

  const [minutes, setMinutes] = useState<WeeklyMinutes>(
    () => activeScheduleOn(versions, today)?.minutesByWeekday ?? DEFAULT_WEEK,
  );
  const [effectiveFrom, setEffectiveFrom] = useState<ISODate>(() =>
    toISODate(startOfMonth(new Date())),
  );

  // The usual week is set in whole hours.
  const setDay = (weekday: Weekday, value: number) =>
    setMinutes((current) => ({
      ...current,
      [weekday]: Math.min(MAX_DAY_MINUTES, Math.max(0, roundToHour(value))),
    }));

  const changeDay = (weekday: Weekday, steps: number) =>
    setDay(weekday, stepWholeHours(minutes[weekday], steps));

  const weeklyTotal = Object.values(minutes).reduce((sum, m) => sum + m, 0);

  /** Saves and returns the months whose monthly plan still overrides the new week. */
  const save = () => {
    saveScheduleFrom(db, effectiveFrom, minutes, randomUUID);
    return plannedMonthsFrom(db, effectiveFrom);
  };

  return {
    minutes,
    changeDay,
    setDay,
    weeklyTotal,
    effectiveFrom,
    setEffectiveFrom,
    save,
  };
}
