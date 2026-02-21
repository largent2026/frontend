'use client';

import { useEffect } from 'react';
import { initI18n } from '@/i18n/client';
import type { Locale } from '@/i18n/config';

export function I18nAndLang({ locale }: { locale: Locale }) {
  initI18n(locale);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  return null;
}
