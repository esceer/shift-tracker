import { router, Tabs } from 'expo-router';
import { useTranslation } from 'react-i18next';
import type { ColorValue } from 'react-native';

import { toISODate } from '@/domain/dates';
import { FloatingTabBar } from '@/ui/components/FloatingTabBar';
import { Icon, type IconName } from '@/ui/components/Icon';

function tabIcon(name: IconName) {
  return function TabIcon({ color, focused }: { color: ColorValue; focused: boolean }) {
    return <Icon name={name} color={color} strokeWidth={focused ? 2.4 : 2} />;
  };
}

export default function TabsLayout() {
  const { t } = useTranslation();

  return (
    <Tabs
      screenOptions={{ headerShown: false }}
      tabBar={(props) => (
        <FloatingTabBar
          {...props}
          addLabel={t('tabs.addChange')}
          onAddPress={() =>
            router.push({ pathname: '/entry/[date]', params: { date: toISODate(new Date()) } })
          }
        />
      )}
    >
      <Tabs.Screen name="index" options={{ title: t('tabs.home'), tabBarIcon: tabIcon('home') }} />
      <Tabs.Screen
        name="calendar"
        options={{ title: t('tabs.calendar'), tabBarIcon: tabIcon('calendar') }}
      />
      <Tabs.Screen
        name="reports"
        options={{ title: t('tabs.reports'), tabBarIcon: tabIcon('chart') }}
      />
      <Tabs.Screen
        name="settings"
        options={{ title: t('tabs.settings'), tabBarIcon: tabIcon('settings') }}
      />
    </Tabs>
  );
}
