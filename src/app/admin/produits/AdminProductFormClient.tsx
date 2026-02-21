'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { LocaleLink } from '@/components/LocaleLink';
import { useLocale } from '@/contexts/LocaleContext';
import { adminProductsApi, categoriesApi, aiProductDescriptionApi } from '@/lib/api';
import type { Category } from '@/lib/api';

function getAdminToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('adminToken') ?? localStorage.getItem('admin_token');
}

const LOCALES = ['fr', 'en', 'de'] as const;
const LOCALE_LABELS = { fr: 'Français', en: 'English', de: 'Deutsch' };

type Localized = { fr: string; en: string; de: string };

const emptyLocalized = (): Localized => ({ fr: '', en: '', de: '' });
const emptyBulletPoints = () => ({ fr: [] as string[], en: [] as string[], de: [] as string[] });

export function AdminProductFormClient() {
  const router = useRouter();
  const locale = useLocale();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState<Localized>(emptyLocalized());
  const [slug, setSlug] = useState('');
  const [category, setCategory] = useState('');
  const [price, setPrice] = useState<string>('');
  const [description, setDescription] = useState<Localized>(emptyLocalized());
  const [shortDescription, setShortDescription] = useState<Localized>(emptyLocalized());
  const [metaTitle, setMetaTitle] = useState<Localized>(emptyLocalized());
  const [metaDescription, setMetaDescription] = useState<Localized>(emptyLocalized());
  const [bulletPoints, setBulletPoints] = useState<{ fr: string[]; en: string[]; de: string[] }>(emptyBulletPoints());
  const [status, setStatus] = useState<'draft' | 'active'>('draft');

  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  useEffect(() => {
    categoriesApi.list('fr').then((res) => setCategories(res.categories ?? [])).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const setLocalized = (
    setter: React.Dispatch<React.SetStateAction<Localized>>,
    locale: 'fr' | 'en' | 'de',
    value: string
  ) => {
    setter((prev) => ({ ...prev, [locale]: value }));
  };

  const setBulletForLocale = (locale: 'fr' | 'en' | 'de', index: number, value: string) => {
    setBulletPoints((prev) => {
      const next = { ...prev };
      const arr = [...(next[locale] || [])];
      arr[index] = value;
      next[locale] = arr;
      return next;
    });
  };

  const addBullet = (locale: 'fr' | 'en' | 'de') => {
    setBulletPoints((prev) => ({ ...prev, [locale]: [...(prev[locale] || []), ''] }));
  };

  const handleGenerateAi = async () => {
    const token = getAdminToken();
    if (!token) {
      setAiError('Authentification admin requise.');
      return;
    }
    setAiLoading(true);
    setAiError(null);
    try {
      const categoryName = categories.find((c) => c._id === category)?.name ?? category;
      const res = await aiProductDescriptionApi.generate(
        { name: { fr: name.fr || undefined, en: name.en || undefined, de: name.de || undefined }, categoryName },
        token
      );
      setDescription(res.description ?? emptyLocalized());
      setShortDescription(res.shortDescription ?? emptyLocalized());
      setMetaTitle(res.seo?.metaTitle ?? emptyLocalized());
      setMetaDescription(res.seo?.metaDescription ?? emptyLocalized());
      setBulletPoints(res.bulletPoints ?? emptyBulletPoints());
    } catch (e) {
      setAiError(e instanceof Error ? e.message : 'Erreur lors de la génération.');
    } finally {
      setAiLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = getAdminToken();
    if (!token) {
      setError('Authentification admin requise.');
      return;
    }
    const priceNum = parseFloat(price);
    if (Number.isNaN(priceNum) || priceNum < 0) {
      setError('Prix invalide.');
      return;
    }
    if (!name.fr?.trim()) {
      setError('Nom (FR) requis.');
      return;
    }
    if (!category) {
      setError('Catégorie requise.');
      return;
    }
    setSaving(true);
    setError(null);
    const bulletPayload = {
      fr: (bulletPoints.fr || []).filter(Boolean),
      en: (bulletPoints.en || []).filter(Boolean),
      de: (bulletPoints.de || []).filter(Boolean),
    };
    const hasBullets = bulletPayload.fr.length > 0 || bulletPayload.en.length > 0 || bulletPayload.de.length > 0;

    try {
      await adminProductsApi.create(
        {
          name: { fr: name.fr.trim(), en: name.en?.trim() || undefined, de: name.de?.trim() || undefined },
          slug: slug.trim() || undefined,
          category,
          price: priceNum,
          description: description.fr || description.en || description.de ? description : undefined,
          shortDescription: shortDescription.fr || shortDescription.en || shortDescription.de ? shortDescription : undefined,
          seo:
            metaTitle.fr || metaTitle.en || metaTitle.de || metaDescription.fr || metaDescription.en || metaDescription.de
              ? {
                  metaTitle: { fr: metaTitle.fr || '', en: metaTitle.en || '', de: metaTitle.de || '' },
                  metaDescription: { fr: metaDescription.fr || '', en: metaDescription.en || '', de: metaDescription.de || '' },
                }
              : undefined,
          bulletPoints: hasBullets ? bulletPayload : undefined,
          status,
        },
        token
      );
      router.push(`/${locale}/admin/produits`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur lors de la création.');
    } finally {
      setSaving(false);
    }
  };

  const inputClass = 'w-full rounded-lg border border-zinc-600 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-blue-500 focus:outline-none';
  const labelClass = 'mb-1 block text-sm font-medium text-zinc-300';

  if (loading) {
    return <div className="animate-pulse rounded-xl bg-zinc-800 h-12 w-48" />;
  }

  return (
    <div className="max-w-4xl space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold tracking-tight">Nouveau produit</h1>
        <LocaleLink href="/admin/produits" className="text-sm text-zinc-400 hover:text-zinc-200">
          ← Retour à la liste
        </LocaleLink>
      </div>

      <div className="rounded-xl border border-amber-800/50 bg-amber-950/20 p-4">
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handleGenerateAi}
            disabled={aiLoading}
            className="inline-flex items-center gap-2 rounded-lg bg-amber-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-amber-500 disabled:opacity-50"
          >
            {aiLoading ? (
              <>
                <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Génération en cours…
              </>
            ) : (
              <>✨ Generate description with AI</>
            )}
          </button>
          <span className="text-sm text-zinc-400">
            Renseigne au moins le nom (FR) et la catégorie, puis clique pour générer description, SEO et points forts en FR / EN / DE.
          </span>
        </div>
        {aiError && <p className="mt-2 text-sm text-amber-400">{aiError}</p>}
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {error && (
          <div className="rounded-lg border border-red-800 bg-red-950/30 p-3 text-sm text-red-300">{error}</div>
        )}

        <section className="rounded-xl border border-zinc-700/50 bg-zinc-900/50 p-6">
          <h2 className="mb-4 text-lg font-medium text-zinc-200">Informations de base</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {LOCALES.map((loc) => (
              <div key={loc}>
                <label className={labelClass}>Nom ({LOCALE_LABELS[loc]})</label>
                <input
                  type="text"
                  value={name[loc]}
                  onChange={(e) => setLocalized(setName, loc, e.target.value)}
                  className={inputClass}
                  placeholder={loc === 'fr' ? 'Obligatoire' : 'Optionnel'}
                />
              </div>
            ))}
            <div>
              <label className={labelClass}>Slug (optionnel)</label>
              <input type="text" value={slug} onChange={(e) => setSlug(e.target.value)} className={inputClass} placeholder="auto si vide" />
            </div>
            <div>
              <label className={labelClass}>Catégorie</label>
              <select value={category} onChange={(e) => setCategory(e.target.value)} className={inputClass} required>
                <option value="">— Choisir —</option>
                {categories.map((c) => (
                  <option key={c._id} value={c._id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>Prix (CHF)</label>
              <input type="number" step="0.01" min="0" value={price} onChange={(e) => setPrice(e.target.value)} className={inputClass} required />
            </div>
            <div>
              <label className={labelClass}>Statut</label>
              <select value={status} onChange={(e) => setStatus(e.target.value as 'draft' | 'active')} className={inputClass}>
                <option value="draft">Brouillon</option>
                <option value="active">Actif</option>
              </select>
            </div>
          </div>
        </section>

        <section className="rounded-xl border border-zinc-700/50 bg-zinc-900/50 p-6">
          <h2 className="mb-4 text-lg font-medium text-zinc-200">Descriptions</h2>
          {LOCALES.map((loc) => (
            <div key={loc} className="mb-4">
              <label className={labelClass}>{LOCALE_LABELS[loc]} – Description</label>
              <textarea
                rows={4}
                value={description[loc]}
                onChange={(e) => setLocalized(setDescription, loc, e.target.value)}
                className={inputClass}
              />
              <label className={`${labelClass} mt-2`}>Résumé (court)</label>
              <input
                type="text"
                value={shortDescription[loc]}
                onChange={(e) => setLocalized(setShortDescription, loc, e.target.value)}
                className={inputClass}
              />
            </div>
          ))}
        </section>

        <section className="rounded-xl border border-zinc-700/50 bg-zinc-900/50 p-6">
          <h2 className="mb-4 text-lg font-medium text-zinc-200">SEO</h2>
          {LOCALES.map((loc) => (
            <div key={loc} className="mb-4">
              <label className={labelClass}>Meta title ({LOCALE_LABELS[loc]})</label>
              <input
                type="text"
                value={metaTitle[loc]}
                onChange={(e) => setLocalized(setMetaTitle, loc, e.target.value)}
                className={inputClass}
                maxLength={70}
              />
              <label className={`${labelClass} mt-2`}>Meta description</label>
              <textarea
                rows={2}
                value={metaDescription[loc]}
                onChange={(e) => setLocalized(setMetaDescription, loc, e.target.value)}
                className={inputClass}
                maxLength={160}
              />
            </div>
          ))}
        </section>

        <section className="rounded-xl border border-zinc-700/50 bg-zinc-900/50 p-6">
          <h2 className="mb-4 text-lg font-medium text-zinc-200">Points forts (bullet points)</h2>
          {LOCALES.map((loc) => (
            <div key={loc} className="mb-4">
              <label className={labelClass}>{LOCALE_LABELS[loc]}</label>
              {(bulletPoints[loc] || []).concat('').map((point, i) => (
                <input
                  key={i}
                  type="text"
                  value={point}
                  onChange={(e) => setBulletForLocale(loc, i, e.target.value)}
                  className={`${inputClass} mb-2`}
                  placeholder={`Point ${i + 1}`}
                />
              ))}
              <button type="button" onClick={() => addBullet(loc)} className="mt-1 text-sm text-blue-400 hover:underline">
                + Ajouter un point
              </button>
            </div>
          ))}
        </section>

        <div className="flex gap-3">
          <button type="submit" disabled={saving} className="rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-50">
            {saving ? 'Création…' : 'Créer le produit'}
          </button>
          <LocaleLink href="/admin/produits" className="rounded-lg border border-zinc-600 px-6 py-2.5 text-sm text-zinc-300 hover:bg-zinc-800">
            Annuler
          </LocaleLink>
        </div>
      </form>
    </div>
  );
}
