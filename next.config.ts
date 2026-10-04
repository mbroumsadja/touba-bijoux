import type { NextConfig } from 'next';

// Images, icônes et manifeste du site : le navigateur les garde 1 jour sans rien redemander,
// puis les réutilise pendant 30 jours le temps de vérifier en arrière-plan (par défaut Next.js impose max-age=0 :
// chaque visite retéléchargeait ou revalidait toutes les photos).
const STATIC_CACHE = 'public, max-age=86400, stale-while-revalidate=2592000';

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers() {
    return [
      { source: '/images/:path*', headers: [{ key: 'Cache-Control', value: STATIC_CACHE }] },
      { source: '/icons/:path*', headers: [{ key: 'Cache-Control', value: STATIC_CACHE }] },
      { source: '/manifest.webmanifest', headers: [{ key: 'Cache-Control', value: 'public, max-age=86400' }] },
    ];
  },
};

export default nextConfig;
