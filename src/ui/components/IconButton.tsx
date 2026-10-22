import { Pressable, StyleSheet } from 'react-native';

import { Icon, type IconName } from '@/ui/components/Icon';
import { colors, touchTarget } from '@/ui/theme/tokens';

type Props = {
  icon: IconName;
  /** Read by screen readers; required because the button has no visible text. */
  accessibilityLabel: string;
  onPress: () => void;
  /** Circle colour; white by default. */
  background?: string;
  size?: number;
};

/** Round icon-only button. */
export function IconButton({
  icon,
  accessibilityLabel,
  onPress,
  background = colors.surface,
  size = touchTarget,
}: Props) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      hitSlop={Math.max(0, (touchTarget - size) / 2)}
      style={({ pressed }) => [
        styles.button,
        { width: size, height: size, borderRadius: size / 2, backgroundColor: background },
        pressed && styles.pressed,
      ]}
    >
      <Icon name={icon} size={Math.round(size * 0.42)} strokeWidth={2.4} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: { alignItems: 'center', justifyContent: 'center' },
  pressed: { opacity: 0.7 },
});
