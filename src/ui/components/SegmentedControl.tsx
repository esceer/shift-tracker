import { Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@/ui/components/Text';
import { colors, radius } from '@/ui/theme/tokens';

type Option<T extends string> = { value: T; label: string };

type Props<T extends string> = {
  options: readonly Option<T>[];
  value: T;
  onChange: (value: T) => void;
  /** Background behind the segments; white by default. */
  background?: string;
};

/** Pill switch between a few options (e.g. Month / Quarter). */
export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  background = colors.surface,
}: Props<T>) {
  return (
    <View
      style={[styles.container, { backgroundColor: background }]}
      accessibilityRole="radiogroup"
    >
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            onPress={() => onChange(option.value)}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            style={[styles.segment, selected && styles.selected]}
          >
            <Text variant="button" color={selected ? colors.onInk : colors.ink}>
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', borderRadius: radius.md, padding: 4 },
  segment: {
    flex: 1,
    height: 44,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selected: { backgroundColor: colors.ink },
});
