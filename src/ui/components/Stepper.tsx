import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { parseDuration, toClock } from '@/domain/duration';
import type { Minutes } from '@/domain/types';
import { IconButton } from '@/ui/components/IconButton';
import { Text } from '@/ui/components/Text';
import { colors, radius, spacing, typography, type TypographyVariant } from '@/ui/theme/tokens';

type Props = {
  /** Already formatted value, e.g. "−2h 00m" or "Off". */
  valueLabel: string;
  onDecrement: () => void;
  onIncrement: () => void;
  decrementLabel: string;
  incrementLabel: string;
  variant?: TypographyVariant;
  valueColor?: string;
  buttonBackground?: string;
  buttonSize?: number;
  /** With `onChangeMinutes`: tapping the value lets the user type it ("7:30", "7,5"). */
  minutes?: Minutes;
  onChangeMinutes?: (minutes: Minutes) => void;
  editLabel?: string;
};

/** − value + control. Formatting and limits are the caller's job. */
export function Stepper({
  valueLabel,
  onDecrement,
  onIncrement,
  decrementLabel,
  incrementLabel,
  variant = 'heading',
  valueColor = colors.ink,
  buttonBackground = colors.surfaceMuted,
  buttonSize = 44,
  minutes,
  onChangeMinutes,
  editLabel,
}: Props) {
  // Typed text while editing; `undefined` shows the formatted value.
  const [draft, setDraft] = useState<string>();
  const editable = minutes !== undefined && onChangeMinutes !== undefined;

  const commit = () => {
    const parsed = parseDuration(draft ?? '');
    if (parsed !== null) onChangeMinutes?.(parsed);
    setDraft(undefined);
  };

  const label = (
    <Text
      variant={variant}
      color={valueColor}
      style={styles.value}
      numberOfLines={1}
      adjustsFontSizeToFit
      accessibilityLiveRegion="polite"
    >
      {valueLabel}
    </Text>
  );

  return (
    <View style={styles.row}>
      <IconButton
        icon="minus"
        accessibilityLabel={decrementLabel}
        onPress={onDecrement}
        background={buttonBackground}
        size={buttonSize}
      />
      {draft !== undefined ? (
        <TextInput
          value={draft}
          onChangeText={setDraft}
          onBlur={commit}
          onSubmitEditing={commit}
          autoFocus
          selectTextOnFocus
          keyboardType="numbers-and-punctuation"
          returnKeyType="done"
          accessibilityLabel={editLabel}
          style={[
            typography[variant],
            styles.value,
            styles.input,
            { backgroundColor: buttonBackground },
          ]}
        />
      ) : editable ? (
        <Pressable
          onPress={() => setDraft(toClock(minutes))}
          accessibilityRole="button"
          accessibilityLabel={editLabel ? `${editLabel}: ${valueLabel}` : valueLabel}
          style={styles.value}
        >
          {label}
        </Pressable>
      ) : (
        label
      )}
      <IconButton
        icon="plus"
        accessibilityLabel={incrementLabel}
        onPress={onIncrement}
        background={buttonBackground}
        size={buttonSize}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  value: { flex: 1, textAlign: 'center' },
  input: {
    color: colors.ink,
    borderRadius: radius.sm,
    paddingVertical: spacing.xs,
  },
});
