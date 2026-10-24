import { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';

import { fromISODate, toISODate } from '@/domain/dates';
import type { Weekday } from '@/domain/types';
import type { Language } from '@/i18n/language';
import { formatDate, formatDuration } from '@/lib/format';
import { Button } from '@/ui/components/Button';
import { IconButton } from '@/ui/components/IconButton';
import { Screen } from '@/ui/components/Screen';
import { SegmentedControl } from '@/ui/components/SegmentedControl';
import { Stepper } from '@/ui/components/Stepper';
import { Text } from '@/ui/components/Text';
import { Tile } from '@/ui/components/Tile';
import { colors, radius, spacing } from '@/ui/theme/tokens';

import { MonthPlanForm } from './MonthPlanForm';
import { useScheduleEditor } from './useScheduleEditor';

const WEEKDAYS: Weekday[] = [1, 2, 3, 4, 5, 6, 7];

type Props = { mode: 'onboarding' | 'edit' };

/** "Your usual week" (first launch, step 2) and the schedule editor in Settings. */
export function ScheduleEditorScreen({ mode }: Props) {
  const { t } = useTranslation();
  const onboarding = mode === 'onboarding';
  const [kind, setKind] = useState<'weekly' | 'monthly'>('weekly');

  return (
    <Screen>
      <View style={styles.header}>
        <IconButton
          icon="chevronLeft"
          accessibilityLabel={t('common.back')}
          onPress={router.back}
        />
        {onboarding && (
          <View
            style={styles.steps}
            accessible
            accessibilityLabel={t('schedule.step', { current: 2, total: 2 })}
          >
            <View style={[styles.step, styles.stepDone]} />
            <View style={[styles.step, styles.stepCurrent]} />
          </View>
        )}
      </View>

      <View style={styles.intro}>
        <Text variant="title">{onboarding ? t('schedule.title') : t('schedule.editTitle')}</Text>
        <Text color={colors.inkMuted}>
          {onboarding
            ? t('schedule.subtitle')
            : kind === 'weekly'
              ? t('schedule.editHint')
              : t('schedule.monthHint')}
        </Text>
      </View>

      {!onboarding && (
        <SegmentedControl
          options={[
            { value: 'weekly', label: t('schedule.weekly') },
            { value: 'monthly', label: t('schedule.monthly') },
          ]}
          value={kind}
          onChange={setKind}
        />
      )}

      {kind === 'weekly' ? <WeeklyScheduleForm mode={mode} /> : <MonthPlanForm />}
    </Screen>
  );
}

/** Hours per weekday, valid from a chosen date. */
function WeeklyScheduleForm({ mode }: Props) {
  const { t, i18n } = useTranslation();
  const editor = useScheduleEditor(mode);
  const onboarding = mode === 'onboarding';

  const pickDate = () =>
    DateTimePickerAndroid.open({
      value: fromISODate(editor.effectiveFrom),
      mode: 'date',
      onValueChange: (_event, date) => editor.setEffectiveFrom(toISODate(date)),
    });

  const save = () => {
    editor.save();
    if (onboarding) router.replace('/');
    else router.back();
  };

  return (
    <>
      <Tile style={styles.days}>
        {WEEKDAYS.map((weekday) => {
          const day = t(`weekdays.${weekday}`);
          const value = editor.minutes[weekday];
          return (
            <View key={weekday} style={styles.dayRow}>
              <Text variant="bodyStrong" style={styles.dayName}>
                {day}
              </Text>
              <View style={styles.stepper}>
                <Stepper
                  valueLabel={value ? formatDuration(value, t) : t('schedule.off')}
                  valueColor={value ? colors.ink : colors.inkSubtle}
                  onDecrement={() => editor.changeDay(weekday, -1)}
                  onIncrement={() => editor.changeDay(weekday, 1)}
                  minutes={value}
                  onChangeMinutes={(minutes) => editor.setDay(weekday, minutes)}
                  editLabel={t('schedule.typeHours', { day })}
                  decrementLabel={t('schedule.less', { day })}
                  incrementLabel={t('schedule.more', { day })}
                  buttonSize={40}
                />
              </View>
            </View>
          );
        })}
      </Tile>

      <View style={styles.summary}>
        <Tile tint="lavender" style={styles.summaryTile}>
          <Text variant="label" color={colors.inkMuted}>
            {t('schedule.perWeek')}
          </Text>
          <Text variant="title">{formatDuration(editor.weeklyTotal, t)}</Text>
        </Tile>
        <Pressable
          onPress={pickDate}
          accessibilityRole="button"
          style={({ pressed }) => [styles.dateTile, pressed && { opacity: 0.85 }]}
        >
          <Text variant="label" color={colors.inkMuted}>
            {t('schedule.countsFrom')}
          </Text>
          <Text variant="heading">
            {formatDate(editor.effectiveFrom, i18n.language as Language)}
          </Text>
        </Pressable>
      </View>

      <Button label={onboarding ? t('schedule.finish') : t('schedule.save')} onPress={save} />
    </>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  steps: { flexDirection: 'row', gap: 6 },
  step: { height: 6, borderRadius: 3 },
  stepDone: { width: 20, backgroundColor: colors.track },
  stepCurrent: { width: 32, backgroundColor: colors.ink },
  intro: { gap: spacing.xs, paddingHorizontal: spacing.xs },
  days: { paddingVertical: spacing.sm, gap: 0 },
  dayRow: { height: 54, flexDirection: 'row', alignItems: 'center' },
  dayName: { flex: 1 },
  stepper: { width: 170 },
  summary: { flexDirection: 'row', gap: 10 },
  summaryTile: { flex: 1, borderRadius: radius.md, gap: 2 },
  dateTile: {
    flex: 1,
    borderRadius: radius.md,
    padding: 18,
    gap: 2,
    backgroundColor: colors.surface,
  },
});
