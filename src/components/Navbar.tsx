import React from 'react';
import { MessageCircle } from 'lucide-react';
import { useStore } from '../lib/store';
import { buildGeneralWhatsAppLink } from '../lib/whatsapp';

interface NavbarProps {
  onNavigate: (sectionId: string) => void;
  activeSection: string;
}

export const Navbar: React.FC<NavbarProps> = ({ onNavigate, activeSection }) => {
  const { settings, lang, setLanguage, tr } = useStore();

  const links = [
    { id: 'accueil', label: tr('Accueil', 'Home') },
    { id: 'catalogue', label: tr('Catalogue', 'Catalog') },
    { id: 'arrivages', label: tr('Arrivages', 'New arrivals') },
    { id: 'gros', label: tr('Vente en gros', 'Wholesale') },
    { id: 'boutique', label: tr('Boutique', 'Shop') },
  ];

  const whatsapp = buildGeneralWhatsAppLink({ phone: settings.whatsappNumber, shopName: settings.shopName, lang });

  return (
    <header className="sticky top-0 z-40 bg-ivory/90 backdrop-blur-md border-b border-onyx/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3">
        <button type="button" onClick={() => onNavigate('accueil')} className="cursor-pointer" aria-label={settings.shopName}>
          <span className="font-serif text-[1.3rem] sm:text-3xl font-semibold tracking-[0.1em] leading-none whitespace-nowrap">
            {settings.shopName.split(' ')[0]}
            <span className="text-gold-deep font-medium"> {settings.shopName.split(' ').slice(1).join(' ')}</span>
          </span>
        </button>

        <nav className="hidden md:flex items-center gap-8 text-sm" aria-label="Navigation">
          {links.map((l) => (
            <button
              key={l.id}
              type="button"
              onClick={() => onNavigate(l.id)}
              aria-current={activeSection === l.id ? 'page' : undefined}
              className={`relative py-1 cursor-pointer transition-colors ${
                activeSection === l.id ? 'text-onyx font-medium' : 'text-onyx/60 hover:text-onyx'
              }`}
            >
              {l.label}
              {activeSection === l.id && <span className="absolute -bottom-0.5 inset-x-0 h-px bg-gold" />}
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-full border border-onyx/15 p-0.5 text-xs font-medium" role="group" aria-label="Langue / Language">
            {(['fr', 'en'] as const).map((code) => (
              <button
                key={code}
                type="button"
                onClick={() => setLanguage(code)}
                aria-pressed={lang === code}
                className={`h-8 min-w-9 px-2 rounded-full cursor-pointer transition-colors ${
                  lang === code ? 'bg-onyx text-ivory' : 'text-onyx/60 hover:text-onyx'
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
            className="h-10 px-3.5 rounded-full bg-wa-deep hover:bg-onyx text-white text-sm font-medium inline-flex items-center gap-2 transition-colors"
            aria-label="WhatsApp"
          >
            <MessageCircle className="w-4 h-4 fill-current" />
            <span className="hidden sm:inline">WhatsApp</span>
          </a>
        </div>
      </div>
    </header>
  );
};
