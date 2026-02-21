'use client';

import { useTranslation } from 'react-i18next';
import { LocaleLink } from '@/components/LocaleLink';
import { RecommendedForYou } from '@/components/recommendations/RecommendedForYou';

export function HomeClient() {
  const { t } = useTranslation();
  return (
    <>
      <section className="mx-auto max-w-7xl px-4 py-24 text-center sm:px-6">
        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
          {t('home.title')}
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground">
          {t('home.subtitle')}
        </p>
        <LocaleLink
          href="/produits"
          className="mt-8 inline-block rounded-full bg-foreground px-8 py-3 text-sm font-medium text-background transition hover:opacity-90"
        >
          {t('common.seeProducts')}
        </LocaleLink>
      </section>
      <RecommendedForYou />
    </>
  );
}
