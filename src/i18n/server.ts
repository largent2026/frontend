import type { Locale } from './config';
import fr from './locales/fr.json';
import en from './locales/en.json';
import de from './locales/de.json';

const resources: Record<Locale, Record<string, unknown>> = {
  fr: fr as Record<string, unknown>,
  en: en as Record<string, unknown>,
  de: de as Record<string, unknown>,
};

function getNested(obj: Record<string, unknown>, path: string): unknown {
  const keys = path.split('.');
  let current: unknown = obj;
  for (const key of keys) {
    if (current == null || typeof current !== 'object') return undefined;
    current = (current as Record<string, unknown>)[key];
  }
  return current;
}

export function getTranslations(locale: Locale) {
  const dict = resources[locale] ?? resources.fr;
  return function t(path: string, vars?: Record<string, string | number>): string {
    let value = getNested(dict, path);
    if (typeof value !== 'string') value = getNested(resources.fr as Record<string, unknown>, path);
    let str = (typeof value === 'string' ? value : path) as string;
    if (vars) {
      Object.entries(vars).forEach(([k, v]) => {
        str = str.replace(new RegExp(`{{${k}}}`, 'g'), String(v));
      });
    }
    return str;
  };
}
