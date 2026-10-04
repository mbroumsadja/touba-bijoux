import { createHash } from 'node:crypto';
import type { Document } from 'mongodb';
import { signValue } from './auth';
import { collections } from './db';
import { gzipAsync } from './http';
import { isDataUrl, productImageUrl } from './images';
import { publicSettings } from './validate';

/** Signature du lien d'une photo de produit masqué : seul le gérant (qui reçoit ces liens) peut l'afficher. */
export const imageSignature = (id: string, index: number) => signValue(`img:${id}:${index}`);

/** Version de la photo : change à chaque modification des images, ce qui invalide le cache du navigateur. */
export const imageVersion = (doc: Document) => doc.imgV ?? doc.createdAt ?? 0;

function signHidden(p: Document): Document {
  if (!p.hidden || !Array.isArray(p.images)) return p;
  return {
    ...p,
    images: p.images.map((s: unknown, i: number) =>
      typeof s === 'string' && s.startsWith('/api/img/p/') ? `${s}&k=${imageSignature(String(p.id), i)}` : s,
    ),
  };
}

/** Produit tel que l'API le publie : sans champs internes, photos en liens courts (jamais en base64). */
export function toApiProduct(doc: Document, admin: boolean): Document {
  const { _id: _omitId, createdAt: _createdAt, imgV: _imgV, images, ...rest } = doc;
  const version = imageVersion(doc);
  const list = (Array.isArray(images) ? images : []).map((s: unknown, i: number) =>
    isDataUrl(s) ? productImageUrl(String(doc.id), i, version) : s,
  );
  const out = { ...rest, images: list };
  return admin ? signHidden(out) : out;
}

// La conversion est faite par MongoDB lui-même : les photos en base64 (plusieurs centaines de Ko par produit)
// ne quittent même pas la base, seul le lien court est transféré.
const imagesAsLinks = {
  $map: {
    input: { $range: [0, { $size: { $ifNull: ['$images', []] } }] },
    as: 'i',
    in: {
      $let: {
        vars: { s: { $arrayElemAt: ['$images', '$$i'] } },
        in: {
          $cond: [
            { $eq: [{ $substrCP: [{ $ifNull: ['$$s', ''] }, 0, 5] }, 'data:'] },
            {
              $concat: [
                '/api/img/p/',
                '$id',
                '/',
                { $toString: '$$i' },
                '?v=',
                // $toLong : les dates sont enregistrées en nombre décimal ; on force un entier pour que le texte
                // soit identique à celui calculé côté Node (imageVersion) et que le cache d'un an s'applique.
                { $toString: { $toLong: { $ifNull: ['$imgV', { $ifNull: ['$createdAt', 0] }] } } },
              ],
            },
            '$$s',
          ],
        },
      },
    },
  },
};

let warned = false;

export async function listProducts(admin: boolean): Promise<Document[]> {
  const { products } = await collections();
  const match = admin ? {} : { hidden: { $ne: true } };
  try {
    const rows = await products
      .aggregate<Document>([{ $match: match }, { $sort: { createdAt: -1 } }, { $set: { images: imagesAsLinks } }, { $unset: ['_id', 'createdAt', 'imgV'] }])
      .toArray();
    return admin ? rows.map(signHidden) : rows;
  } catch (e) {
    // Filet de sécurité (ancienne version de MongoDB, par exemple) : même résultat, calculé côté serveur Node.
    if (!warned) {
      warned = true;
      console.warn('[touba] Agrégation des photos indisponible, repli sur la lecture complète :', e);
    }
    const rows = await products.find(match).sort({ createdAt: -1 }).toArray();
    return rows.map((row) => toApiProduct(row, admin));
  }
}

/* ---- catalogue complet (produits + réglages) avec cache mémoire côté visiteur ---- */

type Built = { body: string; etag: string; gz?: Buffer };
const TTL_MS = 30_000;
const g = globalThis as unknown as { _toubaCatalog?: { entry?: Built & { at: number }; inflight?: Promise<Built>; gen: number } };
const state = () => (g._toubaCatalog ??= { gen: 0 });

export async function buildCatalog(admin: boolean): Promise<Built> {
  const { settings } = await collections();
  const [products, doc] = await Promise.all([
    listProducts(admin),
    settings.findOne({ _id: 'main' } as never, { projection: { passwordHash: 0 } }),
  ]);
  const body = JSON.stringify({ products, settings: publicSettings(doc) });
  return {
    body,
    etag: `W/"${createHash('sha1').update(body).digest('base64url')}"`,
    gz: admin ? undefined : await gzipAsync(body), // compressé une seule fois pour tous les visiteurs de la période de cache
  };
}

/**
 * Catalogue public : calculé au plus une fois toutes les 30 s (et immédiatement après toute modification du gérant),
 * même si 100 visiteurs arrivent en même temps. Le gérant connecté n'utilise jamais ce cache.
 */
export async function loadCatalog(admin: boolean): Promise<Built> {
  if (admin) return buildCatalog(true);
  const s = state();
  if (s.entry && Date.now() - s.entry.at < TTL_MS) return s.entry;
  if (!s.inflight) {
    const gen = s.gen;
    const run: Promise<Built> = buildCatalog(false)
      .then((built) => {
        if (gen === state().gen) state().entry = { ...built, at: Date.now() }; // ignoré si une modification est survenue entre-temps
        return built;
      })
      .finally(() => {
        if (state().inflight === run) state().inflight = undefined;
      });
    s.inflight = run;
  }
  return s.inflight;
}

export function invalidateCatalog() {
  const s = state();
  s.gen++;
  s.entry = undefined;
  s.inflight = undefined; // les requêtes suivantes repartent d'une lecture fraîche
}
