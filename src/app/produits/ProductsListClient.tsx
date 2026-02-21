'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { useLocale } from '@/contexts/LocaleContext';
import { ProductCard } from '@/components/product/ProductCard';
import type { Product } from '@/lib/api';
import type { Pagination } from '@/lib/api';

export function ProductsListClient({
  initialProducts,
  initialPagination,
}: {
  initialProducts: Product[];
  initialPagination: Pagination;
}) {
  const { t } = useTranslation();
  const locale = useLocale();
  const router = useRouter();
  const currentSearchParams = useSearchParams();
  const page = initialPagination?.page ?? 1;
  const totalPages = initialPagination?.totalPages ?? 1;

  const goToPage = (p: number) => {
    const next = new URLSearchParams(currentSearchParams.toString());
    next.set('page', String(p));
    router.push(`/${locale}/produits?${next.toString()}`);
  };

  if (!initialProducts?.length) {
    return (
      <p className="py-12 text-center text-muted-foreground">
        {t('products.noResults')}
      </p>
    );
  }

  return (
    <>
      <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
        {initialProducts.map((product, i) => (
          <ProductCard key={product._id} product={product} index={i} />
        ))}
      </div>

      {totalPages > 1 && (
        <div className="mt-12 flex items-center justify-center gap-2">
          <button
            onClick={() => goToPage(page - 1)}
            disabled={page <= 1}
            className="rounded-lg border border-border bg-background px-4 py-2 text-sm disabled:opacity-50"
          >
            {t('products.previous')}
          </button>
          <span className="text-sm text-muted-foreground">
            {t('products.page', { current: page, total: totalPages })}
          </span>
          <button
            onClick={() => goToPage(page + 1)}
            disabled={page >= totalPages}
            className="rounded-lg border border-border bg-background px-4 py-2 text-sm disabled:opacity-50"
          >
            {t('products.next')}
          </button>
        </div>
      )}
    </>
  );
}
