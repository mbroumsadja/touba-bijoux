import { requireAdmin } from '@/server/auth';
import { collections, NO_ID } from '@/server/db';
import { handle, json } from '@/server/http';
import { SEED_PRODUCTS, SEED_SETTINGS } from '@/server/seed';
import { publicSettings, withoutCreatedAt } from '@/server/validate';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const POST = handle(async (req) => {
  requireAdmin(req);
  const { products, settings } = await collections();
  await products.deleteMany({});
  const now = Date.now();
  await products.insertMany(SEED_PRODUCTS.map((product, index) => ({ ...product, createdAt: now - index })));
  await settings.updateOne({ _id: 'main' } as never, { $set: { ...SEED_SETTINGS } }, { upsert: true });

  const doc = await settings.findOne({ _id: 'main' } as never);
  const list = await products.find({}, NO_ID).sort({ createdAt: -1 }).toArray();
  return json({ products: list.map(withoutCreatedAt), settings: publicSettings(doc) });
});
