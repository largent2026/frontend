export const locales = ['fr', 'en', 'de'] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'fr';

export const localeNames: Record<Locale, string> = {
  fr: 'Français',
  en: 'English',
  de: 'Deutsch',
};

export const localeFlags: Record<Locale, string> = {
  fr: '🇫🇷',
  en: '🇬🇧',
  de: '🇩🇪',
};

export const COOKIE_LOCALE = 'NEXT_LOCALE';
export const COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 year

export function isValidLocale(value: string): value is Locale {
  return locales.includes(value as Locale);
}
