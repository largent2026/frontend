import { Suspense } from 'react';
import { productsApi, categoriesApi } from '@/lib/api';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { ProductCard } from '@/components/product/ProductCard';
import { ProductCardSkeleton } from '@/components/product/ProductCardSkeleton';
import { ProductFilters } from '@/components/product/ProductFilters';
import { ProductsListClient } from './ProductsListClient';

export const dynamic = 'force-dynamic';
export const revalidate = 60;

export default async function ProduitsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; sort?: string; category?: string; minPrice?: string; maxPrice?: string }>;
}) {
  const params = await searchParams;
  const locale = 'fr';

  const [categoriesRes, initialData] = await Promise.all([
    categoriesApi.list(locale),
    productsApi.list({
      page: params.page || '1',
      limit: '12',
      sort: params.sort || 'newest',
      category: params.category,
      minPrice: params.minPrice,
      maxPrice: params.maxPrice,
      locale,
    }),
  ]);

  const categories = categoriesRes.categories || [];
  const { products, pagination } = initialData;

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6">
        <h1 className="mb-8 text-2xl font-semibold tracking-tight">Produits</h1>

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
