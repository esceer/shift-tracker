import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { fonts } from '@/ui/theme/fonts';

type Props = { title: string };

/** Temporary screen body until the real feature screen is built. */
export function PlaceholderScreen({ title }: Props) {
  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.content}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>Coming soon</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F7F6FB' },
  content: { flex: 1, paddingHorizontal: 22, paddingTop: 24, gap: 4 },
  title: { fontFamily: fonts.displayExtraBold, fontSize: 40, color: '#1B1A2E' },
  subtitle: { fontFamily: fonts.bodyMedium, fontSize: 15, color: '#4A4860' },
});
