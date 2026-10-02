import React from 'react';
import { MessageCircle } from 'lucide-react';
import { Product } from '../types';
import { useStore } from '../lib/store';
import { track } from '../lib/analytics';
import { buildWhatsAppProductLink, formatFCFA } from '../lib/whatsapp';

interface ProductCardProps {
  product: Product;
  dark?: boolean;
  onOpen: () => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, dark = false, onOpen }) => {
  const { settings, lang, tr } = useStore();
  const name = lang === 'en' && product.nameEn ? product.nameEn : product.name;
  const soldOut = Boolean(product.soldOut);
  const link = buildWhatsAppProductLink({ phone: settings.whatsappNumber, shopName: settings.shopName, product, lang });
  const hasWholesale = (product.wholesalePrice ?? 0) > 0;
  const wholesaleLink = hasWholesale
    ? buildWhatsAppProductLink({ phone: settings.whatsappNumber, shopName: settings.shopName, product, lang, wholesale: true })
    : '';

  return (
    <article className="reveal group flex flex-col">
      <button
        type="button"
        onClick={onOpen}
        className="relative block aspect-square w-full overflow-hidden rounded-2xl bg-sand cursor-pointer"
        aria-label={name}
      >
        <img
          src={product.images[0]}
          alt={name}
          loading="lazy"
          decoding="async"
          className={`w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 ${soldOut ? 'opacity-50 grayscale' : ''}`}
        />
        {(soldOut || product.isNew) && (
          <span
            className={`absolute top-2.5 left-2.5 px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
              soldOut ? 'bg-onyx/90 text-ivory' : 'bg-gold text-onyx'
            }`}
          >
            {soldOut ? tr('Épuisé', 'Sold out') : tr('Nouveau', 'New')}
          </span>
        )}
      </button>

      <div className="pt-3 flex-1 flex flex-col">
        <h3 className={`font-serif text-lg sm:text-xl font-medium leading-tight ${dark ? 'text-ivory' : 'text-onyx'}`}>{name}</h3>
        <p className={`mt-1 text-[15px] font-medium tabular-nums ${dark ? 'text-gold' : 'text-gold-deep'}`}>{formatFCFA(product.price, lang)}</p>
        {hasWholesale && (
          <p className={`mt-0.5 text-[13px] tabular-nums ${dark ? 'text-ivory/70' : 'text-onyx/65'}`}>
            {tr('Prix de gros', 'Wholesale')} : <span className="font-medium">{formatFCFA(product.wholesalePrice!, lang)}</span>
          </p>
        )}

        {soldOut ? (
          <span className={`mt-3 h-11 rounded-full inline-flex items-center justify-center text-sm ${dark ? 'bg-ivory/10 text-ivory/50' : 'bg-onyx/5 text-onyx/40'}`}>
            {tr('Indisponible', 'Unavailable')}
          </span>
        ) : (
          <a
            href={link}
            onClick={() => track('order', { pid: product.id, cat: product.category })}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 h-11 rounded-full bg-wa-deep hover:bg-onyx text-white text-sm font-medium inline-flex items-center justify-center gap-2 transition-colors"
          >
            <MessageCircle className="w-4 h-4 fill-current shrink-0" />
            <span className="truncate">{tr('Commander', 'Order')}</span>
          </a>
        )}
        {hasWholesale && !soldOut && (
          <a
            href={wholesaleLink}
            onClick={() => track('wholesale', { pid: product.id, cat: product.category })}
            target="_blank"
            rel="noopener noreferrer"
            className={`mt-1 h-10 inline-flex items-center justify-center text-[13px] font-medium underline underline-offset-4 decoration-gold/70 transition-colors ${dark ? 'text-ivory/80 hover:text-gold' : 'text-onyx/75 hover:text-gold-deep'}`}
          >
            {tr('Commander en gros', 'Order wholesale')}
          </a>
        )}
      </div>
    </article>
  );
};
