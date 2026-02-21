'use client';

import React, { useEffect, useState } from 'react';
import { adminReviewsApi, type Review } from '@/lib/api';

function getAdminToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('adminToken') ?? localStorage.getItem('admin_token');
}

type ReplyLocale = 'fr' | 'en' | 'de';

function ReplyModal({
  review,
  onClose,
}: {
  review: Review;
  onClose: () => void;
}) {
  const token = getAdminToken();
  const [locale, setLocale] = useState<ReplyLocale>('fr');
  const [replyLoading, setReplyLoading] = useState(false);
  const [replyText, setReplyText] = useState<string | null>(null);
  const [replyError, setReplyError] = useState<string | null>(null);

  const getProductName = (r: Review) => {
    const p = r.product as { name?: Record<string, string> } | undefined;
    if (!p?.name) return '—';
    return p.name.fr ?? p.name.en ?? p.name.de ?? '—';
  };

  const reviewContent =
    typeof review.title === 'string'
      ? review.title
      : (review.title as Record<string, string> | undefined)?.fr ??
        (review.title as Record<string, string> | undefined)?.en ??
        (review.title as Record<string, string> | undefined)?.de ??
        '';
  const reviewComment =
    typeof review.comment === 'string'
      ? review.comment
      : (review.comment as Record<string, string> | undefined)?.fr ??
        (review.comment as Record<string, string> | undefined)?.en ??
        (review.comment as Record<string, string> | undefined)?.de ??
        '';
  const displayText = (reviewContent || reviewComment || '—').slice(0, 300);

  const handleGenerate = async () => {
    if (!token) return;
    setReplyLoading(true);
    setReplyError(null);
    setReplyText(null);
    try {
      const res = await adminReviewsApi.generateReply(review._id, { locale }, token);
      setReplyText(res.reply ?? null);
    } catch (e) {
      setReplyError(e instanceof Error ? e.message : 'Erreur');
    } finally {
      setReplyLoading(false);
    }
  };

  const handleCopy = () => {
    if (!replyText) return;
    navigator.clipboard.writeText(replyText);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="reply-modal-title">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl border border-zinc-700 bg-zinc-900 p-5 shadow-xl">
        <h2 id="reply-modal-title" className="mb-3 text-lg font-semibold text-zinc-100">
          Generate reply with AI
        </h2>
        <p className="mb-1 text-xs text-zinc-500">{getProductName(review)} · ★ {review.rating}/5</p>
        <p className="mb-4 line-clamp-3 text-sm text-zinc-400">{displayText}</p>
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <label className="text-sm text-zinc-400">Langue :</label>
          <select
            value={locale}
            onChange={(e) => setLocale(e.target.value as ReplyLocale)}
            className="rounded-lg border border-zinc-600 bg-zinc-800 px-3 py-2 text-sm text-zinc-100"
          >
            <option value="fr">Français</option>
            <option value="en">English</option>
            <option value="de">Deutsch</option>
          </select>
          <button
            type="button"
            onClick={handleGenerate}
            disabled={replyLoading}
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
          >
            {replyLoading ? 'Génération…' : 'Generate reply with AI'}
          </button>
        </div>
        {replyError && (
          <p className="mb-3 rounded-lg border border-amber-800 bg-amber-950/30 p-2 text-sm text-amber-200">
            {replyError}
          </p>
        )}
        {replyText && (
          <div className="mb-4">
            <label className="mb-1 block text-xs text-zinc-500">Réponse générée</label>
            <textarea
              readOnly
              value={replyText}
              rows={5}
              className="mb-2 w-full resize-y rounded-lg border border-zinc-600 bg-zinc-800 p-3 text-sm text-zinc-200"
            />
            <button
              type="button"
              onClick={handleCopy}
              className="rounded-lg border border-zinc-600 bg-zinc-800 px-3 py-2 text-sm text-zinc-200 hover:bg-zinc-700"
            >
              Copier
            </button>
          </div>
        )}
        <div className="flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-zinc-600 bg-zinc-800 px-4 py-2 text-sm text-zinc-200 hover:bg-zinc-700"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}

export function AdminAvisClient() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('pending');
  const [updating, setUpdating] = useState<string | null>(null);
  const [replyModalReview, setReplyModalReview] = useState<Review | null>(null);

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
      const res = await adminReviewsApi.list(
        { page, limit: 20, status: statusFilter || undefined },
        token
      );
      setReviews(res.reviews ?? []);
      setPagination(res.pagination ?? { page: 1, limit: 20, total: 0, totalPages: 0 });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur');
    } finally {
      setLoading(false);
    }
  };

  const setStatus = async (id: string, status: 'approved' | 'rejected') => {
    const token = getAdminToken();
    if (!token) return;
    setUpdating(id);
    try {
      await adminReviewsApi.setStatus(id, status, token);
      setReviews((prev) => prev.filter((r) => r._id !== id));
    } catch {
      load(pagination.page);
    } finally {
      setUpdating(null);
    }
  };

  useEffect(() => {
    load(pagination.page);
  }, [pagination.page, statusFilter]);

  const getProductName = (r: Review) => {
    const p = r.product as { name?: Record<string, string> } | undefined;
    if (!p?.name) return '—';
    return p.name.fr ?? p.name.en ?? p.name.de ?? '—';
  };

  if (error && !reviews.length) {
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
          <option value="">Tous</option>
          <option value="pending">En attente</option>
          <option value="approved">Approuvés</option>
          <option value="rejected">Rejetés</option>
        </select>
      </div>

      {loading && !reviews.length ? (
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-xl bg-zinc-800" />
          ))}
        </div>
      ) : (
        <>
          <div className="overflow-x-auto rounded-xl border border-zinc-700/50">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-zinc-700 bg-zinc-800/80">
                  <th className="p-3 font-medium">Produit</th>
                  <th className="p-3 font-medium">Client</th>
                  <th className="p-3 font-medium">Note</th>
                  <th className="p-3 font-medium">Titre / Commentaire</th>
                  <th className="p-3 font-medium">Statut</th>
                  <th className="p-3 font-medium">Réponse IA</th>
                  <th className="p-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {reviews.map((r) => (
                  <tr key={r._id} className="border-b border-zinc-700/50 last:border-0">
                    <td className="p-3 text-zinc-300">{getProductName(r)}</td>
                    <td className="p-3 text-zinc-400">{r.userName ?? '—'}</td>
                    <td className="p-3">
                      <span className="text-amber-400">★ {r.rating}/5</span>
                    </td>
                    <td className="max-w-xs p-3">
                      <span className="line-clamp-2 text-zinc-400">
                        {r.title ?? r.comment ?? '—'}
                      </span>
                    </td>
                    <td className="p-3">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-xs ${
                          r.status === 'approved'
                            ? 'bg-emerald-900/50 text-emerald-300'
                            : r.status === 'rejected'
                            ? 'bg-red-900/50 text-red-300'
                            : 'bg-amber-900/50 text-amber-300'
                        }`}
                      >
                        {r.status ?? 'pending'}
                      </span>
                    </td>
                    <td className="p-3">
                      <button
                        type="button"
                        onClick={() => setReplyModalReview(r)}
                        className="rounded-lg border border-zinc-600 bg-zinc-800 px-3 py-1.5 text-xs font-medium text-zinc-200 hover:bg-zinc-700"
                      >
                        Generate reply with AI
                      </button>
                    </td>
                    <td className="p-3">
                      {r.status === 'pending' && (
                        <div className="flex gap-2">
                          <button
                            type="button"
                            disabled={updating === r._id}
                            onClick={() => setStatus(r._id, 'approved')}
                            className="text-sm text-emerald-400 hover:underline disabled:opacity-50"
                          >
                            Approuver
                          </button>
                          <button
                            type="button"
                            disabled={updating === r._id}
                            onClick={() => setStatus(r._id, 'rejected')}
                            className="text-sm text-red-400 hover:underline disabled:opacity-50"
                          >
                            Rejeter
                          </button>
                        </div>
                      )}
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

      {replyModalReview && (
        <ReplyModal review={replyModalReview} onClose={() => setReplyModalReview(null)} />
      )}
    </div>
  );
}
