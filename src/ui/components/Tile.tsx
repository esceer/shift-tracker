import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { colors, radius, tints, type Tint } from '@/ui/theme/tokens';

type Props = {
  children: ReactNode;
  /** Pastel tint; white when omitted. */
  tint?: Tint;
  onPress?: () => void;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
};

/** Rounded Bento tile. Becomes a button when `onPress` is set. */
export function Tile({ children, tint, onPress, accessibilityLabel, style }: Props) {
  const tileStyle = [styles.tile, { backgroundColor: tint ? tints[tint] : colors.surface }, style];

  if (!onPress) return <View style={tileStyle}>{children}</View>;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={({ pressed }) => [tileStyle, pressed && styles.pressed]}
    >
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tile: { borderRadius: radius.lg, padding: 18, gap: 12 },
  pressed: { opacity: 0.85 },
});
