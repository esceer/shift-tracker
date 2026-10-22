import { Text as RNText, type TextProps } from 'react-native';

import { colors, typography, type TypographyVariant } from '@/ui/theme/tokens';

type Props = TextProps & {
  variant?: TypographyVariant;
  color?: string;
};

/** Text in one of the Bento type styles. */
export function Text({ variant = 'body', color = colors.ink, style, ...rest }: Props) {
  return <RNText {...rest} style={[typography[variant], { color }, style]} />;
}
