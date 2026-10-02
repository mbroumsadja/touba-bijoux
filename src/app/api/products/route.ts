import { requireAdmin } from '@/server/auth';
import { collections } from '@/server/db';
import { handle, json, readJson } from '@/server/http';
import { cleanProduct, validateProduct, withoutCreatedAt } from '@/server/validate';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const POST = handle(async (req) => {
  requireAdmin(req);
  const p = cleanProduct(await readJson(req), { partial: false });
  const err = validateProduct(p, { partial: false });
  if (err) return json({ error: err }, 400);
  const doc = { ...p, id: `p-${Date.now()}`, createdAt: Date.now() };
  const { products } = await collections();
  await products.insertOne({ ...doc });
  return json(withoutCreatedAt(doc), 201);
});
