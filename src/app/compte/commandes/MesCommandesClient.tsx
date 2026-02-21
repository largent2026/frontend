'use client';

import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { LocaleLink } from '@/components/LocaleLink';
import { ordersApi, type Order } from '@/lib/api';
import { formatPrice } from '@/lib/utils';
import { OrderStatusBadge } from '@/components/orders/OrderStatusBadge';
import { getAccessToken } from '@/lib/auth';

export function MesCommandesClient() {
  const { t } = useTranslation();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const t = getAccessToken();
    setToken(t);
    if (!t) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await ordersApi.listMyOrders({}, t);
        if (!cancelled) setOrders(res.orders ?? []);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Erreur');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!token) {
    return (
      <div className="mt-8 rounded-2xl border border-border bg-muted/30 p-6 text-center">
        <p className="text-muted-foreground">
          Connectez-vous pour voir l’{t('orders.loginRequired')}
        </p>
        <LocaleLink
          href="/commandes/suivi"
          className="mt-4 inline-block font-medium text-primary underline underline-offset-4"
        >
          {t('orders.guestTrack')}
        </LocaleLink>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="mt-8 space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 rounded-xl border border-border skeleton" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="mt-8 rounded-2xl border border-red-200 bg-red-50 p-6 text-red-800 dark:border-red-900 dark:bg-red-950/30 dark:text-red-200">
        <p>{error}</p>
        <LocaleLink href="/commandes/suivi" className="mt-2 inline-block text-sm underline">
          {t('orders.guestTrack')}
        </LocaleLink>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="mt-8 rounded-2xl border border-border bg-muted/30 p-8 text-center">
        <p className="text-muted-foreground">{t('orders.noOrders')}</p>
        <LocaleLink
          href="/produits"
          className="mt-4 inline-flex items-center justify-center rounded-full bg-foreground px-6 py-2.5 text-sm font-medium text-background"
        >
          {t('common.seeProducts')}
        </LocaleLink>
      </div>
    );
  }

  return (
    <div className="mt-8 space-y-4">
      {orders.map((order) => (
        <LocaleLink
          key={order._id}
          href={`/compte/commandes/${order.orderNumber}`}
          className="block rounded-xl border border-border bg-card p-4 transition-colors hover:bg-muted/50 sm:p-5"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <span className="font-mono font-semibold">{order.orderNumber}</span>
              <span className="ml-2 text-sm text-muted-foreground">
                {order.createdAt
                  ? new Date(order.createdAt).toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })
                  : ''}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <OrderStatusBadge status={order.status} />
              <span className="tabular-nums font-medium">
                {formatPrice(order.total, order.currency)}
              </span>
            </div>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            {order.items?.length ?? 0} {t('orders.articles')}
          </p>
        </LocaleLink>
      ))}
      <p className="pt-4 text-center text-sm text-muted-foreground">
        <LocaleLink href="/commandes/suivi" className="underline underline-offset-4">
          {t('orders.guestTrack')}
        </LocaleLink>
      </p>
    </div>
  );
}
