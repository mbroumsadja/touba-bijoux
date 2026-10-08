/** Adresse publique du site (domaine validé dans Google Search Console), sans « / » final. */
export const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/+$/, '');
