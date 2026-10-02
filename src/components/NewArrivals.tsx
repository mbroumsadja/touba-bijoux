import React from 'react';
import { ArrowRight } from 'lucide-react';
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
    <section id="arrivages" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-20">
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <h2 className="font-serif text-3xl sm:text-4xl font-medium">{tr('Nouveautés', 'New arrivals')}</h2>
          <span className="gold-rule mt-3" />
        </div>
        <button type="button" onClick={onSeeAll} className="text-sm font-medium text-gold-deep hover:text-onyx inline-flex items-center gap-1.5 cursor-pointer transition-colors">
          {tr('Tout voir', 'View all')} <ArrowRight className="w-4 h-4" />
        </button>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-3 gap-y-8 sm:gap-x-6">
        {items.map((p, i) => (
          <ProductCard key={p.id} product={p} onOpen={() => onOpen(ids, i)} />
        ))}
      </div>
    </section>
  );
};
