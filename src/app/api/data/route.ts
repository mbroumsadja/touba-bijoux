import { isAdminRequest } from '@/server/auth';
import { loadCatalog } from '@/server/catalog';
import { handle, respondJson } from '@/server/http';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const GET = handle(async (req) => {
  const admin = isAdminRequest(req);
  const { body, etag, gz } = await loadCatalog(admin);

  if (admin) {
    // Le gérant voit toujours l'état exact (produits masqués inclus) : jamais de cache.
    return respondJson(req, body, { 'Cache-Control': 'private, no-store', Vary: 'Authorization' });
  }

  // Visiteurs : le navigateur revalidate (réponse 304 de quelques octets si rien n'a changé),
  // et un CDN éventuel peut servir la copie pendant 30 s.
  const headers = {
    ETag: etag,
    Vary: 'Authorization',
    'Cache-Control': 'public, max-age=0, must-revalidate, s-maxage=30, stale-while-revalidate=300',
  };
  if (req.headers.get('if-none-match')?.split(',').some((t) => t.trim() === etag)) {
    return new Response(null, { status: 304, headers });
  }
  return respondJson(req, body, headers, gz);
});
