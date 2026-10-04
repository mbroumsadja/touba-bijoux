import { collections } from './db';
import { MAX_EVENTS_SENT } from './validate';

/** Évènements des `days` derniers jours (30 par défaut), du plus récent au plus ancien. */
export async function listEvents(url: string) {
  const days = Number(new URL(url).searchParams.get('days') ?? '30');
  const { events } = await collections();
  const since = Number.isFinite(days) && days > 0 ? Date.now() - days * 86_400_000 : undefined;
  const query = since ? { t: { $gte: since } } : {};
  const list = await events.find(query, { projection: { _id: 0 } }).sort({ t: -1 }).limit(MAX_EVENTS_SENT).toArray();
  return { events: list, truncated: list.length >= MAX_EVENTS_SENT };
}

/**
 * Garde les MAX_EVENTS_SENT évènements les plus récents. Lancé après la réponse et seulement quand l'excédent
 * atteint 500 : avant, chaque clic de visiteur déclenchait un comptage complet de la collection.
 */
export async function trimEvents() {
  try {
    const { events } = await collections();
    if ((await events.estimatedDocumentCount()) <= MAX_EVENTS_SENT + 500) return;
    const cutoff = await events.find({}, { projection: { _id: 0, t: 1 } }).sort({ t: -1 }).skip(MAX_EVENTS_SENT).limit(1).next();
    if (cutoff) await events.deleteMany({ t: { $lte: cutoff.t } });
  } catch (e) {
    console.error('[touba] nettoyage des évènements', e);
  }
}
