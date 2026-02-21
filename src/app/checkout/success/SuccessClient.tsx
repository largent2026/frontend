'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { LocaleLink } from '@/components/LocaleLink';
import { checkoutApi, type Order } from '@/lib/api';
import { formatPrice } from '@/lib/utils';

export function SuccessClient() {
  const { t } = useTranslation();
  const params = useSearchParams();
  const orderNumber = params.get('orderNumber');

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (!orderNumber) {
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const res = await checkoutApi.getOrder(orderNumber);
        if (!cancelled) setOrder(res.order);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Erreur commande');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [orderNumber]);

  return (
    <div className="rounded-2xl border border-border p-6">
      <h1 className="text-2xl font-semibold tracking-tight">{t('checkout.successTitle')}</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        {orderNumber ? t('checkout.successMessage') : 'Paiement terminé. Si tu ne vois pas ta commande, vérifie ton email.'}
      </p>

      {loading ? (
        <p className="mt-4 text-sm text-muted-foreground">Chargement…</p>
      ) : error ? (
        <p className="mt-4 text-sm text-red-600">{error}</p>
      ) : order ? (
        <div className="mt-5 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">{t('checkout.orderNumber')}</span>
            <span className="font-medium">{order.orderNumber}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">{t('checkout.status')}</span>
            <span className="font-medium">{order.status}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Total</span>
            <span className="font-medium tabular-nums">{formatPrice(order.total, order.currency)}</span>
          </div>
        </div>
      ) : (
        <p className="mt-4 text-sm text-muted-foreground">Commande introuvable.</p>
      )}

      <div className="mt-6 flex flex-col gap-2 sm:flex-row">
        {orderNumber && (
          <LocaleLink
            href={`/compte/commandes/${orderNumber}`}
            className="inline-flex h-11 items-center justify-center rounded-full bg-foreground px-6 text-sm font-medium text-background"
          >
            {t('checkout.viewOrder')}
          </LocaleLink>
        )}
        <LocaleLink
          href="/produits"
          className="inline-flex h-11 items-center justify-center rounded-full border border-border px-6 text-sm font-medium"
        >
          {t('common.backToProducts')}
        </LocaleLink>
        <LocaleLink href="/panier" className="inline-flex h-11 items-center justify-center rounded-full border border-border px-6 text-sm font-medium">
          {t('common.viewCart')}
        </LocaleLink>
      </div>
    </div>
  );
}

