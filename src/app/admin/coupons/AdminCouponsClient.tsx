'use client';

import React, { useEffect, useState } from 'react';
import { adminCouponsApi, type Coupon } from '@/lib/api';
import { formatPrice } from '@/lib/utils';

function getAdminToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('adminToken') ?? localStorage.getItem('admin_token');
}

export function AdminCouponsClient() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<string>('');
  const [modal, setModal] = useState<'create' | 'edit' | null>(null);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [form, setForm] = useState({
    code: '',
    type: 'percentage' as 'percentage' | 'fixed',
    value: 10,
    minOrderAmount: 0,
    maxDiscountAmount: '',
    maxUses: '',
    maxUsesPerUser: 1,
    validFrom: '',
    validTo: '',
    isActive: true,
  });

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
      const res = await adminCouponsApi.list(
        { page, limit: 20, search: search || undefined, isActive: activeFilter || undefined },
        token
      );
      setCoupons(res.coupons ?? []);
      setPagination(res.pagination ?? { page: 1, limit: 20, total: 0, totalPages: 0 });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setForm({
      code: '',
      type: 'percentage',
      value: 10,
      minOrderAmount: 0,
      maxDiscountAmount: '',
      maxUses: '',
      maxUsesPerUser: 1,
      validFrom: '',
      validTo: '',
      isActive: true,
    });
    setEditingCoupon(null);
    setModal(null);
  };

  const openEdit = (c: Coupon) => {
    setEditingCoupon(c);
    setForm({
      code: c.code,
      type: c.type,
      value: c.value,
      minOrderAmount: c.minOrderAmount ?? 0,
      maxDiscountAmount: c.maxDiscountAmount?.toString() ?? '',
      maxUses: c.maxUses?.toString() ?? '',
      maxUsesPerUser: c.maxUsesPerUser ?? 1,
      validFrom: c.validFrom ? c.validFrom.toString().slice(0, 10) : '',
      validTo: c.validTo ? c.validTo.toString().slice(0, 10) : '',
      isActive: c.isActive,
    });
    setModal('edit');
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = getAdminToken();
    if (!token) return;
    try {
      await adminCouponsApi.create(
        {
          code: form.code,
          type: form.type,
          value: form.value,
          minOrderAmount: form.minOrderAmount,
          maxDiscountAmount: form.maxDiscountAmount ? Number(form.maxDiscountAmount) : undefined,
          maxUses: form.maxUses ? Number(form.maxUses) : undefined,
          maxUsesPerUser: form.maxUsesPerUser,
          validFrom: form.validFrom || undefined,
          validTo: form.validTo || undefined,
          isActive: form.isActive,
        },
        token
      );
      resetForm();
      load(1);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erreur');
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCoupon) return;
    const token = getAdminToken();
    if (!token) return;
    try {
      await adminCouponsApi.update(
        editingCoupon._id,
        {
          code: form.code,
          type: form.type,
          value: form.value,
          minOrderAmount: form.minOrderAmount,
          maxDiscountAmount: form.maxDiscountAmount ? Number(form.maxDiscountAmount) : undefined,
          maxUses: form.maxUses ? Number(form.maxUses) : null,
          maxUsesPerUser: form.maxUsesPerUser,
          validFrom: form.validFrom || undefined,
          validTo: form.validTo || undefined,
          isActive: form.isActive,
        },
        token
      );
      resetForm();
      load(pagination.page);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erreur');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer ce coupon ?')) return;
    const token = getAdminToken();
    if (!token) return;
    try {
      await adminCouponsApi.delete(id, token);
      setCoupons((prev) => prev.filter((c) => c._id !== id));
    } catch {
      load(pagination.page);
    }
  };

  useEffect(() => {
    load(pagination.page);
  }, [pagination.page, search, activeFilter]);

  const formatValue = (c: Coupon) =>
    c.type === 'percentage' ? `${c.value}%` : formatPrice(c.value);

  if (error && !coupons.length) {
    return (
      <div className="rounded-xl border border-amber-800 bg-amber-950/30 p-6 text-amber-200">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-4">
        <input
          type="text"
          placeholder="Rechercher par code..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && load(1)}
          className="rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500"
        />
        <select
          value={activeFilter}
          onChange={(e) => {
            setActiveFilter(e.target.value);
            setPagination((p) => ({ ...p, page: 1 }));
          }}
          className="rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100"
        >
          <option value="">Tous</option>
          <option value="true">Actifs</option>
          <option value="false">Inactifs</option>
        </select>
        <button
          type="button"
          onClick={() => {
            resetForm();
            setModal('create');
          }}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500"
        >
          + Nouveau coupon
        </button>
      </div>

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-xl border border-zinc-700 bg-zinc-900 p-6">
            <h3 className="mb-4 text-lg font-medium">
              {modal === 'create' ? 'Nouveau coupon' : 'Modifier le coupon'}
            </h3>
            <form onSubmit={modal === 'create' ? handleCreate : handleUpdate} className="space-y-3">
              <div>
                <label className="mb-1 block text-sm text-zinc-400">Code</label>
                <input
                  type="text"
                  value={form.code}
                  onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))}
                  required
                  className="w-full rounded border border-zinc-600 bg-zinc-800 px-3 py-2 text-zinc-100"
                />
              </div>
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="mb-1 block text-sm text-zinc-400">Type</label>
                  <select
                    value={form.type}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, type: e.target.value as 'percentage' | 'fixed' }))
                    }
                    className="w-full rounded border border-zinc-600 bg-zinc-800 px-3 py-2 text-zinc-100"
                  >
                    <option value="percentage">Pourcentage</option>
                    <option value="fixed">Montant fixe</option>
                  </select>
                </div>
                <div className="flex-1">
                  <label className="mb-1 block text-sm text-zinc-400">Valeur</label>
                  <input
                    type="number"
                    min={0}
                    step={form.type === 'percentage' ? 1 : 0.01}
                    value={form.value}
                    onChange={(e) => setForm((f) => ({ ...f, value: Number(e.target.value) }))}
                    required
                    className="w-full rounded border border-zinc-600 bg-zinc-800 px-3 py-2 text-zinc-100"
                  />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-sm text-zinc-400">Montant minimum (CHF)</label>
                <input
                  type="number"
                  min={0}
                  value={form.minOrderAmount}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, minOrderAmount: Number(e.target.value) }))
                  }
                  className="w-full rounded border border-zinc-600 bg-zinc-800 px-3 py-2 text-zinc-100"
                />
              </div>
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="mb-1 block text-sm text-zinc-400">Max utilisations</label>
                  <input
                    type="number"
                    min={0}
                    placeholder="Illimité"
                    value={form.maxUses}
                    onChange={(e) => setForm((f) => ({ ...f, maxUses: e.target.value }))}
                    className="w-full rounded border border-zinc-600 bg-zinc-800 px-3 py-2 text-zinc-100"
                  />
                </div>
                <div className="flex-1">
                  <label className="mb-1 block text-sm text-zinc-400">Valide jusqu&apos;au</label>
                  <input
                    type="date"
                    value={form.validTo}
                    onChange={(e) => setForm((f) => ({ ...f, validTo: e.target.value }))}
                    className="w-full rounded border border-zinc-600 bg-zinc-800 px-3 py-2 text-zinc-100"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={form.isActive}
                  onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
                  className="rounded border-zinc-600"
                />
                <label htmlFor="isActive" className="text-sm text-zinc-400">
                  Actif
                </label>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={resetForm}
                  className="rounded-lg border border-zinc-600 px-4 py-2 text-sm text-zinc-300"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white"
                >
                  {modal === 'create' ? 'Créer' : 'Enregistrer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {loading && !coupons.length ? (
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-14 animate-pulse rounded-xl bg-zinc-800" />
          ))}
        </div>
      ) : (
        <>
          <div className="overflow-x-auto rounded-xl border border-zinc-700/50">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-zinc-700 bg-zinc-800/80">
                  <th className="p-3 font-medium">Code</th>
                  <th className="p-3 font-medium">Valeur</th>
                  <th className="p-3 font-medium">Utilisations</th>
                  <th className="p-3 font-medium">Valide</th>
                  <th className="p-3 font-medium">Statut</th>
                  <th className="p-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {coupons.map((c) => (
                  <tr key={c._id} className="border-b border-zinc-700/50 last:border-0">
                    <td className="p-3 font-mono font-medium text-zinc-200">{c.code}</td>
                    <td className="p-3 text-zinc-400">{formatValue(c)}</td>
                    <td className="p-3 text-zinc-400">
                      {c.usedCount}
                      {c.maxUses != null ? ` / ${c.maxUses}` : ''}
                    </td>
                    <td className="p-3 text-zinc-500">
                      {c.validTo ? new Date(c.validTo).toLocaleDateString('fr-FR') : '—'}
                    </td>
                    <td className="p-3">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-xs ${
                          c.isActive ? 'bg-emerald-900/50 text-emerald-300' : 'bg-zinc-700 text-zinc-400'
                        }`}
                      >
                        {c.isActive ? 'Actif' : 'Inactif'}
                      </span>
                    </td>
                    <td className="p-3">
                      <button
                        type="button"
                        onClick={() => openEdit(c)}
                        className="mr-2 text-blue-400 hover:underline"
                      >
                        Modifier
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(c._id)}
                        className="text-red-400 hover:underline"
                      >
                        Supprimer
                      </button>
                    </td>
                  </tr>
                ))}
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
