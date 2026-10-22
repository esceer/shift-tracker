import { startOfMonth } from 'date-fns';
import { randomUUID } from 'expo-crypto';
import { useState } from 'react';

import { db } from '@/data/db';
import { useScheduleVersions } from '@/data/live';
import { toISODate } from '@/domain/dates';
import { STEP_MINUTES } from '@/domain/duration';
import { activeScheduleOn } from '@/domain/schedule';
import type { ISODate, Weekday, WeeklyMinutes } from '@/domain/types';

import { saveScheduleFrom } from './saveSchedule';

const MAX_DAY_MINUTES = 24 * 60;
/** Starting point for a brand-new user: Mon–Fri 8h. */
const DEFAULT_WEEK: WeeklyMinutes = { 1: 480, 2: 480, 3: 480, 4: 480, 5: 480, 6: 0, 7: 0 };

/**
 * Editor state for the weekly schedule. On first launch the schedule counts from the start
 * of the current month (so this month's report is complete); later edits default to today.
 */
export function useScheduleEditor(mode: 'onboarding' | 'edit') {
  const versions = useScheduleVersions();
  const today = toISODate(new Date());

  const [minutes, setMinutes] = useState<WeeklyMinutes>(
    () => activeScheduleOn(versions, today)?.minutesByWeekday ?? DEFAULT_WEEK,
  );
  const [effectiveFrom, setEffectiveFrom] = useState<ISODate>(() =>
    mode === 'onboarding' ? toISODate(startOfMonth(new Date())) : today,
  );

  const changeDay = (weekday: Weekday, steps: number) =>
    setMinutes((current) => ({
      ...current,
      [weekday]: Math.min(MAX_DAY_MINUTES, Math.max(0, current[weekday] + steps * STEP_MINUTES)),
    }));

  const weeklyTotal = Object.values(minutes).reduce((sum, m) => sum + m, 0);

  const save = () => saveScheduleFrom(db, effectiveFrom, minutes, randomUUID);

  return { minutes, changeDay, weeklyTotal, effectiveFrom, setEffectiveFrom, save };
}
