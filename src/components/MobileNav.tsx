import React from 'react';
import { useStore } from '../lib/store';

interface MobileNavProps {
  onNavigate: (sectionId: string) => void;
  activeSection: string;
}

export const MobileNav: React.FC<MobileNavProps> = ({ onNavigate, activeSection }) => {
  const { tr } = useStore();

  const links = [
    { id: 'accueil', label: tr('Accueil', 'Home') },
    { id: 'catalogue', label: tr('Catalogue', 'Catalog') },
    { id: 'arrivages', label: tr('Arrivages', 'New arrivals') },
    { id: 'gros', label: tr('Gros', 'Wholesale') },
    { id: 'boutique', label: tr('Boutique', 'Shop') },
  ];

  return (
    <nav className="md:hidden sticky top-[4.1rem] z-30 border-b border-[#0B3B2E]/10 bg-[#FBFAF6]/90 backdrop-blur-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-2 overflow-x-auto px-4 py-2">
        {links.map((link) => (
          <button
            key={link.id}
            type="button"
            onClick={() => onNavigate(link.id)}
            className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
              activeSection === link.id ? 'bg-[#0B3B2E] text-[#FBFAF6]' : 'text-[#0B3B2E]/70 hover:text-[#0B3B2E]'
            }`}
          >
            {link.label}
          </button>
        ))}
      </div>
    </nav>
  );
};
