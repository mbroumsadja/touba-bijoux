import { ProductCategory, StoreSettings } from '../types';

// Images servies depuis /public : chemins stables entre deux déploiements.
const base = '/';
export const IMG = {
  hero: `${base}images/hero.webp`,
  watch: `${base}images/watch.webp`,
  watch2: `${base}images/watch-2.webp`,
  necklace: `${base}images/necklace.webp`,
  necklace2: `${base}images/necklace-2.webp`,
  earrings: `${base}images/earrings.webp`,
  bracelet: `${base}images/bracelet.webp`,
  rings: `${base}images/rings.webp`,
};

export const CATEGORIES: { id: ProductCategory; fr: string; en: string; prefix: string; image: string }[] = [
  { id: 'montres', fr: 'Montres', en: 'Watches', prefix: 'M', image: IMG.watch },
  { id: 'colliers', fr: 'Colliers', en: 'Necklaces', prefix: 'C', image: IMG.necklace },
  { id: 'boucles', fr: "Boucles d'oreilles", en: 'Earrings', prefix: 'B', image: IMG.earrings },
  { id: 'bracelets', fr: 'Bracelets', en: 'Bracelets', prefix: 'BR', image: IMG.bracelet },
  { id: 'bagues', fr: 'Bagues', en: 'Rings', prefix: 'BG', image: IMG.rings },
];

export const INITIAL_SETTINGS: StoreSettings = {
  shopName: 'TOUBA BIJOUX',
  sloganFr: "L'élégance à portée de main.",
  sloganEn: 'Elegance at your fingertips.',
  whatsappNumber: '237690216869',
  displayPhone: '+237 690 216 869',
  addressFr: 'Rue Congo Paraiso(Nº2.517),DOuala,Cameroun',
  addressEn: 'Rue Congo Paraiso(Nº2.517),Douala,Cameroon',
  openingHoursFr: 'Lundi – Samedi : 10:00 – 18h00',
  openingHoursEn: 'Monday – Saturday: 10:00 AM – 6:00 PM',
  googleMapsUrl: 'https://maps.app.goo.gl/xzpm1XRWGowwwfV9?g_st=aw',
  bannerImage: IMG.hero,
  shopPhoto: IMG.hero,
  wholesaleMinQty: 0,
};
