import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';

import type { DayInfo } from '@/domain/types';
import type { Language } from '@/i18n/language';
import { formatDate, formatDurationCompact } from '@/lib/format';
import { Icon } from '@/ui/components/Icon';
import { Text } from '@/ui/components/Text';
import { dayTint, kindIcon } from '@/ui/theme/entryStyle';
import { colors, tints, type Tint } from '@/ui/theme/tokens';

type Props = {
  day: DayInfo;
  /** Day number or weekday shown on top. */
  label: string;
  onPress: () => void;
  today?: boolean;
  selected?: boolean;
  height?: number;
  /** Background instead of the entry's colour. */
  tint?: Tint;
  /** Shows a small dot in the corner (e.g. a swapped day). */
  marked?: boolean;
};

/**
 * One day in the week strip or month grid: scheduled hours, the change (+1:30 / −2h)
 * or an absence icon, coloured by kind.
 */
export function DayCell({
  day,
  label,
  onPress,
  today,
  selected,
  height = 54,
  tint = dayTint(day),
  marked,
}: Props) {
  const { t, i18n } = useTranslation();
  const absence = day.entry && day.entry.minutes === null ? day.entry.kind : undefined;
  const working = day.scheduledMinutes > 0;

  const background = today
    ? colors.ink
    : tint
      ? tints[tint]
      : working
        ? colors.surfaceMuted
        : 'transparent';
  const foreground = today ? colors.onInk : working || day.entry ? colors.ink : colors.inkSubtle;

  const value = day.entry
    ? absence
      ? t(`entryKind.${absence}`)
      : formatDurationCompact(day.deltaMinutes, t, { signed: true })
    : working
      ? formatDurationCompact(day.scheduledMinutes, t)
      : t('day.off');

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={`${formatDate(day.date, i18n.language as Language, 'dayTitle')}, ${value}`}
      style={[styles.cell, { height, backgroundColor: background }, selected && styles.selected]}
    >
      {marked && <View style={[styles.dot, { backgroundColor: foreground }]} />}
      <Text variant="bodyStrong" color={foreground} style={styles.label}>
        {label}
      </Text>
      {absence ? (
        <Icon name={kindIcon[absence]} size={14} color={foreground} strokeWidth={2.2} />
      ) : (
        <Text variant="caption" color={foreground} style={styles.value} numberOfLines={1}>
          {value}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  cell: { flex: 1, borderRadius: 14, alignItems: 'center', justifyContent: 'center', gap: 4 },
  selected: { borderWidth: 2, borderColor: colors.ink },
  label: { lineHeight: 18 },
  value: { fontSize: 10, lineHeight: 12 },
  dot: { position: 'absolute', top: 6, right: 6, width: 5, height: 5, borderRadius: 3 },
});
