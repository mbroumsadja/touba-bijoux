import { isAdminRequest, requireAdmin } from '@/server/auth';
import { invalidateCatalog, listProducts, toApiProduct } from '@/server/catalog';
import { collections } from '@/server/db';
import { handle, json, readJson } from '@/server/http';
import { ownImageRef } from '@/server/images';
import { cleanProduct, validateProduct } from '@/server/validate';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const GET = handle(async (req) => json(await listProducts(isAdminRequest(req))));

export const POST = handle(async (req) => {
  requireAdmin(req);
  const p = cleanProduct(await readJson(req), { partial: false });
  p.images = (p.images as string[]).filter((s) => !ownImageRef(s)); // un nouveau produit n'a encore aucune photo enregistrée à réutiliser
  const err = validateProduct(p, { partial: false });
  if (err) return json({ error: err }, 400);
  const now = Date.now();
  const doc = { ...p, id: `p-${now}`, createdAt: now, imgV: now };
  const { products } = await collections();
  await products.insertOne({ ...doc });
  invalidateCatalog();
  return json(toApiProduct(doc, true), 201);
});
