import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { SuiviClient } from '@/app/commandes/suivi/SuiviClient';
import { getTranslations } from '@/i18n/server';
import type { Locale } from '@/i18n/config';

export default async function SuiviPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = getTranslations(locale as Locale);
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-12 sm:px-6">
        <h1 className="text-2xl font-semibold tracking-tight">{t('orders.trackingTitle')}</h1>
        <p className="mt-1 text-muted-foreground">{t('orders.trackingDescription')}</p>
        <SuiviClient />
      </main>
      <Footer />
    </div>
  );
}
