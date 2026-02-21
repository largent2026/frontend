'use client';

import { useTranslation } from 'react-i18next';
import { LocaleLink } from '@/components/LocaleLink';
import { CartTrigger } from '@/components/cart/CartTrigger';
import { LanguageSelector } from '@/components/LanguageSelector';

export function Header() {
  const { t } = useTranslation();
  return (
    <header className="sticky top-0 z-50 border-b border-border/80 bg-background/95 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6">
        <LocaleLink href="/" className="text-lg font-medium tracking-tight">
          Dyson Reconditionnés
        </LocaleLink>
        <nav className="flex items-center gap-3 text-sm text-muted-foreground sm:gap-4">
          <LocaleLink href="/produits" className="transition hover:text-foreground">
            {t('common.products')}
          </LocaleLink>
          <LocaleLink href="/compte/commandes" className="transition hover:text-foreground">
            {t('common.myOrders')}
          </LocaleLink>
          <LocaleLink href="/commandes/suivi" className="transition hover:text-foreground">
            {t('common.tracking')}
          </LocaleLink>
          <LanguageSelector />
          <CartTrigger />
        </nav>
      </div>
    </header>
  );
}
