import { getDocumentAsync } from 'expo-document-picker';
import { File, Paths } from 'expo-file-system';
import { shareAsync } from 'expo-sharing';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, StyleSheet, View } from 'react-native';

import { buildBackup, InvalidBackupError, restoreBackup } from '@/data/backup/backup';
import { db } from '@/data/db';
import { toISODate } from '@/domain/dates';
import { ListRow } from '@/ui/components/ListRow';
import { Text } from '@/ui/components/Text';
import { Tile } from '@/ui/components/Tile';
import { colors, spacing } from '@/ui/theme/tokens';

type Message = 'restored' | 'invalid' | 'failed' | null;

/** Export all data to a JSON file, or replace all data from one. */
export function BackupTile() {
  const { t } = useTranslation();
  const [message, setMessage] = useState<Message>(null);

  const exportBackup = async () => {
    setMessage(null);
    try {
      const now = new Date();
      const file = new File(Paths.cache, `tempo-backup-${toISODate(now)}.json`);
      file.create({ overwrite: true });
      await file.write(JSON.stringify(buildBackup(db, now), null, 2));
      await shareAsync(file.uri, { mimeType: 'application/json' });
    } catch {
      setMessage('failed');
    }
  };

  const restore = async () => {
    setMessage(null);
    const result = await getDocumentAsync({
      type: 'application/json',
      copyToCacheDirectory: false,
    });
    if (result.canceled) return;

    let json: unknown;
    try {
      json = JSON.parse(await new File(result.assets[0]!.uri).text());
    } catch {
      setMessage('invalid');
      return;
    }

    Alert.alert(t('backup.confirmTitle'), t('backup.confirmMessage'), [
      { text: t('backup.cancel'), style: 'cancel' },
      {
        text: t('backup.confirm'),
        style: 'destructive',
        onPress: () => {
          try {
            restoreBackup(db, json);
            setMessage('restored');
          } catch (error) {
            setMessage(error instanceof InvalidBackupError ? 'invalid' : 'failed');
          }
        },
      },
    ]);
  };

  return (
    <Tile style={styles.tile}>
      <View style={styles.header}>
        <Text variant="heading">{t('backup.title')}</Text>
        <Text variant="label" color={colors.inkMuted}>
          {t('backup.description')}
        </Text>
      </View>
      <ListRow label={t('backup.export')} icon="upload" onPress={exportBackup} />
      <View style={styles.divider} />
      <ListRow label={t('backup.restore')} icon="download" onPress={restore} />
      {message && (
        <Text variant="label" style={styles.message} accessibilityLiveRegion="polite">
          {t(`backup.${message}`)}
        </Text>
      )}
    </Tile>
  );
}

const styles = StyleSheet.create({
  tile: { paddingHorizontal: 0, gap: 0 },
  header: { paddingHorizontal: 20, paddingBottom: spacing.sm, gap: 2 },
  divider: { height: 1, backgroundColor: colors.divider, marginHorizontal: 20 },
  message: { paddingHorizontal: 20, paddingTop: spacing.sm },
});
