import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Switch, View } from 'react-native';

import { db } from '@/data/db';
import { fetchHungarianHolidays } from '@/data/holidays/nagerClient';
import { syncHolidays } from '@/data/holidays/syncHolidays';
import { useSettings } from '@/data/live';
import { setSetting } from '@/data/repositories/settingsRepository';
import { toISODate } from '@/domain/dates';
import type { Language } from '@/i18n/language';
import { formatDate } from '@/lib/format';
import { Icon } from '@/ui/components/Icon';
import { Text } from '@/ui/components/Text';
import { Tile } from '@/ui/components/Tile';
import { colors, radius, spacing } from '@/ui/theme/tokens';

/** Toggle for the Hungarian public-holiday sync, with "Sync now". */
export function HolidaySyncTile() {
  const { t, i18n } = useTranslation();
  const { holidaySyncEnabled, holidaysSyncedAt } = useSettings();
  const [status, setStatus] = useState<'idle' | 'syncing' | 'failed'>('idle');

  const sync = async () => {
    setStatus('syncing');
    try {
      await syncHolidays(db, fetchHungarianHolidays, new Date());
      setStatus('idle');
    } catch {
      setStatus('failed');
    }
  };

  const toggle = (enabled: boolean) => {
    setSetting(db, 'holidaySyncEnabled', enabled);
    if (enabled) void sync();
    else setStatus('idle');
  };

  const lastSynced = holidaysSyncedAt
    ? t('holidays.lastSynced', {
        date: formatDate(toISODate(new Date(holidaysSyncedAt)), i18n.language as Language),
      })
    : t('holidays.neverSynced');

  return (
    <Tile tint="mint">
      <View style={styles.header}>
        <View style={styles.icon}>
          <Icon name="flag" size={20} />
        </View>
        <View style={styles.flex}>
          <Text variant="heading">{t('holidays.title')}</Text>
          <Text variant="label" color={colors.inkMuted}>
            {holidaySyncEnabled ? lastSynced : t('holidays.description')}
          </Text>
        </View>
        <Switch
          value={holidaySyncEnabled}
          onValueChange={toggle}
          accessibilityLabel={t('holidays.title')}
          trackColor={{ false: 'rgba(27,26,46,0.2)', true: colors.ink }}
          thumbColor={colors.surface}
        />
      </View>

      {holidaySyncEnabled && (
        <Pressable
          onPress={sync}
          disabled={status === 'syncing'}
          accessibilityRole="button"
          style={({ pressed }) => [styles.syncButton, pressed && styles.pressed]}
        >
          <Icon name="sync" size={16} strokeWidth={2.2} />
          <Text variant="button">
            {status === 'syncing' ? t('holidays.syncing') : t('holidays.syncNow')}
          </Text>
        </Pressable>
      )}

      {status === 'failed' && (
        <Text variant="label" accessibilityLiveRegion="polite">
          {t('holidays.syncFailed')}
        </Text>
      )}
    </Tile>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  icon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  flex: { flex: 1 },
  syncButton: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: 44,
    paddingHorizontal: 16,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255,255,255,0.7)',
  },
  pressed: { opacity: 0.7 },
});
