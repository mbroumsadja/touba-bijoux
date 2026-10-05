import React, { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { useStore } from '../lib/store';
import { CATEGORIES } from '../lib/initialData';
import { ProductCard } from './ProductCard';

interface ProductGridProps {
  selectedCategory: string; // 'all' ou ProductCategory
  onSelectCategory: (cat: string) => void;
  onOpen: (ids: string[], index: number) => void;
}

export const ProductGrid: React.FC<ProductGridProps> = ({ selectedCategory, onSelectCategory, onOpen }) => {
  const { products, lang, tr, ready, offline } = useStore();
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return products.filter((p) => {
      if (p.hidden) return false;
      if (selectedCategory !== 'all' && p.category !== selectedCategory) return false;
      if (!needle) return true;
      const haystack = `${p.name} ${p.nameEn ?? ''} ${p.reference}`.toLowerCase();
      return haystack.includes(needle);
    });
  }, [products, query, selectedCategory]);

  const ids = filtered.map((p) => p.id);
  const tabs = [{ id: 'all', fr: 'Tout', en: 'All' }, ...CATEGORIES];
  const searching = query.trim() !== '';

  return (
    <section id="catalogue">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 sm:pt-20 pb-6">
        <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-5">
          <div>
            <h2 className="text-[2rem] sm:text-5xl lg:text-6xl font-bold">{tr('Le catalogue', 'The catalog')}</h2>
            <p className="mt-2 text-moss tabular-nums" aria-live="polite">
              {filtered.length} {tr(filtered.length > 1 ? 'pièces' : 'pièce', filtered.length > 1 ? 'items' : 'item')}
            </p>
          </div>

          <div className="w-full sm:w-80">
            <label htmlFor="catalog-search" className="block text-sm text-moss mb-1.5">
              {tr('Nom ou référence', 'Name or reference')}
            </label>
            <div className="relative">
              <Search className="w-[18px] h-[18px] absolute left-3.5 top-1/2 -translate-y-1/2 text-moss" aria-hidden="true" />
              <input
                id="catalog-search"
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={tr('Ex. M-001, collier…', 'e.g. M-001, necklace…')}
                className="w-full h-12 rounded-sm border border-velvet/50 bg-paper pl-11 pr-3 text-base text-velvet placeholder:text-moss outline-none focus:border-tag focus:ring-1 focus:ring-tag"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Seuls les filtres restent collés en haut de l'écran */}
      <div className="sticky top-16 z-30 bg-porcelain/92 backdrop-blur-md border-y border-velvet/15">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-6 overflow-x-auto no-scrollbar" role="tablist" aria-label={tr('Catégories', 'Categories')}>
            {tabs.map((t) => {
              const active = selectedCategory === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => onSelectCategory(t.id)}
                  className={`h-12 border-b-2 whitespace-nowrap shrink-0 cursor-pointer ${
                    active ? 'border-tag text-velvet font-semibold' : 'border-transparent text-moss hover:text-velvet'
                  }`}
                >
                  {lang === 'fr' ? t.fr : t.en}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-16 sm:pb-24">
        {filtered.length === 0 ? (
          <div className="py-14 max-w-md">
            {!ready ? (
              <p className="text-lg">{tr('Chargement du catalogue…', 'Loading the catalog…')}</p>
            ) : offline ? (
              <p className="text-lg">
                {tr(
                  'Le catalogue est momentanément indisponible. Réessayez dans un instant ou écrivez-nous sur WhatsApp.',
                  'The catalog is temporarily unavailable. Please retry shortly or message us on WhatsApp.',
                )}
              </p>
            ) : searching ? (
              <>
                <p className="text-lg font-heading font-bold">{tr(`Aucune pièce ne correspond à « ${query.trim()} »`, `No piece matches “${query.trim()}”`)}</p>
                <button type="button" onClick={() => setQuery('')} className="mt-4 h-12 px-6 rounded-sm bg-velvet hover:bg-velvet-deep text-white font-semibold cursor-pointer">
                  {tr('Effacer la recherche', 'Clear the search')}
                </button>
              </>
            ) : (
              <>
                <p className="text-lg font-heading font-bold">{tr('Aucune pièce dans cette catégorie pour le moment', 'No pieces in this category yet')}</p>
                <button type="button" onClick={() => onSelectCategory('all')} className="mt-4 h-12 px-6 rounded-sm bg-velvet hover:bg-velvet-deep text-white font-semibold cursor-pointer">
                  {tr('Voir tout le catalogue', 'See the whole catalog')}
                </button>
              </>
            )}
          </div>
        ) : (
          <div key={selectedCategory} className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-3 gap-y-10 sm:gap-x-6">
            {filtered.map((p, i) => (
              <ProductCard key={p.id} product={p} onOpen={() => onOpen(ids, i)} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};
