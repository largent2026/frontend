import type { MetadataRoute } from 'next';

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL
  || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null)
  || 'http://localhost:3000';

export default function robots(): MetadataRoute.Robots {
  const root = baseUrl.replace(/\/$/, '');
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin', '/compte', '/checkout', '/api/'],
      },
    ],
    sitemap: `${root}/sitemap.xml`,
  };
}
