import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Check, EyeOff, Gem, LayoutGrid, LayoutList, PackageOpen, PackageX, Pencil, Plus, Search, SearchX, Trash2, X, type LucideIcon } from 'lucide-react';
import { useStore } from '../lib/store';
import { CATEGORIES } from '../lib/initialData';
import { ProductStat, Stats } from '../lib/analytics';
import { Product } from '../types';
import { ProductForm } from './ProductForm';
import {
  ConfirmDialog, STATUS_DOT, STATUS_LABEL, STATUS_OPTIONS, SelectField, StatusId,
  btnGhost, btnPrimary, fmt, inputCls, plural, statusOf, statusPatch,
} from './ui';

export type ProductRoute = { mode: 'list' } | { mode: 'new' } | { mode: 'edit'; id: string };

type Filter = 'all' | StatusId;
type Sort = 'recent' | 'name' | 'price-asc' | 'price-desc' | 'demand';
type Layout = 'table' | 'cards';

const TILES: { id: Filter; label: string; Icon: LucideIcon }[] = [
  { id: 'all', label: 'Tous les produits', Icon: Gem },
  { id: 'sale', label: 'En vente', Icon: Check },
  { id: 'soldout', label: 'Épuisés', Icon: PackageX },
  { id: 'hidden', label: 'Masqués', Icon: EyeOff },
];

const SORTS: { id: Sort; label: string }[] = [
  { id: 'recent', label: 'Plus récents' },
  { id: 'name', label: 'Nom A → Z' },
  { id: 'price-asc', label: 'Prix croissant' },
  { id: 'price-desc', label: 'Prix décroissant' },
  { id: 'demand', label: 'Plus demandés' },
];

const catLabel = (id: string) => CATEGORIES.find((c) => c.id === id)?.fr ?? id;
const priceText = (p: Product) => (p.price > 0 ? `${fmt(p.price)} FCFA` : 'Sur demande');

interface Props {
  route: ProductRoute;
  go: (path: string, force?: boolean) => void;
  stats: Stats;
  say: (msg: string, ok?: boolean) => void;
  onDirty: (dirty: boolean) => void;
}

/** Case à cocher avec une zone de toucher de 44 px. */
const RowCheck: React.FC<{ checked: boolean; indeterminate?: boolean; onChange: () => void; label: string }> = ({ checked, indeterminate, onChange, label }) => {
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (ref.current) ref.current.indeterminate = Boolean(indeterminate);
  }, [indeterminate]);
  return (
    <label className="w-11 h-11 flex items-center justify-center cursor-pointer shrink-0">
      <input ref={ref} type="checkbox" checked={checked} onChange={onChange} aria-label={label} className="w-5 h-5 accent-encre cursor-pointer" />
    </label>
  );
};

const StatusSelect: React.FC<{ product: Product; pending: boolean; onChange: (s: StatusId) => void; className?: string }> = ({ product, pending, onChange, className }) => {
  const st = statusOf(product);
  return (
    <SelectField label={`Statut de ${product.name}`} value={st} onChange={(v) => onChange(v as StatusId)} disabled={pending} compact dot={STATUS_DOT[st]} className={className}>
      {STATUS_OPTIONS.map((o) => <option key={o} value={o}>{STATUS_LABEL[o]}</option>)}
    </SelectField>
  );
};

const NewBadge: React.FC = () => (
  <span className="shrink-0 h-5 px-1.5 rounded-full bg-or/25 text-or-deep text-[11px] font-semibold inline-flex items-center">Nouveau</span>
);

const Thumb: React.FC<{ product: Product; size: string }> = ({ product, size }) => (
  <img
    src={product.images[0]}
    alt=""
    loading="lazy"
    decoding="async"
    className={`${size} shrink-0 rounded-md object-cover bg-papier ${product.hidden ? 'opacity-50' : product.soldOut ? 'grayscale opacity-70' : ''}`}
  />
);

export const Products: React.FC<Props> = ({ route, go, stats, say, onDirty }) => {
  const s = useStore();
  const { products, ready } = s;
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [cat, setCat] = useState('all');
  const [sort, setSort] = useState<Sort>('recent');
  const [layout, setLayout] = useState<Layout>('table');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [pending, setPending] = useState<Set<string>>(new Set());
  const [toDelete, setToDelete] = useState<Product[] | null>(null);
  const [deleting, setDeleting] = useState(false);

  const perf = useMemo(() => new Map<string, ProductStat>(stats.byProduct.map((p) => [p.product.id, p])), [stats]);

  const counts = useMemo(() => {
    const c: Record<Filter, number> = { all: products.length, sale: 0, soldout: 0, hidden: 0 };
    products.forEach((p) => { c[statusOf(p)]++; });
    return c;
  }, [products]);

  const list = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const out = products.filter((p) => {
      if (cat !== 'all' && p.category !== cat) return false;
      if (filter !== 'all' && statusOf(p) !== filter) return false;
      return !needle || `${p.name} ${p.nameEn ?? ''} ${p.reference}`.toLowerCase().includes(needle);
    });
    if (sort === 'name') out.sort((a, b) => a.name.localeCompare(b.name, 'fr'));
    // « Sur demande » (prix 0) passe toujours en dernier.
    if (sort === 'price-asc') out.sort((a, b) => (a.price || Infinity) - (b.price || Infinity));
    if (sort === 'price-desc') out.sort((a, b) => (b.price || -1) - (a.price || -1));
    if (sort === 'demand') {
      const d = (p: Product) => perf.get(p.id);
      out.sort((a, b) => (d(b)?.demands ?? 0) - (d(a)?.demands ?? 0) || (d(b)?.views ?? 0) - (d(a)?.views ?? 0));
    }
    return out;
  }, [products, q, filter, cat, sort, perf]);

  // Changer de filtre vide la sélection : on n'agit jamais sur des produits qu'on ne voit pas.
  useEffect(() => {
    setSelected(new Set());
  }, [q, filter, cat]);

  const picked = list.filter((p) => selected.has(p.id));
  const allPicked = list.length > 0 && picked.length === list.length;
  const filtering = q.trim() !== '' || filter !== 'all' || cat !== 'all';

  const toggleOne = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (!next.delete(id)) next.add(id);
      return next;
    });
  const toggleAll = () => setSelected(allPicked ? new Set() : new Set(list.map((p) => p.id)));
  const resetFilters = () => {
    setQ('');
    setFilter('all');
    setCat('all');
  };

  const mark = (ids: string[], on: boolean) =>
    setPending((prev) => {
      const next = new Set(prev);
      ids.forEach((id) => (on ? next.add(id) : next.delete(id)));
      return next;
    });

  const changeStatus = async (p: Product, next: StatusId) => {
    if (statusOf(p) === next) return;
    mark([p.id], true);
    const err = await s.updateProduct(p.id, statusPatch(next));
    mark([p.id], false);
    say(err ?? `« ${p.name} » : ${STATUS_LABEL[next].toLowerCase()}.`, !err);
  };

  const bulkStatus = async (next: StatusId) => {
    const targets = picked;
    const ids = targets.map((p) => p.id);
    mark(ids, true);
    const results = await Promise.all(targets.map((p) => s.updateProduct(p.id, statusPatch(next))));
    mark(ids, false);
    const failed = results.filter(Boolean).length;
    setSelected(new Set());
    say(
      failed ? `${plural(ids.length - failed, 'produit modifié', 'produits modifiés')}, ${plural(failed, 'erreur', 'erreurs')}.` : `${plural(ids.length, 'produit modifié', 'produits modifiés')} : ${STATUS_LABEL[next].toLowerCase()}.`,
      failed === 0,
    );
  };

  const doDelete = async () => {
    if (!toDelete) return;
    setDeleting(true);
    const results = await Promise.all(toDelete.map((p) => s.deleteProduct(p.id)));
    setDeleting(false);
    const done = toDelete.filter((_, i) => !results[i]).map((p) => p.id);
    const firstError = results.find(Boolean);
    setSelected((prev) => {
      const next = new Set(prev);
      done.forEach((id) => next.delete(id));
      return next;
    });
    setToDelete(null);
    say(firstError ?? `${plural(done.length, 'produit supprimé', 'produits supprimés')}.`, !firstError);
  };

  /* ----------------------------- Formulaire ----------------------------- */

  if (route.mode === 'new') return <ProductForm key="new" say={say} go={go} onDirty={onDirty} />;
  if (route.mode === 'edit') {
    const product = products.find((p) => p.id === route.id);
    if (product) return <ProductForm key={product.id} product={product} stat={perf.get(product.id)} say={say} go={go} onDirty={onDirty} />;
    return (
      <div className="max-w-md">
        <h1 className="font-display text-[1.75rem] sm:text-4xl font-semibold leading-[1.15] text-encre">{ready ? 'Produit introuvable' : 'Chargement…'}</h1>
        {ready && <p className="mt-2 text-encre/80">Ce produit a peut-être été supprimé.</p>}
        <button type="button" onClick={() => go('produits')} className={`${btnGhost} mt-5`}>Retour aux produits</button>
      </div>
    );
  }

  /* -------------------------------- Liste -------------------------------- */

  const subtitle = [
    `${plural(products.length, 'produit', 'produits')} dans votre boutique`,
    stats.demands > 0 ? `${plural(stats.demands, 'clic', 'clics')} pour commander ces 30 derniers jours` : '',
  ].filter(Boolean).join(' · ');

  const edit = (p: Product) => go(`produits/modifier/${encodeURIComponent(p.id)}`);
  const interest = (p: Product) => {
    const st = perf.get(p.id);
    return st ? `${plural(st.views, 'vue', 'vues')} · ${plural(st.demands, 'demande', 'demandes')}` : '';
  };

  const iconBtn = 'w-11 h-11 rounded-full flex items-center justify-center cursor-pointer transition-colors';

  return (
    <div>
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="min-w-0">
          <h1 className="font-display text-[1.75rem] sm:text-4xl font-semibold leading-[1.15] text-encre">Produits</h1>
          <p className="mt-1 text-sm text-encre/75">{subtitle}</p>
        </div>
        <button type="button" onClick={() => go('produits/nouveau')} className={btnPrimary}>
          <Plus className="w-5 h-5" aria-hidden="true" /> Ajouter un produit
        </button>
      </div>

      {/* Compteurs : chacun filtre la liste */}
      <div role="group" aria-label="Filtrer par statut" className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
        {TILES.map(({ id, label, Icon }) => (
          <button
            key={id}
            type="button"
            aria-pressed={filter === id}
            onClick={() => setFilter(id)}
            className={`min-h-[4.5rem] rounded-xl border bg-feuille p-3.5 text-left cursor-pointer transition-colors ${filter === id ? 'border-encre ring-2 ring-encre' : 'border-encre/20 hover:border-encre/50'}`}
          >
            <span className="block font-display text-3xl font-semibold tabular-nums leading-none text-encre">{counts[id]}</span>
            <span className="mt-1.5 flex items-center gap-1.5 text-sm text-encre/80">
              <Icon className="w-4 h-4 shrink-0" aria-hidden="true" /> {label}
            </span>
          </button>
        ))}
      </div>

      {/* Barre d'outils */}
      <div className="mt-5 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[14rem]">
          <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-encre/75 pointer-events-none" aria-hidden="true" />
          <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Chercher un nom ou une référence" aria-label="Chercher un produit" className={`${inputCls} pl-11`} />
        </div>
        <SelectField label="Catégorie" value={cat} onChange={setCat} className="w-[calc(50%-0.375rem)] sm:w-52">
          <option value="all">Catégories</option>
          {CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.fr}</option>)}
        </SelectField>
        <SelectField label="Trier par" value={sort} onChange={(v) => setSort(v as Sort)} className="w-[calc(50%-0.375rem)] sm:w-52">
          {SORTS.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
        </SelectField>
        <div role="group" aria-label="Affichage" className="hidden lg:flex h-12 rounded-lg border border-encre/55 bg-feuille overflow-hidden">
          {([['table', LayoutList, 'Tableau'], ['cards', LayoutGrid, 'Cartes']] as const).map(([id, Icon, label]) => (
            <button key={id} type="button" aria-pressed={layout === id} aria-label={label} title={label} onClick={() => setLayout(id)} className={`w-12 flex items-center justify-center cursor-pointer transition-colors ${layout === id ? 'bg-encre text-feuille' : 'text-encre hover:bg-encre/5'}`}>
              <Icon className="w-5 h-5" aria-hidden="true" />
            </button>
          ))}
        </div>
      </div>

      {products.length > 0 && (
        <p role="status" className="mt-4 text-sm text-encre/75">
          {filtering ? `${list.length} sur ${plural(products.length, 'produit', 'produits')}` : plural(list.length, 'produit', 'produits')}
        </p>
      )}

      {products.length === 0 ? (
        <div className="mt-6 rounded-xl border border-dashed border-encre/40 bg-feuille p-8 text-center">
          <PackageOpen className="w-10 h-10 mx-auto text-encre/60" aria-hidden="true" />
          <h2 className="mt-3 font-display text-xl font-semibold text-encre">{ready ? 'Aucun produit pour le moment' : 'Chargement des produits…'}</h2>
          {ready && (
            <>
              <p className="mt-1 text-encre/75">Ajoutez votre première pièce : photo, nom, prix.</p>
              <button type="button" onClick={() => go('produits/nouveau')} className={`${btnPrimary} mt-5`}><Plus className="w-5 h-5" aria-hidden="true" /> Ajouter un produit</button>
            </>
          )}
        </div>
      ) : list.length === 0 ? (
        <div className="mt-4 rounded-xl border border-dashed border-encre/40 bg-feuille p-8 text-center">
          <SearchX className="w-10 h-10 mx-auto text-encre/60" aria-hidden="true" />
          <h2 className="mt-3 font-display text-xl font-semibold text-encre">Aucun produit ne correspond</h2>
          <p className="mt-1 text-encre/75">Changez la recherche ou les filtres.</p>
          <button type="button" onClick={resetFilters} className={`${btnGhost} mt-5`}>Réinitialiser les filtres</button>
        </div>
      ) : (
        <>
          {/* Tableau (grand écran) */}
          <div className={layout === 'table' ? 'hidden lg:block mt-3' : 'hidden'}>
            <div className="rounded-xl border border-encre/15 bg-feuille overflow-hidden">
              {/* Largeurs fixes : un nom très long est coupé, il ne pousse plus les autres colonnes. */}
              <table className="w-full table-fixed text-left text-sm">
                <caption className="sr-only">Liste des produits</caption>
                <thead className="bg-papier text-[13px] font-medium text-encre/75">
                  <tr>
                    <th scope="col" className="w-14 pl-2 py-1">
                      <RowCheck checked={allPicked} indeterminate={picked.length > 0 && !allPicked} onChange={toggleAll} label="Sélectionner tous les produits affichés" />
                    </th>
                    <th scope="col" className="py-3 pr-3 font-medium">Produit</th>
                    <th scope="col" className="py-3 pr-3 font-medium w-32">Prix</th>
                    <th scope="col" className="py-3 pr-3 font-medium w-44 hidden xl:table-cell">Intérêt (30 j)</th>
                    <th scope="col" className="py-3 pr-3 font-medium w-40">Statut</th>
                    <th scope="col" className="py-3 pr-2 font-medium w-24 text-right"><span className="sr-only">Actions</span></th>
                  </tr>
                </thead>
                <tbody>
                  {list.map((p) => {
                    const on = selected.has(p.id);
                    const gros = p.wholesalePrice ?? 0;
                    return (
                      <tr key={p.id} className={`border-t border-encre/10 ${on ? 'bg-or/10' : 'hover:bg-papier/60'}`}>
                        <td className="pl-2"><RowCheck checked={on} onChange={() => toggleOne(p.id)} label={`Sélectionner ${p.name}`} /></td>
                        <td className="py-2 pr-3 overflow-hidden">
                          <div className="flex items-center gap-3 min-w-0">
                            <Thumb product={p} size="w-12 h-12" />
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 min-w-0">
                                <button type="button" onClick={() => edit(p)} className="min-w-0 truncate text-left font-medium text-encre hover:underline underline-offset-4 cursor-pointer">{p.name}</button>
                                {p.isNew && <NewBadge />}
                              </div>
                              <div className="text-xs text-encre/70 truncate">Réf. {p.reference} · {catLabel(p.category)}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-2 pr-3 tabular-nums whitespace-nowrap">
                          <div className="text-encre">{priceText(p)}</div>
                          {gros > 0 && <div className="text-xs font-medium text-malachite">Gros : {fmt(gros)}</div>}
                        </td>
                        <td className="py-2 pr-3 text-encre/80 hidden xl:table-cell">{interest(p)}</td>
                        <td className="py-2 pr-3"><StatusSelect product={p} pending={pending.has(p.id)} onChange={(v) => changeStatus(p, v)} /></td>
                        <td className="py-2 pr-2">
                          <div className="flex justify-end">
                            <button type="button" onClick={() => edit(p)} className={`${iconBtn} hover:bg-encre/10`} aria-label={`Modifier ${p.name}`} title="Modifier"><Pencil className="w-4 h-4" aria-hidden="true" /></button>
                            <button type="button" onClick={() => setToDelete([p])} className={`${iconBtn} text-garance hover:bg-garance/10`} aria-label={`Supprimer ${p.name}`} title="Supprimer"><Trash2 className="w-4 h-4" aria-hidden="true" /></button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Cartes (mobile, tablette, ou choix « Cartes ») */}
          <ul className={`mt-3 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 ${layout === 'table' ? 'lg:hidden' : ''}`}>
            {list.map((p) => {
              const on = selected.has(p.id);
              const gros = p.wholesalePrice ?? 0;
              return (
                <li key={p.id} className={`min-w-0 rounded-xl border bg-feuille p-3 ${on ? 'border-encre ring-1 ring-encre' : 'border-encre/20'}`}>
                  <div className="flex items-start gap-1">
                    <RowCheck checked={on} onChange={() => toggleOne(p.id)} label={`Sélectionner ${p.name}`} />
                    <Thumb product={p} size="w-16 h-16" />
                    <div className="min-w-0 flex-1 pl-1.5">
                      <div className="flex items-start gap-2">
                        <div className="font-display text-base font-semibold leading-tight text-encre line-clamp-2">{p.name}</div>
                        {p.isNew && <NewBadge />}
                      </div>
                      <div className="text-xs text-encre/70">Réf. {p.reference} · {catLabel(p.category)}</div>
                      <div className="mt-1 text-[13px] text-encre tabular-nums">{priceText(p)}</div>
                      {gros > 0 && <div className="text-[13px] text-malachite font-medium tabular-nums">Gros : {fmt(gros)} FCFA</div>}
                      {interest(p) && <div className="text-[11px] text-encre/70">{interest(p)}</div>}
                    </div>
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    <StatusSelect product={p} pending={pending.has(p.id)} onChange={(v) => changeStatus(p, v)} className="flex-1 min-w-0" />
                    <button type="button" onClick={() => edit(p)} className={`${btnGhost} h-11 px-4 text-sm`}><Pencil className="w-4 h-4" aria-hidden="true" /> Modifier</button>
                    <button type="button" onClick={() => setToDelete([p])} className={`${iconBtn} text-garance hover:bg-garance/10`} aria-label={`Supprimer ${p.name}`}><Trash2 className="w-5 h-5" aria-hidden="true" /></button>
                  </div>
                </li>
              );
            })}
          </ul>
        </>
      )}

      {/* Actions groupées */}
      {picked.length > 0 && (
        <div role="region" aria-label="Actions groupées" className="sticky z-10 bottom-[calc(5rem+env(safe-area-inset-bottom))] lg:bottom-4 mt-4 rounded-xl bg-encre text-feuille p-2.5 shadow-lg flex flex-wrap items-center gap-2">
          <span className="px-2 font-medium tabular-nums">{plural(picked.length, 'sélectionné', 'sélectionnés')}</span>
          <SelectField label="Changer le statut des produits sélectionnés" value="" onChange={(v) => v && void bulkStatus(v as StatusId)} compact className="w-48">
            <option value="">Changer le statut…</option>
            {STATUS_OPTIONS.map((o) => <option key={o} value={o}>{STATUS_LABEL[o]}</option>)}
          </SelectField>
          <button type="button" onClick={() => setToDelete(picked)} className="h-11 px-4 rounded-full bg-garance hover:bg-garance/90 text-white text-sm font-medium inline-flex items-center gap-2 cursor-pointer transition-colors">
            <Trash2 className="w-4 h-4" aria-hidden="true" /> Supprimer
          </button>
          <button type="button" onClick={() => setSelected(new Set())} className="h-11 px-4 rounded-full border border-feuille/50 hover:bg-feuille/10 text-sm font-medium inline-flex items-center gap-2 cursor-pointer transition-colors sm:ml-auto">
            <X className="w-4 h-4" aria-hidden="true" /> Désélectionner
          </button>
        </div>
      )}

      <ConfirmDialog
        open={toDelete !== null}
        danger
        busy={deleting}
        title={toDelete && toDelete.length > 1 ? `Supprimer ${toDelete.length} produits ?` : `Supprimer « ${toDelete?.[0]?.name ?? ''} » ?`}
        message="Cette action est définitive. Pour garder le produit et son historique sans l'afficher aux clientes, choisissez plutôt le statut « Masqué »."
        confirmLabel="Supprimer"
        onConfirm={doDelete}
        onCancel={() => setToDelete(null)}
      />
    </div>
  );
};
