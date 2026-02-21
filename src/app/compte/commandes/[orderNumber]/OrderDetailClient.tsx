'use client';

import { useEffect, useState } from 'react';
import { LocaleLink } from '@/components/LocaleLink';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import { ordersApi, type OrderDetail } from '@/lib/api';
import { formatPrice } from '@/lib/utils';
import { useTranslation } from 'react-i18next';
import { getAccessToken } from '@/lib/auth';
import { OrderStatusBadge } from '@/components/orders/OrderStatusBadge';
import { OrderTimeline } from '@/components/orders/OrderTimeline';
import { TrackingBlock } from '@/components/orders/TrackingBlock';

interface OrderDetailClientProps {
  orderNumber: string;
}

export function OrderDetailClient({ orderNumber }: OrderDetailClientProps) {
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const guestEmail = searchParams.get('email');
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const token = getAccessToken();
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await ordersApi.getMyOrder(
          orderNumber,
          token ?? undefined,
          guestEmail ?? undefined
        );
        if (!cancelled) setOrder(res.order);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Commande introuvable');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [orderNumber, guestEmail]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 skeleton rounded" />
        <div className="h-64 skeleton rounded-xl" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="rounded-2xl border border-border bg-muted/30 p-8 text-center">
        <p className="text-muted-foreground">{error ?? 'Commande introuvable.'}</p>
        <LocaleLink href="/compte/commandes" className="mt-4 inline-block font-medium underline">
          {t('orders.backToOrders')}
        </LocaleLink>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Commande {order.orderNumber}
          </h1>
          <p className="mt-1 text-muted-foreground">
            {order.createdAt
              ? new Date(order.createdAt).toLocaleDateString('fr-FR', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })
              : ''}
          </p>
        </div>
        <OrderStatusBadge status={order.status} />
      </div>

      <section>
        <h2 className="mb-4 text-lg font-medium">Suivi de la commande</h2>
        <div className="rounded-xl border border-border bg-card p-6">
          <OrderTimeline
            statusHistory={order.statusHistory ?? null}
            currentStatus={order.status}
          />
        </div>
      </section>

      {order.shipments && order.shipments.length > 0 && (
        <section>
          <h2 className="mb-4 text-lg font-medium">Expéditions et suivi</h2>
          <div className="space-y-4">
            {order.shipments.map((shipment) => (
              <TrackingBlock key={shipment._id} shipment={shipment} />
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="mb-4 text-lg font-medium">Articles</h2>
        <ul className="space-y-3 rounded-xl border border-border bg-card p-4">
          {order.items?.map((item, i) => (
            <li key={i} className="flex gap-4 border-b border-border pb-3 last:border-0 last:pb-0">
              {item.imageUrl && (
                <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-md bg-muted">
                  <Image
                    src={item.imageUrl}
                    alt={item.name}
                    fill
                    className="object-cover"
                    sizes="64px"
                  />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="font-medium">{item.name}</p>
                <p className="text-sm text-muted-foreground">
                  Qté : {item.quantity} · {formatPrice(item.unitPrice, order.currency)} / u.
                </p>
              </div>
              <span className="tabular-nums font-medium">
                {formatPrice(item.totalPrice, order.currency)}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-xl border border-border bg-card p-6">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Sous-total</span>
          <span className="tabular-nums">{formatPrice(order.subtotal ?? order.total, order.currency)}</span>
        </div>
        {order.shippingCost != null && order.shippingCost > 0 && (
          <div className="mt-2 flex justify-between text-sm">
            <span className="text-muted-foreground">Livraison</span>
            <span className="tabular-nums">{formatPrice(order.shippingCost, order.currency)}</span>
          </div>
        )}
        {order.discount != null && order.discount > 0 && (
          <div className="mt-2 flex justify-between text-sm text-emerald-600">
            <span>Réduction</span>
            <span className="tabular-nums">-{formatPrice(order.discount, order.currency)}</span>
          </div>
        )}
        <div className="mt-4 flex justify-between border-t border-border pt-4 font-semibold">
          <span>Total</span>
          <span className="tabular-nums">{formatPrice(order.total, order.currency)}</span>
        </div>
      </section>

      <div className="flex flex-wrap gap-4">
        <LocaleLink
          href="/compte/commandes"
          className="inline-flex items-center justify-center rounded-full border border-border px-6 py-2.5 text-sm font-medium"
        >
          {t('orders.backToOrders')}
        </LocaleLink>
        <LocaleLink
          href="/produits"
          className="inline-flex items-center justify-center rounded-full bg-foreground px-6 py-2.5 text-sm font-medium text-background"
        >
          {t('orders.continueShopping')}
        </LocaleLink>
      </div>
    </div>
  );
}
