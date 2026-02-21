import { notFound } from 'next/navigation';
import { locales, isValidLocale } from '@/i18n/config';
import { LocaleProvider } from '@/contexts/LocaleContext';
import { I18nAndLang } from '@/components/I18nAndLang';
import { Chatbot } from '@/components/chat/Chatbot';
import { CookieBanner } from '@/components/cookies/CookieBanner';

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isValidLocale(locale)) return {};
  const titles: Record<string, string> = {
    fr: 'Dyson Reconditionnés | Aspirateurs & soin premium',
    en: 'Refurbished Dyson | Vacuums & premium care',
    de: 'Dyson Generalüberholt | Staubsauger & Premium-Pflege',
  };
  const descriptions: Record<string, string> = {
    fr: 'Dyson reconditionnés garantis. Performance et design premium à prix réduits.',
    en: 'Guaranteed refurbished Dyson. Premium performance and design at reduced prices.',
    de: 'Garantierte generalüberholte Dyson. Premium-Leistung und Design zu reduzierten Preisen.',
  };
  return {
    title: titles[locale] ?? titles.fr,
    description: descriptions[locale] ?? descriptions.fr,
    alternates: {
      canonical: `/${locale}`,
      languages: Object.fromEntries(locales.map((l) => [l, `/${l}`])),
    },
    openGraph: {
      title: titles[locale] ?? titles.fr,
      description: descriptions[locale] ?? descriptions.fr,
      locale: locale === 'fr' ? 'fr_CH' : locale === 'de' ? 'de_CH' : 'en_GB',
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();

  return (
    <LocaleProvider initialLocale={locale}>
      <I18nAndLang locale={locale} />
      {children}
      <Chatbot />
      <CookieBanner />
    </LocaleProvider>
  );
}
