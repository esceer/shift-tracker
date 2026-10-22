import type { ColorValue } from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

import { colors } from '@/ui/theme/tokens';

const icons = {
  home: <Path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" />,
  calendar: (
    <>
      <Rect x={3} y={5} width={18} height={16} rx={3} />
      <Path d="M3 10h18M8 3v4M16 3v4" />
    </>
  ),
  chart: <Path d="M5 20V11M12 20V5M19 20v-6" />,
  settings: (
    <>
      <Path d="M4 7h10M18 7h2M4 17h4M12 17h8" />
      <Circle cx={16} cy={7} r={2} />
      <Circle cx={10} cy={17} r={2} />
    </>
  ),
  plus: <Path d="M12 5v14M5 12h14" />,
  minus: <Path d="M5 12h14" />,
  plusMinus: <Path d="M12 4v8M8 8h8M8 19h8" />,
  chevronLeft: <Path d="m15 18-6-6 6-6" />,
  chevronRight: <Path d="m9 18 6-6-6-6" />,
  chevronDown: <Path d="m6 9 6 6 6-6" />,
  arrowRight: <Path d="M5 12h14M13 6l6 6-6 6" />,
  close: <Path d="M6 6l12 12M18 6 6 18" />,
  clock: (
    <>
      <Circle cx={12} cy={12} r={9} />
      <Path d="M12 7v5l3 2" />
    </>
  ),
  flag: <Path d="M5 21V4M5 4h11l-2 4 2 4H5" />,
  sun: (
    <>
      <Circle cx={12} cy={12} r={4} />
      <Path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </>
  ),
  thermometer: <Path d="M14 14.8V5a2 2 0 0 0-4 0v9.8a4 4 0 1 0 4 0z" />,
  download: <Path d="M12 4v11M7 10l5 5 5-5M5 20h14" />,
  upload: <Path d="M12 15V4M7 9l5-5 5 5M5 20h14" />,
  sync: <Path d="M20 11a8 8 0 0 0-14.9-3M4 4v4h4M4 13a8 8 0 0 0 14.9 3M20 20v-4h-4" />,
} as const;

export type IconName = keyof typeof icons;

type Props = {
  name: IconName;
  size?: number;
  color?: ColorValue;
  strokeWidth?: number;
};

/** Stroke icon from the Bento icon set. Decorative: label the surrounding control instead. */
export function Icon({ name, size = 24, color = colors.ink, strokeWidth = 2 }: Props) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      accessible={false}
    >
      {icons[name]}
    </Svg>
  );
}
