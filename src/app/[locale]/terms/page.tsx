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
    title: t('terms.seoTitle'),
    description: t('terms.seoDescription'),
    alternates: {
      canonical: `/${locale}/terms`,
      languages: Object.fromEntries(
        (['fr', 'en', 'de'] as const).map((l) => [l, `/${l}/terms`])
      ),
    },
  };
}

export default async function TermsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = getTranslations(locale as Locale);
  return (
    <LegalTextPage title={t('terms.title')}>
      <LegalContent content={t('terms.content')} />
    </LegalTextPage>
  );
}
