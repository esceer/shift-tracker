import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { db } from '@/data/db';
import { useDays, useLegalRules, usePlannedDays } from '@/data/live';
import { deleteMonthPlan, saveMonthPlan } from '@/data/repositories/plannedDayRepository';
import { periodRange, shiftPeriod, toISODate, toMonthWeeks } from '@/domain/dates';
import { roundToHour, stepWholeHours } from '@/domain/duration';
import type { ISODate, Minutes, Period } from '@/domain/types';
import type { Language } from '@/i18n/language';
import { capitalize, formatDate, formatDuration } from '@/lib/format';
import { Button } from '@/ui/components/Button';
import { DayCell } from '@/ui/components/DayCell';
import { IconButton } from '@/ui/components/IconButton';
import { Stepper } from '@/ui/components/Stepper';
import { Text } from '@/ui/components/Text';
import { Tile } from '@/ui/components/Tile';
import { colors, radius, spacing, tints } from '@/ui/theme/tokens';

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
  const { holidays, swaps } = useLegalRules(start, end);
  // Starts from the month's plan, or from the weekly schedule when there is none; holidays start off.
  const [minutes, setMinutes] = useState<Map<ISODate, Minutes>>(
    () => new Map(days.map((day) => [day.date, holidays.has(day.date) ? 0 : day.scheduledMinutes])),
  );
  const [editing, setEditing] = useState<ISODate>();
  const insets = useSafeAreaInsets();

  // The plan is set in whole hours.
  const set = (date: ISODate, value: Minutes) =>
    setMinutes((current) =>
      new Map(current).set(date, Math.min(MAX_DAY_MINUTES, Math.max(0, roundToHour(value)))),
    );

  const change = (date: ISODate, steps: number) =>
    set(date, stepWholeHours(minutes.get(date) ?? 0, steps));

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
                    requiredMinutes: 0,
                    // A holiday off shows as a holiday; with hours planned it keeps the colour.
                    entry:
                      holidays.has(cell.date) && cell.value === 0
                        ? {
                            date: cell.date,
                            kind: 'holiday',
                            minutes: null,
                            note: null,
                            synced: true,
                          }
                        : undefined,
                    deltaMinutes: 0,
                  }}
                  label={String(Number(cell.date.slice(8)))}
                  selected={cell.date === editing}
                  tint={holidays.has(cell.date) ? 'mint' : undefined}
                  marked={swaps.has(cell.date)}
                  onPress={() => setEditing(cell.date)}
                />
              ) : (
                <View key={`empty-${j}`} style={styles.empty} />
              ),
            )}
          </View>
        ))}
      </Tile>

      {(holidays.size > 0 || swaps.size > 0) && (
        <View style={styles.legend}>
          {holidays.size > 0 && (
            <View style={[styles.chip, { backgroundColor: tints.mint }]}>
              <Text variant="caption">{t('entryKind.holiday')}</Text>
            </View>
          )}
          {swaps.size > 0 && (
            <View style={[styles.chip, styles.swapChip]}>
              <View style={styles.dot} />
              <Text variant="caption">{t('schedule.swappedDay')}</Text>
            </View>
          )}
        </View>
      )}

      <Tile tint="lavender" style={styles.summaryTile}>
        <View style={styles.flex}>
          <Text variant="label" color={colors.inkMuted}>
            {t('schedule.perMonth')}
          </Text>
          <Text variant="title">{formatDuration(total, t)}</Text>
        </View>
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
              minutes={minutes.get(editing) ?? 0}
              onChangeMinutes={(value) => set(editing, value)}
              editLabel={t('entry.typeHours')}
              decrementLabel={t('schedule.hourLess')}
              incrementLabel={t('schedule.hourMore')}
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
  legend: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, paddingHorizontal: 4 },
  chip: { borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 6 },
  swapChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.surface,
  },
  dot: { width: 5, height: 5, borderRadius: 3, backgroundColor: colors.ink },
  backdrop: { flex: 1, backgroundColor: 'rgba(27,26,46,0.3)' },
  sheet: {
    backgroundColor: colors.background,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    padding: spacing.xl,
    gap: spacing.xl,
  },
  summaryTile: {
    borderRadius: radius.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  flex: { flex: 1, gap: 2 },
});
