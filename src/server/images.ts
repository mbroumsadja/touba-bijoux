// Photos : stockées en base64 dans MongoDB, mais JAMAIS renvoyées en base64 au navigateur.
// L'API publie des liens courts (/api/img/...) que le navigateur met en cache pour un an.

export const IMAGE_SETTING_KEYS = ['bannerImage', 'shopPhoto'];

const DATA_URL = /^data:(image\/(?:png|jpe?g|webp|gif|avif));base64,/i;
const OWN_PRODUCT = /^\/api\/img\/p\/([^/?#]+)\/(\d{1,2})(?:[?#].*)?$/;
const OWN_SETTING = /^\/api\/img\/s\/([A-Za-z]+)(?:[?#].*)?$/;

export const isDataUrl = (s: unknown): s is string => typeof s === 'string' && s.startsWith('data:');

/** Formats acceptés à l'enregistrement : photo raster en base64, lien interne, chemin du site ou adresse http(s). */
export function isAcceptableImage(s: string): boolean {
  if (DATA_URL.test(s)) return true; // pas de SVG : un SVG servi depuis notre domaine pourrait exécuter du script
  if (ownImageRef(s)) return true;
  return (s.startsWith('/') && !s.startsWith('//') && !s.startsWith('/\\')) || /^https?:\/\//i.test(s);
}

export type OwnImageRef = { kind: 'p'; id: string; index: number } | { kind: 's'; key: string };

/** Reconnaît un de nos propres liens de photo (renvoyé tel quel par le formulaire gérant quand la photo n'a pas changé). */
export function ownImageRef(s: string): OwnImageRef | null {
  const p = OWN_PRODUCT.exec(s);
  if (p) return { kind: 'p', id: decodeURIComponent(p[1]), index: Number(p[2]) };
  const k = OWN_SETTING.exec(s);
  if (k && IMAGE_SETTING_KEYS.includes(k[1])) return { kind: 's', key: k[1] };
  return null;
}

export const productImageUrl = (id: string, index: number, version: unknown) =>
  `/api/img/p/${encodeURIComponent(id)}/${index}?v=${version ?? 0}`;
export const settingImageUrl = (key: string, version: unknown) => `/api/img/s/${key}?v=${version ?? 0}`;

export function decodeDataUrl(s: string): { mime: string; data: Buffer } | null {
  const m = DATA_URL.exec(s);
  if (!m) return null;
  return { mime: m[1].toLowerCase(), data: Buffer.from(s.slice(m[0].length), 'base64') };
}

/* ---- petit cache mémoire des photos décodées (évite de relire MongoDB pour chaque visiteur) ---- */

type Decoded = { mime: string; data: Buffer };
const MAX_CACHE_BYTES = 24 * 1024 * 1024;
const g = globalThis as unknown as { _toubaImgCache?: { map: Map<string, Decoded>; bytes: number } };
const store = () => (g._toubaImgCache ??= { map: new Map(), bytes: 0 });

function cacheGet(key: string): Decoded | undefined {
  const c = store();
  const hit = c.map.get(key);
  if (hit) {
    c.map.delete(key); // le plus récemment utilisé passe en fin de Map
    c.map.set(key, hit);
  }
  return hit;
}

function cachePut(key: string, value: Decoded) {
  const c = store();
  if (value.data.length > MAX_CACHE_BYTES / 4) return;
  c.map.set(key, value);
  c.bytes += value.data.length;
  for (const [oldKey, old] of c.map) {
    if (c.bytes <= MAX_CACHE_BYTES) break;
    c.map.delete(oldKey);
    c.bytes -= old.data.length;
  }
}

const IMMUTABLE = 'max-age=31536000, immutable';

/**
 * Sert une photo avec un cache navigateur d'un an quand l'adresse porte la bonne version (?v=…).
 * `load` ne lit la photo dans MongoDB que si elle n'est ni en mémoire ni déjà chez le navigateur.
 */
export async function serveImage(
  req: Request,
  opts: { cacheKey: string; current: string; requested: string | null; priv: boolean; load: () => Promise<string | undefined> },
): Promise<Response> {
  const scope = opts.priv ? 'private' : 'public';
  const fresh = opts.requested === opts.current;
  const cacheControl = fresh ? `${scope}, ${IMMUTABLE}` : `${scope}, max-age=60`;
  const etag = `"${opts.cacheKey}-${opts.current}"`;

  if (req.headers.get('if-none-match')?.split(',').some((t) => t.trim() === etag)) {
    return new Response(null, { status: 304, headers: { ETag: etag, 'Cache-Control': cacheControl } });
  }

  const memoryKey = `${opts.cacheKey}@${opts.current}`;
  let image = cacheGet(memoryKey);
  if (!image) {
    const raw = await opts.load();
    if (!raw) return new Response('Not found', { status: 404 });
    if (!isDataUrl(raw)) {
      // Photo hébergée ailleurs (chemin du site ou adresse http) : on redirige simplement.
      return /^(\/(?!\/)|https?:\/\/)/i.test(raw)
        ? new Response(null, { status: 307, headers: { Location: raw, 'Cache-Control': 'public, max-age=300' } })
        : new Response('Not found', { status: 404 });
    }
    image = decodeDataUrl(raw) ?? undefined;
    if (!image) return new Response('Not found', { status: 404 });
    cachePut(memoryKey, image);
  }

  return new Response(new Uint8Array(image.data), {
    headers: {
      'Content-Type': image.mime,
      'Content-Length': String(image.data.length),
      'Cache-Control': cacheControl,
      ETag: etag,
      'X-Content-Type-Options': 'nosniff',
      'Content-Security-Policy': "default-src 'none'; sandbox",
    },
  });
}
