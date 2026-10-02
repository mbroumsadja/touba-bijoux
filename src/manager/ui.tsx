import React, { useRef, useState } from 'react';
import { ImagePlus, Loader2, X } from 'lucide-react';
import { compressImage } from '../lib/image';

export const inputCls =
  'w-full h-12 px-4 text-base bg-feuille border border-encre/55 rounded-lg outline-none placeholder:text-encre/70 focus:border-encre focus:ring-2 focus:ring-encre/30 aria-[invalid=true]:border-garance';
export const labelCls = 'block text-sm font-medium text-encre mb-1.5';
export const btnPrimary =
  'h-12 px-6 rounded-full bg-encre hover:bg-encre/85 disabled:opacity-60 text-feuille font-medium inline-flex items-center justify-center gap-2 cursor-pointer transition-colors';
export const btnGhost =
  'h-12 px-6 rounded-full border border-encre/55 hover:bg-encre/5 disabled:opacity-60 text-encre font-medium inline-flex items-center justify-center gap-2 cursor-pointer transition-colors';

export const fmt = (n: number) => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, '\u202f');
export const plural = (n: number, one: string, many: string) => `${n} ${n > 1 ? many : one}`;

/** Bloc de page : un titre, un filet au-dessus, pas de carte. */
export const Section: React.FC<{ title: string; hint?: string; children: React.ReactNode }> = ({ title, hint, children }) => (
  <section className="pt-7 mt-8 border-t border-encre/20">
    <h2 className="font-display text-2xl font-semibold leading-tight text-encre">{title}</h2>
    {hint && <p className="mt-1 text-sm text-encre/75 max-w-prose">{hint}</p>}
    <div className="mt-4">{children}</div>
  </section>
);

export const Bar: React.FC<{ value: number; max: number; tone?: string }> = ({ value, max, tone = 'bg-or' }) => (
  <div className="h-2.5 rounded-full bg-encre/10 overflow-hidden" role="presentation">
    <div className={`h-full rounded-full ${tone}`} style={{ width: `${max > 0 ? Math.max(value > 0 ? 3 : 0, (value / max) * 100) : 0}%` }} />
  </div>
);

export const Switch: React.FC<{ on: boolean; onChange: () => void; label: string }> = ({ on, onChange, label }) => (
  <button
    type="button"
    role="switch"
    aria-checked={on}
    onClick={onChange}
    className={`h-11 pl-2 pr-3 rounded-full text-[13px] font-medium inline-flex items-center gap-1.5 cursor-pointer border transition-colors ${
      on ? 'bg-encre text-feuille border-encre' : 'bg-feuille text-encre/75 border-encre/55'
    }`}
  >
    <span className={`w-7 h-4 rounded-full relative transition-colors ${on ? 'bg-or' : 'bg-encre/40'}`}>
      <span className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all ${on ? 'left-3.5' : 'left-0.5'}`} />
    </span>
    {label}
  </button>
);

/** Choix de photo(s) depuis la galerie du téléphone, réduites automatiquement. */
export const PhotoPicker: React.FC<{ photos: string[]; max: number; onChange: (p: string[]) => void; onError: (m: string) => void }> = ({ photos, max, onChange, onError }) => {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  const handleFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    setBusy(true);
    try {
      const added: string[] = [];
      for (const f of Array.from(files).slice(0, max - photos.length)) added.push(await compressImage(f));
      onChange([...photos, ...added]);
    } catch {
      onError('Impossible de lire cette photo. Essayez une autre image.');
    } finally {
      setBusy(false);
      if (input.current) input.current.value = '';
    }
  };

  return (
    <div className="flex flex-wrap gap-3">
      {photos.map((src, i) => (
        <div key={i} className="relative w-24 h-24 rounded-md overflow-hidden bg-papier border border-encre/15">
          <img src={src} alt="" className="w-full h-full object-cover" />
          {i === 0 && max > 1 && <span className="absolute bottom-0 inset-x-0 bg-encre/80 text-feuille text-[11px] text-center py-0.5">Principale</span>}
          <button type="button" onClick={() => onChange(photos.filter((_, j) => j !== i))} className="absolute top-0 right-0 w-11 h-11 flex items-center justify-center cursor-pointer" aria-label="Retirer la photo">
            <span className="w-7 h-7 rounded-full bg-encre/85 text-white flex items-center justify-center"><X className="w-4 h-4" /></span>
          </button>
        </div>
      ))}
      {photos.length < max && (
        <button type="button" onClick={() => input.current?.click()} disabled={busy} className="w-24 h-24 rounded-md border-2 border-dashed border-encre/55 hover:border-or text-encre/70 flex flex-col items-center justify-center gap-1 text-xs cursor-pointer transition-colors">
          {busy ? <Loader2 className="w-6 h-6 animate-spin" /> : <ImagePlus className="w-6 h-6" />}
          {busy ? 'Envoi…' : 'Ajouter'}
        </button>
      )}
      <input ref={input} type="file" accept="image/*" multiple={max > 1} hidden onChange={(e) => handleFiles(e.target.files)} />
    </div>
  );
};
