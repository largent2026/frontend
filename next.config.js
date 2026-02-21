/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  async redirects() {
    return [
      { source: '/:locale(fr|en|de)/mentions-legales', destination: '/:locale/legal', permanent: true },
      { source: '/:locale(fr|en|de)/cgv', destination: '/:locale/terms-of-sale', permanent: true },
    ];
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'res.cloudinary.com', pathname: '/**' },
      { protocol: 'https', hostname: 'placehold.co', pathname: '/**' },
    ],
    unoptimized: false,
  },
};

module.exports = nextConfig;
