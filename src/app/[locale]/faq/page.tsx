import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { FaqClient } from './FaqClient';
import { faqApi } from '@/lib/api';
import { getTranslations } from '@/i18n/server';
import type { Locale } from '@/i18n/config';

export const dynamic = 'force-dynamic';
export const revalidate = 60;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = getTranslations(locale as Locale);
  return {
    title: t('faq.seoTitle'),
    description: t('faq.seoDescription'),
    alternates: {
      canonical: `/${locale}/faq`,
      languages: Object.fromEntries(
        (['fr', 'en', 'de'] as const).map((l) => [l, `/${l}/faq`])
      ),
    },
  };
}

export default async function FaqPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = getTranslations(locale as Locale);
  let faq: { id: string | null; q: string; a: string; category?: string; slug?: string; order?: number }[] = [];
  try {
    const res = await faqApi.list(locale);
    faq = res.faq ?? [];
  } catch {
    // Fallback empty
  }

  const faqPageSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faq.map((item) => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.a,
      },
    })),
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqPageSchema) }}
      />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-12 sm:px-6">
        <h1 className="mb-2 text-3xl font-semibold tracking-tight text-foreground">
          {t('faq.title')}
        </h1>
        <p className="mb-8 text-muted-foreground">
          {t('faq.description')}
        </p>
        <FaqClient initialFaq={faq} />
      </main>
      <Footer />
    </div>
  );
}
