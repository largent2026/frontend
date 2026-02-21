'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useLocale } from '@/contexts/LocaleContext';
import { cn } from '@/lib/utils';
import { pushCategoryView } from '@/lib/recommendationHistory';
import type { Category } from '@/lib/api';

const SORT_OPTIONS = [
  { value: 'newest', label: 'Plus récents' },
  { value: 'price_asc', label: 'Prix croissant' },
  { value: 'price_desc', label: 'Prix décroissant' },
  { value: 'popular', label: 'Popularité' },
] as const;

export function ProductFilters({ categories }: { categories: Category[] }) {
  const locale = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();

  const category = searchParams.get('category') ?? '';
  const sort = searchParams.get('sort') ?? 'newest';
  const minPrice = searchParams.get('minPrice') ?? '';
  const maxPrice = searchParams.get('maxPrice') ?? '';

  const update = (key: string, value: string) => {
    if (key === 'category' && value) pushCategoryView(value);
    const next = new URLSearchParams(searchParams.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    next.delete('page');
    router.push(`/${locale}/produits?${next.toString()}`);
  };

  return (
    <aside className="space-y-6 border-r border-border pr-6">
      <div>
        <h3 className="mb-2 text-sm font-medium">Catégorie</h3>
        <select
          value={category}
          onChange={(e) => update('category', e.target.value)}
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
        >
          <option value="">Toutes</option>
          {categories.map((c) => (
            <option key={c._id} value={c._id}>{c.name}</option>
          ))}
        </select>
      </div>
      <div>
        <h3 className="mb-2 text-sm font-medium">Prix</h3>
        <div className="flex gap-2">
          <input
            type="number"
            placeholder="Min"
            value={minPrice}
            onChange={(e) => update('minPrice', e.target.value)}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
          />
          <input
            type="number"
            placeholder="Max"
            value={maxPrice}
            onChange={(e) => update('maxPrice', e.target.value)}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
          />
        </div>
      </div>
      <div>
        <h3 className="mb-2 text-sm font-medium">Tri</h3>
        <div className="flex flex-col gap-1">
          {SORT_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => update('sort', opt.value)}
              className={cn(
                'rounded-lg px-3 py-2 text-left text-sm transition',
                sort === opt.value ? 'bg-foreground text-background' : 'bg-muted/50 hover:bg-muted'
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
    </aside>
  );
}
