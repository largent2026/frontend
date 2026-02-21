'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useCookieConsent } from '@/contexts/CookieConsentContext';
import { LocaleLink } from '@/components/LocaleLink';

export function CookieBanner() {
  const { t } = useTranslation();
  const { setConsent, showBanner } = useCookieConsent();
  const [customize, setCustomize] = useState(false);
  const [custom, setCustom] = useState({ analytics: false, marketing: false });

  if (!showBanner) return null;

  const handleAcceptAll = () => {
    setConsent({ necessary: true, analytics: true, marketing: true });
  };

  const handleNecessaryOnly = () => {
    setConsent({ necessary: true, analytics: false, marketing: false });
  };

  const handleSaveCustom = () => {
    setConsent({ necessary: true, analytics: custom.analytics, marketing: custom.marketing });
    setCustomize(false);
  };

  return (
    <div
      role="dialog"
      aria-label={t('cookies.bannerTitle')}
      className="fixed bottom-0 left-0 right-0 z-[100] border-t border-border bg-background/95 p-4 shadow-lg backdrop-blur sm:left-4 sm:right-4 sm:bottom-4 sm:max-w-lg sm:rounded-xl"
    >
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-foreground">
          {t('cookies.bannerTitle')}
        </h3>
        <p className="text-sm text-muted-foreground">
          {t('cookies.bannerDescription')}
        </p>
        {!customize ? (
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleAcceptAll}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
            >
              {t('cookies.acceptAll')}
            </button>
            <button
              type="button"
              onClick={handleNecessaryOnly}
              className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted"
            >
              {t('cookies.necessaryOnly')}
            </button>
            <button
              type="button"
              onClick={() => setCustomize(true)}
              className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted"
            >
              {t('cookies.customize')}
            </button>
            <LocaleLink href="/cookies" className="rounded-lg px-4 py-2 text-sm text-muted-foreground underline hover:text-foreground">
              {t('cookies.title')}
            </LocaleLink>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span>{t('cookies.necessary')}</span>
              <span className="text-muted-foreground">—</span>
            </div>
            <label className="flex items-center justify-between gap-4 text-sm">
              <span>{t('cookies.analytics')}</span>
              <input
                type="checkbox"
                checked={custom.analytics}
                onChange={(e) => setCustom((c) => ({ ...c, analytics: e.target.checked }))}
                className="h-4 w-4 rounded border-border"
              />
            </label>
            <label className="flex items-center justify-between gap-4 text-sm">
              <span>{t('cookies.marketing')}</span>
              <input
                type="checkbox"
                checked={custom.marketing}
                onChange={(e) => setCustom((c) => ({ ...c, marketing: e.target.checked }))}
                className="h-4 w-4 rounded border-border"
              />
            </label>
            <div className="flex gap-2">
              <button type="button" onClick={handleSaveCustom} className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90">
                {t('cookies.save')}
              </button>
              <button type="button" onClick={() => setCustomize(false)} className="rounded-lg border border-border px-4 py-2 text-sm text-foreground hover:bg-muted">
                Annuler
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
