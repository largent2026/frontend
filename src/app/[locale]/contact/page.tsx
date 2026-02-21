import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { ContactForm } from './ContactForm';
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
    title: t('contact.seoTitle'),
    description: t('contact.seoDescription'),
    alternates: {
      canonical: `/${locale}/contact`,
      languages: Object.fromEntries(
        (['fr', 'en', 'de'] as const).map((l) => [l, `/${l}/contact`])
      ),
    },
  };
}

export default async function ContactPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = getTranslations(locale as Locale);
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="mx-auto w-full max-w-xl flex-1 px-4 py-12 sm:px-6">
        <h1 className="mb-2 text-3xl font-semibold tracking-tight text-foreground">
          {t('contact.title')}
        </h1>
        <p className="mb-8 text-muted-foreground">
          {t('contact.description')}
        </p>
        <ContactForm />
      </main>
      <Footer />
    </div>
  );
}
