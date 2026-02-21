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
    title: t('privacy.seoTitle'),
    description: t('privacy.seoDescription'),
    alternates: {
      canonical: `/${locale}/privacy`,
      languages: Object.fromEntries(
        (['fr', 'en', 'de'] as const).map((l) => [l, `/${l}/privacy`])
      ),
    },
  };
}

export default async function PrivacyPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = getTranslations(locale as Locale);
  return (
    <LegalTextPage title={t('privacy.title')}>
      <LegalContent content={t('privacy.content')} />
    </LegalTextPage>
  );
}
