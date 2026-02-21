import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { LegalContent } from '@/components/legal/LegalTextPage';
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
    title: t('cookies.seoTitle'),
    description: t('cookies.seoDescription'),
    alternates: {
      canonical: `/${locale}/cookies`,
      languages: Object.fromEntries(
        (['fr', 'en', 'de'] as const).map((l) => [l, `/${l}/cookies`])
      ),
    },
  };
}

export default async function CookiesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = getTranslations(locale as Locale);
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-12 sm:px-6">
        <h1 className="mb-8 text-3xl font-semibold tracking-tight text-foreground">
          {t('cookies.title')}
        </h1>
        <LegalContent content={t('cookies.content')} />
      </main>
      <Footer />
    </div>
  );
}
