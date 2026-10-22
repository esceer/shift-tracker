import { Pressable, StyleSheet } from 'react-native';

import { Icon, type IconName } from '@/ui/components/Icon';
import { Text } from '@/ui/components/Text';
import { colors, spacing } from '@/ui/theme/tokens';

type Props = {
  label: string;
  onPress: () => void;
  /** Current value shown on the right, e.g. "English". */
  value?: string;
  /** Trailing icon; a chevron by default. */
  icon?: IconName;
};

/** Tappable row inside a white list tile (Settings). */
export function ListRow({ label, onPress, value, icon = 'chevronRight' }: Props) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={value ? `${label}, ${value}` : label}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
    >
      <Text variant="bodyStrong" style={styles.label}>
        {label}
      </Text>
      {value && <Text color={colors.inkMuted}>{value}</Text>}
      <Icon name={icon} size={18} color={colors.inkSubtle} strokeWidth={2.2} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: 54,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  label: { flex: 1 },
  pressed: { backgroundColor: colors.surfaceMuted },
});
