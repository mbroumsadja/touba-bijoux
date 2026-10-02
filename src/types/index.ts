export type ProductCategory = 'montres' | 'colliers' | 'boucles' | 'bracelets' | 'bagues';
export type AppLanguage = 'fr' | 'en';

export interface Product {
  id: string;
  reference: string; // ex. "M-012"
  name: string; // nom court FR
  nameEn?: string; // nom court EN (optionnel)
  price: number; // FCFA, 0 = « Prix sur demande »
  wholesalePrice?: number; // prix de gros FCFA, 0/absent = non affiché
  category: ProductCategory;
  images: string[]; // 1 à 3 photos
  isNew?: boolean;
  soldOut?: boolean;
  hidden?: boolean;
}

export interface StoreSettings {
  shopName: string;
  sloganFr: string;
  sloganEn: string;
  whatsappNumber: string; // chiffres uniquement, avec indicatif : 237690000000
  displayPhone: string;
  addressFr: string;
  addressEn: string;
  openingHoursFr: string;
  openingHoursEn: string;
  googleMapsUrl: string;
  bannerImage: string;
  shopPhoto: string;
  wholesaleMinQty: number; // quantité minimale en gros, 0 = non affichée
}

export type EventType = 'visit' | 'view' | 'order' | 'wholesale' | 'category' | 'contact';

/** Un geste d'une cliente, sans aucune donnée personnelle. */
export interface AnalyticsEvent {
  t: number; // horodatage (ms)
  type: EventType;
  pid?: string; // produit concerné
  cat?: string; // catégorie concernée
}
