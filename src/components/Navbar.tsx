import React from 'react';
import { MessageCircle } from 'lucide-react';
import { useStore } from '../lib/store';
import { buildGeneralWhatsAppLink } from '../lib/whatsapp';

interface NavbarProps {
  onNavigate: (sectionId: string) => void;
  activeSection: string;
}

export const Navbar: React.FC<NavbarProps> = ({ onNavigate, activeSection }) => {
  const { products, settings, lang, setLanguage, tr } = useStore();

  // « Nouveautés » n'existe que s'il y a des pièces nouvelles à montrer
  const hasNew = products.some((p) => !p.hidden && p.isNew && !p.soldOut);
  const links = [
    { id: 'accueil', label: tr('Accueil', 'Home') },
    { id: 'catalogue', label: tr('Catalogue', 'Catalog') },
    ...(hasNew ? [{ id: 'arrivages', label: tr('Nouveautés', 'New') }] : []),
    { id: 'gros', label: tr('Vente en gros', 'Wholesale') },
    { id: 'boutique', label: tr('Boutique', 'Shop') },
  ];

  const whatsapp = buildGeneralWhatsAppLink({ phone: settings.whatsappNumber, shopName: settings.shopName, lang });

  return (
    <header className="sticky top-0 z-40 bg-porcelain/92 backdrop-blur-md border-b border-velvet/15">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => onNavigate('accueil')}
          className="h-11 min-w-0 flex items-center cursor-pointer font-heading text-base sm:text-2xl font-extrabold tracking-tight whitespace-nowrap"
          aria-label={settings.shopName}
        >
          {settings.shopName}
        </button>

        <nav className="hidden md:flex items-center gap-7 text-[15px]" aria-label="Navigation">
          {links.map((l) => {
            const active = activeSection === l.id;
            return (
              <button
                key={l.id}
                type="button"
                onClick={() => onNavigate(l.id)}
                aria-current={active ? 'page' : undefined}
                className={`h-11 border-b-2 cursor-pointer ${
                  active ? 'border-tag font-semibold text-velvet' : 'border-transparent text-moss hover:text-velvet'
                }`}
              >
                {l.label}
              </button>
            );
          })}
        </nav>

        <div className="flex items-center gap-1.5">
          <div className="flex items-center text-sm font-semibold" role="group" aria-label="Langue / Language">
            {(['fr', 'en'] as const).map((code) => (
              <button
                key={code}
                type="button"
                onClick={() => setLanguage(code)}
                aria-pressed={lang === code}
                className={`h-11 min-w-11 px-2 cursor-pointer border-b-2 ${
                  lang === code ? 'border-tag text-velvet' : 'border-transparent text-moss hover:text-velvet'
                }`}
              >
                {code.toUpperCase()}
              </button>
            ))}
          </div>

          <a
            href={whatsapp}
            target="_blank"
            rel="noopener noreferrer"
            className="h-11 min-w-11 px-3 rounded-sm bg-velvet hover:bg-velvet-deep text-white text-sm font-semibold inline-flex items-center justify-center gap-2"
            aria-label="WhatsApp"
          >
            <MessageCircle className="w-[18px] h-[18px] fill-current" aria-hidden="true" />
            <span className="hidden sm:inline">WhatsApp</span>
          </a>
        </div>
      </div>
    </header>
  );
};
