import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { db } from '@/data/db';
import { usePlannedDays, useScheduleVersions, useSettings } from '@/data/live';
import { setSetting } from '@/data/repositories/settingsRepository';
import { periodRange, toISODate } from '@/domain/dates';
import { activeScheduleOn } from '@/domain/schedule';
import type { Weekday } from '@/domain/types';
import { applyLanguage } from '@/i18n';
import type { Language } from '@/i18n/language';
import { capitalize, formatDate, formatDuration } from '@/lib/format';
import { Icon } from '@/ui/components/Icon';
import { Screen } from '@/ui/components/Screen';
import { SegmentedControl } from '@/ui/components/SegmentedControl';
import { Text } from '@/ui/components/Text';
import { Tile } from '@/ui/components/Tile';
import { colors, spacing } from '@/ui/theme/tokens';

import { BackupTile } from './BackupTile';
import { HolidaySyncTile } from './HolidaySyncTile';

const WEEKDAYS: Weekday[] = [1, 2, 3, 4, 5, 6, 7];
/** Munkarend options: full time and the usual part-time days. */
const DAILY_MINUTES = ['480', '360', '240'] as const;
const BAR_MAX_HEIGHT = 44;
/** A day of this length (10h) fills the bar. */
const BAR_FULL_MINUTES = 600;

export function SettingsScreen() {
  const { t, i18n } = useTranslation();
  const language = i18n.language as Language;
  const today = toISODate(new Date());
  const active = activeScheduleOn(useScheduleVersions(), today);
  const [year, month] = today.split('-').map(Number) as [number, number];
  const thisMonth = periodRange({ type: 'month', year, month });
  const hasMonthPlan = usePlannedDays(thisMonth.start, thisMonth.end).size > 0;
  const { dailyMinutes } = useSettings();

  const chooseLanguage = (value: Language) => {
    setSetting(db, 'language', value);
    void applyLanguage(value);
  };

  const weekly = active ? Object.values(active.minutesByWeekday).reduce((a, b) => a + b, 0) : 0;
  const summary = active
    ? t('settings.scheduleSummary', {
        total: formatDuration(weekly, t),
        date: formatDate(active.effectiveFrom, language),
      })
    : t('settings.noSchedule');

  return (
    <Screen withTabBar>
      <Text variant="display">{t('tabs.settings')}</Text>

      <Tile>
        <Text variant="heading">{t('settings.dailyHours')}</Text>
        <SegmentedControl
          options={DAILY_MINUTES.map((value) => ({
            value,
            label: formatDuration(Number(value), t),
          }))}
          value={String(dailyMinutes) as (typeof DAILY_MINUTES)[number]}
          onChange={(value) => setSetting(db, 'dailyMinutes', Number(value))}
          background={colors.surfaceMuted}
        />
        <Text variant="label" color={colors.inkMuted}>
          {t('settings.requiredPerWeek', { total: formatDuration(dailyMinutes * 5, t) })}
        </Text>
      </Tile>

      <Tile
        tint="lavender"
        onPress={() => router.push('/schedule')}
        accessibilityLabel={`${t('schedule.editTitle')}, ${summary}`}
      >
        <View style={styles.tileHeader}>
          <View style={styles.tileTitle}>
            <Text variant="title" style={styles.scheduleTitle}>
              {t('schedule.editTitle')}
            </Text>
            <Text variant="label" color={colors.inkMuted}>
              {summary}
            </Text>
            {hasMonthPlan && (
              <Text variant="label">
                {t('settings.monthPlanActive', {
                  month: capitalize(formatDate(thisMonth.start, language, 'month')),
                })}
              </Text>
            )}
          </View>
          <View style={styles.chevron}>
            <Icon name="chevronRight" size={18} strokeWidth={2.2} />
          </View>
        </View>
        {active && (
          <View style={styles.bars}>
            {WEEKDAYS.map((weekday) => {
              const minutes = active.minutesByWeekday[weekday];
              return (
                <View key={weekday} style={styles.barColumn}>
                  {minutes > 0 && <Text variant="caption">{formatDuration(minutes, t)}</Text>}
                  <View
                    style={[
                      styles.bar,
                      minutes > 0
                        ? { height: Math.min(1, minutes / BAR_FULL_MINUTES) * BAR_MAX_HEIGHT }
                        : styles.barOff,
                    ]}
                  />
                  <Text variant="caption" color={colors.inkMuted}>
                    {t(`weekdaysShort.${weekday}`)}
                  </Text>
                </View>
              );
            })}
          </View>
        )}
      </Tile>

      <HolidaySyncTile />

      <Tile>
        <Text variant="heading">{t('language.label')}</Text>
        <SegmentedControl
          options={[
            { value: 'en', label: t('language.en') },
            { value: 'hu', label: t('language.hu') },
          ]}
          value={language}
          onChange={chooseLanguage}
          background={colors.surfaceMuted}
        />
      </Tile>

      <BackupTile />
    </Screen>
  );
}

const styles = StyleSheet.create({
  tileHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  tileTitle: { flex: 1, gap: 2 },
  scheduleTitle: { fontSize: 22, lineHeight: 26 },
  chevron: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bars: { flexDirection: 'row', alignItems: 'flex-end', gap: 6, minHeight: 76 },
  barColumn: { flex: 1, alignItems: 'center', gap: 4 },
  bar: { alignSelf: 'stretch', borderRadius: 8, backgroundColor: colors.ink },
  barOff: { height: 4, borderRadius: 2, backgroundColor: 'rgba(27,26,46,0.18)' },
});
