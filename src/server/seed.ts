// Données de départ (première mise en route uniquement) : à remplacer depuis l'espace gérant.
// Les prix de gros ci-dessous sont des EXEMPLES.
const img = (name: string) => `/images/${name}.webp`;

export const SEED_PRODUCTS: Record<string, unknown>[] = [
  { id: 'p-m-012', reference: 'M-012', name: 'Montre Élégance Nacre', nameEn: 'Elegance Pearl Watch', price: 45000, wholesalePrice: 36000, category: 'montres', images: [img('watch'), img('watch-2')], isNew: true },
  { id: 'p-m-008', reference: 'M-008', name: 'Montre Or Rose', nameEn: 'Rose Gold Watch', price: 38000, wholesalePrice: 30000, category: 'montres', images: [img('watch-2')] },
  { id: 'p-m-003', reference: 'M-003', name: 'Montre Maille Dorée', nameEn: 'Golden Mesh Watch', price: 42000, wholesalePrice: 33000, category: 'montres', images: [img('watch')], soldOut: true },
  { id: 'p-c-008', reference: 'C-008', name: 'Collier Étoile Céleste', nameEn: 'Celestial Star Necklace', price: 15000, wholesalePrice: 11000, category: 'colliers', images: [img('necklace'), img('necklace-2')], isNew: true },
  { id: 'p-c-014', reference: 'C-014', name: 'Collier Solitaire', nameEn: 'Solitaire Necklace', price: 22000, wholesalePrice: 17000, category: 'colliers', images: [img('necklace-2')] },
  { id: 'p-b-005', reference: 'B-005', name: "Pendants Perles d'Eau Douce", nameEn: 'Freshwater Pearl Drops', price: 18000, wholesalePrice: 13500, category: 'boucles', images: [img('earrings')], isNew: true },
  { id: 'p-b-011', reference: 'B-011', name: 'Boucles Perle Baroque', nameEn: 'Baroque Pearl Earrings', price: 12000, wholesalePrice: 9000, category: 'boucles', images: [img('earrings')] },
  { id: 'p-br-003', reference: 'BR-003', name: 'Bracelet Maille Milanaise', nameEn: 'Milanese Mesh Bracelet', price: 14000, wholesalePrice: 10500, category: 'bracelets', images: [img('bracelet')], isNew: true },
  { id: 'p-br-007', reference: 'BR-007', name: 'Bracelet Chaîne Dorée', nameEn: 'Golden Chain Bracelet', price: 16000, wholesalePrice: 12000, category: 'bracelets', images: [img('bracelet')] },
  { id: 'p-bg-015', reference: 'BG-015', name: 'Bague Solaire Pavée', nameEn: 'Paved Solar Ring', price: 9500, wholesalePrice: 7000, category: 'bagues', images: [img('rings')] },
];

export const SEED_SETTINGS: Record<string, string | number> = {
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
  bannerImage: img('hero'),
  shopPhoto: img('hero'),
  wholesaleMinQty: 0, // 0 = quantité minimale non affichée
};
