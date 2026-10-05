import React, { useEffect, useRef, useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { nextReference, useStore } from '../lib/store';
import { CATEGORIES } from '../lib/initialData';
import { ProductStat } from '../lib/analytics';
import { Product, ProductCategory } from '../types';
import {
  PhotoPicker, STATUS_DOT, STATUS_LABEL, STATUS_OPTIONS, SelectField, StatusId, Switch,
  btnGhost, btnPrimary, inputCls, labelCls, plural, statusOf, statusPatch,
} from './ui';

const MAX_PHOTOS = 3;
const card = 'rounded-xl border border-encre/15 bg-feuille p-4 sm:p-5';
const cardTitle = 'font-display text-lg font-semibold leading-snug text-encre';
const help = 'mt-1.5 text-xs text-encre/75';

const STATUS_HELP: Record<StatusId, string> = {
  sale: 'Visible dans la boutique et commandable.',
  soldout: 'Visible, marqué « Épuisé », sans bouton Commander.',
  hidden: 'Invisible pour les clientes. Le produit et son historique sont conservés.',
};

interface Props {
  product?: Product;
  stat?: ProductStat;
  say: (msg: string, ok?: boolean) => void;
  go: (path: string, force?: boolean) => void;
  onDirty: (dirty: boolean) => void;
}

export const ProductForm: React.FC<Props> = ({ product, stat, say, go, onDirty }) => {
  const s = useStore();
  const initial = useRef({
    name: product?.name ?? '',
    nameEn: product?.nameEn ?? '',
    price: product?.price ? String(product.price) : '',
    gros: product?.wholesalePrice ? String(product.wholesalePrice) : '',
    category: (product?.category ?? 'colliers') as ProductCategory,
    photos: product?.images ?? [],
    isNew: product ? Boolean(product.isNew) : true,
    status: (product ? statusOf(product) : 'sale') as StatusId,
  }).current;

  const [name, setName] = useState(initial.name);
  const [nameEn, setNameEn] = useState(initial.nameEn);
  const [price, setPrice] = useState(initial.price);
  const [gros, setGros] = useState(initial.gros);
  const [category, setCategory] = useState<ProductCategory>(initial.category);
  const [photos, setPhotos] = useState<string[]>(initial.photos);
  const [isNew, setIsNew] = useState(initial.isNew);
  const [status, setStatus] = useState<StatusId>(initial.status);
  const [saving, setSaving] = useState(false);
  const [errs, setErrs] = useState<{ photos?: string; gros?: string }>({});
  const photoBox = useRef<HTMLDivElement>(null);
  const grosInput = useRef<HTMLInputElement>(null);

  const retail = parseInt(price, 10) || 0;
  const wholesale = parseInt(gros, 10) || 0;
  const discount = retail > 0 && wholesale > 0 && wholesale < retail ? Math.round((1 - wholesale / retail) * 100) : 0;

  const dirty =
    name !== initial.name || nameEn !== initial.nameEn || price !== initial.price || gros !== initial.gros ||
    category !== initial.category || isNew !== initial.isNew || status !== initial.status ||
    photos.length !== initial.photos.length || photos.some((p, i) => p !== initial.photos[i]);

  // Prévient le tableau de bord : changer de page avec des modifications non enregistrées demande confirmation.
  useEffect(() => {
    onDirty(dirty);
  }, [dirty, onDirty]);
  useEffect(() => () => onDirty(false), [onDirty]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;
    const found: typeof errs = {};
    if (photos.length === 0) found.photos = 'Ajoutez au moins une photo.';
    if (wholesale > 0 && retail > 0 && wholesale >= retail) found.gros = 'Le prix de gros doit être inférieur au prix de détail.';
    setErrs(found);
    // Le focus va sur le premier champ en erreur (lecteurs d'écran et clavier).
    if (found.photos) return photoBox.current?.focus();
    if (found.gros) return grosInput.current?.focus();

    const data = {
      name: name.trim(),
      nameEn: nameEn.trim(),
      price: retail,
      wholesalePrice: wholesale,
      category,
      images: photos,
      isNew,
      // Modification : le statut n'est envoyé que s'il a changé, les champs d'un produit inchangé ne sont pas touchés.
      ...(product
        ? status !== initial.status ? statusPatch(status) : {}
        : { soldOut: status === 'soldout', hidden: status === 'hidden' }),
    };
    setSaving(true);
    const err = product ? await s.updateProduct(product.id, data) : await s.addProduct({ ...data, reference: nextReference(category, s.products) });
    setSaving(false);
    if (err) return say(err, false);
    say(product ? 'Produit modifié.' : 'Produit ajouté.');
    onDirty(false);
    go('produits', true);
  };

  const title = product ? `Modifier ${product.name}` : 'Nouveau produit';

  return (
    <form onSubmit={save}>
      <nav aria-label="Fil d'Ariane" className="flex items-center gap-1 text-sm text-encre/75">
        <button type="button" onClick={() => go('produits')} className="h-11 -ml-2 px-2 underline underline-offset-4 decoration-or cursor-pointer">Produits</button>
        <ChevronRight className="w-4 h-4 shrink-0" aria-hidden="true" />
        <span aria-current="page" className="truncate">{title}</span>
      </nav>
      <h1 className="mt-1 font-display text-[1.75rem] sm:text-4xl font-semibold leading-[1.15] text-encre">{title}</h1>

      <div className="mt-6 grid lg:grid-cols-[minmax(0,1fr)_20rem] gap-6 items-start">
        <div className="space-y-6 min-w-0">
          <section className={card}>
            <h2 className={cardTitle}>Photos</h2>
            <p className={help}>De 1 à {MAX_PHOTOS} photos. La première est la photo principale.</p>
            <div ref={photoBox} tabIndex={-1} className="mt-3 outline-none">
              <PhotoPicker
                photos={photos}
                max={MAX_PHOTOS}
                onChange={(list) => { setPhotos(list); setErrs((x) => ({ ...x, photos: undefined })); }}
                onError={(m) => say(m, false)}
              />
            </div>
            {errs.photos && <p role="alert" className="mt-2 text-sm text-garance">{errs.photos}</p>}
          </section>

          <section className={card}>
            <h2 className={cardTitle}>Informations</h2>
            <div className="mt-3 space-y-4">
              <div>
                <label className={labelCls} htmlFor="p-name">Nom court</label>
                <input id="p-name" required autoComplete="off" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex. Montre Élégance" className={inputCls} />
              </div>
              <div>
                <label className={labelCls} htmlFor="p-en">Nom en anglais <span className="text-encre/75 font-normal">(facultatif)</span></label>
                <input id="p-en" autoComplete="off" value={nameEn} onChange={(e) => setNameEn(e.target.value)} placeholder="Ex. Elegance Watch" className={inputCls} />
              </div>
            </div>
          </section>

          <section className={card}>
            <h2 className={cardTitle}>Prix</h2>
            <div className="mt-3 grid sm:grid-cols-2 gap-4">
              <div>
                <label className={labelCls} htmlFor="p-price">Prix de détail en FCFA</label>
                <input id="p-price" inputMode="numeric" autoComplete="off" value={price} aria-describedby="p-price-help" onChange={(e) => setPrice(e.target.value.replace(/\D/g, ''))} placeholder="45000" className={`${inputCls} tabular-nums`} />
                <p id="p-price-help" className={help}>Vide : « Prix sur demande ».</p>
              </div>
              <div>
                <label className={labelCls} htmlFor="p-gros">Prix de gros en FCFA</label>
                <input ref={grosInput} id="p-gros" inputMode="numeric" autoComplete="off" value={gros} aria-invalid={Boolean(errs.gros)} aria-describedby="p-gros-help" onChange={(e) => { setGros(e.target.value.replace(/\D/g, '')); setErrs((x) => ({ ...x, gros: undefined })); }} placeholder="36000" className={`${inputCls} tabular-nums`} />
                <p id="p-gros-help" role={errs.gros ? 'alert' : undefined} className={errs.gros ? 'mt-1.5 text-sm text-garance' : help}>
                  {errs.gros ?? (discount > 0 ? `${discount} % moins cher que le détail.` : 'Vide : aucun prix de gros affiché.')}
                </p>
              </div>
            </div>
          </section>
        </div>

        <aside className="space-y-6 lg:sticky lg:top-6">
          <section className={card}>
            <h2 className={cardTitle}>Statut</h2>
            <div className="mt-3">
              <label className="sr-only" htmlFor="p-status">Statut du produit</label>
              <SelectField id="p-status" value={status} onChange={(v) => setStatus(v as StatusId)} dot={STATUS_DOT[status]}>
                {STATUS_OPTIONS.map((o) => <option key={o} value={o}>{STATUS_LABEL[o]}</option>)}
              </SelectField>
              <p className={help}>{STATUS_HELP[status]}</p>
            </div>
          </section>

          <section className={card}>
            <h2 className={cardTitle}>Organisation</h2>
            <div className="mt-3 space-y-4">
              <div>
                <label className={labelCls} htmlFor="p-cat">Catégorie</label>
                <SelectField id="p-cat" value={category} onChange={(v) => setCategory(v as ProductCategory)}>
                  {CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.fr}</option>)}
                </SelectField>
              </div>
              <Switch on={isNew} onChange={() => setIsNew((v) => !v)} label="Badge « Nouveau »" />
              <div className="pt-3 border-t border-encre/15 text-sm">
                <div className="text-encre/75">Référence</div>
                <div className="font-medium tabular-nums">{product ? product.reference : nextReference(category, s.products)}</div>
                {!product && <p className={help}>Attribuée automatiquement selon la catégorie.</p>}
              </div>
              {stat && (
                <div className="pt-3 border-t border-encre/15 text-sm">
                  <div className="text-encre/75">Ces 30 derniers jours</div>
                  <div className="font-medium">
                    {plural(stat.views, 'vue', 'vues')}, {plural(stat.demands, 'demande', 'demandes')}
                    {stat.wholesale > 0 && ` (${stat.wholesale} en gros)`}
                  </div>
                </div>
              )}
            </div>
          </section>
        </aside>
      </div>

      <div className="sticky z-10 bottom-[calc(4rem+env(safe-area-inset-bottom))] lg:bottom-0 mt-8 -mx-4 sm:-mx-8 xl:-mx-12 px-4 sm:px-8 xl:px-12 py-3 bg-papier/95 backdrop-blur border-t border-encre/15 flex items-center justify-end gap-3">
        {dirty && <span className="mr-auto hidden sm:inline text-sm text-encre/75">Modifications non enregistrées</span>}
        <button type="button" onClick={() => go('produits')} className={btnGhost}>Annuler</button>
        <button type="submit" disabled={saving} className={btnPrimary}>{saving ? 'Enregistrement…' : product ? 'Enregistrer' : 'Ajouter le produit'}</button>
      </div>
    </form>
  );
};
