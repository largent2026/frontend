'use client';

import { useState } from 'react';
import { LocaleLink } from '@/components/LocaleLink';
import { useTranslation } from 'react-i18next';
import Image from 'next/image';
import { ordersApi, type OrderDetail } from '@/lib/api';
import { formatPrice } from '@/lib/utils';
import { OrderStatusBadge } from '@/components/orders/OrderStatusBadge';
import { OrderTimeline } from '@/components/orders/OrderTimeline';
import { TrackingBlock } from '@/components/orders/TrackingBlock';

export function SuiviClient() {
  const { t } = useTranslation();
  const [orderNumber, setOrderNumber] = useState('');
  const [email, setEmail] = useState('');
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderNumber.trim() || !email.trim()) {
      setError('Veuillez remplir le numéro de commande et l’email.');
      return;
    }
    setLoading(true);
    setError(null);
    setOrder(null);
    try {
      const res = await ordersApi.trackOrder(orderNumber.trim(), email.trim());
      setOrder(res.order);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Commande introuvable. Vérifiez le numéro et l’email.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-8">
      <form onSubmit={handleSubmit} className="rounded-2xl border border-border bg-card p-6">
        <div className="space-y-4">
          <div>
            <label htmlFor="orderNumber" className="block text-sm font-medium">
              Numéro de commande
            </label>
            <input
              id="orderNumber"
              type="text"
              value={orderNumber}
              onChange={(e) => setOrderNumber(e.target.value)}
              placeholder="ex. DY-20240219-0001"
              className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 font-mono text-sm"
            />
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="votre@email.ch"
              className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
            />
          </div>
        </div>
        {error && (
          <p className="mt-4 text-sm text-red-600 dark:text-red-400">{error}</p>
        )}
        <button
          type="submit"
          disabled={loading}
          className="mt-6 w-full rounded-full bg-foreground py-3 text-sm font-medium text-background disabled:opacity-50"
        >
          {loading ? 'Recherche…' : 'Voir ma commande'}
        </button>
      </form>

      {order && (
        <div className="mt-10 space-y-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h2 className="text-xl font-semibold">{order.orderNumber}</h2>
            <OrderStatusBadge status={order.status} />
          </div>

          <section>
            <h3 className="mb-4 text-lg font-medium">Suivi de la commande</h3>
            <div className="rounded-xl border border-border bg-card p-6">
              <OrderTimeline
                statusHistory={order.statusHistory ?? null}
                currentStatus={order.status}
              />
            </div>
          </section>

          {order.shipments && order.shipments.length > 0 && (
            <section>
              <h3 className="mb-4 text-lg font-medium">Expéditions</h3>
              <div className="space-y-4">
                {order.shipments.map((shipment) => (
                  <TrackingBlock key={shipment._id} shipment={shipment} />
                ))}
              </div>
            </section>
          )}

          <section>
            <h3 className="mb-4 text-lg font-medium">Récapitulatif</h3>
            <p className="text-muted-foreground">
              {order.items?.length ?? 0} article(s) · Total{' '}
              {formatPrice(order.total, order.currency)}
            </p>
          </section>

          <p className="text-center text-sm text-muted-foreground">
            <LocaleLink href="/commandes/suivi" className="underline">
              {t('orders.trackAnother')}
            </LocaleLink>
          </p>
        </div>
      )}
    </div>
  );
}
