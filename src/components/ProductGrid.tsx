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
  const dark = selectedCategory === 'montres';

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

  return (
    <section id="catalogue" className={`transition-colors duration-500 ${dark ? 'bg-onyx text-ivory' : 'bg-ivory text-onyx'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 sm:pt-20 pb-6">
        <div className="mb-0 flex items-end justify-between gap-4">
          <div>
            <h2 className="font-serif text-3xl sm:text-4xl font-medium">{tr('Le catalogue', 'The catalog')}</h2>
            <span className="gold-rule mt-3" />
          </div>
          <span className={`text-sm tabular-nums ${dark ? 'text-ivory/60' : 'text-onyx/50'}`}>
            {filtered.length} {tr(filtered.length > 1 ? 'pièces' : 'pièce', filtered.length > 1 ? 'items' : 'item')}
          </span>
        </div>
      </div>

      <div className={`sticky top-16 z-30 border-y ${dark ? 'bg-onyx/95 border-ivory/10' : 'bg-ivory/95 border-onyx/10'} backdrop-blur`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="mb-3 relative">
            <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-current/70" aria-hidden="true" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={tr('Rechercher un produit…', 'Search a product…')}
              aria-label={tr('Rechercher un produit', 'Search a product')}
              className={`w-full h-11 rounded-full border pl-11 pr-4 text-sm outline-none transition-colors ${
                dark ? 'border-ivory/15 bg-ivory/5 text-ivory placeholder:text-ivory/45' : 'border-onyx/15 bg-white text-onyx placeholder:text-onyx/45'
              }`}
            />
          </div>

          <div className="flex gap-2 overflow-x-auto no-scrollbar" role="tablist" aria-label={tr('Catégories', 'Categories')}>
            {tabs.map((t) => {
              const active = selectedCategory === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => onSelectCategory(t.id)}
                  className={`h-10 px-4 rounded-full text-sm whitespace-nowrap shrink-0 cursor-pointer transition-colors ${
                    active
                      ? dark ? 'bg-gold text-onyx font-semibold' : 'bg-onyx text-ivory font-medium'
                      : dark ? 'text-ivory/70 hover:text-ivory border border-ivory/20' : 'text-onyx/70 hover:text-onyx border border-onyx/15'
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
          <p className={`py-16 text-center ${dark ? 'text-ivory/60' : 'text-onyx/50'}`}>
            {!ready
              ? tr('Chargement du catalogue…', 'Loading the catalog…')
              : offline
                ? tr('Le catalogue est momentanément indisponible. Réessayez dans un instant ou écrivez-nous sur WhatsApp.', 'The catalog is temporarily unavailable. Please retry shortly or message us on WhatsApp.')
                : tr('Aucune pièce dans cette catégorie pour le moment.', 'No items in this category yet.')}
          </p>
        ) : (
          <div key={selectedCategory} className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-3 gap-y-8 sm:gap-x-6 sm:gap-y-10">
            {filtered.map((p, i) => (
              <ProductCard key={p.id} product={p} dark={dark} onOpen={() => onOpen(ids, i)} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};
