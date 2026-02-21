'use client';

import { useLocaleContext } from '@/contexts/LocaleContext';
import { locales, localeNames, localeFlags } from '@/i18n/config';
import type { Locale } from '@/i18n/config';

export function LanguageSelector() {
  const { locale, setLocale } = useLocaleContext();

  return (
    <div className="relative group">
      <button
        type="button"
        className="flex items-center gap-1.5 rounded-lg border border-border bg-background px-2.5 py-1.5 text-sm text-muted-foreground hover:text-foreground"
        aria-label="Changer la langue"
      >
        <span aria-hidden>{localeFlags[locale]}</span>
        <span className="hidden sm:inline">{localeNames[locale]}</span>
        <svg className="h-4 w-4 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      <div className="absolute right-0 top-full z-50 mt-1 hidden min-w-[10rem] rounded-lg border border-border bg-background py-1 shadow-lg group-hover:block">
        {locales.map((l) => (
          <button
            key={l}
            type="button"
            onClick={() => setLocale(l as Locale)}
            className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-muted ${
              l === locale ? 'font-medium text-foreground' : 'text-muted-foreground'
            }`}
          >
            <span>{localeFlags[l as Locale]}</span>
            <span>{localeNames[l as Locale]}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
