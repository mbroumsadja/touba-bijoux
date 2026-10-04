import { after } from 'next/server';
import { checkPassword, hashPassword, rateLimited, recordAttempt, safeEqual, signAdminToken } from '@/server/auth';
import { collections } from '@/server/db';
import { handle, json, readJson } from '@/server/http';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const configuredAdminPassword = () => (process.env.ADMIN_PASSWORD || 'touba2026').trim();

export const POST = handle(async (req) => {
  const forwarded = req.headers.get('x-forwarded-for') ?? req.headers.get('x-real-ip') ?? 'x';
  const key = `${forwarded}:${req.headers.get('user-agent') ?? 'browser'}`;
  if (rateLimited('login', key, 5, 60_000)) {
    return json({ error: 'Trop de tentatives. Réessayez dans 1 minute.' }, 429);
  }

  const body = await readJson(req);
  const password = typeof body.password === 'string' ? body.password : '';
  if (!password) {
    recordAttempt('login', key);
    return json({ error: 'Mot de passe requis.' }, 400);
  }

  const { settings } = await collections();
  const doc = await settings.findOne({ _id: 'main' } as never, { projection: { _id: 0, passwordHash: 1 } });
  const envPassword = configuredAdminPassword();

  if (safeEqual(password, envPassword)) {
    // Chemin rapide : le mot de passe de l'environnement est validé tout de suite, sans attendre le calcul scrypt.
    // La mise à jour du hash enregistré (si besoin) se fait après la réponse.
    after(async () => {
      try {
        if (doc && (await checkPassword(password, doc.passwordHash))) return;
        await settings.updateOne({ _id: 'main' } as never, { $set: { passwordHash: await hashPassword(envPassword) } }, { upsert: true });
      } catch (e) {
        console.error('[touba] mise à jour du mot de passe enregistré', e);
      }
    });
    return json({ token: signAdminToken() });
  }

  if (!doc || !(await checkPassword(password, doc.passwordHash))) {
    recordAttempt('login', key);
    return json({ error: 'Mot de passe invalide.' }, 401);
  }

  return json({ token: signAdminToken() });
});
