import { requireAdmin } from '@/server/auth';
import { buildCatalog, invalidateCatalog } from '@/server/catalog';
import { collections } from '@/server/db';
import { handle, respondJson } from '@/server/http';
import { SEED_PRODUCTS, SEED_SETTINGS } from '@/server/seed';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const POST = handle(async (req) => {
  requireAdmin(req);
  const { products, settings } = await collections();
  await products.deleteMany({});
  const now = Date.now();
  await products.insertMany(SEED_PRODUCTS.map((product, index) => ({ ...product, createdAt: now - index })));
  await settings.updateOne({ _id: 'main' } as never, { $set: { ...SEED_SETTINGS } }, { upsert: true });
  invalidateCatalog();

  const { body } = await buildCatalog(true);
  return respondJson(req, body, { 'Cache-Control': 'private, no-store' });
});
