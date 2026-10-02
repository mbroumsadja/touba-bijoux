import jwt from 'jsonwebtoken';
import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import { HttpError } from './http';

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex');
  return `scrypt$${salt}$${scryptSync(password, salt, 32).toString('hex')}`;
}

export function checkPassword(password: string, stored: unknown): boolean {
  const [scheme, salt, hash] = String(stored).split('$');
  if (scheme !== 'scrypt' || !salt || !hash) return false;
  const a = scryptSync(password, salt, 32);
  const b = Buffer.from(hash, 'hex');
  return a.length === b.length && timingSafeEqual(a, b);
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

export function isAdminRequest(req: Request): boolean {
  const m = /^Bearer (.+)$/.exec(req.headers.get('authorization') || '');
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
const buckets = (globalThis as unknown as { _toubaBuckets?: Map<string, number[]> });
export function rateLimited(name: string, key: string, max: number, windowMs: number, { count = true } = {}): boolean {
  const store = (buckets._toubaBuckets ??= new Map());
  const k = `${name}:${key}`;
  const now = Date.now();
  const list = (store.get(k) || []).filter((t: number) => now - t < windowMs);
  if (count) list.push(now);
  store.set(k, list);
  return count ? list.length > max : list.length >= max;
}
export function recordAttempt(name: string, key: string) {
  const store = (buckets._toubaBuckets ??= new Map());
  const k = `${name}:${key}`;
  store.set(k, [...(store.get(k) || []), Date.now()]);
}
