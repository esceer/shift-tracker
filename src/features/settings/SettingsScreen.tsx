import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { db } from '@/data/db';
import { useScheduleVersions } from '@/data/live';
import { setSetting } from '@/data/repositories/settingsRepository';
import { toISODate } from '@/domain/dates';
import { activeScheduleOn } from '@/domain/schedule';
import type { Weekday } from '@/domain/types';
import { applyLanguage } from '@/i18n';
import type { Language } from '@/i18n/language';
import { formatDate, formatDuration } from '@/lib/format';
import { Icon } from '@/ui/components/Icon';
import { Screen } from '@/ui/components/Screen';
import { SegmentedControl } from '@/ui/components/SegmentedControl';
import { Text } from '@/ui/components/Text';
import { Tile } from '@/ui/components/Tile';
import { colors, spacing } from '@/ui/theme/tokens';

import { HolidaySyncTile } from './HolidaySyncTile';

const WEEKDAYS: Weekday[] = [1, 2, 3, 4, 5, 6, 7];
const BAR_MAX_HEIGHT = 44;
/** A day of this length (10h) fills the bar. */
const BAR_FULL_MINUTES = 600;

export function SettingsScreen() {
  const { t, i18n } = useTranslation();
  const language = i18n.language as Language;
  const active = activeScheduleOn(useScheduleVersions(), toISODate(new Date()));

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
