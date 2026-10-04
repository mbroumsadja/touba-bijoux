import { IMAGE_SETTING_KEYS, isAcceptableImage, isDataUrl, settingImageUrl } from './images';
import { SEED_SETTINGS } from './seed';

export const CATEGORIES = ['montres', 'colliers', 'boucles', 'bracelets', 'bagues'];
export const SETTINGS_TEXT_KEYS = [
  'shopName', 'sloganFr', 'sloganEn', 'whatsappNumber', 'displayPhone', 'addressFr', 'addressEn',
  'openingHoursFr', 'openingHoursEn', 'googleMapsUrl', 'bannerImage', 'shopPhoto',
];
export const MAX_IMAGE_CHARS = 400_000; // ~300 Ko : les photos sont déjà compressées côté navigateur
export const EVENT_TYPES = ['visit', 'view', 'order', 'wholesale', 'category', 'contact'];
export const MAX_EVENTS_SENT = 20_000;

type Body = Record<string, unknown>;

export const str = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
export const price = (v: unknown) => Math.max(0, Math.min(100_000_000, Math.round(Number(v) || 0)));
const images = (v: unknown) =>
  (Array.isArray(v) ? v : [])
    .filter((s): s is string => typeof s === 'string' && s.length > 0 && s.length <= MAX_IMAGE_CHARS && isAcceptableImage(s))
    .slice(0, 3);

/** Ne garde que les champs connus d'un produit (les champs absents ne sont pas touchés). */
export function cleanProduct(body: Body, { partial }: { partial: boolean }) {
  const out: Body = {};
  const has = (k: string) => Object.prototype.hasOwnProperty.call(body, k);
  if (has('name') || !partial) out.name = str(body.name, 120);
  if (has('nameEn') || !partial) out.nameEn = str(body.nameEn, 120);
  if (has('price') || !partial) out.price = price(body.price);
  if (has('wholesalePrice') || !partial) out.wholesalePrice = price(body.wholesalePrice);
  if (has('category') || !partial) out.category = body.category;
  if (has('images') || !partial) out.images = images(body.images);
  if (has('reference') || !partial) out.reference = str(body.reference, 20);
  for (const k of ['isNew', 'soldOut', 'hidden']) if (has(k) || !partial) out[k] = Boolean(body[k]);
  return out;
}

export function validateProduct(p: Body, { partial }: { partial: boolean }): string | null {
  if ('name' in p && !p.name) return 'Nom du produit manquant.';
  if ('category' in p && !CATEGORIES.includes(p.category as string)) return 'Catégorie invalide.';
  if ('images' in p && (p.images as string[]).length === 0) return 'Ajoutez au moins une photo.';
  if ('reference' in p && !p.reference && !partial) return 'Référence manquante.';
  return null;
}

/** Réglages publics. Les photos en base64 sont remplacées par un lien court mis en cache par le navigateur. */
export function publicSettings(doc: Body | null | undefined) {
  const out: Body = {};
  for (const k of SETTINGS_TEXT_KEYS) {
    const value = doc?.[k] ?? SEED_SETTINGS[k];
    out[k] = IMAGE_SETTING_KEYS.includes(k) && isDataUrl(value) ? settingImageUrl(k, doc?.[`${k}V`]) : value;
  }
  out.wholesaleMinQty = Number.isFinite(doc?.wholesaleMinQty) ? doc!.wholesaleMinQty : 0;
  return out;
}
