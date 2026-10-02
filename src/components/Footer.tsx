import React from 'react';
import { Lock } from 'lucide-react';
import { useStore } from '../lib/store';

interface FooterProps {
  onNavigate: (section: string) => void;
  onOpenAdmin: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate, onOpenAdmin }) => {
  const { settings, lang, tr } = useStore();

  return (
    <footer className="bg-onyx text-ivory">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-24 flex flex-col items-center text-center gap-5">
        <span className="font-serif text-3xl tracking-[0.14em]">{settings.shopName}</span>
        <p className="text-ivory/60 text-sm">{lang === 'fr' ? settings.sloganFr : settings.sloganEn}</p>
        <nav className="flex gap-6 text-sm text-ivory/70">
          <button type="button" onClick={() => onNavigate('catalogue')} className="hover:text-gold cursor-pointer transition-colors">{tr('Catalogue', 'Catalog')}</button>
          <button type="button" onClick={() => onNavigate('gros')} className="hover:text-gold cursor-pointer transition-colors">{tr('Vente en gros', 'Wholesale')}</button>
          <button type="button" onClick={() => onNavigate('boutique')} className="hover:text-gold cursor-pointer transition-colors">{tr('Boutique', 'Shop')}</button>
        </nav>
        <p className="text-xs text-gold">{tr('Vente en détail et en gros · Livraison dans tout le Cameroun · Paiement à la livraison, Orange Money ou MTN MoMo.', 'Retail and wholesale · Delivery across Cameroon · Cash on delivery, Orange Money or MTN MoMo.')}</p>
        <div className="w-full pt-6 mt-2 border-t border-ivory/10 flex items-center justify-between text-xs text-ivory/40">
          <span>© {new Date().getFullYear()} {settings.shopName}</span>
          <button type="button" onClick={onOpenAdmin} className="inline-flex items-center gap-1.5 h-9 px-2 hover:text-gold cursor-pointer transition-colors">
            <Lock className="w-3.5 h-3.5" /> {tr('Espace gérant', 'Manager')}
          </button>
        </div>
      </div>
    </footer>
  );
};
