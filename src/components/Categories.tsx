import React from 'react';
import { CATEGORIES } from '../lib/initialData';
import { useStore } from '../lib/store';
import { ProductCategory } from '../types';

interface CategoriesProps {
  onSelectCategory: (category: ProductCategory) => void;
}

export const Categories: React.FC<CategoriesProps> = ({ onSelectCategory }) => {
  const { lang, tr } = useStore();

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 sm:pt-16">
      <div className="mb-6">
        <h2 className="font-serif text-3xl sm:text-4xl font-medium">{tr('Nos univers', 'Shop by category')}</h2>
        <span className="gold-rule mt-3" />
      </div>

      <div className="-mx-4 px-4 sm:mx-0 sm:px-0 flex sm:grid sm:grid-cols-5 gap-3 sm:gap-4 overflow-x-auto snap-x snap-mandatory no-scrollbar pb-1">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => onSelectCategory(cat.id)}
            className="reveal group relative shrink-0 w-[44%] sm:w-auto snap-start aspect-[4/5] rounded-2xl overflow-hidden bg-sand cursor-pointer text-left"
          >
            <img src={cat.image} alt="" loading="lazy" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
            <div className="absolute inset-0 bg-gradient-to-t from-onyx/75 via-transparent to-transparent" />
            <span className="absolute bottom-3 left-3 right-3 font-serif text-xl text-ivory leading-tight">
              {lang === 'fr' ? cat.fr : cat.en}
            </span>
          </button>
        ))}
      </div>
    </section>
  );
};
