import { Suspense } from 'react';
import { productsApi, categoriesApi } from '@/lib/api';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { ProductCard } from '@/components/product/ProductCard';
import { ProductCardSkeleton } from '@/components/product/ProductCardSkeleton';
import { ProductFilters } from '@/components/product/ProductFilters';
import { ProductSearchBar } from '@/components/product/ProductSearchBar';
import { ProductsListClient } from '@/app/produits/ProductsListClient';
import { getTranslations } from '@/i18n/server';
import type { Locale } from '@/i18n/config';

export const dynamic = 'force-dynamic';
export const revalidate = 60;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = getTranslations(locale as Locale);
  return {
    title: t('seo.productsTitle'),
    description: t('seo.productsDescription'),
    alternates: {
      canonical: `/${locale}/produits`,
      languages: Object.fromEntries(
        (['fr', 'en', 'de'] as const).map((l) => [l, `/${l}/produits`])
      ),
    },
  };
}

export default async function ProduitsPage({
  searchParams,
  params,
}: {
  searchParams: Promise<{ q?: string; page?: string; sort?: string; category?: string; minPrice?: string; maxPrice?: string }>;
  params: Promise<{ locale: string }>;
}) {
  const [query, { locale }] = await Promise.all([searchParams, params]);
  const searchQuery = typeof query.q === 'string' ? query.q.trim() : '';
  const useSearchApi = searchQuery.length > 0;

  const [categoriesRes, initialData] = await Promise.all([
    categoriesApi.list(locale),
    useSearchApi
      ? productsApi.search(searchQuery, {
          locale,
          page: query.page ? parseInt(query.page, 10) : 1,
          limit: 12,
          sort: query.sort || 'newest',
        })
      : productsApi.list({
          page: query.page || '1',
          limit: '12',
          sort: query.sort || 'newest',
          category: query.category,
          minPrice: query.minPrice,
          maxPrice: query.maxPrice,
          locale,
        }),
  ]);

  const categories = categoriesRes.categories || [];
  const { products, pagination } = initialData;
  const t = (await import('@/i18n/server')).getTranslations(locale as Locale);

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6">
        <h1 className="mb-2 text-2xl font-semibold tracking-tight">
          {t('products.title')}
        </h1>
        {useSearchApi && (
          <p className="mb-4 text-sm text-muted-foreground">
            {t('products.resultsFor', { query: searchQuery })}
          </p>
        )}
        <div className="mb-6">
          <ProductSearchBar initialQuery={searchQuery} />
        </div>

        <div className="flex flex-col gap-8 lg:flex-row">
          <div className="w-full shrink-0 lg:w-56">
            <ProductFilters categories={categories} />
          </div>

          <div className="min-w-0 flex-1">
            <Suspense fallback={<ProductsGridSkeleton />}>
              <ProductsListClient
                initialProducts={products}
                initialPagination={pagination}
              />
            </Suspense>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

function ProductsGridSkeleton() {
  return (
    <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}
