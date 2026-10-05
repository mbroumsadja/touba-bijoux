import React from 'react';
import { MessageCircle, Wallet, Truck, Boxes } from 'lucide-react';
import { useStore } from '../lib/store';
import { track } from '../lib/analytics';
import { buildGeneralWhatsAppLink, formatFCFA } from '../lib/whatsapp';
import { Product } from '../types';

interface HeroProps {
  featured: Product | null;
  onOpenProduct: (id: string) => void;
  onExploreCatalog: () => void;
}

export const Hero: React.FC<HeroProps> = ({ featured, onOpenProduct, onExploreCatalog }) => {
  const { settings, lang, tr } = useStore();
  const whatsapp = buildGeneralWhatsAppLink({ phone: settings.whatsappNumber, shopName: settings.shopName, lang });

  const perks = [
    { icon: MessageCircle, text: tr('Commande en 1 clic sur WhatsApp', 'Order in 1 tap on WhatsApp') },
    { icon: Wallet, text: tr('Paiement via Orange Money, MTN MoMo', 'Cash on delivery, Orange Money, MTN MoMo') },
    { icon: Truck, text: tr('Livraison dans tout le Cameroun', 'Delivery across Cameroon') },
    { icon: Boxes, text: tr('Détaillant et grossiste : prix de gros sur chaque pièce', 'Retail and wholesale: a wholesale price on every piece') },
  ];

  return (
    <section id="accueil" className="shop">
      <div className="relative isolate overflow-hidden bg-[#0B3B2E] min-h-[78svh] sm:min-h-[70vh] flex items-end">
        <img
          src={settings.bannerImage || '/images/hero.webp'}
          alt=""
          fetchPriority="high"
          className="absolute inset-0 -z-10 w-full h-full object-cover object-[62%_50%] sm:object-center"
        />
        <div className="absolute inset-0 -z-10 bg-gradient-to-t from-[#0B3B2E]/90 via-[#0B3B2E]/70 to-[#0B3B2E]/20 sm:bg-gradient-to-r sm:from-[#0B3B2E]/85 sm:via-[#0B3B2E]/45 sm:to-transparent" />

        <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 mb-10 pb-10 sm:pb-16 pt-24">
          <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] items-end">
            <div className="max-w-xl text-[#FBFAF6]">
              <h1 className="mt-3 font-serif text-[3.2rem] sm:text-6xl lg:text-7xl mb-5 font-medium leading-[1.02] text-[#FBFAF6]">
                {lang === 'fr' ? settings.sloganFr : settings.sloganEn}
              </h1>
              <p className="mt-4 text-base sm:text-lg text-[#FBFAF6]/85 max-w-md">
                {tr('Montres et bijoux pour femmes et hommes, au détail et en gros. Une photo, un prix, un message WhatsApp.', "Women's and men's watches and jewelry, retail and wholesale. One photo, one price, one WhatsApp message.")}
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={onExploreCatalog}
                  className="btn-gold h-12 px-7 rounded-full bg-[#D9A93C] hover:bg-[#FBFAF6] text-[#0B3B2E] text-sm font-semibold tracking-wide cursor-pointer transition-colors"
                >
                  {tr('Voir le catalogue', 'Browse the catalog')}
                </button>
                <a
                  href={whatsapp}
                  onClick={() => track('contact')}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="h-12 px-6 rounded-full border border-[#FBFAF6]/40 hover:bg-[#FBFAF6]/10 text-[#FBFAF6] text-sm font-medium inline-flex items-center gap-2 transition-colors"
                >
                  <MessageCircle className="w-4 h-4 fill-current" />
                  {tr('Écrire sur WhatsApp', 'Chat on WhatsApp')}
                </a>
              </div>
            </div>

            {featured && (
              <div className="lg:justify-self-end">
                <button
                  type="button"
                  onClick={() => onOpenProduct(featured.id)}
                  className="hang sway block w-full max-w-xs rounded-[1.6rem] bg-[#FBFAF6] p-3 text-left shadow-[0_24px_65px_rgba(11,59,46,0.18)] transition-transform hover:-translate-y-0.5"
                >
                  <div className="relative overflow-hidden rounded-[1.2rem] bg-[#DDE4DE]">
                    <img src={featured.images[0]} alt={featured.name} className="h-64 w-full object-cover" />
                    <span className="absolute left-3 top-3 tag">{tr('À découvrir', 'Featured')}</span>
                  </div>
                  <div className="mt-4 flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.2em] text-[#4A6258]">{tr('Pièce phare', 'Featured piece')}</p>
                      <h2 className="mt-1 text-xl font-semibold text-[#0B3B2E]">{lang === 'en' && featured.nameEn ? featured.nameEn : featured.name}</h2>
                    </div>
                    <span className="tag-off tag text-xs whitespace-nowrap">{formatFCFA(featured.price, lang)}</span>
                  </div>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-[#E8EEE9] border-y border-[#0B3B2E]/10">
        <ul className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 grid grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-3 text-[13px] text-[#0B3B2E]/80">
          {perks.map(({ icon: Icon, text }) => (
            <li key={text} className="flex items-start gap-2.5">
              <Icon className="w-4 h-4 mt-0.5 shrink-0 text-[#0B3B2E]" />
              <span className="leading-snug">{text}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
};
