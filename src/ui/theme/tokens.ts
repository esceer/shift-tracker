import type { TextStyle } from 'react-native';

import { fonts } from './fonts';

export const colors = {
  background: '#F7F6FB',
  surface: '#FFFFFF',
  surfaceMuted: '#F0EEF6',
  ink: '#1B1A2E',
  inkMuted: '#4A4860',
  /** Icons and decorative text only (3.5:1 on white). */
  inkSubtle: '#8A879C',
  onInk: '#FFFFFF',
  divider: '#F0EEF6',
  /** Overtime chip on Home (white text on it). */
  overtime: '#C5221F',
  /** Inactive progress/step indicator. */
  track: '#D9D6E3',
} as const;

/** Pastel tile colours. Dark ink text works on all of them. */
export const tints = {
  lavender: '#E4DDFF',
  sky: '#D6E6FF',
  peach: '#FFDCC7',
  mint: '#CDEFDC',
  butter: '#FFE7A8',
  pink: '#FFD6E8',
  /** Overtime days. */
  red: '#FFB4AB',
  /** Sick days. */
  orange: '#FFCF9E',
} as const;

export type Tint = keyof typeof tints;

export const radius = { sm: 14, md: 22, lg: 30, pill: 999 } as const;

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 } as const;

/** Minimum touch target size. */
export const touchTarget = 44;

export const typography = {
  hero: { fontFamily: fonts.displayExtraBold, fontSize: 64, lineHeight: 64, letterSpacing: -2 },
  display: { fontFamily: fonts.displayExtraBold, fontSize: 40, lineHeight: 42, letterSpacing: -1 },
  title: { fontFamily: fonts.displayExtraBold, fontSize: 28, lineHeight: 32, letterSpacing: -0.5 },
  heading: { fontFamily: fonts.displayBold, fontSize: 19, lineHeight: 24 },
  body: { fontFamily: fonts.bodyMedium, fontSize: 16, lineHeight: 22 },
  bodyStrong: { fontFamily: fonts.bodySemiBold, fontSize: 16, lineHeight: 22 },
  label: { fontFamily: fonts.bodySemiBold, fontSize: 13, lineHeight: 18 },
  caption: { fontFamily: fonts.bodySemiBold, fontSize: 12, lineHeight: 16 },
  button: { fontFamily: fonts.bodyBold, fontSize: 16, lineHeight: 20 },
} as const satisfies Record<string, TextStyle>;

export type TypographyVariant = keyof typeof typography;
