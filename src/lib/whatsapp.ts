import { AppLanguage, Product } from '../types';

/** 45000 → « 45 000 FCFA » (espace insécable, lisible partout) */
export function formatFCFA(price: number, lang: AppLanguage = 'fr'): string {
  if (!price || price <= 0) return lang === 'fr' ? 'Prix sur demande' : 'Price on request';
  return `${String(Math.round(price)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ')} FCFA`;
}

export const sanitizePhone = (phone: string) => phone.replace(/\D/g, '');

/** Lien de photo partageable : absolu si possible, rien si la photo est embarquée (data:). */
function shareablePhotoUrl(src?: string): string | null {
  if (!src || src.startsWith('data:') || typeof window === 'undefined') return null;
  try {
    return new URL(src, window.location.origin).href;
  } catch {
    return null;
  }
}

const waLink = (phone: string, message: string) =>
  `https://wa.me/${sanitizePhone(phone)}?text=${encodeURIComponent(message)}`;

/**
 * « Bonjour TOUBA BIJOUX 👋 Je suis intéressée par : *Montre Élégance* (Réf. M-012) – 45 000 FCFA.
 *   Voici la photo : [lien]. Est-elle disponible ? »
 */
export function buildWhatsAppProductLink(o: {
  phone: string;
  shopName: string;
  product: Product;
  lang?: AppLanguage;
  wholesale?: boolean;
}): string {
  const { phone, shopName, product, lang = 'fr', wholesale = false } = o;
  const name = lang === 'en' && product.nameEn ? product.nameEn : product.name;
  const price = formatFCFA(product.price, lang);
  const photo = shareablePhotoUrl(product.images[0]);

  if (wholesale) {
    const gros = formatFCFA(product.wholesalePrice ?? 0, lang);
    return waLink(
      phone,
      lang === 'fr'
        ? `Bonjour ${shopName} 👋 Je souhaite acheter en gros : *${name}* (Réf. ${product.reference}) – prix de gros : ${gros}.${photo ? ` Voici la photo : ${photo}` : ''} Quelle quantité minimale et quels délais de livraison ?`
        : `Hello ${shopName} 👋 I'd like to buy wholesale: *${name}* (Ref. ${product.reference}) – wholesale price: ${gros}.${photo ? ` Here is the photo: ${photo}` : ''} What is the minimum quantity and delivery time?`,
    );
  }

  const msg =
    lang === 'fr'
      ? `Bonjour ${shopName} 👋 Je suis intéressée par : *${name}* (Réf. ${product.reference}) – ${price}.${photo ? ` Voici la photo : ${photo}` : ''} Est-elle disponible ?`
      : `Hello ${shopName} 👋 I'm interested in: *${name}* (Ref. ${product.reference}) – ${price}.${photo ? ` Here is the photo: ${photo}` : ''} Is it available?`;
  return waLink(phone, msg);
}

export function buildGeneralWhatsAppLink(o: { phone: string; shopName: string; lang?: AppLanguage }): string {
  const { phone, shopName, lang = 'fr' } = o;
  return waLink(
    phone,
    lang === 'fr'
      ? `Bonjour ${shopName} 👋 J'aimerais avoir des renseignements sur vos bijoux et montres.`
      : `Hello ${shopName} 👋 I'd like some information about your jewelry and watches.`,
  );
}

export function buildWholesaleWhatsAppLink(o: { phone: string; shopName: string; lang?: AppLanguage }): string {
  const { phone, shopName, lang = 'fr' } = o;
  return waLink(
    phone,
    lang === 'fr'
      ? `Bonjour ${shopName} 👋 Je suis intéressée par vos prix de gros. Pouvez-vous m'envoyer le catalogue et les conditions (quantité minimale, livraison) ?`
      : `Hello ${shopName} 👋 I'm interested in your wholesale prices. Could you send me the catalog and conditions (minimum quantity, delivery)?`,
  );
}
