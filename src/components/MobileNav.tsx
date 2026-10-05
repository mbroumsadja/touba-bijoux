import React from 'react';
import { Boxes, Gem, House, Sparkles, Store } from 'lucide-react';
import { useStore } from '../lib/store';

interface MobileNavProps {
  onNavigate: (sectionId: string) => void;
  activeSection: string;
}

export const MobileNav: React.FC<MobileNavProps> = ({ onNavigate, activeSection }) => {
  const { products, tr } = useStore();
  const hasNew = products.some((p) => !p.hidden && p.isNew && !p.soldOut);

  const items = [
    { id: 'accueil', icon: House, label: tr('Accueil', 'Home') },
    { id: 'catalogue', icon: Gem, label: tr('Catalogue', 'Catalog') },
    ...(hasNew ? [{ id: 'arrivages', icon: Sparkles, label: tr('Nouveautés', 'New') }] : []),
    { id: 'gros', icon: Boxes, label: tr('Gros', 'Wholesale') },
    { id: 'boutique', icon: Store, label: tr('Boutique', 'Shop') },
  ];

  return (
    <nav
      className="md:hidden fixed inset-x-0 bottom-0 z-40 bg-porcelain/95 backdrop-blur-md border-t border-velvet/15 pb-[env(safe-area-inset-bottom)]"
      aria-label="Navigation"
    >
      <ul className="flex h-16 items-stretch">
        {items.map(({ id, icon: Icon, label }) => {
          const active = activeSection === id;
          return (
            <li key={id} className="flex-1">
              <button
                type="button"
                onClick={() => onNavigate(id)}
                aria-current={active ? 'page' : undefined}
                className={`relative w-full h-full flex flex-col items-center justify-center gap-1 text-xs cursor-pointer ${
                  active ? 'text-velvet font-semibold' : 'text-moss'
                }`}
              >
                {active && <span className="absolute top-0 inset-x-3 h-[3px] bg-tag" />}
                <Icon className="w-[22px] h-[22px]" aria-hidden="true" />
                {label}
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
};
