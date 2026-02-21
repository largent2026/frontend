'use client';

import { useTranslation } from 'react-i18next';
import { LocaleLink } from '@/components/LocaleLink';

export function NotFoundClient() {
  const { t } = useTranslation();
  return (
    <div className="text-center">
      <h1 className="text-4xl font-semibold">404</h1>
      <p className="mt-2 text-muted-foreground">Page non trouvée.</p>
      <LocaleLink href="/produits" className="mt-6 inline-block text-sm font-medium underline">
        {t('common.seeProducts')}
      </LocaleLink>
    </div>
  );
}
