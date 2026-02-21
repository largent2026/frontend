import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { productsApi, reviewsApi } from '@/lib/api';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { ProductGallery } from '@/components/product/ProductGallery';
import { ProductInfo } from '@/components/product/ProductInfo';
import { SimilarProducts } from '@/components/product/SimilarProducts';
import { ReviewsSection } from '@/components/product/ReviewsSection';
import { RecommendationTracker } from '@/components/recommendations/RecommendationTracker';
import { getTranslations } from '@/i18n/server';
import { locales } from '@/i18n/config';
import type { Locale } from '@/i18n/config';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  try {
    const { product } = await productsApi.getBySlug(slug, locale);
    const metaTitle = (product.seo?.metaTitle as Record<string, string>)?.[locale] || product.name;
    const metaDesc =
      (product.seo?.metaDescription as Record<string, string>)?.[locale] ||
      product.shortDescription ||
      product.description;
    return {
      title: metaTitle,
      description: (typeof metaDesc === 'string' ? metaDesc : undefined) || undefined,
      openGraph: { title: metaTitle, description: (typeof metaDesc === 'string' ? metaDesc : undefined) || undefined },
      alternates: {
        canonical: `/${locale}/produits/${slug}`,
        languages: Object.fromEntries(
          locales.map((l) => [l, `/${l}/produits/${slug}`])
        ),
      },
    };
  } catch {
    return { title: 'Produit' };
  }
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;

  let product: Awaited<ReturnType<typeof productsApi.getBySlug>>['product'] | undefined;
  let similar: Awaited<ReturnType<typeof productsApi.getSimilar>>['products'] = [];
  let reviewsData: {
    reviews: Awaited<ReturnType<typeof reviewsApi.listByProduct>>['reviews'];
    stats: { average: number; count: number };
    pagination: { page: number; limit: number; total: number; totalPages: number };
  };

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
    reviewsData = {
      reviews: [],
      stats: { average: 0, count: 0 },
      pagination: { page: 1, limit: 5, total: 0, totalPages: 0 },
    };
  }

  const categoryId =
    product.category && typeof product.category === 'object' && '_id' in product.category
      ? (product.category as { _id: string })._id
      : typeof product.category === 'string'
        ? product.category
        : undefined;

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');
  const nameObj = product.name && typeof product.name === 'object' ? (product.name as Record<string, string>) : undefined;
  const productName = typeof product.name === 'string' ? product.name : (nameObj?.[locale] || nameObj?.fr) ?? '';
  const descObj = product.description && typeof product.description === 'object' ? (product.description as Record<string, string>) : undefined;
  const productDesc = typeof product.description === 'string' ? product.description : descObj?.[locale] || descObj?.fr;
  const imageUrl = product.images?.[0]?.url;
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: productName,
    description: productDesc ? String(productDesc).slice(0, 500) : undefined,
    image: imageUrl ? (imageUrl.startsWith('http') ? imageUrl : `${siteUrl}${imageUrl}`) : undefined,
    sku: product.sku,
    offers: {
      '@type': 'Offer',
      price: product.price,
      priceCurrency: 'CHF',
      availability: product.inStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
    },
  };

  return (
    <div className="flex min-h-screen flex-col">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <RecommendationTracker productId={product._id} categoryId={categoryId} />
      <Header />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6">
        <div className="grid gap-12 lg:grid-cols-2">
          <ProductGallery product={product} />
          <ProductInfo product={product} />
        </div>

        {similar?.length ? (
          <section className="mt-16">
            <h2 className="mb-6 text-xl font-semibold tracking-tight">
              {getTranslations(locale as Locale)('recommendations.similar')}
            </h2>
            <SimilarProducts products={similar} />
          </section>
        ) : null}

        <section className="mt-16">
          <ReviewsSection
            productId={product._id}
            initialReviews={reviewsData.reviews}
            initialStats={reviewsData.stats}
          />
        </section>
      </main>
      <Footer />
    </div>
  );
}
