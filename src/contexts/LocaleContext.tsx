'use client';

import { createContext, useContext, useCallback, useMemo } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { COOKIE_LOCALE, COOKIE_MAX_AGE, locales, defaultLocale, isValidLocale } from '@/i18n/config';
import type { Locale } from '@/i18n/config';

type LocaleContextValue = {
  locale: Locale;
  setLocale: (next: Locale) => void;
  pathWithoutLocale: string;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function useLocale(): Locale {
  const ctx = useContext(LocaleContext);
  if (!ctx) return defaultLocale;
  return ctx.locale;
}

export function useLocaleContext(): LocaleContextValue {
  const ctx = useContext(LocaleContext);
  if (!ctx) {
    return {
      locale: defaultLocale,
      setLocale: () => {},
      pathWithoutLocale: '/',
    };
  }
  return ctx;
}

export function LocaleProvider({
  children,
  initialLocale,
}: {
  children: React.ReactNode;
  initialLocale: Locale;
}) {
  const pathname = usePathname();
  const router = useRouter();

  const locale = useMemo((): Locale => {
    const segment = pathname?.split('/')[1];
    return segment && isValidLocale(segment) ? segment : initialLocale;
  }, [pathname, initialLocale]);

  const pathWithoutLocale = useMemo(() => {
    if (!pathname) return '/';
    const segments = pathname.split('/').filter(Boolean);
    if (segments.length > 0 && isValidLocale(segments[0])) {
      return '/' + segments.slice(1).join('/') || '';
    }
    return pathname;
  }, [pathname]);

  const setLocale = useCallback(
    (next: Locale) => {
      if (next === locale) return;
      document.cookie = `${COOKIE_LOCALE}=${next}; path=/; max-age=${COOKIE_MAX_AGE}; SameSite=Lax`;
      const base = pathWithoutLocale || '/';
      router.push(`/${next}${base}`);
    },
    [locale, pathWithoutLocale, router]
  );

  const value = useMemo<LocaleContextValue>(
    () => ({ locale, setLocale, pathWithoutLocale }),
    [locale, setLocale, pathWithoutLocale]
  );

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}
