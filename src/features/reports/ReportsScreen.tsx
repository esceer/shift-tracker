import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';

import { useDays, usePeriodReport } from '@/data/live';
import {
  monthsInPeriod,
  periodRange,
  quarterOfMonth,
  shiftPeriod,
  toISODate,
} from '@/domain/dates';
import type { AbsenceKind, Period } from '@/domain/types';
import type { Language } from '@/i18n/language';
import { capitalize, formatDate, formatDuration, formatPeriod } from '@/lib/format';
import { Button } from '@/ui/components/Button';
import { Icon } from '@/ui/components/Icon';
import { IconButton } from '@/ui/components/IconButton';
import { Screen } from '@/ui/components/Screen';
import { SegmentedControl } from '@/ui/components/SegmentedControl';
import { Text } from '@/ui/components/Text';
import { Tile } from '@/ui/components/Tile';
import { dayTint, kindIcon, kindTint } from '@/ui/theme/entryStyle';
import { colors, radius, spacing, tints } from '@/ui/theme/tokens';

import { exportReportPdf } from './pdf/exportReportPdf';

type MonthPeriod = Extract<Period, { type: 'month' }>;
const ABSENCES: AbsenceKind[] = ['vacation', 'sick', 'holiday'];

function currentMonth(): MonthPeriod {
  const [year, month] = toISODate(new Date()).split('-').map(Number) as [number, number];
  return { type: 'month', year, month };
}

/** Switches between month and quarter, keeping the user in the same part of the year. */
function switchType(period: Period, type: Period['type']): Period {
  if (period.type === type) return period;
  if (period.type === 'month') {
    return { type: 'quarter', year: period.year, quarter: quarterOfMonth(period.month) };
  }
  const now = currentMonth();
  const months = monthsInPeriod(period);
  return months.find((m) => m.year === now.year && m.month === now.month) ?? months[0]!;
}

export function ReportsScreen() {
  const { t, i18n } = useTranslation();
  const language = i18n.language as Language;
  const [period, setPeriod] = useState<Period>(currentMonth);
  const report = usePeriodReport(period);
  const duration = (minutes: number, signed = false) => formatDuration(minutes, t, { signed });

  const months = monthsInPeriod(period);
  const [exportState, setExportState] = useState<'idle' | 'busy' | 'failed'>('idle');

  const exportPdf = async () => {
    setExportState('busy');
    try {
      await exportReportPdf(period, t, language);
      setExportState('idle');
    } catch {
      setExportState('failed');
    }
  };

  return (
    <Screen withTabBar>
      <Text variant="display" style={styles.title}>
        {t('tabs.reports')}
      </Text>
      <SegmentedControl
        options={[
          { value: 'month', label: t('reports.month') },
          { value: 'quarter', label: t('reports.quarter') },
        ]}
        value={period.type}
        onChange={(type) => setPeriod(switchType(period, type))}
      />

      <Tile tint="lavender" style={styles.balanceTile}>
        <View style={styles.periodRow}>
          <IconButton
            icon="chevronLeft"
            accessibilityLabel={t('reports.previous')}
            onPress={() => setPeriod(shiftPeriod(period, -1))}
            background="rgba(255,255,255,0.6)"
          />
          <Text variant="bodyStrong" style={styles.periodTitle} accessibilityRole="header">
            {formatPeriod(period, t, language)}
          </Text>
          <IconButton
            icon="chevronRight"
            accessibilityLabel={t('reports.next')}
            onPress={() => setPeriod(shiftPeriod(period, 1))}
            background="rgba(255,255,255,0.6)"
          />
        </View>
        <Text
          variant="hero"
          color={report.balanceMinutes > 0 ? colors.overtime : colors.ink}
          style={styles.center}
          numberOfLines={1}
          adjustsFontSizeToFit
        >
          {duration(report.balanceMinutes, true)}
        </Text>
        <Text color={colors.inkMuted} style={styles.center}>
          {t('home.workedOf', {
            worked: duration(report.workedMinutes),
            scheduled: duration(report.scheduledMinutes),
          })}
        </Text>
      </Tile>

      {period.type === 'quarter' ? (
        <View style={styles.row}>
          {months.map((month) => (
            <MonthTile key={month.month} month={month} onPress={() => setPeriod(month)} />
          ))}
        </View>
      ) : (
        <MonthChanges month={period} />
      )}

      <Tile>
        <Text variant="heading">{t('reports.daysOff')}</Text>
        <View style={styles.row}>
          {ABSENCES.map((kind) => (
            <View key={kind} style={[styles.absence, { backgroundColor: tints[kindTint[kind]] }]}>
              <Icon name={kindIcon[kind]} size={20} />
              <Text variant="title">{report.absenceDays[kind]}</Text>
              <Text variant="label" color={colors.inkMuted}>
                {t(`entryKind.${kind}`)}
              </Text>
            </View>
          ))}
        </View>
      </Tile>

      <Button
        label={exportState === 'busy' ? t('export.exporting') : t('export.exportPdf')}
        icon="download"
        onPress={exportPdf}
        disabled={exportState === 'busy'}
      />
      {exportState === 'failed' && (
        <Text variant="label" style={styles.center} accessibilityLiveRegion="polite">
          {t('export.failed')}
        </Text>
      )}
    </Screen>
  );
}

/** One month of a quarter: name and balance, coloured by sign. Tapping opens the month. */
function MonthTile({ month, onPress }: { month: MonthPeriod; onPress: () => void }) {
  const { t, i18n } = useTranslation();
  const { balanceMinutes } = usePeriodReport(month);
  const name = capitalize(formatDate(periodRange(month).start, i18n.language as Language, 'month'));
  const value = formatDuration(balanceMinutes, t, { signed: true });

  return (
    <Tile
      tint={balanceMinutes > 0 ? 'red' : balanceMinutes < 0 ? 'sky' : undefined}
      onPress={onPress}
      accessibilityLabel={`${name}, ${value}`}
      style={styles.monthTile}
    >
      <Text variant="label" color={colors.inkMuted} numberOfLines={1}>
        {name}
      </Text>
      <Text
        variant="heading"
        color={balanceMinutes > 0 ? colors.overtime : colors.ink}
        numberOfLines={1}
        adjustsFontSizeToFit
      >
        {value}
      </Text>
    </Tile>
  );
}

/** The month's changes, newest last; tapping a row opens it for editing. */
function MonthChanges({ month }: { month: MonthPeriod }) {
  const { t, i18n } = useTranslation();
  const { start, end } = periodRange(month);
  const days = useDays(start, end).filter(
    (day) => day.entry && !(day.entry.synced && day.scheduledMinutes === 0),
  );

  return (
    <Tile style={styles.changes}>
      <Text variant="heading" style={styles.changesTitle}>
        {t('reports.changes')}
      </Text>
      {days.length === 0 && (
        <Text color={colors.inkMuted} style={styles.changesTitle}>
          {t('reports.noChanges')}
        </Text>
      )}
      {days.map((day) => {
        const entry = day.entry!;
        const kind = t(`entryKind.${entry.kind}`);
        const value =
          entry.minutes === null ? null : formatDuration(day.deltaMinutes, t, { signed: true });
        const tint = dayTint(day);
        return (
          <Pressable
            key={day.date}
            onPress={() => router.push({ pathname: '/entry/[date]', params: { date: day.date } })}
            accessibilityRole="button"
            style={({ pressed }) => [styles.changeRow, pressed && styles.pressed]}
          >
            <View
              style={[
                styles.changeDot,
                { backgroundColor: tint ? tints[tint] : colors.surfaceMuted },
              ]}
            >
              <Icon name={kindIcon[entry.kind]} size={18} />
            </View>
            <View style={styles.flex}>
              <Text variant="bodyStrong" numberOfLines={1}>
                {entry.note ?? kind}
              </Text>
              <Text variant="label" color={colors.inkMuted}>
                {formatDate(day.date, i18n.language as Language, 'dayShort')}
              </Text>
            </View>
            {value && (
              <Text
                variant="bodyStrong"
                color={day.deltaMinutes > 0 ? colors.overtime : colors.ink}
              >
                {value}
              </Text>
            )}
          </Pressable>
        );
      })}
    </Tile>
  );
}

const styles = StyleSheet.create({
  title: { paddingHorizontal: 6 },
  balanceTile: { gap: spacing.sm, paddingBottom: 22 },
  periodRow: { flexDirection: 'row', alignItems: 'center' },
  periodTitle: { flex: 1, textAlign: 'center' },
  center: { textAlign: 'center' },
  row: { flexDirection: 'row', gap: 10 },
  monthTile: { flex: 1, borderRadius: radius.md, padding: 14, gap: 18 },
  absence: { flex: 1, borderRadius: 18, padding: 12, gap: 4 },
  changes: { paddingHorizontal: 0, gap: 0 },
  changesTitle: { paddingHorizontal: 18, paddingBottom: spacing.sm },
  changeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  pressed: { backgroundColor: colors.surfaceMuted },
  changeDot: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flex: { flex: 1 },
});
