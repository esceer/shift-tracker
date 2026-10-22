import { useTranslation } from 'react-i18next';

import { Screen } from '@/ui/components/Screen';
import { Text } from '@/ui/components/Text';
import { colors } from '@/ui/theme/tokens';

type Props = { title: string };

/** Temporary screen body until the real feature screen is built. */
export function PlaceholderScreen({ title }: Props) {
  const { t } = useTranslation();
  return (
    <Screen withTabBar>
      <Text variant="display">{title}</Text>
      <Text color={colors.inkMuted}>{t('common.comingSoon')}</Text>
    </Screen>
  );
}
