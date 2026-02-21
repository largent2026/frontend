'use client';

import React, { useEffect, useState } from 'react';
import { LocaleLink } from '@/components/LocaleLink';
import { adminOrdersApi, type Order } from '@/lib/api';
import { formatPrice } from '@/lib/utils';
import { OrderStatusBadge } from '@/components/orders/OrderStatusBadge';

function getAdminToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('adminToken') ?? localStorage.getItem('admin_token');
}

export function AdminCommandesClient() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('');

  const load = async (page = 1) => {
    const token = getAdminToken();
    if (!token) {
      setError('Authentification admin requise. Enregistrez le token dans localStorage (adminToken).');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await adminOrdersApi.list(
        { page, limit: 20, ...(statusFilter && { status: statusFilter }) },
        token
      );
      setOrders(res.orders ?? []);
      setPagination(res.pagination ?? { page: 1, limit: 20, total: 0, totalPages: 0 });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(pagination.page);
  }, [pagination.page, statusFilter]);

  if (error && !orders.length) {
    return (
      <div className="rounded-xl border border-amber-800 bg-amber-950/30 p-6 text-amber-200">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-4">
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPagination((p) => ({ ...p, page: 1 }));
          }}
          className="rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100"
        >
          <option value="">Tous les statuts</option>
          {['pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'].map(
            (s) => (
              <option key={s} value={s}>
                {s}
              </option>
            )
          )}
        </select>
      </div>
      {loading && !orders.length ? (
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-16 animate-pulse rounded-xl bg-zinc-800" />
          ))}
        </div>
      ) : (
        <>
          <div className="overflow-x-auto rounded-xl border border-zinc-700/50">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-zinc-700 bg-zinc-800/80">
                  <th className="p-3 font-medium">Commande</th>
                  <th className="p-3 font-medium">Date</th>
                  <th className="p-3 font-medium">Statut</th>
                  <th className="p-3 font-medium">Total</th>
                  <th className="p-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order._id} className="border-b border-zinc-700/50 last:border-0">
                    <td className="p-3 font-mono font-medium text-zinc-200">{order.orderNumber}</td>
                    <td className="p-3 text-zinc-400">
                      {order.createdAt ? new Date(order.createdAt).toLocaleDateString('fr-FR') : '—'}
                    </td>
                    <td className="p-3">
                      <OrderStatusBadge status={order.status} />
                    </td>
                    <td className="p-3 tabular-nums text-zinc-300">
                      {formatPrice(order.total, order.currency)}
                    </td>
                    <td className="p-3">
                      <LocaleLink
                        href={`/admin/commandes/${order._id}`}
                        className="font-medium text-blue-400 underline hover:text-blue-300"
                      >
                        Gérer
                      </LocaleLink>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {pagination.totalPages > 1 && (
            <div className="mt-4 flex justify-center gap-2">
              <button
                type="button"
                disabled={pagination.page <= 1}
                onClick={() => setPagination((p) => ({ ...p, page: p.page - 1 }))}
                className="rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2 text-sm text-zinc-200 disabled:opacity-50"
              >
                Précédent
              </button>
              <span className="flex items-center px-4 text-zinc-400">
                {pagination.page} / {pagination.totalPages}
              </span>
              <button
                type="button"
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => setPagination((p) => ({ ...p, page: p.page + 1 }))}
                className="rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2 text-sm text-zinc-200 disabled:opacity-50"
              >
                Suivant
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
