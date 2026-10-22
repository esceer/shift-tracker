import { useTranslation } from 'react-i18next';

import { PlaceholderScreen } from '@/ui/components/PlaceholderScreen';

export function CalendarScreen() {
  const { t } = useTranslation();
  return <PlaceholderScreen title={t('tabs.calendar')} />;
}
