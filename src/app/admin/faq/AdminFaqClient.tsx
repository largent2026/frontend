'use client';

import React, { useEffect, useState } from 'react';
import { LocaleLink } from '@/components/LocaleLink';
import { adminFaqApi, type FaqEntry } from '@/lib/api';

function getAdminToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('adminToken') ?? localStorage.getItem('admin_token');
}

const LOCALES = ['fr', 'en', 'de'] as const;
const LABELS: Record<string, string> = { fr: 'FR', en: 'EN', de: 'DE' };

export function AdminFaqClient() {
  const [entries, setEntries] = useState<FaqEntry[]>([]);
  const [frequent, setFrequent] = useState<{ question: string; locale: string; count: number }[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<'entries' | 'frequent'>('entries');
  const [modal, setModal] = useState<'add' | null>(null);
  const [form, setForm] = useState({
    question: { fr: '', en: '', de: '' },
    answer: { fr: '', en: '', de: '' },
    category: 'products' as string,
    slug: '',
    order: 0,
  });

  const loadEntries = async (page = 1) => {
    const token = getAdminToken();
    if (!token) return;
    try {
      const res = await adminFaqApi.listEntries({ page, limit: 20 }, token);
      setEntries(res.entries ?? []);
      setPagination(res.pagination ?? { page: 1, limit: 20, total: 0, totalPages: 0 });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur');
    }
  };

  const loadFrequent = async () => {
    const token = getAdminToken();
    if (!token) return;
    try {
      const res = await adminFaqApi.frequent({ limit: 30 }, token);
      setFrequent(res.questions ?? []);
    } catch {
      setFrequent([]);
    }
  };

  useEffect(() => {
    const token = getAdminToken();
    if (!token) {
      setError('Authentification admin requise.');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    Promise.all([loadEntries(1), loadFrequent()]).finally(() => setLoading(false));
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = getAdminToken();
    if (!token) return;
    try {
      await adminFaqApi.create(
        { question: form.question, answer: form.answer, category: form.category, slug: form.slug || undefined, order: form.order, source: 'admin' },
        token
      );
      setModal(null);
      setForm({ question: { fr: '', en: '', de: '' }, answer: { fr: '', en: '', de: '' }, category: 'products', slug: '', order: 0 });
      loadEntries(pagination.page);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur');
    }
  };

  const handleGenerateIa = async (entry: FaqEntry, locale: 'fr' | 'en' | 'de') => {
    const token = getAdminToken();
    if (!token) return;
    try {
      const res = await adminFaqApi.generateAnswer(entry._id, { locale }, token);
      const nextAnswer = { ...(entry.answer || {}), [locale]: res.answer };
      await adminFaqApi.update(entry._id, { answer: nextAnswer } as Partial<FaqEntry>, token);
      loadEntries(pagination.page);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur génération IA');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer cette entrée ?')) return;
    const token = getAdminToken();
    if (!token) return;
    try {
      await adminFaqApi.delete(id, token);
      loadEntries(pagination.page);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur');
    }
  };

  const getLocalized = (obj: Record<string, string> | undefined, locale: string) =>
    obj?.[locale] || obj?.fr || obj?.en || obj?.de || '—';

  const inputClass = 'w-full rounded-lg border border-zinc-600 bg-zinc-800 px-3 py-2 text-sm text-zinc-100';
  const labelClass = 'mb-1 block text-xs font-medium text-zinc-400';

  if (loading && !entries.length && !frequent.length) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 animate-pulse rounded bg-zinc-800" />
        <div className="h-64 animate-pulse rounded-xl bg-zinc-800" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold tracking-tight">FAQ dynamique</h1>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setTab('entries')}
            className={`rounded-lg px-4 py-2 text-sm font-medium ${tab === 'entries' ? 'bg-zinc-700 text-white' : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'}`}
          >
            Entrées FAQ
          </button>
          <button
            type="button"
            onClick={() => setTab('frequent')}
            className={`rounded-lg px-4 py-2 text-sm font-medium ${tab === 'frequent' ? 'bg-zinc-700 text-white' : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'}`}
          >
            Questions fréquentes
          </button>
          <button
            type="button"
            onClick={() => setModal('add')}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500"
          >
            + Ajouter une entrée
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-amber-800 bg-amber-950/30 p-3 text-sm text-amber-200">{error}</div>
      )}

      {tab === 'entries' && (
        <div className="overflow-x-auto rounded-xl border border-zinc-700/50">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-zinc-700 bg-zinc-800/80">
                <th className="p-3 font-medium">Order</th>
                <th className="p-3 font-medium">Slug</th>
                <th className="p-3 font-medium">Question (FR)</th>
                <th className="p-3 font-medium">Catégorie</th>
                <th className="p-3 font-medium">Réponse (extrait)</th>
                <th className="p-3 font-medium">Source</th>
                <th className="p-3 font-medium">Hits</th>
                <th className="p-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => (
                <tr key={entry._id} className="border-b border-zinc-700/50 last:border-0">
                  <td className="p-3 tabular-nums text-zinc-400">{entry.order ?? 0}</td>
                  <td className="max-w-[120px] truncate p-3 text-zinc-500 text-xs">{entry.slug ?? '—'}</td>
                  <td className="p-3 text-zinc-200">{getLocalized(entry.question, 'fr')}</td>
                  <td className="p-3 text-zinc-400">{entry.category ?? 'products'}</td>
                  <td className="max-w-xs truncate p-3 text-zinc-400">{getLocalized(entry.answer, 'fr')}</td>
                  <td className="p-3">
                    <span className="rounded-full bg-zinc-700 px-2 py-0.5 text-xs">{entry.source ?? 'admin'}</span>
                  </td>
                  <td className="p-3 tabular-nums text-zinc-400">{entry.hitCount ?? 0}</td>
                  <td className="p-3 flex flex-wrap gap-1">
                    {(['fr', 'en', 'de'] as const).map((loc) => (
                      <button
                        key={loc}
                        type="button"
                        onClick={() => handleGenerateIa(entry, loc)}
                        className="rounded bg-emerald-800/60 px-2 py-0.5 text-xs text-emerald-200 hover:bg-emerald-700/60"
                        title={`Générer réponse ${loc} avec l'IA`}
                      >
                        IA {loc}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => handleDelete(entry._id)}
                      className="text-red-400 hover:underline text-xs"
                    >
                      Suppr.
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {pagination.totalPages > 1 && (
            <div className="flex justify-center gap-2 border-t border-zinc-700/50 p-3">
              <button
                type="button"
                disabled={pagination.page <= 1}
                onClick={() => loadEntries(pagination.page - 1)}
                className="rounded border border-zinc-600 px-3 py-1 text-sm disabled:opacity-50"
              >
                Précédent
              </button>
              <span className="px-3 py-1 text-zinc-400">
                {pagination.page} / {pagination.totalPages}
              </span>
              <button
                type="button"
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => loadEntries(pagination.page + 1)}
                className="rounded border border-zinc-600 px-3 py-1 text-sm disabled:opacity-50"
              >
                Suivant
              </button>
            </div>
          )}
        </div>
      )}

      {tab === 'frequent' && (
        <div className="rounded-xl border border-zinc-700/50 bg-zinc-900/50 p-4">
          <p className="mb-4 text-sm text-zinc-400">
            Questions les plus posées (issues des logs). Utilisez ces données pour enrichir la base FAQ.
          </p>
          <ul className="space-y-2">
            {frequent.map((item, i) => (
              <li key={i} className="flex items-center justify-between rounded-lg bg-zinc-800/50 px-3 py-2">
                <span className="text-zinc-200">{item.question}</span>
                <span className="rounded bg-zinc-700 px-2 py-0.5 text-xs text-zinc-300">
                  {item.locale} · {item.count} fois
                </span>
              </li>
            ))}
          </ul>
          {frequent.length === 0 && <p className="text-zinc-500">Aucune donnée pour l’instant.</p>}
        </div>
      )}

      {modal === 'add' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl border border-zinc-700 bg-zinc-900 p-6">
            <h2 className="mb-4 text-lg font-semibold">Nouvelle entrée FAQ</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Catégorie</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                    className={inputClass}
                  >
                    <option value="products">Produits</option>
                    <option value="delivery">Livraison</option>
                    <option value="payment">Paiement</option>
                    <option value="warranty">Garantie</option>
                    <option value="returns">Retours</option>
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Ordre (order)</label>
                  <input
                    type="number"
                    min={0}
                    value={form.order}
                    onChange={(e) => setForm((f) => ({ ...f, order: parseInt(e.target.value, 10) || 0 }))}
                    className={inputClass}
                  />
                </div>
              </div>
              <div>
                <label className={labelClass}>Slug (optionnel)</label>
                <input
                  type="text"
                  placeholder="ex: delai-livraison"
                  value={form.slug}
                  onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
                  className={inputClass}
                />
              </div>
              {LOCALES.map((loc) => (
                <div key={loc}>
                  <label className={labelClass}>Question ({LABELS[loc]})</label>
                  <input
                    type="text"
                    value={form.question[loc]}
                    onChange={(e) => setForm((f) => ({ ...f, question: { ...f.question, [loc]: e.target.value } }))}
                    className={inputClass}
                  />
                  <label className={`${labelClass} mt-2`}>Réponse ({LABELS[loc]})</label>
                  <textarea
                    rows={3}
                    value={form.answer[loc]}
                    onChange={(e) => setForm((f) => ({ ...f, answer: { ...f.answer, [loc]: e.target.value } }))}
                    className={inputClass}
                  />
                </div>
              ))}
              <div className="flex gap-2">
                <button type="submit" className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-500">
                  Enregistrer
                </button>
                <button
                  type="button"
                  onClick={() => setModal(null)}
                  className="rounded-lg border border-zinc-600 px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-800"
                >
                  Annuler
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
