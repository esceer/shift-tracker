import { useState } from 'react';
import { Platform, Pressable, StyleSheet, TextInput, View } from 'react-native';

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

  // −/+ closes the text field, so the stepped value is visible.
  const step = (handler: () => void) => {
    setDraft(undefined);
    handler();
  };

  const label = (
    <Text
      variant={variant}
      color={valueColor}
      style={[styles.value, styles.label]}
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
        onPress={() => step(onDecrement)}
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
          // Starts empty so typing replaces the value; leaving it empty keeps it.
          placeholder={toClock(minutes ?? 0)}
          placeholderTextColor={colors.inkSubtle}
          // Android's number pad has no ':' but takes "7,5"; iOS's keypad has both.
          keyboardType={Platform.OS === 'ios' ? 'numbers-and-punctuation' : 'decimal-pad'}
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
          onPress={() => setDraft('')}
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
        onPress={() => step(onIncrement)}
        background={buttonBackground}
        size={buttonSize}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  value: { flex: 1, textAlign: 'center' },
  // The text box fills the button height; keep the glyphs in its middle (Android).
  label: { textAlignVertical: 'center', includeFontPadding: false },
  input: {
    color: colors.ink,
    borderRadius: radius.sm,
    paddingVertical: spacing.xs,
  },
});
