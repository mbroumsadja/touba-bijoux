import React from 'react';
import { MessageCircle, Wallet, Truck, Boxes } from 'lucide-react';
import { useStore } from '../lib/store';
import { track } from '../lib/analytics';
import { buildGeneralWhatsAppLink } from '../lib/whatsapp';
import { CATEGORIES, IMG } from '../lib/initialData';
import { ProductCategory } from '../types';

interface HeroProps {
  onSelectCategory: (category: ProductCategory) => void;
  onExploreCatalog: () => void;
}

export const Hero: React.FC<HeroProps> = ({ onSelectCategory, onExploreCatalog }) => {
  const { settings, lang, tr } = useStore();
  const whatsapp = buildGeneralWhatsAppLink({ phone: settings.whatsappNumber, shopName: settings.shopName, lang });

  const perks = [
    { icon: MessageCircle, text: tr('Commande en 1 clic sur WhatsApp', 'Order in 1 tap on WhatsApp') },
    { icon: Wallet, text: tr('Paiement via Orange Money, MTN MoMo', 'Cash on delivery, Orange Money, MTN MoMo') },
    { icon: Truck, text: tr('Livraison dans tout le Cameroun', 'Delivery across Cameroon') },
    { icon: Boxes, text: tr('Détaillant et grossiste : prix de gros sur chaque pièce', 'Retail and wholesale: a wholesale price on every piece') },
  ];

  return (
    <section id="accueil">
      {/* Bannière */}
      <div className="relative isolate overflow-hidden bg-onyx min-h-[78svh] sm:min-h-[70vh] flex items-end">
        <img
          src={settings.bannerImage || IMG.hero}
          alt=""
          fetchPriority="high"
          className="absolute inset-0 -z-10 w-full h-full object-cover object-[62%_50%] sm:object-center"
        />
        <div className="absolute inset-0 -z-10 bg-gradient-to-t from-onyx/90 via-onyx/55 to-onyx/10 sm:bg-gradient-to-r sm:from-onyx/80 sm:via-onyx/35 sm:to-transparent" />

        <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 mb-10 pb-10 sm:pb-16 pt-24">
          <div className="max-w-xl text-ivory">
            <h1 className="mt-3 font-serif text-[3.9rem] sm:text-6xl lg:text-7xl mb-5 font-medium leading-[1.02]">
              {lang === 'fr' ? settings.sloganFr : settings.sloganEn}
            </h1>
            <p className="mt-4 text-base sm:text-lg text-ivory/85 max-w-md">
              {tr('Montres et bijoux pour femmes et hommes, au détail et en gros. Une photo, un prix, un message WhatsApp.', "Women's and men's watches and jewelry, retail and wholesale. One photo, one price, one WhatsApp message.")}
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={onExploreCatalog}
                className="btn-gold h-12 px-7 rounded-full bg-gold hover:bg-ivory text-onyx text-sm font-semibold tracking-wide cursor-pointer transition-colors"
              >
                {tr('Voir le catalogue', 'Browse the catalog')}
              </button>
              <a
                href={whatsapp}
                onClick={() => track('contact')}
                target="_blank"
                rel="noopener noreferrer"
                className="h-12 px-6 rounded-full border border-ivory/40 hover:bg-ivory/10 text-ivory text-sm font-medium inline-flex items-center gap-2 transition-colors"
              >
                <MessageCircle className="w-4 h-4 fill-current" />
                {tr('Écrire sur WhatsApp', 'Chat on WhatsApp')}
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Bandeau de réassurance */}
      <div className="bg-sand border-y border-onyx/10">
        <ul className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 grid grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-3 text-[13px] text-onyx/80">
          {perks.map(({ icon: Icon, text }) => (
            <li key={text} className="flex items-start gap-2.5">
              <Icon className="w-4 h-4 mt-0.5 shrink-0 text-gold-deep" />
              <span className="leading-snug">{text}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Catégories */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 sm:pt-16">
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
      </div>
    </section>
  );
};
