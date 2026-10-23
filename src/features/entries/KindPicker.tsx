import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';

import { Icon } from '@/ui/components/Icon';
import { Text } from '@/ui/components/Text';
import { kindIcon, kindTint } from '@/ui/theme/entryStyle';
import { colors, radius, tints } from '@/ui/theme/tokens';

import type { FormKind } from './entryForm';

const ROWS: FormKind[][] = [
  ['actual', 'vacation'],
  ['sick', 'holiday'],
];

type Props = { value: FormKind; onChange: (kind: FormKind) => void };

/** Pastel tiles for the entry kinds; the selected one turns dark. */
export function KindPicker({ value, onChange }: Props) {
  const { t } = useTranslation();

  return (
    <View style={styles.grid} accessibilityRole="radiogroup">
      {ROWS.map((row, rowIndex) => (
        <View key={rowIndex} style={styles.row}>
          {row.map((kind) => {
            const selected = kind === value;
            const color = selected ? colors.onInk : colors.ink;
            return (
              <Pressable
                key={kind}
                onPress={() => onChange(kind)}
                accessibilityRole="radio"
                accessibilityState={{ selected }}
                style={[
                  styles.tile,
                  { backgroundColor: selected ? colors.ink : tints[kindTint[kind]] },
                ]}
              >
                <Icon name={kindIcon[kind]} size={22} color={color} />
                <Text variant="button" color={color} numberOfLines={1}>
                  {t(`entryKind.${kind}`)}
                </Text>
              </Pressable>
            );
          })}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { gap: 8 },
  row: { flexDirection: 'row', gap: 8 },
  tile: {
    flex: 1,
    height: 60,
    borderRadius: radius.md,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
});
