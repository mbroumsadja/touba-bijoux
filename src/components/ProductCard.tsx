import React from 'react';
import { MessageCircle } from 'lucide-react';
import { Product } from '../types';
import { useStore } from '../lib/store';
import { track } from '../lib/analytics';
import { buildWhatsAppProductLink, formatFCFA } from '../lib/whatsapp';

interface ProductCardProps {
  product: Product;
  onOpen: () => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onOpen }) => {
  const { settings, lang, tr } = useStore();
  const name = lang === 'en' && product.nameEn ? product.nameEn : product.name;
  const soldOut = Boolean(product.soldOut);
  const link = buildWhatsAppProductLink({ phone: settings.whatsappNumber, shopName: settings.shopName, product, lang });
  const hasWholesale = (product.wholesalePrice ?? 0) > 0;
  const wholesaleLink = hasWholesale
    ? buildWhatsAppProductLink({ phone: settings.whatsappNumber, shopName: settings.shopName, product, lang, wholesale: true })
    : '';

  return (
    <article className="flex flex-col">
      <div className="relative">
        <button type="button" onClick={onOpen} className="block w-full aspect-square overflow-hidden bg-mist cursor-pointer" aria-label={name}>
          <img
            src={product.images[0]}
            alt={name}
            loading="lazy"
            decoding="async"
            width={600}
            height={600}
            className={`w-full h-full object-cover ${soldOut ? 'opacity-55 grayscale' : ''}`}
          />
        </button>

        {product.isNew && !soldOut && (
          <span className="absolute top-0 left-0 bg-brass text-velvet text-xs font-semibold px-2.5 py-1">{tr('Nouveau', 'New')}</span>
        )}

        {/* L'étiquette de prix, accrochée au bas de la photo */}
        <span
          className={`tag ${soldOut ? 'tag-off' : ''} pointer-events-none absolute left-0 bottom-3 font-bold tabular-nums text-[15px] sm:text-base`}
        >
          {soldOut ? tr('Épuisé', 'Sold out') : formatFCFA(product.price, lang)}
        </span>
      </div>

      <div className="pt-3 flex-1 flex flex-col">
        <h3 className="font-heading font-bold text-base sm:text-lg leading-snug line-clamp-2">{name}</h3>
        <p className="mt-0.5 text-sm text-moss">Réf. {product.reference}</p>

        <div className="mt-auto pt-2">
          {soldOut ? (
            <p className="min-h-11 flex items-center text-sm text-moss">{tr('Indisponible pour le moment', 'Currently unavailable')}</p>
          ) : (
            <>
              {hasWholesale && (
                <a
                  href={wholesaleLink}
                  onClick={() => track('wholesale', { pid: product.id, cat: product.category })}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="min-h-11 flex items-center justify-between gap-2 text-sm text-moss hover:text-velvet underline underline-offset-4 decoration-velvet/30"
                  aria-label={`${tr('Commander en gros', 'Order wholesale')} · ${name}`}
                >
                  <span>{tr('Prix de gros', 'Wholesale')}</span>
                  <span className="font-semibold tabular-nums text-velvet">{formatFCFA(product.wholesalePrice!, lang)}</span>
                </a>
              )}
              <a
                href={link}
                onClick={() => track('order', { pid: product.id, cat: product.category })}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1 h-12 rounded-sm bg-velvet hover:bg-velvet-deep text-white font-semibold inline-flex w-full items-center justify-center gap-2"
              >
                <MessageCircle className="w-[18px] h-[18px] fill-current shrink-0" aria-hidden="true" />
                {tr('Commander', 'Order')}
              </a>
            </>
          )}
        </div>
      </div>
    </article>
  );
};
