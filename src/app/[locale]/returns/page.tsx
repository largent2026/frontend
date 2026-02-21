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
    title: t('returns.seoTitle'),
    description: t('returns.seoDescription'),
    alternates: {
      canonical: `/${locale}/returns`,
      languages: Object.fromEntries(
        (['fr', 'en', 'de'] as const).map((l) => [l, `/${l}/returns`])
      ),
    },
  };
}

export default async function ReturnsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = getTranslations(locale as Locale);
  return (
    <LegalTextPage title={t('returns.title')}>
      <LegalContent content={t('returns.content')} />
    </LegalTextPage>
  );
}
