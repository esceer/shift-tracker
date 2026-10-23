import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { db } from '@/data/db';
import { useDays, usePlannedDays } from '@/data/live';
import { deleteMonthPlan, saveMonthPlan } from '@/data/repositories/plannedDayRepository';
import { periodRange, shiftPeriod, toISODate, weekdayOf } from '@/domain/dates';
import { STEP_MINUTES } from '@/domain/duration';
import type { ISODate, Minutes, Period } from '@/domain/types';
import type { Language } from '@/i18n/language';
import { capitalize, formatDate, formatDuration } from '@/lib/format';
import { Button } from '@/ui/components/Button';
import { IconButton } from '@/ui/components/IconButton';
import { Stepper } from '@/ui/components/Stepper';
import { Text } from '@/ui/components/Text';
import { Tile } from '@/ui/components/Tile';
import { colors, radius, spacing } from '@/ui/theme/tokens';

type MonthPeriod = Extract<Period, { type: 'month' }>;

const MAX_DAY_MINUTES = 24 * 60;

function currentMonth(): MonthPeriod {
  const [year, month] = toISODate(new Date()).split('-').map(Number) as [number, number];
  return { type: 'month', year, month };
}

/** Planned hours for every day of one month; replaces the weekly schedule for that month. */
export function MonthPlanForm() {
  const { t, i18n } = useTranslation();
  const [month, setMonth] = useState<MonthPeriod>(currentMonth);
  const { start } = periodRange(month);

  return (
    <>
      <Tile style={styles.monthSwitcher}>
        <IconButton
          icon="chevronLeft"
          accessibilityLabel={t('calendar.previousMonth')}
          onPress={() => setMonth(shiftPeriod(month, -1) as MonthPeriod)}
          background={colors.surfaceMuted}
        />
        <Text variant="bodyStrong" style={styles.monthTitle} accessibilityRole="header">
          {capitalize(formatDate(start, i18n.language as Language, 'monthYear'))}
        </Text>
        <IconButton
          icon="chevronRight"
          accessibilityLabel={t('calendar.nextMonth')}
          onPress={() => setMonth(shiftPeriod(month, 1) as MonthPeriod)}
          background={colors.surfaceMuted}
        />
      </Tile>
      {/* Re-mount per month so the form starts from that month's plan. */}
      <MonthDays key={start} month={month} />
    </>
  );
}

function MonthDays({ month }: { month: MonthPeriod }) {
  const { t } = useTranslation();
  const { start, end } = periodRange(month);
  const days = useDays(start, end);
  const hasPlan = usePlannedDays(start, end).size > 0;
  // Starts from the month's plan, or from the weekly schedule when there is none.
  const [minutes, setMinutes] = useState<Map<ISODate, Minutes>>(
    () => new Map(days.map((day) => [day.date, day.scheduledMinutes])),
  );

  const change = (date: ISODate, steps: number) =>
    setMinutes((current) => {
      const next = new Map(current);
      const value = (current.get(date) ?? 0) + steps * STEP_MINUTES;
      next.set(date, Math.min(MAX_DAY_MINUTES, Math.max(0, value)));
      return next;
    });

  const total = [...minutes.values()].reduce((sum, m) => sum + m, 0);

  const save = () => {
    saveMonthPlan(
      db,
      month.year,
      month.month,
      [...minutes].map(([date, value]) => ({ date, minutes: value })),
    );
    router.back();
  };

  const switchToWeekly = () => {
    deleteMonthPlan(db, month.year, month.month);
    router.back();
  };

  return (
    <>
      <Tile style={styles.days}>
        {[...minutes].map(([date, value]) => {
          const label = t('schedule.dayLabel', {
            day: Number(date.slice(8)),
            weekday: t(`weekdaysShort.${weekdayOf(date)}`),
          });
          return (
            <View key={date} style={styles.dayRow}>
              <Text variant="bodyStrong" style={styles.dayName}>
                {label}
              </Text>
              <View style={styles.stepper}>
                <Stepper
                  valueLabel={value ? formatDuration(value, t) : t('schedule.off')}
                  valueColor={value ? colors.ink : colors.inkSubtle}
                  onDecrement={() => change(date, -1)}
                  onIncrement={() => change(date, 1)}
                  decrementLabel={t('schedule.less', { day: label })}
                  incrementLabel={t('schedule.more', { day: label })}
                  buttonSize={40}
                />
              </View>
            </View>
          );
        })}
      </Tile>

      <Tile tint="lavender" style={styles.summaryTile}>
        <Text variant="label" color={colors.inkMuted}>
          {t('schedule.perMonth')}
        </Text>
        <Text variant="title">{formatDuration(total, t)}</Text>
      </Tile>

      <Button label={t('schedule.save')} onPress={save} />
      {hasPlan && (
        <Button label={t('schedule.useWeekly')} onPress={switchToWeekly} variant="secondary" />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  monthSwitcher: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 6,
    borderRadius: radius.md,
  },
  monthTitle: { flex: 1, textAlign: 'center' },
  days: { paddingVertical: spacing.sm, gap: 0 },
  dayRow: { height: 54, flexDirection: 'row', alignItems: 'center' },
  dayName: { flex: 1 },
  stepper: { width: 190 },
  summaryTile: { borderRadius: radius.md, gap: 2 },
});
