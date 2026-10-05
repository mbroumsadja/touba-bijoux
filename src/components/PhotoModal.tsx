import React, { useEffect, useRef, useState } from 'react';
import { X, ChevronLeft, ChevronRight, MessageCircle } from 'lucide-react';
import { Product } from '../types';
import { formatFCFA, buildWhatsAppProductLink } from '../lib/whatsapp';
import { useStore } from '../lib/store';
import { track } from '../lib/analytics';

interface PhotoModalProps {
  product: Product | null;
  hasMultiple: boolean;
  onStep: (delta: number) => void;
  onClose: () => void;
}

export const PhotoModal: React.FC<PhotoModalProps> = ({ product, hasMultiple, onStep, onClose }) => {
  const { settings, lang, tr } = useStore();
  const [photo, setPhoto] = useState(0);
  const touch = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => setPhoto(0), [product?.id]);

  // Une vue = la cliente ouvre la fiche du produit
  useEffect(() => {
    if (product) track('view', { pid: product.id, cat: product.category });
  }, [product?.id]);

  // Échap / flèches, et blocage du défilement derrière la fenêtre
  useEffect(() => {
    if (!product) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') onStep(1);
      if (e.key === 'ArrowLeft') onStep(-1);
    };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [product, onClose, onStep]);

  if (!product) return null;

  const name = lang === 'en' && product.nameEn ? product.nameEn : product.name;
  const soldOut = Boolean(product.soldOut);
  const link = buildWhatsAppProductLink({ phone: settings.whatsappNumber, shopName: settings.shopName, product, lang });
  const hasWholesale = (product.wholesalePrice ?? 0) > 0;
  const wholesaleLink = hasWholesale
    ? buildWhatsAppProductLink({ phone: settings.whatsappNumber, shopName: settings.shopName, product, lang, wholesale: true })
    : '';

  const onTouchEnd = (e: React.TouchEvent) => {
    if (!touch.current || !hasMultiple) return;
    const dx = e.changedTouches[0].clientX - touch.current.x;
    const dy = e.changedTouches[0].clientY - touch.current.y;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) onStep(dx < 0 ? 1 : -1);
    touch.current = null;
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-velvet-deep/80 backdrop-blur-sm flex items-end sm:items-center justify-center fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={name}
    >
      <div
        key={product.id}
        className="sheet-in relative w-full sm:max-w-md max-h-[100svh] overflow-y-auto bg-porcelain text-velvet shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="relative aspect-square bg-mist select-none"
          onTouchStart={(e) => (touch.current = { x: e.touches[0].clientX, y: e.touches[0].clientY })}
          onTouchEnd={onTouchEnd}
        >
          <img src={product.images[photo] ?? product.images[0]} alt={name} className={`w-full h-full object-cover ${soldOut ? 'opacity-55 grayscale' : ''}`} />

          <button
            type="button"
            onClick={onClose}
            className="absolute top-3 right-3 w-11 h-11 bg-porcelain hover:bg-white text-velvet flex items-center justify-center cursor-pointer"
            aria-label={tr('Fermer', 'Close')}
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>

          {product.isNew && !soldOut && (
            <span className="absolute top-0 left-0 bg-brass text-velvet text-xs font-semibold px-3 py-1.5">{tr('Nouveau', 'New')}</span>
          )}

          {/* La même étiquette que dans le catalogue */}
          <span className={`tag ${soldOut ? 'tag-off' : ''} pointer-events-none absolute left-0 bottom-4 font-bold tabular-nums text-lg`}>
            {soldOut ? tr('Épuisé', 'Sold out') : formatFCFA(product.price, lang)}
          </span>

          {hasMultiple && (
            <>
              <button type="button" onClick={() => onStep(-1)} className="hidden sm:flex absolute left-3 top-1/2 -translate-y-1/2 w-11 h-11 bg-porcelain hover:bg-white text-velvet items-center justify-center cursor-pointer" aria-label={tr('Précédent', 'Previous')}>
                <ChevronLeft className="w-5 h-5" aria-hidden="true" />
              </button>
              <button type="button" onClick={() => onStep(1)} className="hidden sm:flex absolute right-3 top-1/2 -translate-y-1/2 w-11 h-11 bg-porcelain hover:bg-white text-velvet items-center justify-center cursor-pointer" aria-label={tr('Suivant', 'Next')}>
                <ChevronRight className="w-5 h-5" aria-hidden="true" />
              </button>
              <span className="sm:hidden absolute bottom-3 right-3 text-xs font-medium px-2.5 py-1 bg-porcelain text-velvet">
                {tr('Glissez pour changer de pièce', 'Swipe to change piece')}
              </span>
            </>
          )}
        </div>

        {product.images.length > 1 && (
          <div className="flex gap-2 px-5 pt-4">
            {product.images.map((src, i) => (
              <button
                key={src + i}
                type="button"
                onClick={() => setPhoto(i)}
                aria-current={i === photo ? 'true' : undefined}
                className={`w-14 h-14 overflow-hidden cursor-pointer border-2 ${i === photo ? 'border-tag' : 'border-transparent opacity-60 hover:opacity-100'}`}
                aria-label={`Photo ${i + 1}`}
              >
                <img src={src} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}

        <div className="p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
          <h3 className="font-heading text-2xl sm:text-3xl font-bold leading-tight">{name}</h3>
          <p className="mt-1 text-sm text-moss">Réf. {product.reference}</p>

          {hasWholesale && (
            <div className="mt-5 py-3 border-y border-velvet/25 flex items-center justify-between gap-3">
              <span>
                {tr('Prix de gros', 'Wholesale price')}
                {settings.wholesaleMinQty > 0 && (
                  <span className="block text-sm text-moss">
                    {tr(`à partir de ${settings.wholesaleMinQty} pièces`, `from ${settings.wholesaleMinQty} pieces`)}
                  </span>
                )}
              </span>
              <span className="text-xl font-bold tabular-nums whitespace-nowrap">{formatFCFA(product.wholesalePrice!, lang)}</span>
            </div>
          )}

          {soldOut ? (
            <p className="mt-5 min-h-12 flex items-center text-moss">{tr('Cette pièce est épuisée.', 'This piece is sold out.')}</p>
          ) : (
            <a
              href={link}
              onClick={() => track('order', { pid: product.id, cat: product.category })}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-5 h-14 rounded-sm bg-velvet hover:bg-velvet-deep text-white font-semibold inline-flex w-full items-center justify-center gap-2.5"
            >
              <MessageCircle className="w-5 h-5 fill-current" aria-hidden="true" />
              {tr('Commander sur WhatsApp', 'Order on WhatsApp')}
            </a>
          )}
          {hasWholesale && !soldOut && (
            <a
              href={wholesaleLink}
              onClick={() => track('wholesale', { pid: product.id, cat: product.category })}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 h-12 rounded-sm border border-velvet hover:bg-velvet hover:text-white font-semibold inline-flex w-full items-center justify-center gap-2"
            >
              {tr('Commander en gros', 'Order wholesale')}
            </a>
          )}
          <p className="mt-4 text-sm text-moss">
            {tr('Livraison dans tout le Cameroun. Paiement à la livraison, Orange Money ou MTN MoMo.', 'Delivery across Cameroon. Cash on delivery, Orange Money or MTN MoMo.')}
          </p>
        </div>
      </div>
    </div>
  );
};
