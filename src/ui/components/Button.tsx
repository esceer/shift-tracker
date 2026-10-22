import { Pressable, StyleSheet, View } from 'react-native';

import { Icon, type IconName } from '@/ui/components/Icon';
import { Text } from '@/ui/components/Text';
import { colors, radius, spacing } from '@/ui/theme/tokens';

type Props = {
  label: string;
  onPress: () => void;
  /** `primary`: dark pill (main action). `secondary`: white pill. */
  variant?: 'primary' | 'secondary';
  icon?: IconName;
  disabled?: boolean;
};

export function Button({ label, onPress, variant = 'primary', icon, disabled = false }: Props) {
  const primary = variant === 'primary';
  const foreground = primary ? colors.onInk : colors.ink;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: primary ? colors.ink : colors.surface },
        (pressed || disabled) && { opacity: disabled ? 0.4 : 0.85 },
      ]}
    >
      <View style={styles.content}>
        {icon && <Icon name={icon} size={20} color={foreground} strokeWidth={2.2} />}
        <Text variant="button" color={foreground}>
          {label}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    height: 58,
    borderRadius: radius.pill,
    justifyContent: 'center',
    paddingHorizontal: 22,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
});
