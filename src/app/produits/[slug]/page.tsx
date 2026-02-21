import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { productsApi, reviewsApi } from '@/lib/api';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { ProductGallery } from '@/components/product/ProductGallery';
import { ProductInfo } from '@/components/product/ProductInfo';
import { SimilarProducts } from '@/components/product/SimilarProducts';
import { ReviewsSection } from '@/components/product/ReviewsSection';

const locale = 'fr';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  try {
    const { product } = await productsApi.getBySlug(slug, locale);
    const metaTitle = product.seo?.metaTitle?.[locale] || product.name;
    const metaDesc = product.seo?.metaDescription?.[locale] || product.shortDescription || product.description;
    return {
      title: metaTitle,
      description: metaDesc || undefined,
      openGraph: { title: metaTitle, description: metaDesc || undefined },
    };
  } catch {
    return { title: 'Produit' };
  }
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  let product;
  let similar: Awaited<ReturnType<typeof productsApi.getSimilar>>['products'] = [];
  let reviewsData: { reviews: Awaited<ReturnType<typeof reviewsApi.listByProduct>>['reviews']; stats: { average: number; count: number }; pagination: { page: number; limit: number; total: number; totalPages: number } };

  try {
    const res = await productsApi.getBySlug(slug, locale);
    product = res.product;
  } catch {
    notFound();
  }

  if (!product) notFound();

  try {
    const [similarRes, reviewsRes] = await Promise.all([
      productsApi.getSimilar(slug, locale),
      reviewsApi.listByProduct(product._id, { limit: '5' }),
    ]);
    similar = similarRes.products || [];
    reviewsData = {
      reviews: reviewsRes.reviews || [],
      stats: reviewsRes.stats || { average: 0, count: 0 },
      pagination: reviewsRes.pagination || { page: 1, limit: 5, total: 0, totalPages: 0 },
    };
  } catch {
    reviewsData = { reviews: [], stats: { average: 0, count: 0 }, pagination: { page: 1, limit: 5, total: 0, totalPages: 0 } };
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6">
        <div className="grid gap-12 lg:grid-cols-2">
          <ProductGallery product={product} />
          <ProductInfo product={product} />
        </div>

        {similar?.length ? (
          <section className="mt-16">
            <h2 className="mb-6 text-xl font-semibold">Produits similaires</h2>
            <SimilarProducts products={similar} />
          </section>
        ) : null}

        <section className="mt-16">
          <ReviewsSection productId={product._id} initialReviews={reviewsData.reviews} initialStats={reviewsData.stats} />
        </section>
      </main>
      <Footer />
    </div>
  );
}
