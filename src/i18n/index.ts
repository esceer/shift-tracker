import { getLocales } from 'expo-localization';
import { createInstance } from 'i18next';
import { initReactI18next } from 'react-i18next';

import { resolveLanguage, type Language } from './language';
import en from './locales/en.json';
import hu from './locales/hu.json';

export const resources = {
  en: { translation: en },
  hu: { translation: hu },
} as const;

export const i18n = createInstance();

/** Starts i18n (first call) or switches language. `preference` null = follow the device. */
export async function applyLanguage(preference: Language | null): Promise<void> {
  const lng = resolveLanguage(preference, getLocales()[0]?.languageCode);
  if (i18n.isInitialized) {
    await i18n.changeLanguage(lng);
    return;
  }
  await i18n.use(initReactI18next).init({
    resources,
    lng,
    fallbackLng: 'en',
    interpolation: { escapeValue: false }, // React already escapes
  });
}
