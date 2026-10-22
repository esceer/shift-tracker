import type { BottomTabBarProps } from 'expo-router/tabs';
import { Fragment } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Icon } from '@/ui/components/Icon';
import { colors, radius } from '@/ui/theme/tokens';

export const TAB_BAR_HEIGHT = 72;
/** Gap between the bar and the bottom safe-area edge. */
export const TAB_BAR_OFFSET = 16;

type Props = BottomTabBarProps & {
  onAddPress: () => void;
  addLabel: string;
};

/** Floating pill tab bar with a central "+" action between the first and second half of the tabs. */
export function FloatingTabBar({
  state,
  descriptors,
  emitter,
  navigateToTab,
  insets,
  onAddPress,
  addLabel,
}: Props) {
  const middle = Math.ceil(state.routes.length / 2);

  return (
    <View style={[styles.bar, { bottom: insets.bottom + TAB_BAR_OFFSET }]}>
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key]!;
        const focused = state.index === index;
        const color = focused ? colors.ink : colors.inkSubtle;

        const onPress = () => {
          const event = emitter.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });
          if (!focused && !event.defaultPrevented) navigateToTab(route.key);
        };

        return (
          <Fragment key={route.key}>
            {index === middle && (
              <Pressable
                onPress={onAddPress}
                accessibilityRole="button"
                accessibilityLabel={addLabel}
                style={({ pressed }) => [styles.add, pressed && styles.pressed]}
              >
                <Icon name="plus" size={26} color={colors.onInk} strokeWidth={2.6} />
              </Pressable>
            )}
            <Pressable
              onPress={onPress}
              accessibilityRole="tab"
              accessibilityState={{ selected: focused }}
              accessibilityLabel={options.title}
              style={styles.tab}
            >
              {options.tabBarIcon?.({ focused, color, size: 24 })}
            </Pressable>
          </Fragment>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    position: 'absolute',
    left: 16,
    right: 16,
    height: TAB_BAR_HEIGHT,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    shadowColor: colors.ink,
    shadowOpacity: 0.1,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  tab: { flex: 1, height: 48, alignItems: 'center', justifyContent: 'center' },
  add: {
    width: 56,
    height: 56,
    marginHorizontal: 8,
    borderRadius: 28,
    backgroundColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { opacity: 0.85 },
});
