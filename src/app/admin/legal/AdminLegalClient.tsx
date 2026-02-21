'use client';

import React, { useEffect, useState } from 'react';
import { adminLegalApi } from '@/lib/api';

function getAdminToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('adminToken') ?? localStorage.getItem('admin_token');
}

const LOCALES = ['fr', 'en', 'de'] as const;
const LABELS: Record<string, string> = { fr: 'FR', en: 'EN', de: 'DE' };

type LegalDoc = {
  companyName?: { fr?: string; en?: string; de?: string };
  legalForm?: { fr?: string; en?: string; de?: string };
  address?: { fr?: string; en?: string; de?: string };
  email?: string;
  publicationManager?: { fr?: string; en?: string; de?: string };
  host?: { fr?: string; en?: string; de?: string };
  vatNumber?: string;
  intellectualProperty?: { fr?: string; en?: string; de?: string };
  liability?: { fr?: string; en?: string; de?: string };
};

const emptyLocalized = () => ({ fr: '', en: '', de: '' });

export function AdminLegalClient() {
  const [legal, setLegal] = useState<LegalDoc | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState<LegalDoc>({
    companyName: emptyLocalized(),
    legalForm: emptyLocalized(),
    address: emptyLocalized(),
    email: '',
    publicationManager: emptyLocalized(),
    host: emptyLocalized(),
    vatNumber: '',
    intellectualProperty: emptyLocalized(),
    liability: emptyLocalized(),
  });

  const load = async () => {
    const token = getAdminToken();
    if (!token) {
      setError('Authentification requise');
      setLoading(false);
      return;
    }
    try {
      const res = await adminLegalApi.get(token);
      const data = (res.legal ?? {}) as LegalDoc;
      setLegal(data);
      setForm({
        companyName: data.companyName ?? emptyLocalized(),
        legalForm: data.legalForm ?? emptyLocalized(),
        address: data.address ?? emptyLocalized(),
        email: data.email ?? '',
        publicationManager: data.publicationManager ?? emptyLocalized(),
        host: data.host ?? emptyLocalized(),
        vatNumber: data.vatNumber ?? '',
        intellectualProperty: data.intellectualProperty ?? emptyLocalized(),
        liability: data.liability ?? emptyLocalized(),
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = getAdminToken();
    if (!token) return;
    setSaving(true);
    setError(null);
    try {
      await adminLegalApi.update(form, token);
      setLegal(form);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur');
    } finally {
      setSaving(false);
    }
  };

  const inputClass = 'w-full rounded-lg border border-zinc-600 bg-zinc-800 px-3 py-2 text-sm text-zinc-100';
  const labelClass = 'mb-1 block text-xs font-medium text-zinc-400';

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 animate-pulse rounded bg-zinc-800" />
        <div className="h-64 animate-pulse rounded-xl bg-zinc-800" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Mentions légales</h1>
      {error && (
        <div className="rounded-lg border border-amber-800 bg-amber-950/30 p-3 text-sm text-amber-200">
          {error}
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-6">
        {(['companyName', 'legalForm', 'address', 'publicationManager', 'host', 'intellectualProperty', 'liability'] as const).map((field) => (
          <div key={field}>
            <label className={labelClass}>{field}</label>
            <div className="grid gap-3 sm:grid-cols-3">
              {LOCALES.map((loc) => (
                <div key={loc}>
                  <span className="text-xs text-zinc-500">({LABELS[loc]})</span>
                  <input
                    type="text"
                    value={form[field]?.[loc] ?? ''}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        [field]: { ...(f[field] ?? emptyLocalized()), [loc]: e.target.value },
                      }))
                    }
                    className={inputClass}
                  />
                </div>
              ))}
            </div>
          </div>
        ))}
        <div>
          <label className={labelClass}>email</label>
          <input
            type="email"
            value={form.email ?? ''}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>vatNumber</label>
          <input
            type="text"
            value={form.vatNumber ?? ''}
            onChange={(e) => setForm((f) => ({ ...f, vatNumber: e.target.value }))}
            className={inputClass}
          />
        </div>
        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-50"
        >
          {saving ? 'Enregistrement…' : 'Enregistrer'}
        </button>
      </form>
    </div>
  );
}
