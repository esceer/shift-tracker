import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { Text, View } from 'react-native';

import { useDatabaseMigrations } from '@/data/db';
import { fontAssets } from '@/ui/theme/fonts';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts(fontAssets);
  const migrations = useDatabaseMigrations();

  const fontsReady = fontsLoaded || !!fontError;
  const dbReady = migrations.success || !!migrations.error;

  useEffect(() => {
    if (fontsReady && dbReady) {
      SplashScreen.hideAsync();
    }
  }, [fontsReady, dbReady]);

  if (!fontsReady || !dbReady) {
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
      <Stack screenOptions={{ headerShown: false }} />
    </>
  );
}
