'use client';

import React, { useEffect, useState } from 'react';
import { LocaleLink } from '@/components/LocaleLink';
import { adminProductsApi, type Product } from '@/lib/api';
import { formatPrice } from '@/lib/utils';

function getAdminToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('adminToken') ?? localStorage.getItem('admin_token');
}

export function AdminProduitsClient() {
  const [products, setProducts] = useState<Product[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [stockEdits, setStockEdits] = useState<Record<string, number | undefined>>({});
  const [saving, setSaving] = useState<string | null>(null);

  const load = async (page = 1) => {
    const token = getAdminToken();
    if (!token) {
      setError('Authentification admin requise.');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await adminProductsApi.list(
        { page, limit: 20, status: statusFilter || undefined },
        token
      );
      setProducts(res.products ?? []);
      setPagination(res.pagination ?? { page: 1, limit: 20, total: 0, totalPages: 0 });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur');
    } finally {
      setLoading(false);
    }
  };

  const saveStock = async (id: string, quantity: number) => {
    const token = getAdminToken();
    if (!token) return;
    setSaving(id);
    try {
      await adminProductsApi.updateStock(id, { quantity }, token);
      setProducts((prev) =>
        prev.map((p) => (p._id === id ? { ...p, stock: quantity, totalStock: quantity } : p))
      );
      setStockEdits((e) => {
        const next = { ...e };
        delete next[id];
        return next;
      });
    } catch {
      load(pagination.page);
    } finally {
      setSaving(null);
    }
  };

  useEffect(() => {
    load(pagination.page);
  }, [pagination.page, statusFilter]);

  const getProductName = (p: Product) => {
    if (typeof p.name === 'string') return p.name;
    const n = p.name as Record<string, string> | undefined;
    return n?.fr ?? n?.en ?? n?.de ?? '';
  };

  if (error && !products.length) {
    return (
      <div className="rounded-xl border border-amber-800 bg-amber-950/30 p-6 text-amber-200">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
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
          <option value="active">Actif</option>
          <option value="draft">Brouillon</option>
        </select>
        </div>
        <LocaleLink
          href="/admin/produits/nouveau"
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500"
        >
          + Nouveau produit
        </LocaleLink>
      </div>

      {loading && !products.length ? (
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
                  <th className="p-3 font-medium">Produit</th>
                  <th className="p-3 font-medium">Prix</th>
                  <th className="p-3 font-medium">Stock</th>
                  <th className="p-3 font-medium">Statut</th>
                  <th className="p-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => {
                  const stockVal = stockEdits[p._id] ?? p.stock ?? p.totalStock ?? 0;
                  return (
                    <tr key={p._id} className="border-b border-zinc-700/50 last:border-0">
                      <td className="p-3">
                        <span className="font-medium text-zinc-200">{getProductName(p)}</span>
                      </td>
                      <td className="p-3 tabular-nums text-zinc-400">{formatPrice(p.price)}</td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min={0}
                            value={stockVal}
                            onChange={(e) =>
                              setStockEdits((prev) => ({
                                ...prev,
                                [p._id]: parseInt(e.target.value, 10) || 0,
                              }))
                            }
                            className="w-20 rounded border border-zinc-600 bg-zinc-800 px-2 py-1 text-zinc-100"
                          />
                          <button
                            type="button"
                            disabled={saving === p._id || stockEdits[p._id] === undefined}
                            onClick={() => saveStock(p._id, stockVal)}
                            className="text-xs text-blue-400 hover:underline disabled:opacity-50"
                          >
                            {saving === p._id ? '...' : 'Mettre à jour'}
                          </button>
                        </div>
                      </td>
                      <td className="p-3">
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-xs ${
                            p.status === 'active'
                              ? 'bg-emerald-900/50 text-emerald-300'
                              : 'bg-zinc-700 text-zinc-400'
                          }`}
                        >
                          {p.status ?? 'draft'}
                        </span>
                      </td>
                      <td className="p-3">
                        <LocaleLink
                          href={`/produits/${p.slug}`}
                          className="text-blue-400 hover:underline"
                          target="_blank"
                        >
                          Voir
                        </LocaleLink>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {pagination.totalPages > 1 && (
            <div className="flex justify-center gap-2">
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
