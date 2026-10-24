import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';

import { db, useDatabaseMigrations } from '@/data/db';
import { fetchHungarianHolidays } from '@/data/holidays/nagerClient';
import { fetchHungarianWorkdaySwaps } from '@/data/holidays/swapClient';
import { autoSyncHolidays } from '@/data/holidays/syncHolidays';
import { getSettings } from '@/data/repositories/settingsRepository';
import { applyLanguage } from '@/i18n';
import { fontAssets } from '@/ui/theme/fonts';
import { colors } from '@/ui/theme/tokens';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts(fontAssets);
  const migrations = useDatabaseMigrations();
  const [languageReady, setLanguageReady] = useState(false);

  useEffect(() => {
    if (migrations.success) {
      applyLanguage(getSettings(db).language).finally(() => setLanguageReady(true));
      void autoSyncHolidays(db, fetchHungarianHolidays, fetchHungarianWorkdaySwaps, new Date());
    }
  }, [migrations.success]);

  const fontsReady = fontsLoaded || !!fontError;
  const ready = fontsReady && (languageReady || !!migrations.error);

  useEffect(() => {
    if (ready) {
      SplashScreen.hideAsync();
    }
  }, [ready]);

  if (!ready) {
    return null;
  }

  if (migrations.error) {
    // Unrecoverable: the app cannot work without its database.
    return (
      <View style={{ flex: 1, justifyContent: 'center', padding: 24 }}>
        <Text>Database error: {migrations.error.message}</Text>
      </View>
    );
  }

  return (
    <>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}
      >
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="entry/[date]" options={{ presentation: 'modal' }} />
      </Stack>
    </>
  );
}
