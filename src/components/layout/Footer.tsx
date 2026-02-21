'use client';

import { useTranslation } from 'react-i18next';
import { LocaleLink } from '@/components/LocaleLink';

export function Footer() {
  const { t } = useTranslation();
  const year = new Date().getFullYear();

  return (
    <footer className="mt-24 border-t border-border bg-muted/30">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {/* Section 1: À propos, Contact, FAQ */}
          <div>
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {t('footer.about')}
            </h3>
            <nav className="flex flex-col gap-2 text-sm">
              <LocaleLink href="/" className="text-muted-foreground hover:text-foreground">
                {t('home.title')}
              </LocaleLink>
              <LocaleLink href="/contact" className="text-muted-foreground hover:text-foreground">
                {t('footer.contact')}
              </LocaleLink>
              <LocaleLink href="/faq" className="text-muted-foreground hover:text-foreground">
                {t('footer.faq')}
              </LocaleLink>
            </nav>
          </div>

          {/* Section 2: Légal */}
          <div>
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {t('footer.legal')}
            </h3>
            <nav className="flex flex-col gap-2 text-sm">
              <LocaleLink href="/terms-of-sale" className="text-muted-foreground hover:text-foreground">
                {t('footer.termsOfSale')}
              </LocaleLink>
              <LocaleLink href="/privacy" className="text-muted-foreground hover:text-foreground">
                {t('footer.privacy')}
              </LocaleLink>
              <LocaleLink href="/legal" className="text-muted-foreground hover:text-foreground">
                {t('footer.legal')}
              </LocaleLink>
              <LocaleLink href="/cookies" className="text-muted-foreground hover:text-foreground">
                {t('footer.cookies')}
              </LocaleLink>
              <LocaleLink href="/returns" className="text-muted-foreground hover:text-foreground">
                {t('footer.returns')}
              </LocaleLink>
              <LocaleLink href="/terms" className="text-muted-foreground hover:text-foreground">
                {t('footer.terms')}
              </LocaleLink>
            </nav>
          </div>

          {/* Section 3: Paiement (texte, pas de logos pour rester minimaliste) */}
          <div>
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {t('footer.payments')}
            </h3>
            <p className="text-sm text-muted-foreground">
              {t('footer.paymentsNote')}
            </p>
          </div>
        </div>

        <div className="mt-10 border-t border-border pt-6 text-center text-sm text-muted-foreground">
          {t('footer.copyright', { year: String(year) })}
        </div>
      </div>
    </footer>
  );
}
