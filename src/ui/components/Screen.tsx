import type { ReactNode } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { TAB_BAR_HEIGHT, TAB_BAR_OFFSET } from '@/ui/components/FloatingTabBar';
import { colors, spacing } from '@/ui/theme/tokens';

type Props = {
  children: ReactNode;
  /** Leaves room for the floating tab bar at the bottom. */
  withTabBar?: boolean;
};

/** Scrollable page with the app background and standard padding. */
export function Screen({ children, withTabBar = false }: Props) {
  const insets = useSafeAreaInsets();
  const bottom = withTabBar
    ? TAB_BAR_HEIGHT + TAB_BAR_OFFSET + insets.bottom + spacing.lg
    : insets.bottom + spacing.xl;

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: bottom }]}>
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: spacing.lg, paddingTop: spacing.xl, gap: spacing.md },
});
