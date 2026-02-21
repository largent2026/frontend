import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { LocaleLink } from '@/components/LocaleLink';
import { legalApi } from '@/lib/api';
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
    title: t('legal.seoTitle'),
    description: t('legal.seoDescription'),
    alternates: {
      canonical: `/${locale}/legal`,
      languages: Object.fromEntries(
        (['fr', 'en', 'de'] as const).map((l) => [l, `/${l}/legal`])
      ),
    },
  };
}

function LegalSection({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  if (!value?.trim()) return null;
  return (
    <section className="mb-6">
      <h2 className="mb-1 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </h2>
      <p className="text-foreground">{value}</p>
    </section>
  );
}

export default async function LegalPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = getTranslations(locale as Locale);
  let legal: {
    companyName: string;
    legalForm: string;
    address: string;
    email: string;
    publicationManager: string;
    host: string;
    vatNumber: string;
    intellectualProperty: string;
    liability: string;
  } | null = null;
  try {
    const res = await legalApi.get(locale);
    legal = res.legal ?? null;
  } catch {
    // ignore
  }

  // Si pas de config en base, afficher des valeurs par défaut (i18n) pour voir le résultat sans seed
  const isEmpty = !legal || Object.values(legal).every((v) => !v?.trim());
  const displayLegal = isEmpty
    ? {
        companyName: t('legal.defaultCompanyName'),
        legalForm: t('legal.defaultLegalForm'),
        address: t('legal.defaultAddress'),
        email: t('legal.defaultEmail'),
        publicationManager: t('legal.defaultPublicationManager'),
        host: t('legal.defaultHost'),
        vatNumber: '',
        intellectualProperty: t('legal.defaultIntellectualProperty'),
        liability: t('legal.defaultLiability'),
      }
    : legal;

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-12 sm:px-6">
        <h1 className="mb-8 text-3xl font-semibold tracking-tight text-foreground">
          {t('legal.title')}
        </h1>
        {isEmpty && (
          <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
            <p>{t('legal.notConfigured')}</p>
            <p className="mt-1">{t('legal.configureInAdmin')}</p>
            <LocaleLink href="/contact" className="mt-2 inline-block text-primary underline hover:no-underline">
              {t('footer.contact')}
            </LocaleLink>
          </div>
        )}
        <div className="space-y-1">
          <LegalSection label={t('legal.companyName')} value={displayLegal.companyName} />
          <LegalSection label={t('legal.legalForm')} value={displayLegal.legalForm} />
          <LegalSection label={t('legal.address')} value={displayLegal.address} />
          <LegalSection label={t('legal.email')} value={displayLegal.email} />
          <LegalSection
            label={t('legal.publicationManager')}
            value={displayLegal.publicationManager}
          />
          <LegalSection label={t('legal.host')} value={displayLegal.host} />
          <LegalSection label={t('legal.vatNumber')} value={displayLegal.vatNumber} />
          <LegalSection
            label={t('legal.intellectualProperty')}
            value={displayLegal.intellectualProperty}
          />
          <LegalSection label={t('legal.liability')} value={displayLegal.liability} />
        </div>
      </main>
      <Footer />
    </div>
  );
}
