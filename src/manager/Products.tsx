import React, { useEffect, useMemo, useState } from 'react';
import { Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { useStore, nextReference } from '../lib/store';
import { CATEGORIES } from '../lib/initialData';
import { Stats } from '../lib/analytics';
import { Product, ProductCategory } from '../types';
import { PhotoPicker, Switch, btnGhost, btnPrimary, fmt, inputCls, labelCls, plural } from './ui';

const MAX_PHOTOS = 3;
const STATUS = [
  { id: 'all', label: 'Tous' },
  { id: 'sale', label: 'En vente' },
  { id: 'soldout', label: 'Épuisés' },
  { id: 'hidden', label: 'Masqués' },
] as const;

const chip = (on: boolean) =>
  `h-11 px-4 rounded-full text-sm whitespace-nowrap cursor-pointer border transition-colors ${on ? 'bg-encre text-feuille border-encre' : 'bg-feuille border-encre/55 text-encre'}`;

interface Props {
  stats: Stats;
  say: (msg: string, ok?: boolean) => void;
  openId: string | null;
  onOpened: () => void;
}

export const Products: React.FC<Props> = ({ stats, say, openId, onOpened }) => {
  const s = useStore();
  const { products } = s;
  const [q, setQ] = useState('');
  const [status, setStatus] = useState<(typeof STATUS)[number]['id']>('all');
  const [cat, setCat] = useState('all');
  const [editing, setEditing] = useState<'new' | string | null>(null);

  useEffect(() => {
    if (openId) {
      setEditing(openId);
      onOpened();
    }
  }, [openId, onOpened]);

  const perf = useMemo(() => new Map(stats.byProduct.map((p) => [p.product.id, p])), [stats]);
  const list = products.filter((p) => {
    if (cat !== 'all' && p.category !== cat) return false;
    if (status === 'sale' && (p.soldOut || p.hidden)) return false;
    if (status === 'soldout' && !p.soldOut) return false;
    if (status === 'hidden' && !p.hidden) return false;
    const needle = q.trim().toLowerCase();
    return !needle || `${p.name} ${p.reference}`.toLowerCase().includes(needle);
  });

  const toggle = async (p: Product, key: 'soldOut' | 'hidden' | 'isNew') => {
    const err = await s.updateProduct(p.id, { [key]: !p[key] });
    if (err) say(err, false);
  };

  if (editing !== null) {
    return <ProductForm product={editing === 'new' ? undefined : products.find((p) => p.id === editing)} say={say} onDone={() => setEditing(null)} />;
  }

  return (
    <div>
      <div className="flex items-end justify-between gap-3 flex-wrap">
        <h1 className="font-display text-[1.75rem] sm:text-4xl font-semibold leading-[1.15] text-encre">
          {plural(products.length, 'produit', 'produits')} en boutique
        </h1>
        <button type="button" onClick={() => setEditing('new')} className={btnPrimary}>
          <Plus className="w-5 h-5" /> Ajouter un produit
        </button>
      </div>

      <div className="mt-5 relative">
        <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-encre/75" aria-hidden="true" />
        <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Chercher un nom ou une référence" aria-label="Chercher un produit" className={`${inputCls} pl-11`} />
      </div>
      <div className="mt-3 flex gap-2 overflow-x-auto no-scrollbar" role="group" aria-label="Statut">
        {STATUS.map((o) => (
          <button key={o.id} type="button" aria-pressed={status === o.id} onClick={() => setStatus(o.id)} className={chip(status === o.id)}>{o.label}</button>
        ))}
      </div>
      <div className="mt-2 flex gap-2 overflow-x-auto no-scrollbar" role="group" aria-label="Catégorie">
        <button type="button" aria-pressed={cat === 'all'} onClick={() => setCat('all')} className={chip(cat === 'all')}>Toutes</button>
        {CATEGORIES.map((c) => (
          <button key={c.id} type="button" aria-pressed={cat === c.id} onClick={() => setCat(c.id)} className={chip(cat === c.id)}>{c.fr}</button>
        ))}
      </div>

      {list.length === 0 ? (
        <p className="mt-8 text-encre/70">Aucun produit ne correspond. Changez le filtre ou ajoutez un produit.</p>
      ) : (
        <ul className="mt-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 lg:gap-4">
          {list.map((p) => {
            const st = perf.get(p.id);
            const gros = p.wholesalePrice ?? 0;
            return (
              <li key={p.id} className="min-w-0 rounded-lg border border-encre/20 bg-feuille p-3">
                <div className="flex items-start gap-2.5">
                  <img src={p.images[0]} alt="" loading="lazy" decoding="async" className={`w-14 h-14 shrink-0 rounded-md object-cover bg-papier ${p.soldOut ? 'grayscale opacity-70' : ''} ${p.hidden ? 'opacity-50' : ''}`} />
                  <div className="min-w-0 flex-1">
                    <div className="font-display text-base font-semibold leading-tight text-encre line-clamp-2">{p.name}</div>
                    <div className="text-xs text-encre/70">Réf. {p.reference}, {CATEGORIES.find((c) => c.id === p.category)?.fr}</div>
                    <div className="mt-1 text-[13px] text-encre tabular-nums">
                      {p.price > 0 ? `${fmt(p.price)} FCFA` : 'Prix sur demande'}
                    </div>
                    {gros > 0 && <div className="text-[13px] text-malachite font-medium tabular-nums">Gros : {fmt(gros)} FCFA</div>}
                    {st && (
                      <div className="text-[11px] text-encre/70">
                        {plural(st.views, 'vue', 'vues')}, {plural(st.demands, 'demande', 'demandes')}
                        {st.wholesale > 0 && ` (${st.wholesale} en gros)`}
                      </div>
                    )}
                  </div>
                  <div className="flex shrink-0 gap-1.5">
                    <button type="button" onClick={() => setEditing(p.id)} className="w-9 h-9 rounded-full hover:bg-encre/10 flex items-center justify-center cursor-pointer" aria-label={`Modifier ${p.name}`}>
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        if (!confirm(`Supprimer « ${p.name} » ? Pour garder l'historique, masquez-le plutôt.`)) return;
                        const err = await s.deleteProduct(p.id);
                        if (err) say(err, false);
                      }}
                      className="w-9 h-9 rounded-full hover:bg-garance/10 text-garance flex items-center justify-center cursor-pointer"
                      aria-label={`Supprimer ${p.name}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="mt-2.5 flex flex-wrap gap-1.5">
                  <Switch on={Boolean(p.soldOut)} onChange={() => toggle(p, 'soldOut')} label="Épuisé" />
                  <Switch on={Boolean(p.isNew)} onChange={() => toggle(p, 'isNew')} label="Nouveau" />
                  <Switch on={Boolean(p.hidden)} onChange={() => toggle(p, 'hidden')} label={p.hidden ? 'Masqué' : 'Masquer'} />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

const ProductForm: React.FC<{ product?: Product; say: Props['say']; onDone: () => void }> = ({ product, say, onDone }) => {
  const s = useStore();
  const [name, setName] = useState(product?.name ?? '');
  const [nameEn, setNameEn] = useState(product?.nameEn ?? '');
  const [price, setPrice] = useState(product?.price ? String(product.price) : '');
  const [gros, setGros] = useState(product?.wholesalePrice ? String(product.wholesalePrice) : '');
  const [category, setCategory] = useState<ProductCategory>(product?.category ?? 'colliers');
  const [photos, setPhotos] = useState<string[]>(product?.images ?? []);
  const [isNew, setIsNew] = useState(product ? Boolean(product.isNew) : true);
  const [saving, setSaving] = useState(false);
  const [errs, setErrs] = useState<{ photos?: string; gros?: string }>({});

  const retail = parseInt(price, 10) || 0;
  const wholesale = parseInt(gros, 10) || 0;
  const discount = retail > 0 && wholesale > 0 && wholesale < retail ? Math.round((1 - wholesale / retail) * 100) : 0;

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;
    const found: typeof errs = {};
    if (photos.length === 0) found.photos = 'Ajoutez au moins une photo.';
    if (wholesale > 0 && retail > 0 && wholesale >= retail) found.gros = 'Le prix de gros doit être inférieur au prix de détail.';
    setErrs(found);
    if (found.photos || found.gros) return;
    const data = { name: name.trim(), nameEn: nameEn.trim() || undefined, price: retail, wholesalePrice: wholesale, category, images: photos, isNew };
    setSaving(true);
    const err = product ? await s.updateProduct(product.id, data) : await s.addProduct({ ...data, reference: nextReference(category, s.products) });
    setSaving(false);
    if (err) return say(err, false);
    say(product ? 'Produit modifié.' : 'Produit ajouté.');
    onDone();
  };

  return (
    <form onSubmit={save} className="space-y-6 max-w-xl">
      <h1 className="font-display text-[1.75rem] sm:text-4xl font-semibold leading-[1.15] text-encre">{product ? `Modifier ${product.name}` : 'Nouveau produit'}</h1>
      <div>
        <span className={labelCls}>Photos (1 à {MAX_PHOTOS})</span>
        <PhotoPicker photos={photos} max={MAX_PHOTOS} onChange={(list) => { setPhotos(list); setErrs((x) => ({ ...x, photos: undefined })); }} onError={(m) => say(m, false)} />
        {errs.photos && <p role="alert" className="mt-2 text-sm text-garance">{errs.photos}</p>}
      </div>
      <div>
        <label className={labelCls} htmlFor="p-name">Nom court</label>
        <input id="p-name" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex. Montre Élégance" className={inputCls} />
      </div>
      <div>
        <label className={labelCls} htmlFor="p-en">Nom en anglais <span className="text-encre/75 font-normal">(facultatif)</span></label>
        <input id="p-en" value={nameEn} onChange={(e) => setNameEn(e.target.value)} placeholder="Ex. Elegance Watch" className={inputCls} />
      </div>
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className={labelCls} htmlFor="p-price">Prix de détail en FCFA</label>
          <input id="p-price" inputMode="numeric" value={price} onChange={(e) => setPrice(e.target.value.replace(/\D/g, ''))} placeholder="45000" className={inputCls} />
          <p className="mt-1.5 text-xs text-encre/75">Vide : « Prix sur demande ».</p>
        </div>
        <div>
          <label className={labelCls} htmlFor="p-gros">Prix de gros en FCFA</label>
          <input id="p-gros" inputMode="numeric" value={gros} aria-invalid={Boolean(errs.gros)} aria-describedby="p-gros-help" onChange={(e) => { setGros(e.target.value.replace(/\D/g, '')); setErrs((x) => ({ ...x, gros: undefined })); }} placeholder="36000" className={inputCls} />
          <p id="p-gros-help" role={errs.gros ? 'alert' : undefined} className={`mt-1.5 ${errs.gros ? 'text-sm text-garance' : 'text-xs text-encre/75'}`}>{errs.gros ?? (discount > 0 ? `${discount} % moins cher que le détail.` : 'Vide : aucun prix de gros affiché.')}</p>
        </div>
      </div>
      <div>
        <span className={labelCls}>Catégorie</span>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((c) => (
            <button key={c.id} type="button" onClick={() => setCategory(c.id)} aria-pressed={category === c.id} className={chip(category === c.id)}>{c.fr}</button>
          ))}
        </div>
      </div>
      <Switch on={isNew} onChange={() => setIsNew((v) => !v)} label="Afficher le badge « Nouveau »" />
      <div className="flex gap-3 pt-2">
        <button type="button" onClick={onDone} className={btnGhost}>Annuler</button>
        <button type="submit" disabled={saving} className={`${btnPrimary} flex-1`}>{saving ? 'Enregistrement…' : 'Enregistrer'}</button>
      </div>
    </form>
  );
};
