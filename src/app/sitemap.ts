import type { MetadataRoute } from 'next';
import { locales } from '@/i18n/config';

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL
  || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null)
  || 'http://localhost:3000';

function cleanBaseUrl(url: string): string {
  return url.replace(/\/$/, '');
}

const root = cleanBaseUrl(baseUrl);

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = [];

  const now = new Date();

  const staticPaths = [
    '',
    '/produits',
    '/panier',
    '/faq',
    '/legal',
    '/terms-of-sale',
    '/privacy',
    '/returns',
    '/terms',
    '/cookies',
    '/contact',
  ];
  for (const locale of locales) {
    for (const path of staticPaths) {
      entries.push({
        url: `${root}/${locale}${path}`,
        lastModified: now,
        changeFrequency: path === '' || path === '/produits' ? 'daily' : path === '/panier' ? 'monthly' : 'weekly',
        priority: path === '' ? 1 : path === '/produits' ? 0.9 : path === '/panier' ? 0.5 : 0.7,
      });
    }
  }

  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';
    const res = await fetch(`${apiUrl}/products?limit=1000&page=1`, { next: { revalidate: 3600 } });
    const data = await res.json();
    const products = data?.products ?? [];
    for (const p of products) {
      const slug = p.slug;
      if (!slug) continue;
      for (const locale of locales) {
        entries.push({
          url: `${root}/${locale}/produits/${slug}`,
          lastModified: p.updatedAt ? new Date(p.updatedAt) : now,
          changeFrequency: 'weekly',
          priority: 0.8,
        });
      }
    }
  } catch {
    // Ignore: API peut être indisponible au build
  }

  return entries;
}
