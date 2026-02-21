'use client';

import { useEffect, useState } from 'react';
import { LocaleLink } from '@/components/LocaleLink';
import { adminOrdersApi, type OrderDetail, type OrderReturn } from '@/lib/api';
import { formatPrice } from '@/lib/utils';
import { OrderStatusBadge } from '@/components/orders/OrderStatusBadge';
import { OrderTimeline } from '@/components/orders/OrderTimeline';
import { TrackingBlock } from '@/components/orders/TrackingBlock';

const ORDER_STATUSES = [
  'pending',
  'paid',
  'processing',
  'shipped',
  'delivered',
  'cancelled',
  'refunded',
];

const RETURN_STATUSES = [
  'requested',
  'approved',
  'rejected',
  'picked_up',
  'received',
  'refunded',
];

function getAdminToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('adminToken') ?? localStorage.getItem('admin_token');
}

interface AdminOrderDetailClientProps {
  orderId: string;
}

export function AdminOrderDetailClient({ orderId }: AdminOrderDetailClientProps) {
  const [order, setOrder] = useState<(OrderDetail & { returns?: OrderReturn[] }) | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [statusNote, setStatusNote] = useState('');
  const [trackingCarrier, setTrackingCarrier] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [refundAmount, setRefundAmount] = useState('');
  const [returnReason, setReturnReason] = useState('');
  const [returnComment, setReturnComment] = useState('');

  const token = getAdminToken();

  const load = async () => {
    if (!token) {
      setError('Token admin requis');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await adminOrdersApi.get(orderId, token);
      setOrder(res.order);
      setNewStatus(res.order.status);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [orderId]);

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !newStatus) return;
    setActionLoading(true);
    try {
      await adminOrdersApi.updateStatus(orderId, newStatus, statusNote || undefined, token);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur');
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddTracking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setActionLoading(true);
    try {
      await adminOrdersApi.addShipment(
        orderId,
        {
          carrier: trackingCarrier || 'Standard',
          trackingNumber: trackingNumber || undefined,
        },
        token
      );
      setTrackingCarrier('');
      setTrackingNumber('');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!token || !confirm('Annuler cette commande ? Le stock sera remis.')) return;
    setActionLoading(true);
    try {
      await adminOrdersApi.cancel(orderId, token);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRefund = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !confirm('Effectuer le remboursement ?')) return;
    setActionLoading(true);
    try {
      const amount = refundAmount ? parseFloat(refundAmount) : undefined;
      await adminOrdersApi.refund(orderId, amount, token);
      setRefundAmount('');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreateReturn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setActionLoading(true);
    try {
      await adminOrdersApi.createReturn(
        orderId,
        { reason: returnReason, customerComment: returnComment },
        token
      );
      setReturnReason('');
      setReturnComment('');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateReturnStatus = async (
    returnId: string,
    status: string,
    adminNotes?: string,
    refundAmount?: number
  ) => {
    if (!token) return;
    setActionLoading(true);
    try {
      await adminOrdersApi.updateReturnStatus(
        orderId,
        returnId,
        { status, adminNotes, refundAmount },
        token
      );
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading && !order) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 skeleton rounded" />
        <div className="h-64 skeleton rounded-xl" />
      </div>
    );
  }

  if (error && !order) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 dark:border-red-900 dark:bg-red-950/30">
        <p className="text-red-800 dark:text-red-200">{error}</p>
        <LocaleLink href="/admin/commandes" className="mt-4 inline-block underline">
          Retour à la liste
        </LocaleLink>
      </div>
    );
  }

  if (!order) return null;

  const canCancel = !['cancelled', 'refunded'].includes(order.status);
  const canRefund = order.status === 'paid' || order.status === 'processing' || order.status === 'shipped' || order.status === 'delivered';

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <LocaleLink href="/admin/commandes" className="text-sm text-muted-foreground underline">
            ← Commandes
          </LocaleLink>
          <h1 className="mt-2 text-2xl font-semibold">
            {order.orderNumber}
          </h1>
        </div>
        <OrderStatusBadge status={order.status} />
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/30 dark:text-red-200">
          {error}
        </div>
      )}

      <section>
        <h2 className="mb-4 text-lg font-medium">Changer le statut</h2>
        <form onSubmit={handleUpdateStatus} className="flex flex-wrap items-end gap-4 rounded-xl border border-border bg-card p-4">
          <div>
            <label className="block text-xs text-muted-foreground">Statut</label>
            <select
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value)}
              className="mt-1 rounded-lg border border-border bg-background px-3 py-2 text-sm"
            >
              {ORDER_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div className="min-w-[200px] flex-1">
            <label className="block text-xs text-muted-foreground">Note (optionnel)</label>
            <input
              type="text"
              value={statusNote}
              onChange={(e) => setStatusNote(e.target.value)}
              placeholder="Ex: Colis expédié"
              className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
            />
          </div>
          <button
            type="submit"
            disabled={actionLoading}
            className="rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-background disabled:opacity-50"
          >
            Mettre à jour
          </button>
        </form>
      </section>

      <section>
        <h2 className="mb-4 text-lg font-medium">Ajouter un envoi / tracking</h2>
        <form onSubmit={handleAddTracking} className="flex flex-wrap items-end gap-4 rounded-xl border border-border bg-card p-4">
          <div>
            <label className="block text-xs text-muted-foreground">Transporteur</label>
            <input
              type="text"
              value={trackingCarrier}
              onChange={(e) => setTrackingCarrier(e.target.value)}
              placeholder="ex. La Poste"
              className="mt-1 rounded-lg border border-border bg-background px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-muted-foreground">N° de suivi</label>
            <input
              type="text"
              value={trackingNumber}
              onChange={(e) => setTrackingNumber(e.target.value)}
              placeholder="ex. 1234567890"
              className="mt-1 rounded-lg border border-border bg-background px-3 py-2 text-sm"
            />
          </div>
          <button
            type="submit"
            disabled={actionLoading}
            className="rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-background disabled:opacity-50"
          >
            Ajouter
          </button>
        </form>
      </section>

      <section>
        <h2 className="mb-4 text-lg font-medium">Timeline</h2>
        <div className="rounded-xl border border-border bg-card p-6">
          <OrderTimeline
            statusHistory={order.statusHistory ?? null}
            currentStatus={order.status}
          />
        </div>
      </section>

      {order.shipments && order.shipments.length > 0 && (
        <section>
          <h2 className="mb-4 text-lg font-medium">Expéditions</h2>
          <div className="space-y-4">
            {order.shipments.map((s) => (
              <TrackingBlock key={s._id} shipment={s} />
            ))}
          </div>
        </section>
      )}

      <section className="grid gap-6 sm:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-4">
          <h3 className="font-medium">Annulation</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Remet le stock et passe la commande en annulée.
          </p>
          <button
            type="button"
            onClick={handleCancel}
            disabled={!canCancel || actionLoading}
            className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-800 disabled:opacity-50 dark:border-red-900 dark:bg-red-950/50 dark:text-red-200"
          >
            Annuler la commande
          </button>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <h3 className="font-medium">Remboursement</h3>
          <form onSubmit={handleRefund} className="mt-2">
            <input
              type="number"
              step="0.01"
              value={refundAmount}
              onChange={(e) => setRefundAmount(e.target.value)}
              placeholder="Montant (vide = total)"
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
            />
            <button
              type="submit"
              disabled={!canRefund || actionLoading}
              className="mt-4 rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-background disabled:opacity-50"
            >
              Rembourser
            </button>
          </form>
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-lg font-medium">Retours</h2>
        <form onSubmit={handleCreateReturn} className="mb-6 flex flex-wrap gap-4 rounded-xl border border-border bg-card p-4">
          <input
            type="text"
            value={returnReason}
            onChange={(e) => setReturnReason(e.target.value)}
            placeholder="Raison du retour"
            className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm min-w-[180px]"
          />
          <input
            type="text"
            value={returnComment}
            onChange={(e) => setReturnComment(e.target.value)}
            placeholder="Commentaire client"
            className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm min-w-[180px]"
          />
          <button
            type="submit"
            disabled={actionLoading}
            className="rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-background disabled:opacity-50"
          >
            Créer un retour
          </button>
        </form>
        {order.returns && order.returns.length > 0 ? (
          <ul className="space-y-3">
            {order.returns.map((r) => (
              <li
                key={r._id}
                className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border bg-muted/30 p-4"
              >
                <div>
                  <span className="font-mono font-medium">{r.returnNumber}</span>
                  <span className="ml-2 text-sm text-muted-foreground">{r.status}</span>
                  {r.reason && <p className="mt-1 text-sm">{r.reason}</p>}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <select
                    defaultValue={r.status}
                    onChange={(e) => handleUpdateReturnStatus(r._id, e.target.value)}
                    className="rounded border border-border bg-background px-2 py-1 text-sm"
                  >
                    {RETURN_STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">Aucun retour pour cette commande.</p>
        )}
      </section>

      <section className="rounded-xl border border-border bg-card p-6">
        <h3 className="font-medium">Récap commande</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Total : {formatPrice(order.total, order.currency)} · {order.items?.length ?? 0} article(s)
        </p>
      </section>
    </div>
  );
}
