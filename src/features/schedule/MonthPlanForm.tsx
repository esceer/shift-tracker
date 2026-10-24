import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { db } from '@/data/db';
import { useDays, usePlannedDays } from '@/data/live';
import { deleteMonthPlan, saveMonthPlan } from '@/data/repositories/plannedDayRepository';
import { periodRange, shiftPeriod, toISODate, toMonthWeeks } from '@/domain/dates';
import { STEP_MINUTES } from '@/domain/duration';
import type { ISODate, Minutes, Period } from '@/domain/types';
import type { Language } from '@/i18n/language';
import { capitalize, formatDate, formatDuration } from '@/lib/format';
import { Button } from '@/ui/components/Button';
import { DayCell } from '@/ui/components/DayCell';
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

const WEEKDAYS = [1, 2, 3, 4, 5, 6, 7] as const;

function MonthDays({ month }: { month: MonthPeriod }) {
  const { t, i18n } = useTranslation();
  const language = i18n.language as Language;
  const { start, end } = periodRange(month);
  const days = useDays(start, end);
  const hasPlan = usePlannedDays(start, end).size > 0;
  // Starts from the month's plan, or from the weekly schedule when there is none.
  const [minutes, setMinutes] = useState<Map<ISODate, Minutes>>(
    () => new Map(days.map((day) => [day.date, day.scheduledMinutes])),
  );
  const [editing, setEditing] = useState<ISODate>();
  const insets = useSafeAreaInsets();

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
      <Tile style={styles.grid}>
        <View style={styles.week}>
          {WEEKDAYS.map((weekday) => (
            <Text key={weekday} variant="caption" color={colors.inkMuted} style={styles.weekday}>
              {t(`weekdaysShort.${weekday}`)}
            </Text>
          ))}
        </View>
        {toMonthWeeks([...minutes].map(([date, value]) => ({ date, value }))).map((week, i) => (
          <View key={i} style={styles.week}>
            {week.map((cell, j) =>
              cell ? (
                <DayCell
                  key={cell.date}
                  day={{
                    date: cell.date,
                    scheduledMinutes: cell.value,
                    entry: undefined,
                    deltaMinutes: 0,
                  }}
                  label={String(Number(cell.date.slice(8)))}
                  selected={cell.date === editing}
                  onPress={() => setEditing(cell.date)}
                />
              ) : (
                <View key={`empty-${j}`} style={styles.empty} />
              ),
            )}
          </View>
        ))}
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

      <Modal
        visible={editing !== undefined}
        transparent
        statusBarTranslucent
        navigationBarTranslucent
        animationType="slide"
        onRequestClose={() => setEditing(undefined)}
      >
        <Pressable
          style={styles.backdrop}
          onPress={() => setEditing(undefined)}
          accessibilityLabel={t('common.done')}
        />
        {editing && (
          <View style={[styles.sheet, { paddingBottom: spacing.xxl + insets.bottom }]}>
            <Text variant="heading" accessibilityRole="header">
              {capitalize(formatDate(editing, language, 'dayTitle'))}
            </Text>
            <Stepper
              valueLabel={
                minutes.get(editing) ? formatDuration(minutes.get(editing)!, t) : t('schedule.off')
              }
              valueColor={minutes.get(editing) ? colors.ink : colors.inkSubtle}
              onDecrement={() => change(editing, -1)}
              onIncrement={() => change(editing, 1)}
              decrementLabel={t('entry.decrease')}
              incrementLabel={t('entry.increase')}
              variant="title"
              buttonSize={56}
            />
            <Button label={t('common.done')} onPress={() => setEditing(undefined)} />
          </View>
        )}
      </Modal>
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
  grid: { paddingHorizontal: 12, paddingVertical: 14, gap: 5 },
  week: { flexDirection: 'row', gap: 5 },
  weekday: { flex: 1, textAlign: 'center' },
  empty: { flex: 1 },
  backdrop: { flex: 1, backgroundColor: 'rgba(27,26,46,0.3)' },
  sheet: {
    backgroundColor: colors.background,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    padding: spacing.xl,
    gap: spacing.xl,
  },
  summaryTile: { borderRadius: radius.md, gap: 2 },
});
