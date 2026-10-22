import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { db } from '@/data/db';
import { setSetting } from '@/data/repositories/settingsRepository';
import { applyLanguage } from '@/i18n';
import type { Language } from '@/i18n/language';
import { Button } from '@/ui/components/Button';
import { Icon } from '@/ui/components/Icon';
import { Screen } from '@/ui/components/Screen';
import { SegmentedControl } from '@/ui/components/SegmentedControl';
import { Text } from '@/ui/components/Text';
import { Tile } from '@/ui/components/Tile';
import { colors, spacing, tints } from '@/ui/theme/tokens';

/** First launch, step 1: what the app does + language choice. */
export function WelcomeScreen() {
  const { t, i18n } = useTranslation();

  const chooseLanguage = (language: Language) => {
    setSetting(db, 'language', language);
    void applyLanguage(language);
  };

  return (
    <Screen>
      <Collage sampleLabel={t('welcome.sampleLabel')} />

      <View style={styles.copy}>
        <Text variant="title" style={styles.headline}>
          {t('welcome.title')}
        </Text>
        <Text color={colors.inkMuted}>{t('welcome.body')}</Text>
      </View>

      <View style={styles.language}>
        <Text variant="label" color={colors.inkMuted}>
          {t('language.label')}
        </Text>
        <SegmentedControl
          options={[
            { value: 'en', label: t('language.en') },
            { value: 'hu', label: t('language.hu') },
          ]}
          value={i18n.language as Language}
          onChange={chooseLanguage}
        />
      </View>

      <Button
        label={t('welcome.getStarted')}
        icon="arrowRight"
        onPress={() => router.push('/onboarding/schedule')}
      />
    </Screen>
  );
}

/** Decorative preview of the app's tiles. Hidden from screen readers. */
function Collage({ sampleLabel }: { sampleLabel: string }) {
  return (
    <View
      style={styles.collage}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <View style={styles.row}>
        <Tile tint="lavender" style={[styles.cell, { flex: 2 }]}>
          <Text variant="label" color={colors.inkMuted}>
            {sampleLabel}
          </Text>
          <Text variant="title">+2h 45m</Text>
        </Tile>
        <View style={[styles.iconCell, { backgroundColor: tints.peach }]}>
          <Icon name="clock" size={34} strokeWidth={1.8} />
        </View>
      </View>
      <View style={styles.row}>
        <View style={[styles.iconCell, { backgroundColor: tints.mint }]}>
          <Icon name="flag" size={30} strokeWidth={1.8} />
        </View>
        <Tile style={[styles.cell, styles.bars, { flex: 2 }]}>
          {[6, 40, 54, 54, 40, 6, 6].map((height, i) => (
            <View
              key={i}
              style={[
                styles.bar,
                {
                  height,
                  backgroundColor: [
                    colors.surfaceMuted,
                    tints.sky,
                    colors.ink,
                    tints.lavender,
                    tints.peach,
                    colors.surfaceMuted,
                    colors.surfaceMuted,
                  ][i],
                },
              ]}
            />
          ))}
        </Tile>
      </View>
      <View style={styles.row}>
        <View style={[styles.iconCell, { backgroundColor: tints.butter }]}>
          <Icon name="sun" size={32} strokeWidth={1.8} />
        </View>
        <View style={[styles.iconCell, { backgroundColor: tints.pink }]}>
          <Icon name="chart" size={32} strokeWidth={1.8} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  collage: { gap: 10, marginBottom: spacing.md },
  row: { flexDirection: 'row', gap: 10, height: 100 },
  cell: { flex: 1, borderRadius: 28, justifyContent: 'space-between' },
  iconCell: { flex: 1, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  bars: { flexDirection: 'row', alignItems: 'flex-end', gap: 5, paddingVertical: 14 },
  bar: { flex: 1, borderRadius: 8 },
  copy: { gap: spacing.sm, paddingHorizontal: spacing.xs },
  headline: { fontSize: 36, lineHeight: 40 },
  language: { gap: spacing.sm, marginTop: spacing.md },
});
