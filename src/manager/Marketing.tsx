import React, { useMemo, useState } from 'react';
import { Check, ExternalLink, MessageCircle, Search, Sparkles } from 'lucide-react';
import { useStore } from '../lib/store';
import { formatFCFA } from '../lib/whatsapp';
import { btnGhost, btnPrimary, inputCls } from './ui';

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

const websiteUrl = () => {
  if (typeof window === 'undefined') return 'https://boutique.example';
  return window.location.origin || 'https://boutique.example';
};

const buildPublicationHtml = (products: ReturnType<typeof useStore>['products'], settings: ReturnType<typeof useStore>['settings']) => {
  const site = websiteUrl();
  const cards = products
    .map((product) => {
      const image = product.images[0] ?? '';
      const priceText = product.price > 0 ? `${formatFCFA(product.price, 'fr')}` : 'Prix sur demande';
      const grosText = product.wholesalePrice && product.wholesalePrice > 0 ? `Prix gros : ${formatFCFA(product.wholesalePrice, 'fr')}` : 'Prix détail';
      const reference = escapeHtml(product.reference);
      const name = escapeHtml(product.name);
      const cat = escapeHtml(product.category);
      const vendor = escapeHtml(settings.shopName);
      const phone = escapeHtml(settings.displayPhone || settings.whatsappNumber || '');
      const address = escapeHtml(settings.addressFr || 'Adresse à compléter');
      const hours = escapeHtml(settings.openingHoursFr || 'Horaires à compléter');
      const siteText = escapeHtml(site);
      return `
        <article class="item">
          <div class="image-wrap">
            ${image ? `<img src="${image}" alt="${name}" />` : '<div class="image-placeholder">Photo</div>'}
          </div>
          <div class="body">
            <div class="eyebrow">${reference} · ${cat}</div>
            <h1>${name}</h1>
            <div class="price">${priceText}</div>
            <div class="gros">${grosText}</div>
            <div class="meta">
              <span>💬 Commande rapide</span>
              <span>📍 ${address}</span>
            </div>
          </div>
          <div class="shop">
            <div class="brand">${vendor}</div>
            <div>📞 ${phone}</div>
            <div>⏰ ${hours}</div>
            <div>🌐 ${siteText}</div>
          </div>
        </article>
      `;
    })
    .join('');

  return `<!DOCTYPE html>
    <html lang="fr">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Publication ${escapeHtml(settings.shopName)}</title>
        <style>
          :root { color-scheme: light; }
          * { box-sizing: border-box; }
          body {
            margin:0; font-family: Arial, Helvetica, sans-serif; background:#f7f1eb; color:#1f1d1a; display:flex; justify-content:center; padding:28px 18px; }
          .page { width:min(100%, 440px); }
          .item {
            background:#ffffff; border-radius:28px; overflow:hidden; box-shadow:0 18px 40px rgba(28,25,23,0.08); border:1px solid rgba(31,29,26,0.06);
            margin-bottom:20px;
          }
          .image-wrap { background:#efe7dd; }
          .image-wrap img { width:100%; height:auto; max-height:380px; object-fit:cover; display:block; }
          .image-placeholder { width:100%; height:420px; display:grid; place-items:center; font-size:1.2rem; color:#6d625b; background:linear-gradient(135deg,#eee3d3,#f7f1eb); }
          .body { padding:20px 18px 12px; }
          .eyebrow { font-size:0.7rem; letter-spacing:0.12em; text-transform:uppercase; color:#6f655d; font-weight:700; }
          h1 { margin:10px 0 8px; font-size:2rem; line-height:1.1; color:#1c1816; }
          .price { font-size:1.7rem; font-weight:800; color:#1b3b2a; }
          .gros { margin-top:8px; font-size:0.9rem; color:#4d413d; }
          .meta { margin-top:14px; display:flex; flex-direction:column; gap:6px; font-size:0.85rem; color:#584f4a; }
          .shop { padding:16px 18px 18px; background:linear-gradient(180deg,#f7f0ea,#f3e7dc); border-top:1px solid rgba(31,29,26,0.08); color:#2a2724; font-size:0.92rem; }
          .brand { font-size:1.2rem; font-weight:800; margin-bottom:8px; }
          .cta {
            display:inline-flex; align-items:center; justify-content:center; gap:10px; margin-top:16px; padding:14px 18px; border-radius:999px; text-decoration:none; color:#fff; background:#1d7a52; font-weight:700;
          }
          @media (max-width: 480px) { body { padding:18px 12px; } .image-wrap img, .image-placeholder { height:360px; } h1 { font-size:1.6rem; } }
        </style>
      </head>
      <body>
        <div class="page">${cards}</div>
      </body>
    </html>`;
};

export const Marketing: React.FC = () => {
  const s = useStore();
  const { products, settings } = s;
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return products.filter((product) => !needle || `${product.name} ${product.reference}`.toLowerCase().includes(needle));
  }, [products, query]);

  const selectedProducts = useMemo(() => products.filter((product) => selected.includes(product.id)), [products, selected]);

  const toggleSelected = (productId: string) => {
    setSelected((current) => (current.includes(productId) ? current.filter((id) => id !== productId) : [...current, productId]));
  };


  const copyMessage = async () => {
    if (!selectedProducts.length) return;
    const text = selectedProducts
      .map((product) => {
        const url = `${websiteUrl()}`;
        const price = product.price > 0 ? `${formatFCFA(product.price, 'fr')}` : 'Prix sur demande';
        return `${product.name} — ${price}\n${url}\n${product.images[0] ? `Photo: ${product.images[0]}` : ''}`;
      })
      .join('\n\n');

    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // Ignoré : le gestionnaire du navigateur peut bloquer la copie.
    }
  };

  const shareToWhatsAppStatus = async () => {
    if (!selectedProducts.length) return;

    // Build text summary
    const text = selectedProducts
      .map((product) => {
        const url = `${websiteUrl()}`;
        const price = product.price > 0 ? `${formatFCFA(product.price, 'fr')}` : 'Prix sur demande';
        return `${product.name} — ${price}\n${url}`;
      })
      .join('\n\n');

    // Try Web Share API with files (mobile browsers)
    try {
      if (navigator.canShare) {
        const files: File[] = [];
        for (const p of selectedProducts) {
          if (p.images && p.images[0]) {
            try {
              const res = await fetch(p.images[0], { mode: 'cors' });
              const blob = await res.blob();
              const ext = blob.type.split('/')[1] || 'jpg';
              files.push(new File([blob], `${p.id}.${ext}`, { type: blob.type }));
            } catch (e) {
              // ignore image fetch errors, fallback to text-only share
            }
          }
        }

        if (files.length && navigator.canShare({ files })) {
          await (navigator as any).share({ files, text });
          return;
        }
      }
    } catch (e) {
      // fallthrough to whatsapp link
    }

    // Fallback: open WhatsApp share link (will open chat). On mobile user can choose to add to Status.
    const waText = encodeURIComponent(text + '\n\n' + (settings.shopName ? settings.shopName : ''));
    const waUrl = `https://api.whatsapp.com/send?text=${waText}`;
    window.open(waUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-3 flex-wrap">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-encre/60">Marketing</p>
          <h1 className="font-display text-[1.75rem] sm:text-4xl font-semibold leading-[1.15] text-encre">Créer une publication WhatsApp</h1>
        </div>
      </div>

      <div className="relative">
        <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-encre/75" aria-hidden="true" />
        <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Chercher un produit à publier" className={`${inputCls} pl-11`} />
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map((product) => {
          const active = selected.includes(product.id);
          return (
            <button
              key={product.id}
              type="button"
              onClick={() => toggleSelected(product.id)}
              className={`rounded-2xl border p-3 text-left transition ${active ? 'border-encre bg-encre text-feuille shadow-lg' : 'border-encre/20 bg-feuille text-encre hover:bg-encre/5'}`}
            >
              <div className="flex items-start gap-3">
                <img src={product.images[0]} alt={product.name} className="w-16 h-16 object-cover rounded-lg bg-papier" />
                <div className="min-w-0 flex-1">
                  <div className="font-display text-lg font-semibold leading-tight">{product.name}</div>
                  <div className={`text-xs ${active ? 'text-feuille/80' : 'text-encre/70'}`}>Réf. {product.reference}</div>
                  <div className={`mt-1 text-sm font-medium ${active ? 'text-feuille' : 'text-encre'}`}>{product.price > 0 ? `${formatFCFA(product.price, 'fr')}` : 'Prix sur demande'}</div>
                </div>
              </div>
              <div className={`mt-3 inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${active ? 'bg-feuille text-encre' : 'bg-encre/10 text-encre'}`}>
                {active ? 'Sélectionné' : 'Choisir'}
              </div>
            </button>
          );
        })}
      </div>

      {selectedProducts.length > 0 && (
        <div className="rounded-2xl border border-encre/20 bg-feuille p-4 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm uppercase tracking-[0.18em] text-encre/60">Préparation</p>
              <h2 className="font-display text-2xl font-semibold text-encre">{selectedProducts.length} produit{selectedProducts.length > 1 ? 's' : ''}</h2>
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={copyMessage} className={btnGhost}>
                <MessageCircle className="w-6 h-4" /> {copied ? 'Copié' : 'Copier le message'}
              </button>
              <button type="button" onClick={shareToWhatsAppStatus} className={btnPrimary}>
                <MessageCircle className="w-6 h-4" /> Ajouter au statut WhatsApp
              </button>
            </div>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {selectedProducts.map((product) => (
              <div key={product.id} className="rounded-xl border border-encre/15 bg-papier p-3">
                <img src={product.images[0]} alt={product.name} className="w-full h-36 object-cover rounded-md" />
                <div className="mt-3">
                  <div className="font-display text-lg font-semibold text-encre">{product.name}</div>
                  <div className="text-sm text-encre/70">Réf. {product.reference}</div>
                  <div className="mt-1 text-sm font-medium text-encre">{product.price > 0 ? `${formatFCFA(product.price, 'fr')}` : 'Prix sur demande'}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
