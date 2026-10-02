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
      className="fixed inset-0 z-50 bg-onyx/90 backdrop-blur-sm flex items-end sm:items-center justify-center fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={name}
    >
      <div
        key={product.id}
        className="sheet-in relative w-full sm:max-w-md max-h-[100svh] overflow-y-auto bg-onyx text-ivory sm:rounded-3xl rounded-t-3xl shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="relative aspect-square bg-black select-none"
          onTouchStart={(e) => (touch.current = { x: e.touches[0].clientX, y: e.touches[0].clientY })}
          onTouchEnd={onTouchEnd}
        >
          <img src={product.images[photo] ?? product.images[0]} alt={name} className={`w-full h-full object-cover ${soldOut ? 'opacity-60 grayscale' : ''}`} />

          <button
            type="button"
            onClick={onClose}
            className="absolute top-3 right-3 w-11 h-11 rounded-full bg-onyx/70 hover:bg-onyx text-ivory flex items-center justify-center cursor-pointer backdrop-blur"
            aria-label={tr('Fermer', 'Close')}
          >
            <X className="w-5 h-5" />
          </button>

          {(soldOut || product.isNew) && (
            <span className={`absolute top-4 left-4 px-3 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wider ${soldOut ? 'bg-ivory text-onyx' : 'bg-gold text-onyx'}`}>
              {soldOut ? tr('Épuisé', 'Sold out') : tr('Nouveau', 'New')}
            </span>
          )}

          {hasMultiple && (
            <>
              <button type="button" onClick={() => onStep(-1)} className="hidden sm:flex absolute left-3 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-onyx/70 hover:bg-onyx items-center justify-center cursor-pointer" aria-label={tr('Précédent', 'Previous')}>
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button type="button" onClick={() => onStep(1)} className="hidden sm:flex absolute right-3 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-onyx/70 hover:bg-onyx items-center justify-center cursor-pointer" aria-label={tr('Suivant', 'Next')}>
                <ChevronRight className="w-5 h-5" />
              </button>
              <span className="sm:hidden absolute bottom-3 right-3 text-[11px] px-2.5 py-1 rounded-full bg-onyx/70">
                {tr('← glissez →', '← swipe →')}
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
                className={`w-14 h-14 rounded-xl overflow-hidden cursor-pointer border-2 transition-colors ${i === photo ? 'border-gold' : 'border-transparent opacity-60'}`}
                aria-label={`Photo ${i + 1}`}
              >
                <img src={src} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}

        <div className="p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h3 className="font-serif text-2xl font-medium leading-tight">{name}</h3>
              <span className="text-xs text-ivory/50 tracking-wide">Réf. {product.reference}</span>
            </div>
            <span className="font-serif text-2xl text-gold whitespace-nowrap">{formatFCFA(product.price, lang)}</span>
          </div>

          {hasWholesale && (
            <div className="mt-4 rounded-2xl bg-ivory/10 px-4 py-3 flex items-center justify-between gap-3">
              <span className="text-sm text-ivory/70">
                {tr('Prix de gros', 'Wholesale price')}
                {settings.wholesaleMinQty > 0 && (
                  <span className="block text-xs text-ivory/50">
                    {tr(`à partir de ${settings.wholesaleMinQty} pièces`, `from ${settings.wholesaleMinQty} pieces`)}
                  </span>
                )}
              </span>
              <span className="font-serif text-xl text-gold whitespace-nowrap">{formatFCFA(product.wholesalePrice!, lang)}</span>
            </div>
          )}

          {soldOut ? (
            <div className="mt-5 h-14 rounded-full bg-ivory/10 text-ivory/60 flex items-center justify-center text-sm">
              {tr('Cette pièce est épuisée', 'This piece is sold out')}
            </div>
          ) : (
            <a
              href={link}
              onClick={() => track('order', { pid: product.id, cat: product.category })}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-gold mt-5 h-14 rounded-full bg-wa-deep hover:bg-wa text-white font-semibold inline-flex w-full items-center justify-center gap-2.5 transition-colors"
            >
              <MessageCircle className="w-5 h-5 fill-current" />
              {tr('Commander sur WhatsApp', 'Order on WhatsApp')}
            </a>
          )}
          {hasWholesale && !soldOut && (
            <a
              href={wholesaleLink}
              onClick={() => track('wholesale', { pid: product.id, cat: product.category })}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 h-12 rounded-full border border-gold/60 hover:bg-gold hover:text-onyx text-gold font-medium inline-flex w-full items-center justify-center gap-2 transition-colors"
            >
              {tr('Commander en gros', 'Order wholesale')}
            </a>
          )}
          <p className="mt-3 text-center text-xs text-ivory/50">
            {tr('Livraison dans tout le Cameroun. Paiement à la livraison, Orange Money ou MTN MoMo.', 'Delivery across Cameroon. Cash on delivery, Orange Money or MTN MoMo.')}
          </p>
        </div>
      </div>
    </div>
  );
};
