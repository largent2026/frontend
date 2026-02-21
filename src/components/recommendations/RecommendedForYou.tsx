'use client';

import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocale } from '@/contexts/LocaleContext';
import { recommendationsApi } from '@/lib/api';
import { getAccessToken } from '@/lib/auth';
import { getRecentProductIds, getRecentCategoryIds } from '@/lib/recommendationHistory';
import { ProductCard } from '@/components/product/ProductCard';
import { LocaleLink } from '@/components/LocaleLink';
import type { Product } from '@/lib/api';

const LIMIT = 12;

export function RecommendedForYou() {
  const { t } = useTranslation();
  const locale = useLocale();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const token = getAccessToken();
    const recentProductIds = getRecentProductIds();
    const recentCategoryIds = getRecentCategoryIds();

    recommendationsApi
      .getRecommendations(
        { locale, limit: LIMIT, recentProductIds, recentCategoryIds },
        token
      )
      .then((res) => {
        if (!cancelled && res.products?.length) setProducts(res.products);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [locale]);

  if (loading) {
    return (
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <h2 className="mb-6 text-xl font-semibold tracking-tight">
          {t('recommendations.forYou')}
        </h2>
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-[280px] animate-pulse rounded-2xl bg-muted/50" />
          ))}
        </div>
      </section>
    );
  }

  if (!products.length) return null;

  return (
    <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <h2 className="mb-6 text-xl font-semibold tracking-tight">
        {t('recommendations.forYou')}
      </h2>
      <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
        {products.map((product, i) => (
          <ProductCard key={product._id} product={product} index={i} />
        ))}
      </div>
      <div className="mt-8 text-center">
        <LocaleLink
          href="/produits"
          className="inline-block rounded-lg border border-border bg-background px-6 py-2.5 text-sm font-medium transition hover:bg-muted"
        >
          {t('recommendations.seeAll')}
        </LocaleLink>
      </div>
    </section>
  );
}
