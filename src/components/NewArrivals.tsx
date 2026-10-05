import React from 'react';
import { useStore } from '../lib/store';
import { ProductCard } from './ProductCard';

interface NewArrivalsProps {
  onOpen: (ids: string[], index: number) => void;
  onSeeAll: () => void;
}

export const NewArrivals: React.FC<NewArrivalsProps> = ({ onOpen, onSeeAll }) => {
  const { products, tr } = useStore();
  const items = products.filter((p) => !p.hidden && p.isNew && !p.soldOut).slice(0, 4);
  if (items.length === 0) return null;
  const ids = items.map((p) => p.id);

  return (
    <section id="arrivages" className="bg-mist border-t-4 border-brass">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-20">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-x-6 gap-y-1">
          <h2 className="text-[2rem] sm:text-5xl lg:text-6xl font-bold">{tr('Nouveautés', 'New arrivals')}</h2>
          <button
            type="button"
            onClick={onSeeAll}
            className="min-h-11 font-semibold underline underline-offset-4 decoration-2 decoration-tag hover:text-tag cursor-pointer"
          >
            {tr('Voir tout le catalogue', 'See the whole catalog')}
          </button>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-3 gap-y-10 sm:gap-x-6">
          {items.map((p, i) => (
            <ProductCard key={p.id} product={p} onOpen={() => onOpen(ids, i)} />
          ))}
        </div>
      </div>
    </section>
  );
};
