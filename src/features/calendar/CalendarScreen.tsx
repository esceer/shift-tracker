import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';

import { useDays } from '@/data/live';
import { periodRange, shiftPeriod, toISODate, toMonthWeeks } from '@/domain/dates';
import type { DayInfo, ISODate, Period } from '@/domain/types';
import type { Language } from '@/i18n/language';
import { capitalize, formatDate, formatDuration } from '@/lib/format';
import { Button } from '@/ui/components/Button';
import { DayCell } from '@/ui/components/DayCell';
import { Icon } from '@/ui/components/Icon';
import { IconButton } from '@/ui/components/IconButton';
import { Screen } from '@/ui/components/Screen';
import { Text } from '@/ui/components/Text';
import { Tile } from '@/ui/components/Tile';
import { dayTint } from '@/ui/theme/entryStyle';
import { colors, radius, spacing, tints, type Tint } from '@/ui/theme/tokens';

const WEEKDAYS = [1, 2, 3, 4, 5, 6, 7] as const;
const LEGEND: { tint: Tint; key: string }[] = [
  { tint: 'red', key: 'calendar.extra' },
  { tint: 'sky', key: 'calendar.less' },
  { tint: 'mint', key: 'entryKind.holiday' },
  { tint: 'butter', key: 'entryKind.vacation' },
  { tint: 'orange', key: 'entryKind.sick' },
];

export function CalendarScreen() {
  const { t, i18n } = useTranslation();
  const language = i18n.language as Language;
  const today = toISODate(new Date());
  const [year, month] = today.split('-').map(Number) as [number, number];

  const [cursor, setCursor] = useState<Period>({ type: 'month', year, month });
  const [selected, setSelected] = useState<ISODate>(today);
  const { start, end } = periodRange(cursor);
  const days = useDays(start, end);
  const selectedDay = days.find((day) => day.date === selected);

  const goToMonth = (delta: number) => {
    const next = shiftPeriod(cursor, delta);
    setCursor(next);
    const range = periodRange(next);
    setSelected(today >= range.start && today <= range.end ? today : range.start);
  };

  const goToToday = () => {
    setCursor({ type: 'month', year, month });
    setSelected(today);
  };

  return (
    <Screen withTabBar>
      <View style={styles.header}>
        <View>
          <Text color={colors.inkMuted}>{cursor.year}</Text>
          <Text variant="display">{capitalize(formatDate(start, language, 'month'))}</Text>
        </View>
        <View style={styles.headerRight}>
          <Pressable
            onPress={goToToday}
            accessibilityRole="button"
            hitSlop={8}
            style={({ pressed }) => [styles.todayButton, pressed && styles.pressed]}
          >
            <Icon name="calendar" size={16} strokeWidth={2.2} />
            <Text variant="label">{t('calendar.today')}</Text>
          </Pressable>
          <View style={styles.headerButtons}>
            <IconButton
              icon="chevronLeft"
              accessibilityLabel={t('calendar.previousMonth')}
              onPress={() => goToMonth(-1)}
            />
            <IconButton
              icon="chevronRight"
              accessibilityLabel={t('calendar.nextMonth')}
              onPress={() => goToMonth(1)}
            />
          </View>
        </View>
      </View>

      <Tile style={styles.grid}>
        <View style={styles.week}>
          {WEEKDAYS.map((weekday) => (
            <Text key={weekday} variant="caption" color={colors.inkMuted} style={styles.weekday}>
              {t(`weekdaysShort.${weekday}`)}
            </Text>
          ))}
        </View>
        {toMonthWeeks(days).map((week, i) => (
          <View key={i} style={styles.week}>
            {week.map((day, j) =>
              day ? (
                <DayCell
                  key={day.date}
                  day={day}
                  label={String(Number(day.date.slice(8)))}
                  today={day.date === today}
                  selected={day.date === selected}
                  onPress={() => setSelected(day.date)}
                />
              ) : (
                <View key={`empty-${j}`} style={styles.empty} />
              ),
            )}
          </View>
        ))}
      </Tile>

      <View style={styles.legend}>
        {LEGEND.map(({ tint, key }) => (
          <View key={key} style={[styles.chip, { backgroundColor: tints[tint] }]}>
            <Text variant="caption">{t(key as 'calendar.extra')}</Text>
          </View>
        ))}
      </View>

      {selectedDay && <SelectedDay day={selectedDay} language={language} />}
    </Screen>
  );
}

function SelectedDay({ day, language }: { day: DayInfo; language: Language }) {
  const { t } = useTranslation();
  const { entry, scheduledMinutes, deltaMinutes } = day;
  const duration = (minutes: number, signed = false) => formatDuration(minutes, t, { signed });

  const kindLabel = entry ? t(`entryKind.${entry.kind}`) : undefined;
  const title = entry ? (entry.note ?? kindLabel!) : t('calendar.noChange');
  const detail = !scheduledMinutes
    ? t('calendar.dayOff')
    : entry && entry.minutes !== null
      ? t('calendar.plannedWorked', {
          scheduled: duration(scheduledMinutes),
          worked: duration(scheduledMinutes + deltaMinutes),
        })
      : t('calendar.scheduled', { scheduled: duration(scheduledMinutes) });

  return (
    <Tile tint={dayTint(day)} style={styles.selectedTile}>
      <View style={styles.flex}>
        <Text variant="label" color={colors.inkMuted}>
          {[formatDate(day.date, language, 'dayShort'), kindLabel].filter(Boolean).join(' · ')}
        </Text>
        <Text variant="heading">{title}</Text>
        <Text color={colors.inkMuted}>{detail}</Text>
      </View>
      <View style={styles.selectedAction}>
        <Button
          label={entry && !entry.synced ? t('calendar.edit') : t('calendar.add')}
          onPress={() => router.push({ pathname: '/entry/[date]', params: { date: day.date } })}
        />
      </View>
    </Tile>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: 6,
  },
  headerRight: { alignItems: 'flex-end', gap: spacing.sm },
  headerButtons: { flexDirection: 'row', gap: spacing.sm },
  todayButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 36,
    paddingHorizontal: 14,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
  },
  pressed: { opacity: 0.7 },
  grid: { paddingHorizontal: 12, paddingVertical: 14, gap: 5 },
  week: { flexDirection: 'row', gap: 5 },
  weekday: { flex: 1, textAlign: 'center' },
  empty: { flex: 1 },
  legend: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, paddingHorizontal: 4 },
  chip: { borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 6 },
  selectedTile: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  flex: { flex: 1, gap: 2 },
  selectedAction: { flexShrink: 0 },
});
