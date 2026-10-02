import { checkPassword, hashPassword, rateLimited, recordAttempt, signAdminToken } from '@/server/auth';
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
  const doc = await settings.findOne({ _id: 'main' } as never);
  const envPassword = configuredAdminPassword();
  const passwordMatchesStored = doc ? checkPassword(password, doc.passwordHash) : false;
  const passwordMatchesEnv = password === envPassword;

  if (!doc && !passwordMatchesEnv) {
    recordAttempt('login', key);
    return json({ error: 'Mot de passe invalide.' }, 401);
  }

  if (!passwordMatchesStored && !passwordMatchesEnv) {
    recordAttempt('login', key);
    return json({ error: 'Mot de passe invalide.' }, 401);
  }

  if (doc && !passwordMatchesStored && passwordMatchesEnv) {
    await settings.updateOne({ _id: 'main' } as never, { $set: { passwordHash: hashPassword(envPassword) } }, { upsert: true });
  }

  return json({ token: signAdminToken() });
});
