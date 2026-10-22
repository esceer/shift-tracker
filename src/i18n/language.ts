export const supportedLanguages = ['en', 'hu'] as const;
export type Language = (typeof supportedLanguages)[number];

/** The user's choice wins; otherwise the device language if supported; otherwise English. */
export function resolveLanguage(
  preference: Language | null,
  deviceLanguageCode: string | null | undefined,
): Language {
  if (preference) return preference;
  return deviceLanguageCode === 'hu' ? 'hu' : 'en';
}
