import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, TextInput, View } from 'react-native';

import { db } from '@/data/db';
import { useDayForEditing } from '@/data/live';
import { deleteEntry, saveEntry } from '@/data/repositories/entryRepository';
import { addDays, toISODate } from '@/domain/dates';
import type { ISODate } from '@/domain/types';
import type { Language } from '@/i18n/language';
import { capitalize, formatDate, formatDuration } from '@/lib/format';
import { Button } from '@/ui/components/Button';
import { Icon } from '@/ui/components/Icon';
import { IconButton } from '@/ui/components/IconButton';
import { Screen } from '@/ui/components/Screen';
import { SegmentedControl } from '@/ui/components/SegmentedControl';
import { Stepper } from '@/ui/components/Stepper';
import { Text } from '@/ui/components/Text';
import { Tile } from '@/ui/components/Tile';
import { colors, radius, spacing, tints, typography } from '@/ui/theme/tokens';

import { initialForm, setSign, stepForm, toEntry, workedMinutes } from './entryForm';
import { KindPicker } from './KindPicker';

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/** Add/edit the change for one day (route: /entry/[date]). */
export function EntryScreen() {
  const params = useLocalSearchParams<{ date: string }>();
  const date = ISO_DATE.test(params.date ?? '') ? params.date! : toISODate(new Date());
  // Re-mount per date so the form starts from that day's data.
  return <EntryEditor key={date} date={date} />;
}

function EntryEditor({ date }: { date: ISODate }) {
  const { t, i18n } = useTranslation();
  const language = i18n.language as Language;
  const { scheduledMinutes: scheduled, entry, holidayName } = useDayForEditing(date);
  const [form, setForm] = useState(() => initialForm(entry, scheduled));

  const toSave = toEntry(form, date);
  const worked = workedMinutes(form, scheduled);
  const duration = (minutes: number, signed = false) => formatDuration(minutes, t, { signed });

  const goToDay = (days: number) => router.setParams({ date: addDays(date, days) });

  const save = () => {
    if (!toSave) return;
    saveEntry(db, toSave);
    router.back();
  };

  const remove = () => {
    deleteEntry(db, date);
    router.back();
  };

  return (
    <Screen>
      <View style={styles.header}>
        <IconButton
          icon="chevronLeft"
          accessibilityLabel={t('common.back')}
          onPress={router.back}
        />
        <Text variant="title">{entry ? t('entry.titleEdit') : t('entry.titleNew')}</Text>
      </View>

      <Tile style={styles.daySwitcher}>
        <IconButton
          icon="chevronLeft"
          accessibilityLabel={t('entry.previousDay')}
          onPress={() => goToDay(-1)}
          background={colors.surfaceMuted}
        />
        <Text variant="bodyStrong" style={styles.dayTitle} accessibilityRole="header">
          {capitalize(formatDate(date, language, 'dayTitle'))}
        </Text>
        <IconButton
          icon="chevronRight"
          accessibilityLabel={t('entry.nextDay')}
          onPress={() => goToDay(1)}
          background={colors.surfaceMuted}
        />
      </Tile>

      {holidayName && (
        <View style={styles.holiday}>
          <Icon name="flag" size={16} strokeWidth={2.2} />
          <Text variant="label">{t('entry.holidayHint', { name: holidayName })}</Text>
        </View>
      )}

      <KindPicker value={form.kind} onChange={(kind) => setForm({ ...form, kind })} />

      <Tile tint="lavender" style={styles.valueTile}>
        {form.kind === 'adjustment' && (
          <SegmentedControl
            options={[
              { value: 'less', label: t('entry.less') },
              { value: 'more', label: t('entry.more') },
            ]}
            value={form.sign < 0 ? 'less' : 'more'}
            onChange={(value) => setForm(setSign(form, value === 'less' ? -1 : 1, scheduled))}
            background="rgba(255,255,255,0.55)"
          />
        )}

        {(form.kind === 'adjustment' || form.kind === 'actual') && (
          <Stepper
            valueLabel={
              form.kind === 'adjustment'
                ? duration(form.sign * form.adjustMinutes, true)
                : duration(form.actualMinutes)
            }
            onDecrement={() => setForm(stepForm(form, -1, scheduled))}
            onIncrement={() => setForm(stepForm(form, 1, scheduled))}
            decrementLabel={t('entry.decrease')}
            incrementLabel={t('entry.increase')}
            variant="display"
            buttonBackground={colors.surface}
            buttonSize={56}
          />
        )}

        <Text color={colors.inkMuted} style={styles.preview}>
          {form.kind === 'adjustment'
            ? t('entry.previewAdjust', { scheduled: duration(scheduled), worked: duration(worked) })
            : form.kind === 'actual'
              ? t('entry.previewActual', {
                  scheduled: duration(scheduled),
                  delta: duration(worked - scheduled, true),
                })
              : t('entry.previewAbsence', { scheduled: duration(scheduled) })}
        </Text>
      </Tile>

      <Tile style={styles.noteTile}>
        <Text variant="label" color={colors.inkMuted} nativeID="note-label">
          {t('entry.note')}
        </Text>
        <TextInput
          value={form.note}
          onChangeText={(note) => setForm({ ...form, note })}
          placeholder={t('entry.notePlaceholder')}
          placeholderTextColor={colors.inkSubtle}
          accessibilityLabelledBy="note-label"
          style={styles.noteInput}
        />
      </Tile>

      <Button label={t('entry.save')} onPress={save} disabled={!toSave} />
      {entry && <Button label={t('entry.delete')} onPress={remove} variant="secondary" />}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  daySwitcher: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 6,
    borderRadius: radius.md,
  },
  dayTitle: { flex: 1, textAlign: 'center' },
  holiday: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    alignSelf: 'flex-start',
    backgroundColor: tints.mint,
    borderRadius: radius.pill,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  valueTile: { gap: spacing.lg },
  preview: { textAlign: 'center' },
  noteTile: { borderRadius: radius.md, paddingVertical: 12, gap: 2 },
  noteInput: { ...typography.body, color: colors.ink, paddingVertical: 4 },
});
