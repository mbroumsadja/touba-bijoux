import jwt from 'jsonwebtoken';
import { createHash, createHmac, randomBytes, scrypt, timingSafeEqual } from 'node:crypto';
import { HttpError } from './http';

// scrypt asynchrone : le calcul tourne sur le pool de threads de Node et ne bloque plus
// les autres requêtes (la version synchrone gelait tout le serveur ~50-100 ms à chaque connexion).
const scryptAsync = (password: string, salt: string, keylen: number) =>
  new Promise<Buffer>((resolve, reject) => scrypt(password, salt, keylen, (err, key) => (err ? reject(err) : resolve(key))));

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString('hex');
  return `scrypt$${salt}$${(await scryptAsync(password, salt, 32)).toString('hex')}`;
}

export async function checkPassword(password: string, stored: unknown): Promise<boolean> {
  const [scheme, salt, hash] = String(stored).split('$');
  if (scheme !== 'scrypt' || !salt || !hash) return false;
  const a = await scryptAsync(password, salt, 32);
  const b = Buffer.from(hash, 'hex');
  return a.length === b.length && timingSafeEqual(a, b);
}

/** Comparaison en temps constant de deux chaînes (quelle que soit leur longueur). */
export function safeEqual(a: string, b: string): boolean {
  const ha = createHash('sha256').update(a).digest();
  const hb = createHash('sha256').update(b).digest();
  return timingSafeEqual(ha, hb);
}

const g = globalThis as unknown as { _toubaSecret?: string };
function secret(): string {
  if (process.env.JWT_SECRET) return process.env.JWT_SECRET;
  if (!g._toubaSecret) {
    g._toubaSecret = randomBytes(32).toString('hex');
    console.warn('[touba] JWT_SECRET absent : les sessions gérant sont perdues à chaque redémarrage.');
  }
  return g._toubaSecret;
}

export const signAdminToken = () => jwt.sign({ role: 'admin' }, secret(), { expiresIn: '12h' });

/** Signature courte d'une valeur (liens de photos des produits masqués, réservés au gérant). */
export const signValue = (value: string) => createHmac('sha256', secret()).update(value).digest('hex').slice(0, 32);
export const verifySignature = (value: string, signature: string | null) =>
  Boolean(signature) && safeEqual(signValue(value), signature as string);

export function isAdminRequest(req: Request): boolean {
  const m = req.headers.get('authorization')?.match(/^Bearer\s+(.+)$/i) ?? null;
  if (!m) return false;
  try {
    const payload = jwt.verify(m[1], secret());
    return typeof payload === 'object' && payload.role === 'admin';
  } catch {
    return false;
  }
}

export function requireAdmin(req: Request): void {
  if (!isAdminRequest(req)) throw new HttpError('Session expirée : reconnectez-vous.', 401);
}

/** Limiteur en mémoire : `max` essais par fenêtre de `windowMs`, par clé. */
const buckets = (globalThis as unknown as { _toubaBuckets?: Map<string, number[]>; _toubaSweepAt?: number });
const SWEEP_EVERY_MS = 60_000;
const KEEP_MS = 15 * 60_000;

/** Supprime régulièrement les clés inactives : sans cela la Map grossit indéfiniment (une entrée par IP). */
function sweep(store: Map<string, number[]>, now: number) {
  if (now - (buckets._toubaSweepAt ?? 0) < SWEEP_EVERY_MS) return;
  buckets._toubaSweepAt = now;
  for (const [k, list] of store) {
    if (!list.length || now - list[list.length - 1] > KEEP_MS) store.delete(k);
  }
}

export function rateLimited(name: string, key: string, max: number, windowMs: number, { count = true } = {}): boolean {
  const store = (buckets._toubaBuckets ??= new Map());
  const k = `${name}:${key}`;
  const now = Date.now();
  sweep(store, now);
  const list = (store.get(k) || []).filter((t: number) => now - t < windowMs);
  if (count) list.push(now);
  store.set(k, list);
  return count ? list.length > max : list.length >= max;
}
export function recordAttempt(name: string, key: string) {
  const store = (buckets._toubaBuckets ??= new Map());
  const k = `${name}:${key}`;
  store.set(k, [...(store.get(k) || []), Date.now()].slice(-50));
}
