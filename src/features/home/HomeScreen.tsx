import { router } from 'expo-router';
import type { TFunction } from 'i18next';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';

import { useDays, usePeriodReport, useUpcoming } from '@/data/live';
import { addDays, weekStart, weekdayOf } from '@/domain/dates';
import { splitDuration } from '@/domain/duration';
import type { ISODate } from '@/domain/types';
import type { Language } from '@/i18n/language';
import { capitalize, formatDate, formatDuration } from '@/lib/format';
import { useToday } from '@/lib/useToday';
import { DayCell } from '@/ui/components/DayCell';
import { Icon } from '@/ui/components/Icon';
import { Screen } from '@/ui/components/Screen';
import { Text } from '@/ui/components/Text';
import { Tile } from '@/ui/components/Tile';
import { colors, radius, spacing } from '@/ui/theme/tokens';

/** "of the planned 136h" / "az előírt 136 órához képest" (the Hungarian suffix depends on the unit). */
function ofPlanned(minutes: number, t: TFunction): string {
  const { hours: h, minutes: m } = splitDuration(minutes);
  if (h && m) return t('home.ofPlannedHoursMinutes', { h, m });
  if (m) return t('home.ofPlannedMinutes', { m });
  return t('home.ofPlannedHours', { h });
}

const openEntry = (date: ISODate) => router.push({ pathname: '/entry/[date]', params: { date } });

export function HomeScreen() {
  const { t, i18n } = useTranslation();
  const language = i18n.language as Language;
  const today = useToday();
  const [year, month] = today.split('-').map(Number) as [number, number];

  const report = usePeriodReport({ type: 'month', year, month });
  const { nextChange, nextHoliday } = useUpcoming(today);
  const monday = weekStart(today);
  const week = useDays(monday, addDays(monday, 6));

  const balance = report.balanceMinutes;
  const status = balance > 0 ? 'ahead' : balance < 0 ? 'behind' : 'onTrack';
  const statusColor = balance > 0 ? colors.overtime : balance < 0 ? colors.shortfall : colors.ink;
  const duration = (minutes: number, signed = false) => formatDuration(minutes, t, { signed });

  return (
    <Screen withTabBar>
      <View style={styles.header}>
        <Text color={colors.inkMuted}>{capitalize(formatDate(today, language, 'dayTitle'))}</Text>
        <Text variant="display">{capitalize(formatDate(today, language, 'month'))}</Text>
      </View>

      <Tile
        tint="lavender"
        style={styles.balanceTile}
        onPress={() => router.navigate('/calendar')}
        accessibilityLabel={`${t('home.thisMonth')}: ${duration(balance, true)}, ${t(`home.${status}`)}`}
      >
        <Text variant="bodyStrong" color={colors.inkMuted} style={styles.alignStart}>
          {t('home.thisMonth')}
        </Text>
        <Text variant="hero" style={styles.center} numberOfLines={1} adjustsFontSizeToFit>
          {formatDuration(balance, t, { signed: true, short: true })}
        </Text>
        <View style={styles.footer}>
          <Text color={colors.inkMuted}>{ofPlanned(report.scheduledMinutes, t)}</Text>
          <View style={styles.badge}>
            <Text variant="caption" color={statusColor}>
              {t(`home.${status}`)}
            </Text>
          </View>
        </View>
      </Tile>

      <View style={styles.row}>
        <Tile
          tint="peach"
          style={styles.smallTile}
          onPress={nextChange ? () => openEntry(nextChange.date) : undefined}
        >
          <View style={styles.tileIcon}>
            <Icon name="clock" size={20} />
          </View>
          {nextChange?.entry ? (
            <View>
              <Text variant="label" color={colors.inkMuted}>
                {t('home.nextChange', { day: formatDate(nextChange.date, language, 'dayShort') })}
              </Text>
              <Text variant="title" numberOfLines={1} adjustsFontSizeToFit>
                {nextChange.entry.minutes === null
                  ? t(`entryKind.${nextChange.entry.kind}`)
                  : duration(nextChange.deltaMinutes, true)}
              </Text>
            </View>
          ) : (
            <Text variant="label" color={colors.inkMuted}>
              {t('home.noUpcoming')}
            </Text>
          )}
        </Tile>

        <Tile tint="mint" style={styles.smallTile}>
          <View style={styles.tileIcon}>
            <Icon name="flag" size={20} />
          </View>
          {nextHoliday ? (
            <View>
              <Text variant="label" color={colors.inkMuted}>
                {t('home.nextHoliday', { day: formatDate(nextHoliday.date, language, 'dayShort') })}
              </Text>
              <Text variant="heading" numberOfLines={2}>
                {nextHoliday.name}
              </Text>
            </View>
          ) : (
            <Text variant="label" color={colors.inkMuted}>
              {t('home.noHoliday')}
            </Text>
          )}
        </Tile>
      </View>

      <Tile>
        <View style={styles.weekHeader}>
          <Text variant="heading">{t('home.thisWeek')}</Text>
          <Pressable
            onPress={() => router.navigate('/calendar')}
            accessibilityRole="link"
            hitSlop={12}
          >
            <Text variant="label">{t('tabs.calendar')}</Text>
          </Pressable>
        </View>
        <View style={styles.week}>
          {week.map((day) => (
            <DayCell
              key={day.date}
              day={day}
              label={t(`weekdaysShort.${weekdayOf(day.date)}`)}
              today={day.date === today}
              onPress={() => openEntry(day.date)}
              height={64}
            />
          ))}
        </View>
      </Tile>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { gap: 2, paddingHorizontal: 6, marginBottom: spacing.xs },
  balanceTile: { padding: 22, gap: 10, alignItems: 'center' },
  center: { textAlign: 'center' },
  alignStart: { alignSelf: 'flex-start' },
  footer: { alignSelf: 'flex-end', flexDirection: 'row', alignItems: 'center', gap: 10 },
  badge: {
    backgroundColor: 'rgba(255,255,255,0.6)',
    borderRadius: radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  row: { flexDirection: 'row', gap: 10 },
  smallTile: { flex: 1, gap: 14, minHeight: 150, justifyContent: 'space-between' },
  tileIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  week: { flexDirection: 'row', gap: 6 },
});
