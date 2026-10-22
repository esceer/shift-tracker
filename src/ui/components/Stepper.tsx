import { StyleSheet, View } from 'react-native';

import { IconButton } from '@/ui/components/IconButton';
import { Text } from '@/ui/components/Text';
import { colors, spacing, type TypographyVariant } from '@/ui/theme/tokens';

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
}: Props) {
  return (
    <View style={styles.row}>
      <IconButton
        icon="minus"
        accessibilityLabel={decrementLabel}
        onPress={onDecrement}
        background={buttonBackground}
        size={buttonSize}
      />
      <Text
        variant={variant}
        color={valueColor}
        style={styles.value}
        accessibilityLiveRegion="polite"
      >
        {valueLabel}
      </Text>
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
});
