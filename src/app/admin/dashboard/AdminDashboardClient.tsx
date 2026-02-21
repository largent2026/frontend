'use client';

import React, { useEffect, useState } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { adminDashboardApi } from '@/lib/api';
import { formatPrice } from '@/lib/utils';

function getAdminToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('adminToken') ?? localStorage.getItem('admin_token');
}

/** Affiche le rapport markdown (## titres, listes) de façon lisible */
function InsightsReport({ text }: { text: string }) {
  const lines = text.split('\n');
  return (
    <div className="space-y-3 text-left text-sm text-zinc-300">
      {lines.map((line, i) => {
        const trimmed = line.trimEnd();
        if (/^##\s/.test(trimmed)) {
          return (
            <h3 key={i} className="mt-4 border-b border-zinc-700 pb-1 text-base font-semibold text-zinc-100 first:mt-0">
              {trimmed.replace(/^##\s*/, '')}
            </h3>
          );
        }
        if (/^\s*[-*]\s/.test(trimmed) || /^\d+\.\s/.test(trimmed)) {
          return (
            <div key={i} className="flex gap-2">
              <span className="text-zinc-500">•</span>
              <span>{trimmed.replace(/^\s*[-*]\s|\d+\.\s/, '')}</span>
            </div>
          );
        }
        if (trimmed === '') return <br key={i} />;
        return <p key={i}>{trimmed}</p>;
      })}
    </div>
  );
}

export function AdminDashboardClient() {
  const [stats, setStats] = useState<{
    revenue: number;
    ordersCount: number;
    productsSold: number;
    usersCount: number;
    reviewsCount: number;
    couponsCount: number;
    dailyData: { _id: string; revenue: number; orders: number }[];
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [insightsLoading, setInsightsLoading] = useState(false);
  const [insightsError, setInsightsError] = useState<string | null>(null);
  const [insightsReport, setInsightsReport] = useState<string | null>(null);

  const load = async () => {
    const token = getAdminToken();
    if (!token) {
      setError('Authentification admin requise.');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await adminDashboardApi.stats({}, token);
      setStats({
        revenue: res.revenue ?? 0,
        ordersCount: res.ordersCount ?? 0,
        productsSold: res.productsSold ?? 0,
        usersCount: res.usersCount ?? 0,
        reviewsCount: res.reviewsCount ?? 0,
        couponsCount: res.couponsCount ?? 0,
        dailyData: res.dailyData ?? [],
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    const token = getAdminToken();
    if (!token) return;
    setExporting(true);
    try {
      const res = await adminDashboardApi.exportCsv({}, token);
      const blob = await (res as unknown as Response).blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ventes-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      // ignore
    } finally {
      setExporting(false);
    }
  };

  const handleGenerateInsights = async () => {
    const token = getAdminToken();
    if (!token) return;
    setInsightsLoading(true);
    setInsightsError(null);
    setInsightsReport(null);
    try {
      const res = await adminDashboardApi.insights({}, token);
      if (res.report) setInsightsReport(res.report);
      else setInsightsError('Aucun rapport reçu.');
    } catch (e) {
      setInsightsError(e instanceof Error ? e.message : 'Erreur lors de la génération.');
    } finally {
      setInsightsLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  if (error && !stats) {
    return (
      <div className="rounded-xl border border-amber-800 bg-amber-950/30 p-6 text-amber-200">
        {error}
      </div>
    );
  }

  const cards = stats
    ? [
        { label: 'Revenus', value: formatPrice(stats.revenue), sub: 'Période sélectionnée' },
        { label: 'Commandes', value: stats.ordersCount, sub: 'Ventes payées' },
        { label: 'Produits vendus', value: stats.productsSold, sub: 'Unités' },
        { label: 'Utilisateurs', value: stats.usersCount, sub: 'Comptes actifs' },
        { label: 'Avis', value: stats.reviewsCount, sub: 'Approuvés' },
        { label: 'Coupons', value: stats.couponsCount, sub: 'Actifs' },
      ]
    : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <p className="text-sm text-zinc-500">Statistiques des 30 derniers jours</p>
        <button
          type="button"
          onClick={handleExport}
          disabled={exporting || loading}
          className="rounded-lg bg-zinc-700 px-4 py-2 text-sm font-medium text-zinc-100 hover:bg-zinc-600 disabled:opacity-50"
        >
          {exporting ? 'Export...' : 'Exporter CSV'}
        </button>
      </div>

      {loading && !stats ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl bg-zinc-800" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((c) => (
            <div
              key={c.label}
              className="rounded-xl border border-zinc-700/50 bg-zinc-900 p-4"
            >
              <p className="text-sm text-zinc-500">{c.label}</p>
              <p className="mt-1 text-2xl font-semibold tabular-nums text-zinc-100">
                {c.value}
              </p>
              <p className="text-xs text-zinc-600">{c.sub}</p>
            </div>
          ))}
        </div>
      )}

      {stats && stats.dailyData.length > 0 && (
        <div className="rounded-xl border border-zinc-700/50 bg-zinc-900 p-4">
          <h3 className="mb-4 text-sm font-medium text-zinc-300">Revenus par jour</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.dailyData}>
                <defs>
                  <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" />
                <XAxis
                  dataKey="_id"
                  stroke="#71717a"
                  tick={{ fontSize: 11 }}
                  tickFormatter={(v) => v.slice(5)}
                />
                <YAxis stroke="#71717a" tick={{ fontSize: 11 }} tickFormatter={(v) => `${v}`} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#27272a',
                    border: '1px solid #3f3f46',
                    borderRadius: '8px',
                  }}
                  labelStyle={{ color: '#a1a1aa' }}
                  formatter={(value: number | undefined) => [formatPrice(value ?? 0), 'Revenus']}
                  labelFormatter={(label) => `Date: ${label}`}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#3b82f6"
                  fill="url(#revenueGrad)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Section AI Insights */}
      <div className="rounded-xl border border-zinc-700/50 bg-zinc-900 p-4">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
          <h3 className="text-sm font-medium text-zinc-300">Insights IA</h3>
          <button
            type="button"
            onClick={handleGenerateInsights}
            disabled={insightsLoading}
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
          >
            {insightsLoading ? 'Génération…' : 'Generate AI Insights'}
          </button>
        </div>
        {insightsError && (
          <p className="rounded-lg border border-amber-800 bg-amber-950/30 p-3 text-sm text-amber-200">
            {insightsError}
          </p>
        )}
        {insightsReport && (
          <div className="max-h-[480px] overflow-y-auto rounded-lg border border-zinc-700/50 bg-zinc-950/50 p-4">
            <InsightsReport text={insightsReport} />
          </div>
        )}
      </div>
    </div>
  );
}
