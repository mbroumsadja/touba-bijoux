import { AnalyticsEvent, EventType, Product } from '../types';
import { hasAdminToken } from './store';

/* ------------------------------------------------------------------ */
/* Enregistrement (site public)                                        */
/* ------------------------------------------------------------------ */

const seen = (key: string): boolean => {
  try {
    if (sessionStorage.getItem(key)) return true;
    sessionStorage.setItem(key, '1');
  } catch {
    /* navigation privée : on compte quand même */
  }
  return false;
};

/** Envoie un geste anonyme au serveur. Ignoré quand le gérant est connecté. */
export function track(type: EventType, extra: { pid?: string; cat?: string } = {}) {
  if (hasAdminToken()) return;
  if (type === 'view' && extra.pid && seen(`touba_view_${extra.pid}`)) return; // une vue par produit et par visite
  const body = JSON.stringify({ type, ...extra });
  try {
    if (navigator.sendBeacon?.('/api/events', new Blob([body], { type: 'application/json' }))) return;
  } catch {
    /* on tente fetch juste après */
  }
  fetch('/api/events', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body, keepalive: true }).catch(() => {});
}

export function trackVisitOnce() {
  if (!seen('touba_visit')) track('visit');
}

/* ------------------------------------------------------------------ */
/* Calculs (espace gérant)                                             */
/* ------------------------------------------------------------------ */

export type Action =
  | { kind: 'patch'; label: string; productId: string; patch: Partial<Product> }
  | { kind: 'edit'; label: string; productId: string }
  | { kind: 'status'; label: string; productId: string };

export interface Insight {
  id: string;
  level: 'good' | 'warn' | 'info';
  title: string;
  text: string;
  action?: Action;
}

export interface ProductStat {
  product: Product;
  views: number;
  orders: number; // clics « Commander » (détail)
  wholesale: number; // clics « Commander en gros »
  demands: number; // orders + wholesale
}

export const PRICE_BRACKETS = [
  { id: 'lt10', label: 'Moins de 10 000', min: 1, max: 9_999 },
  { id: '10-20', label: '10 000 à 19 999', min: 10_000, max: 19_999 },
  { id: '20-40', label: '20 000 à 39 999', min: 20_000, max: 39_999 },
  { id: '40+', label: '40 000 et plus', min: 40_000, max: Infinity },
];

const pl = (n: number, one: string, many: string) => `${n} ${n > 1 ? many : one}`;
export const WEEKDAYS = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
const DAY = 86_400_000;

export function computeStats(all: AnalyticsEvent[], products: Product[], days: number, categories: { id: string; fr: string }[]) {
  const now = Date.now();
  const ev = days ? all.filter((e) => e.t >= now - days * DAY) : all;
  const count = (type: EventType) => ev.filter((e) => e.type === type).length;

  const visits = count('visit');
  const views = count('view');
  const orders = count('order');
  const wholesale = count('wholesale');
  const contacts = count('contact');
  const demands = orders + wholesale;

  const perProduct = new Map<string, { views: number; orders: number; wholesale: number }>();
  for (const e of ev) {
    if (!e.pid) continue;
    const s = perProduct.get(e.pid) ?? { views: 0, orders: 0, wholesale: 0 };
    if (e.type === 'view') s.views++;
    else if (e.type === 'order') s.orders++;
    else if (e.type === 'wholesale') s.wholesale++;
    perProduct.set(e.pid, s);
  }
  const byProduct: ProductStat[] = products.map((product) => {
    const s = perProduct.get(product.id) ?? { views: 0, orders: 0, wholesale: 0 };
    return { product, ...s, demands: s.orders + s.wholesale };
  });
  const ranked = [...byProduct].sort((a, b) => b.demands - a.demands || b.views - a.views);

  const byCategory = categories.map((c) => {
    const list = byProduct.filter((s) => s.product.category === c.id);
    const v = list.reduce((n, s) => n + s.views, 0);
    const d = list.reduce((n, s) => n + s.demands, 0);
    const clicks = ev.filter((e) => e.type === 'category' && e.cat === c.id).length;
    return { id: c.id, label: c.fr, views: v, demands: d, clicks, interest: v + d * 3 + clicks };
  });

  const byPrice = PRICE_BRACKETS.map((b) => {
    const list = byProduct.filter((s) => s.product.price >= b.min && s.product.price <= b.max);
    return { ...b, products: list.length, views: list.reduce((n, s) => n + s.views, 0), demands: list.reduce((n, s) => n + s.demands, 0) };
  });

  const span = Math.min(days || 14, 14);
  const daily = Array.from({ length: span }, (_, i) => {
    const d = new Date(now - (span - 1 - i) * DAY);
    d.setHours(0, 0, 0, 0);
    const slice = ev.filter((e) => e.t >= d.getTime() && e.t < d.getTime() + DAY);
    return {
      label: d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }),
      short: String(d.getDate()),
      visits: slice.filter((e) => e.type === 'visit').length,
      demands: slice.filter((e) => e.type === 'order' || e.type === 'wholesale').length,
    };
  });

  const intent = ev.filter((e) => e.type === 'order' || e.type === 'wholesale' || e.type === 'contact');
  const hours = Array.from({ length: 24 }, (_, h) => intent.filter((e) => new Date(e.t).getHours() === h).length);
  const weekdays = Array.from({ length: 7 }, (_, d) => intent.filter((e) => new Date(e.t).getDay() === d).length);

  const insights = buildInsights({ visits, views, demands, wholesale, ranked, byCategory, byPrice, hours, weekdays });
  return { visits, views, orders, wholesale, contacts, demands, per100: visits ? Math.round((demands / visits) * 100) : 0, ranked, byProduct, byCategory, byPrice, daily, hours, weekdays, insights, total: ev.length };
}

export type Stats = ReturnType<typeof computeStats>;

function buildInsights(d: {
  visits: number;
  views: number;
  demands: number;
  wholesale: number;
  ranked: ProductStat[];
  byCategory: { label: string; views: number; demands: number; interest: number }[];
  byPrice: { label: string; views: number; demands: number }[];
  hours: number[];
  weekdays: number[];
}): Insight[] {
  if (d.visits + d.views + d.demands < 10) {
    return [{ id: 'empty', level: 'info', title: 'Pas encore assez de données', text: 'Les conseils apparaissent après une dizaine de gestes de clientes. Partagez le lien de la boutique dans vos statuts WhatsApp pour commencer.' }];
  }
  const out: Insight[] = [];
  const live = d.ranked.filter((s) => !s.product.hidden);
  const top = live.find((s) => !s.product.soldOut && s.demands + s.views > 0);

  if (top) {
    out.push({ id: 'top', level: 'good', title: `${top.product.name} est votre meilleure pièce`, text: `${pl(top.demands, 'demande', 'demandes')} pour ${pl(top.views, 'vue', 'vues')}. Annoncez-la dans votre statut, gardez du stock et cherchez des modèles proches.`, action: { kind: 'status', label: 'Créer un statut WhatsApp', productId: top.product.id } });
  }

  const missed = live.filter((s) => s.product.soldOut && s.views + s.demands >= 3).sort((a, b) => b.views + b.demands - (a.views + a.demands))[0];
  if (missed) {
    out.push({ id: 'soldout', level: 'warn', title: `${missed.product.name} est épuisée mais on la demande`, text: `${pl(missed.views, 'vue', 'vues')} et ${pl(missed.demands, 'demande', 'demandes')} sur une pièce indisponible. Des clientes repartent déçues : rachetez-la ou proposez une pièce proche.`, action: { kind: 'patch', label: 'Remettre en vente', productId: missed.product.id, patch: { soldOut: false } } });
  }

  const stuck = live.filter((s) => !s.product.soldOut && s.views >= 5 && s.demands === 0).sort((a, b) => b.views - a.views)[0];
  if (stuck) {
    out.push({ id: 'stuck', level: 'warn', title: `${stuck.product.name} est regardée mais jamais demandée`, text: `${stuck.views} vues, aucune demande. Essayez une meilleure photo, un prix plus bas ou une petite promotion.`, action: { kind: 'edit', label: 'Modifier le produit', productId: stuck.product.id } });
  }

  const noGros = live.find((s) => s.demands >= 3 && !(s.product.wholesalePrice && s.product.wholesalePrice > 0));
  if (noGros) {
    out.push({ id: 'nogros', level: 'info', title: `${noGros.product.name} n'a pas de prix de gros`, text: 'Cette pièce est très demandée. Affichez un prix de gros pour attirer les revendeuses.', action: { kind: 'edit', label: 'Ajouter un prix de gros', productId: noGros.product.id } });
  }

  const unseen = live.filter((s) => s.views === 0 && !s.product.soldOut);
  if (unseen.length > 0) {
    const first = unseen[0].product;
    out.push({ id: 'unseen', level: 'info', title: unseen.length > 1 ? `${unseen.length} produits jamais ouverts` : '1 produit jamais ouvert', text: `${unseen.slice(0, 3).map((s) => s.product.name).join(', ')}${unseen.length > 3 ? '…' : ''}. Mettez-les en « Nouveau » et envoyez leur photo en statut.`, action: first.isNew ? { kind: 'status', label: 'Créer un statut WhatsApp', productId: first.id } : { kind: 'patch', label: `Marquer « Nouveau »`, productId: first.id, patch: { isNew: true } } });
  }

  const bestCat = [...d.byCategory].sort((a, b) => b.interest - a.interest)[0];
  const worstCat = [...d.byCategory].sort((a, b) => a.interest - b.interest)[0];
  if (bestCat && bestCat.interest > 0) {
    out.push({ id: 'bestcat', level: 'good', title: `${bestCat.label} : la catégorie qui attire le plus`, text: `${pl(bestCat.views, 'vue', 'vues')} et ${pl(bestCat.demands, 'demande', 'demandes')}. Élargissez le choix dans cette catégorie à votre prochain achat.` });
  }
  if (worstCat && bestCat && worstCat.label !== bestCat.label && bestCat.interest >= 5) {
    out.push({ id: 'worstcat', level: 'info', title: `${worstCat.label} : la catégorie la moins regardée`, text: 'Testez de nouvelles photos ou un lot (collier et boucles ensemble) avant de racheter du stock.' });
  }

  const bestPrice = [...d.byPrice].sort((a, b) => b.demands * 3 + b.views - (a.demands * 3 + a.views))[0];
  if (bestPrice && bestPrice.views + bestPrice.demands > 0) {
    out.push({ id: 'price', level: 'info', title: `Budget préféré : ${bestPrice.label} FCFA`, text: 'Achetez surtout des modèles dans cette fourchette et gardez une ou deux pièces plus chères comme vitrine.' });
  }

  if (d.wholesale > 0) {
    out.push({ id: 'gros', level: 'good', title: `${pl(d.wholesale, 'demande', 'demandes')} de prix de gros`, text: 'Des revendeuses vous contactent. Répondez vite et préparez des lots (par exemple 6 pièces de la même catégorie).' });
  }

  if (Math.max(...d.hours) > 0) {
    const h = d.hours.indexOf(Math.max(...d.hours));
    const day = WEEKDAYS[d.weekdays.indexOf(Math.max(...d.weekdays))];
    out.push({ id: 'time', level: 'info', title: `Moment fort : le ${day} vers ${h} h`, text: `Publiez votre statut une heure avant, vers ${(h + 23) % 24} h, pour être vue quand les clientes sont prêtes à commander.` });
  }
  return out;
}

export function exportCsv(stats: Stats, categoryLabel: (id: string) => string): string {
  const rows = [['Référence', 'Nom', 'Catégorie', 'Prix détail FCFA', 'Prix gros FCFA', 'Vues', 'Demandes détail', 'Demandes gros', 'Statut']];
  stats.ranked.forEach((s) =>
    rows.push([s.product.reference, s.product.name, categoryLabel(s.product.category), String(s.product.price), String(s.product.wholesalePrice ?? 0), String(s.views), String(s.orders), String(s.wholesale), s.product.hidden ? 'Masqué' : s.product.soldOut ? 'Épuisé' : 'En vente']),
  );
  return '\ufeff' + rows.map((r) => r.map((c) => `"${c.replace(/"/g, '""')}"`).join(';')).join('\n');
}
