import { requireAdmin } from '@/server/auth';
import { collections, NO_ID } from '@/server/db';
import { handle, json, readJson } from '@/server/http';
import { cleanProduct, validateProduct, withoutCreatedAt } from '@/server/validate';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type Ctx = { params: Promise<{ id: string }> };

export const PATCH = handle<Ctx>(async (req, { params }) => {
  requireAdmin(req);
  const { id } = await params;
  const patch = cleanProduct(await readJson(req), { partial: true });
  const err = validateProduct(patch, { partial: true });
  if (err) return json({ error: err }, 400);
  const { products } = await collections();
  const r = await products.updateOne({ id }, { $set: patch });
  if (!r.matchedCount) return json({ error: 'Produit introuvable.' }, 404);
  const updated = await products.findOne({ id }, NO_ID);
  return json(withoutCreatedAt(updated ?? {}));
});

export const DELETE = handle<Ctx>(async (req, { params }) => {
  requireAdmin(req);
  const { id } = await params;
  const { products } = await collections();
  await products.deleteOne({ id });
  return json({ ok: true });
});
