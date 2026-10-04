import { hashPassword, requireAdmin } from '@/server/auth';
import { invalidateCatalog } from '@/server/catalog';
import { collections } from '@/server/db';
import { handle, json, readJson } from '@/server/http';
import { IMAGE_SETTING_KEYS, isAcceptableImage, ownImageRef } from '@/server/images';
import { publicSettings, SETTINGS_TEXT_KEYS } from '@/server/validate';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const parseMinQty = (value: unknown): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.max(0, Math.min(10_000_000, Math.round(parsed))) : 0;
};

const NO_PASSWORD = { projection: { passwordHash: 0 } };

export const GET = handle(async (req) => {
  requireAdmin(req);
  const { settings } = await collections();
  const doc = await settings.findOne({ _id: 'main' } as never, NO_PASSWORD);
  return json(publicSettings(doc));
});

export const PUT = handle(async (req) => {
  requireAdmin(req);
  const body = await readJson(req);
  const patch: Record<string, unknown> = {};

  for (const key of SETTINGS_TEXT_KEYS) {
    if (!Object.prototype.hasOwnProperty.call(body, key)) continue;
    const value = body[key];
    if (typeof value !== 'string') continue;
    if (IMAGE_SETTING_KEYS.includes(key)) {
      if (ownImageRef(value)) continue; // lien renvoyé tel quel par le formulaire : la photo enregistrée ne change pas
      if (value && !isAcceptableImage(value)) return json({ error: 'Photo invalide.' }, 400);
      patch[key] = value;
      patch[`${key}V`] = Date.now(); // nouvelle version = cache navigateur renouvelé
    } else {
      patch[key] = value;
    }
  }

  if (Object.prototype.hasOwnProperty.call(body, 'wholesaleMinQty')) {
    patch.wholesaleMinQty = parseMinQty(body.wholesaleMinQty);
  }

  if (Object.prototype.hasOwnProperty.call(body, 'newPassword')) {
    const password = typeof body.newPassword === 'string' ? body.newPassword.trim() : '';
    if (password) {
      if (password.length < 6) {
        return json({ error: 'Le nouveau mot de passe doit contenir au moins 6 caractères.' }, 400);
      }
      patch.passwordHash = await hashPassword(password);
    }
  }

  const { settings } = await collections();
  if (Object.keys(patch).length) {
    await settings.updateOne({ _id: 'main' } as never, { $set: patch }, { upsert: true });
    invalidateCatalog();
  }
  const doc = await settings.findOne({ _id: 'main' } as never, NO_PASSWORD);
  return json(publicSettings(doc ?? {}));
});
