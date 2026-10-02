import React, { useState } from 'react';
import { ArrowRight, ImageUp, Search, Sparkles } from 'lucide-react';
import { useStore } from '../lib/store';
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
  const { products, lang, tr } = useStore();
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

  return (
    <section id="gros" className="bg-onyx text-ivory mb-3 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        <div className="max-w-3xl">
          <span className="text-[11px] sm:text-xs uppercase tracking-[0.3em] text-gold font-medium">
            {tr('Recherche par image', 'Image search')}
          </span>
          <h2 className="mt-3 font-serif text-3xl sm:text-5xl font-medium leading-tight">
            {tr('Trouvez un produit à partir d’une photo.', 'Find a product from a photo.')}
          </h2>
          <p className="mt-4 text-ivory/75 text-base sm:text-lg">
            {tr('Téléversez une image et le catalogue cherchera le produit le plus proche.', 'Upload an image and the catalog will look for the closest matching product.')}
          </p>
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-[1.15fr_0.85fr] items-start">
          <label className="group block cursor-pointer rounded-3xl border border-dashed border-ivory/20 bg-ivory/5 p-5 sm:p-7 transition-colors hover:border-gold/60 hover:bg-ivory/8">
            <input type="file" accept="image/*" onChange={onUpload} className="hidden" />
            <div className="flex min-h-[220px] flex-col items-center justify-center rounded-2xl border border-ivory/10 bg-onyx/40 px-6 text-center">
              {preview ? (
                <img src={preview} alt="Aperçu de la recherche" className="h-52 w-full rounded-xl object-cover" />
              ) : (
                <>
                  <span className="flex h-14 w-14 items-center justify-center rounded-full bg-gold/15 text-gold">
                    <ImageUp className="h-6 w-6" />
                  </span>
                  <p className="mt-5 text-lg font-medium text-ivory">{tr('Choisir une image', 'Choose an image')}</p>
                  <p className="mt-2 text-sm text-ivory/65">{tr('PNG, JPG ou WEBP', 'PNG, JPG or WEBP')}</p>
                </>
              )}
              {fileName && <p className="mt-4 text-xs text-ivory/70">{fileName}</p>}
            </div>
          </label>

          <div className="rounded-3xl border border-ivory/10 bg-ivory/5 p-5 sm:p-6">
            <div className="flex items-center gap-2 text-gold">
              <Sparkles className="h-4 w-4" />
              <span className="text-[11px] uppercase tracking-[0.2em]">{tr('Résultat', 'Result')}</span>
            </div>

            {loading ? (
              <div className="mt-5 text-sm text-ivory/70">{tr('Recherche du produit…', 'Searching the product…')}</div>
            ) : match ? (
              <div className="mt-4 space-y-4">
                <div className="rounded-2xl bg-onyx/40 p-3">
                  <p className="text-xs uppercase tracking-[0.2em] text-ivory/55">{tr('Produit proche', 'Closest product')}</p>
                  <h3 className="mt-2 font-serif text-2xl text-ivory">{productName}</h3>
                  <p className="mt-1 text-sm text-ivory/70">{match.reference}</p>
                </div>
                <button
                  type="button"
                  onClick={openCatalog}
                  className="inline-flex items-center gap-2 rounded-full bg-gold px-5 py-3 text-sm font-semibold text-onyx transition-colors hover:bg-ivory"
                >
                  {tr('Voir dans le catalogue', 'View in catalog')} <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="mt-5 flex min-h-[140px] items-center text-sm text-ivory/70">
                {error || tr('Aucune recherche effectuée pour le moment.', 'No search has been made yet.')}
              </div>
            )}
          </div>
        </div>

        <div className="mt-8 flex items-center gap-2 text-sm text-ivory/60">
          <Search className="h-4 w-4" />
          {tr('Recherche visuelle du catalogue', 'Visual catalog search')}
        </div>
      </div>
    </section>
  );
};
