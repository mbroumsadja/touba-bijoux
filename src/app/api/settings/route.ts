import { hashPassword, requireAdmin } from '@/server/auth';
import { collections, NO_ID } from '@/server/db';
import { handle, json, readJson } from '@/server/http';
import { publicSettings, SETTINGS_TEXT_KEYS } from '@/server/validate';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const parseMinQty = (value: unknown): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.max(0, Math.min(10_000_000, Math.round(parsed))) : 0;
};

export const GET = handle(async (req) => {
  requireAdmin(req);
  const { settings } = await collections();
  const doc = await settings.findOne({ _id: 'main' } as never);
  return json(publicSettings(doc));
});

export const PUT = handle(async (req) => {
  requireAdmin(req);
  const body = await readJson(req);
  const patch: Record<string, unknown> = {};

  for (const key of SETTINGS_TEXT_KEYS) {
    if (Object.prototype.hasOwnProperty.call(body, key)) patch[key] = body[key];
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
      patch.passwordHash = hashPassword(password);
    }
  }

  const { settings } = await collections();
  await settings.updateOne({ _id: 'main' } as never, { $set: patch }, { upsert: true });
  const doc = await settings.findOne({ _id: 'main' } as never, NO_ID);
  return json(publicSettings(doc ?? {}));
});
