import React, { useState } from 'react';
import { BadgePercent, Boxes, ImageUp, MessageCircle, Truck } from 'lucide-react';
import { useStore } from '../lib/store';
import { buildWholesaleWhatsAppLink } from '../lib/whatsapp';
import { Product } from '../types';

function loadImageSource(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Image introuvable'));
    img.src = src;
  });
}

async function fingerprintFromSource(src: string): Promise<number[]> {
  const img = await loadImageSource(src);
  const canvas = document.createElement('canvas');
  canvas.width = 32;
  canvas.height = 32;
  const ctx = canvas.getContext('2d');
  if (!ctx) return [];

  ctx.drawImage(img, 0, 0, 32, 32);
  const { data } = ctx.getImageData(0, 0, 32, 32);
  const out: number[] = [];

  for (let y = 0; y < 8; y += 1) {
    for (let x = 0; x < 8; x += 1) {
      let r = 0;
      let g = 0;
      let b = 0;
      let count = 0;
      for (let yy = y * 4; yy < (y + 1) * 4; yy += 1) {
        for (let xx = x * 4; xx < (x + 1) * 4; xx += 1) {
          const i = (yy * 32 + xx) * 4;
          r += data[i];
          g += data[i + 1];
          b += data[i + 2];
          count += 1;
        }
      }
      out.push(Math.round(r / count), Math.round(g / count), Math.round(b / count));
    }
  }

  return out;
}

function distance(a: number[], b: number[]): number {
  let total = 0;
  const max = Math.max(a.length, b.length);
  for (let i = 0; i < max; i += 1) {
    const va = a[i] ?? 0;
    const vb = b[i] ?? 0;
    total += Math.abs(va - vb);
  }
  return total;
}

export const WholesaleSection: React.FC = () => {
  const { products, settings, lang, tr } = useStore();
  const wholesaleLink = buildWholesaleWhatsAppLink({ phone: settings.whatsappNumber, shopName: settings.shopName, lang });
  const [fileName, setFileName] = useState('');
  const [preview, setPreview] = useState<string | null>(null);
  const [match, setMatch] = useState<Product | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const onUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const localUrl = URL.createObjectURL(file);
    setPreview(localUrl);
    setFileName(file.name);
    setMatch(null);
    setError('');
    setLoading(true);

    try {
      const uploaded = await fingerprintFromSource(localUrl);
      let best: Product | null = null;
      let bestScore = Number.POSITIVE_INFINITY;

      for (const product of products) {
        for (const image of product.images ?? []) {
          const score = distance(uploaded, await fingerprintFromSource(image));
          if (score < bestScore) {
            bestScore = score;
            best = product;
          }
        }
      }

      setMatch(best);
      setError(best ? '' : tr('Aucun produit similaire n’a été trouvé.', 'No similar product was found.'));
    } catch {
      setError(tr('Impossible d’analyser cette image.', 'This image could not be analyzed.'));
    } finally {
      setLoading(false);
    }
  };

  const openCatalog = () => {
    document.getElementById('catalogue')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const productName = match && lang === 'en' && match.nameEn ? match.nameEn : match?.name;
  const wholesaleInfo = [
    { icon: BadgePercent, title: tr('Prix de gros dès le catalogue', 'Wholesale prices from the catalog'), text: tr('Chaque pièce affiche son tarif de gros pour faciliter le choix.', 'Each item shows its wholesale price to make selection easier.') },
    { icon: Boxes, title: settings.wholesaleMinQty > 0 ? tr(`À partir de ${settings.wholesaleMinQty} pièces`, `From ${settings.wholesaleMinQty} pieces`) : tr('Quantité à convenir', 'Quantity to agree'), text: tr('Revendeuses et boutiques peuvent commander leur lot selon leurs besoins.', 'Resellers and shops can order their lot according to their needs.') },
    { icon: Truck, title: tr('Livraison partout au Cameroun', 'Delivery across Cameroon'), text: tr('La commande est mise en place rapidement, et la livraison est assurée dans tout le pays.', 'Orders are processed quickly and delivery is available across the country.') },
  ];

  return (
    <section id="gros" className="on-dark bg-velvet text-porcelain">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        <h2 className="text-[2rem] sm:text-5xl lg:text-6xl font-bold max-w-[18ch]">
          {tr('Des prix adaptés aux boutiques et revendeuses', 'Prices tailored to shops and resellers')}
        </h2>
        <p className="mt-5 text-lg text-porcelain/85 max-w-[52ch]">
          {tr('Pour les commandes de lot, l’équipe vous aide à choisir rapidement les modèles qui correspondent à votre clientèle.', 'For bulk orders, the team helps you quickly choose the models that match your customers.')}
        </p>

        <ul className="mt-12 grid gap-x-8 gap-y-8 sm:grid-cols-3">
          {wholesaleInfo.map(({ icon: Icon, title, text }) => (
            <li key={title} className="border-t border-porcelain/30 pt-5">
              <Icon className="h-6 w-6 text-brass" aria-hidden="true" />
              <h3 className="mt-4 font-heading font-bold text-xl leading-snug">{title}</h3>
              <p className="mt-2 text-porcelain/80">{text}</p>
            </li>
          ))}
        </ul>

        <a
          href={wholesaleLink}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-10 inline-flex h-12 items-center gap-2 rounded-sm bg-brass px-7 font-semibold text-velvet hover:bg-porcelain"
        >
          <MessageCircle className="h-[18px] w-[18px] fill-current" aria-hidden="true" />
          {tr('Passer une commande en gros', 'Place a wholesale order')}
        </a>

        <div className="mt-20 sm:mt-28 grid gap-10 lg:grid-cols-[1fr_1.1fr] lg:gap-16 items-start">
          <div>
            <h2 className="text-[2rem] sm:text-5xl lg:text-6xl font-bold max-w-[16ch]">
              {tr('Retrouvez une pièce à partir d’une photo', 'Find a piece from a photo')}
            </h2>
            <p className="mt-5 text-lg text-porcelain/85 max-w-[44ch]">
              {tr('Ajoutez une image : le catalogue cherche la pièce la plus proche.', 'Add an image and the catalog looks for the closest piece.')}
            </p>
          </div>

          <div className="grid gap-4">
            <label className="block cursor-pointer border-2 border-dashed border-porcelain/35 hover:border-brass focus-within:border-brass p-3 sm:p-4">
              <input type="file" accept="image/*" onChange={onUpload} className="sr-only" />
              <span className="flex min-h-[200px] flex-col items-center justify-center bg-velvet-deep px-6 text-center">
                {preview ? (
                  <img src={preview} alt="Aperçu de la recherche" className="h-52 w-full object-cover" />
                ) : (
                  <>
                    <ImageUp className="h-8 w-8 text-brass" aria-hidden="true" />
                    <span className="mt-4 block text-lg font-semibold">{tr('Choisir une image', 'Choose an image')}</span>
                    <span className="mt-1 block text-sm text-porcelain/75">{tr('PNG, JPG ou WEBP', 'PNG, JPG or WEBP')}</span>
                  </>
                )}
                {fileName && <span className="mt-3 block text-sm text-porcelain/80">{fileName}</span>}
              </span>
            </label>

            <div className="border border-porcelain/25 p-5" aria-live="polite">
              <p className="font-heading font-bold">{tr('Résultat', 'Result')}</p>

              {loading ? (
                <p className="mt-3 text-porcelain/85">{tr('Recherche de la pièce…', 'Searching for the piece…')}</p>
              ) : match ? (
                <div className="mt-3">
                  <p className="font-heading text-2xl font-bold leading-tight">{productName}</p>
                  <p className="mt-1 text-sm text-porcelain/80">Réf. {match.reference}</p>
                  <button
                    type="button"
                    onClick={openCatalog}
                    className="mt-5 inline-flex h-12 items-center rounded-sm bg-brass px-6 font-semibold text-velvet hover:bg-porcelain cursor-pointer"
                  >
                    {tr('Voir dans le catalogue', 'View in catalog')}
                  </button>
                </div>
              ) : (
                <p className="mt-3 text-porcelain/85">
                  {error || tr('Ajoutez une photo pour lancer la recherche.', 'Add a photo to start the search.')}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
