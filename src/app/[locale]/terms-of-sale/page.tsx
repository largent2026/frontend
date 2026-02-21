import { LegalTextPage, LegalContent } from '@/components/legal/LegalTextPage';
import { getTranslations } from '@/i18n/server';
import type { Locale } from '@/i18n/config';

export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = getTranslations(locale as Locale);
  return {
    title: t('termsOfSale.seoTitle'),
    description: t('termsOfSale.seoDescription'),
    alternates: {
      canonical: `/${locale}/terms-of-sale`,
      languages: Object.fromEntries(
        (['fr', 'en', 'de'] as const).map((l) => [l, `/${l}/terms-of-sale`])
      ),
    },
  };
}

export default async function TermsOfSalePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = getTranslations(locale as Locale);
  return (
    <LegalTextPage title={t('termsOfSale.title')}>
      <LegalContent content={t('termsOfSale.content')} />
    </LegalTextPage>
  );
}
