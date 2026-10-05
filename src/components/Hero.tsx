import React from 'react';
import { MessageCircle } from 'lucide-react';
import { useStore } from '../lib/store';
import { track } from '../lib/analytics';
import { buildGeneralWhatsAppLink, formatFCFA } from '../lib/whatsapp';
import { IMG } from '../lib/initialData';
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
    { title: tr('Commande sur WhatsApp', 'Order on WhatsApp'), text: tr('Un message suffit, sans compte à créer.', 'One message is enough. No account needed.') },
    { title: tr('Paiement', 'Payment'), text: tr('À la livraison, Orange Money ou MTN MoMo.', 'Cash on delivery, Orange Money or MTN MoMo.') },
    { title: tr('Livraison', 'Delivery'), text: tr('Dans tout le Cameroun.', 'Across Cameroon.') },
    { title: tr('Prix de gros', 'Wholesale prices'), text: tr('Affiché sur chaque pièce.', 'Shown on every piece.') },
  ];

  const featuredName = featured ? (lang === 'en' && featured.nameEn ? featured.nameEn : featured.name) : '';
  const featuredWholesale = featured && (featured.wholesalePrice ?? 0) > 0;

  return (
    <section id="accueil">
      <div className="on-dark bg-velvet text-porcelain overflow-x-clip">
        <div className="grid lg:grid-cols-2">
          <div className="px-4 sm:px-6 py-14 sm:py-20 lg:py-28 lg:pl-[max(2rem,calc((100vw-80rem)/2+2rem))] lg:pr-14 flex flex-col justify-center">
            <h1 className="text-[2.75rem] sm:text-6xl xl:text-7xl font-extrabold leading-[1.02] max-w-[13ch]">
              {lang === 'fr' ? settings.sloganFr : settings.sloganEn}
            </h1>
            <p className="mt-6 text-lg text-porcelain/85 max-w-[42ch]">
              {tr(
                'Montres et bijoux pour femmes et hommes, au détail et en gros. Une photo, un prix, un message WhatsApp.',
                "Women's and men's watches and jewelry, retail and wholesale. One photo, one price, one WhatsApp message.",
              )}
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={onExploreCatalog}
                className="h-12 px-7 rounded-sm bg-brass hover:bg-porcelain text-velvet font-semibold cursor-pointer"
              >
                {tr('Voir le catalogue', 'Browse the catalog')}
              </button>
              <a
                href={whatsapp}
                onClick={() => track('contact')}
                target="_blank"
                rel="noopener noreferrer"
                className="h-12 px-6 rounded-sm border border-porcelain/55 hover:bg-porcelain hover:text-velvet font-semibold inline-flex items-center gap-2"
              >
                <MessageCircle className="w-[18px] h-[18px] fill-current" aria-hidden="true" />
                {tr('Écrire sur WhatsApp', 'Chat on WhatsApp')}
              </a>
            </div>
          </div>

          <div className="relative aspect-[4/3] sm:aspect-[16/9] lg:aspect-auto lg:min-h-[640px] bg-velvet-deep">
            <img
              src={settings.bannerImage || IMG.hero}
              alt=""
              fetchPriority="high"
              className="absolute inset-0 w-full h-full object-cover object-[62%_50%]"
            />

            {featured && (
              <div className="absolute z-10 top-0 right-5 sm:right-10 lg:right-auto lg:left-10 xl:left-14">
                <div className="sway">
                  {/* Ficelle et clou : l'étiquette est accrochée au bord de la photo */}
                  <span aria-hidden="true" className="mx-auto block w-px h-6 bg-brass" />
                  <button
                    type="button"
                    onClick={() => onOpenProduct(featured.id)}
                    className="hang block w-[10.5rem] sm:w-[12.5rem] text-left text-velvet cursor-pointer pt-9 px-3.5 pb-4 hover:bg-white drop-shadow-[0_6px_10px_rgba(0,0,0,.35)]"
                    aria-label={`${featuredName}, ${formatFCFA(featured.price, lang)}`}
                  >
                    <span className="block text-xs text-moss">
                      {featured.isNew ? tr('Nouveau', 'New') : tr('À découvrir', 'Discover')} · {featured.reference}
                    </span>
                    {featured.images[0] && (
                      <img src={featured.images[0]} alt="" className="hidden sm:block mt-2 w-full aspect-[4/3] object-cover bg-mist" />
                    )}
                    <span className="mt-2 block font-heading font-bold text-[15px] sm:text-base leading-snug line-clamp-2">{featuredName}</span>
                    <span className="mt-1.5 block font-bold tabular-nums text-xl sm:text-2xl text-tag leading-none">{formatFCFA(featured.price, lang)}</span>
                    {featuredWholesale && (
                      <span className="mt-1.5 block text-xs text-moss">
                        {tr('Gros', 'Wholesale')} {formatFCFA(featured.wholesalePrice!, lang)}
                      </span>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Ce que la cliente doit savoir avant de commander */}
      <ul className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 grid grid-cols-2 lg:grid-cols-4 gap-y-7 gap-x-6">
        {perks.map((p) => (
          <li key={p.title} className="border-l-2 border-brass pl-4">
            <p className="font-heading font-bold text-base leading-snug">{p.title}</p>
            <p className="mt-1 text-sm text-moss">{p.text}</p>
          </li>
        ))}
      </ul>
    </section>
  );
};
