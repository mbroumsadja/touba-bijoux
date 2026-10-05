import React from 'react';
import { Lock } from 'lucide-react';
import { useStore } from '../lib/store';

interface FooterProps {
  onNavigate: (section: string) => void;
  onOpenAdmin: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate, onOpenAdmin }) => {
  const { products, settings, lang, tr } = useStore();
  const hasNew = products.some((p) => !p.hidden && p.isNew && !p.soldOut);

  const links = [
    { id: 'catalogue', label: tr('Catalogue', 'Catalog') },
    ...(hasNew ? [{ id: 'arrivages', label: tr('Nouveautés', 'New arrivals') }] : []),
    { id: 'gros', label: tr('Vente en gros', 'Wholesale') },
    { id: 'boutique', label: tr('Boutique', 'Shop') },
  ];

  return (
    <footer className="on-dark bg-velvet-deep text-porcelain">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 pb-28 md:pb-10">
        <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="font-heading text-4xl sm:text-5xl font-extrabold tracking-tight">{settings.shopName}</p>
            <p className="mt-2 text-porcelain/80">{lang === 'fr' ? settings.sloganFr : settings.sloganEn}</p>
          </div>
          <nav aria-label={tr('Pied de page', 'Footer')} className="flex flex-wrap gap-x-6 text-porcelain/90">
            {links.map((l) => (
              <button key={l.id} type="button" onClick={() => onNavigate(l.id)} className="h-11 hover:text-brass cursor-pointer">
                {l.label}
              </button>
            ))}
          </nav>
        </div>

        <p className="mt-8 max-w-[60ch] text-sm text-brass">
          {tr(
            'Vente au détail et en gros. Livraison dans tout le Cameroun. Paiement à la livraison, Orange Money ou MTN MoMo.',
            'Retail and wholesale. Delivery across Cameroon. Cash on delivery, Orange Money or MTN MoMo.',
          )}
        </p>

        <div className="mt-8 pt-4 border-t border-porcelain/20 flex items-center justify-between text-sm text-porcelain/75">
          <span>© {new Date().getFullYear()} {settings.shopName}</span>
          <button type="button" onClick={onOpenAdmin} className="inline-flex items-center gap-1.5 h-11 px-2 hover:text-brass cursor-pointer">
            <Lock className="w-3.5 h-3.5" aria-hidden="true" /> {tr('Espace gérant', 'Manager')}
          </button>
        </div>
      </div>
    </footer>
  );
};
