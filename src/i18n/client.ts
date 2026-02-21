'use client';

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { locales, defaultLocale, isValidLocale, COOKIE_LOCALE } from './config';
import fr from './locales/fr.json';
import en from './locales/en.json';
import de from './locales/de.json';

const resources = {
  fr: { translation: fr },
  en: { translation: en },
  de: { translation: de },
};

const detectionOptions = {
  order: ['cookie', 'navigator', 'htmlTag'],
  lookupCookie: COOKIE_LOCALE,
  caches: ['cookie'],
  cookieOptions: { maxAge: 60 * 60 * 24 * 365, sameSite: 'lax' as const },
};

function normalizeLocale(lng: string): string {
  const lower = lng.toLowerCase().slice(0, 2);
  return isValidLocale(lower) ? lower : defaultLocale;
}

export function initI18n(locale?: string) {
  const lng = locale && isValidLocale(locale) ? locale : defaultLocale;
  if (i18n.isInitialized) {
    i18n.changeLanguage(lng);
    return i18n;
  }
  i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
      resources,
      lng,
      fallbackLng: defaultLocale,
      supportedLngs: [...locales],
      interpolation: { escapeValue: false },
      detection: detectionOptions,
    });
  return i18n;
}

export { locales, defaultLocale, isValidLocale };
export type { Locale } from './config';
