import React from 'react';
import { useStore } from '../lib/store';
import { CATEGORIES } from '../lib/initialData';
import { ProductCategory } from '../types';

interface CategoriesProps {
  onSelectCategory: (category: ProductCategory) => void;
}

export const Categories: React.FC<CategoriesProps> = ({ onSelectCategory }) => {
  const { products, lang, tr } = useStore();
  const count = (id: string) => products.filter((p) => !p.hidden && p.category === id).length;

  return (
    <section aria-labelledby="univers" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-10 pb-6">
      <h2 id="univers" className="sr-only">{tr('Choisir un univers', 'Choose a category')}</h2>
      <ul className="border-t border-velvet/25">
        {CATEGORIES.map((cat) => {
          const n = count(cat.id);
          return (
            <li key={cat.id} className="border-b border-velvet/25">
              <button
                type="button"
                onClick={() => onSelectCategory(cat.id)}
                className="group w-full min-h-[4.5rem] py-4 sm:py-6 flex items-center justify-between gap-4 text-left cursor-pointer"
              >
                <span className="min-w-0">
                  <span className="block font-heading font-extrabold text-[2rem] sm:text-6xl lg:text-7xl leading-none tracking-tight group-hover:text-tag">
                    {lang === 'fr' ? cat.fr : cat.en}
                  </span>
                  <span className="mt-1.5 block text-sm tabular-nums text-moss">
                    {n} {tr(n > 1 ? 'pièces' : 'pièce', n > 1 ? 'items' : 'item')}
                  </span>
                </span>
                <img
                  src={cat.image}
                  alt=""
                  loading="lazy"
                  width={160}
                  height={160}
                  className="shrink-0 w-16 h-16 sm:w-24 sm:h-24 lg:w-32 lg:h-32 object-cover bg-mist"
                />
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
};
