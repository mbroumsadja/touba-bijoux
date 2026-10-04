import { requireAdmin } from '@/server/auth';
import { invalidateCatalog, toApiProduct } from '@/server/catalog';
import { collections } from '@/server/db';
import { handle, json, readJson } from '@/server/http';
import { ownImageRef } from '@/server/images';
import { cleanProduct, validateProduct } from '@/server/validate';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type Ctx = { params: Promise<{ id: string }> };

export const PATCH = handle<Ctx>(async (req, { params }) => {
  requireAdmin(req);
  const { id } = await params;
  const patch = cleanProduct(await readJson(req), { partial: true });
  const { products } = await collections();

  let imagesChanged = false;
  if (Array.isArray(patch.images)) {
    // Le formulaire gérant renvoie les liens courts des photos inchangées : on les remplace par la photo enregistrée.
    const current = await products.findOne({ id }, { projection: { _id: 0, images: 1 } });
    if (!current) return json({ error: 'Produit introuvable.' }, 404);
    const stored: string[] = Array.isArray(current.images) ? current.images : [];
    const resolved = (patch.images as string[])
      .map((s) => {
        const ref = ownImageRef(s);
        if (!ref) return s;
        return ref.kind === 'p' && ref.id === id ? stored[ref.index] : undefined;
      })
      .filter((s): s is string => typeof s === 'string' && s.length > 0);
    patch.images = resolved;
    imagesChanged = resolved.length !== stored.length || resolved.some((s, i) => s !== stored[i]);
  }

  const err = validateProduct(patch, { partial: true });
  if (err) return json({ error: err }, 400);
  if (imagesChanged) patch.imgV = Date.now(); // nouvelle version = nouvelles adresses de photos = cache navigateur renouvelé
  else delete patch.images; // photos identiques : inutile de les réécrire

  const updated = Object.keys(patch).length
    ? await products.findOneAndUpdate({ id }, { $set: patch }, { returnDocument: 'after' })
    : await products.findOne({ id });
  if (!updated) return json({ error: 'Produit introuvable.' }, 404);
  invalidateCatalog();
  return json(toApiProduct(updated, true));
});

export const DELETE = handle<Ctx>(async (req, { params }) => {
  requireAdmin(req);
  const { id } = await params;
  const { products } = await collections();
  await products.deleteOne({ id });
  invalidateCatalog();
  return json({ ok: true });
});
