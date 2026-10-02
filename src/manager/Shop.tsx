import React, { useState } from 'react';
import { getSettings, useStore } from '../lib/store';
import { PhotoPicker, btnPrimary, inputCls, labelCls } from './ui';

export const Shop: React.FC<{ say: (msg: string, ok?: boolean) => void }> = ({ say }) => {
  const s = useStore();
  const [form, setForm] = useState(() => ({ ...s.settings, newPassword: '' }));
  const [saving, setSaving] = useState(false);
  const [errs, setErrs] = useState<{ wa?: string; pass?: string }>({});
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const hint = 'mt-1.5 text-xs text-encre/75';

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;
    const digits = form.whatsappNumber.replace(/\D/g, '');
    const { newPassword, ...rest } = form;
    const found: typeof errs = {};
    if (digits.length < 9) found.wa = 'Numéro trop court. Exemple : 237690000000.';
    if (newPassword && newPassword.trim().length < 6) found.pass = '6 caractères minimum.';
    setErrs(found);
    if (found.wa || found.pass) return;
    setSaving(true);
    const err = await s.updateSettings({ ...rest, whatsappNumber: digits, wholesaleMinQty: Math.max(0, parseInt(String(rest.wholesaleMinQty), 10) || 0), ...(newPassword.trim() ? { newPassword: newPassword.trim() } : {}) });
    setSaving(false);
    if (err) return say(err, false);
    setForm((f) => ({ ...f, newPassword: '' }));
    say('Réglages enregistrés.');
  };

  return (
    <div className="flex justify-center">
      <form onSubmit={save} className="w-full max-w-2xl space-y-6">
        <h1 className="font-display text-[1.75rem] sm:text-4xl font-semibold leading-[1.15] text-encre text-center">Votre boutique</h1>
      <div>
        <label className={labelCls} htmlFor="s-wa">Numéro WhatsApp (avec 237, sans +)</label>
        <input id="s-wa" required inputMode="numeric" value={form.whatsappNumber} aria-invalid={Boolean(errs.wa)} aria-describedby="s-wa-help" onChange={(e) => { set('whatsappNumber')(e); setErrs((x) => ({ ...x, wa: undefined })); }} className={inputCls} placeholder="237690000000" />
        <p id="s-wa-help" role={errs.wa ? 'alert' : undefined} className={errs.wa ? 'mt-1.5 text-sm text-garance' : hint}>{errs.wa ?? 'Toutes les commandes arrivent sur ce numéro.'}</p>
      </div>
      <div>
        <label className={labelCls} htmlFor="s-min">Quantité minimale en gros</label>
        <input id="s-min" inputMode="numeric" value={form.wholesaleMinQty || ''} onChange={(e) => setForm((f) => ({ ...f, wholesaleMinQty: parseInt(e.target.value.replace(/\D/g, ''), 10) || 0 }))} className={inputCls} placeholder="Ex. 6" />
        <p className={hint}>Vide : la quantité n'est pas affichée aux clientes.</p>
      </div>
      <div>
        <label className={labelCls} htmlFor="s-phone">Téléphone affiché</label>
        <input id="s-phone" value={form.displayPhone} onChange={set('displayPhone')} className={inputCls} placeholder="+237 690 00 00 00" />
      </div>
      <div>
        <label className={labelCls} htmlFor="s-hours">Horaires</label>
        <input id="s-hours" value={form.openingHoursFr} onChange={set('openingHoursFr')} className={inputCls} />
        <input aria-label="Horaires en anglais" value={form.openingHoursEn} onChange={set('openingHoursEn')} className={`${inputCls} mt-2`} placeholder="Horaires en anglais (facultatif)" />
      </div>
      <div>
        <label className={labelCls} htmlFor="s-addr">Adresse</label>
        <textarea id="s-addr" rows={2} value={form.addressFr} onChange={set('addressFr')} className={`${inputCls} h-auto py-3`} />
        <textarea aria-label="Adresse en anglais" rows={2} value={form.addressEn} onChange={set('addressEn')} className={`${inputCls} h-auto py-3 mt-2`} placeholder="Adresse en anglais (facultatif)" />
      </div>
      <div>
        <label className={labelCls} htmlFor="s-map">Lien Google Maps</label>
        <input id="s-map" type="url" value={form.googleMapsUrl} onChange={set('googleMapsUrl')} className={inputCls} />
      </div>
      <div>
        <span className={labelCls}>Photo d'accueil</span>
        <PhotoPicker photos={form.bannerImage ? [form.bannerImage] : []} max={1} onChange={(p) => setForm((f) => ({ ...f, bannerImage: p[0] ?? '' }))} onError={(m) => say(m, false)} />
      </div>
      <div>
        <span className={labelCls}>Photo de la boutique</span>
        <PhotoPicker photos={form.shopPhoto ? [form.shopPhoto] : []} max={1} onChange={(p) => setForm((f) => ({ ...f, shopPhoto: p[0] ?? '' }))} onError={(m) => say(m, false)} />
      </div>
      <div>
        <label className={labelCls} htmlFor="s-pass">Nouveau mot de passe</label>
        <input id="s-pass" type="password" autoComplete="new-password" value={form.newPassword} aria-invalid={Boolean(errs.pass)} aria-describedby="s-pass-help" onChange={(e) => { set('newPassword')(e); setErrs((x) => ({ ...x, pass: undefined })); }} className={inputCls} />
        <p id="s-pass-help" role={errs.pass ? 'alert' : undefined} className={errs.pass ? 'mt-1.5 text-sm text-garance' : hint}>{errs.pass ?? "Laissez vide pour garder l'actuel."}</p>
      </div>
      <div className="flex items-center justify-between gap-3 pt-4 border-t border-encre/20">
        <button
          type="button"
          onClick={async () => {
            if (!confirm("Remettre les produits et réglages d'exemple ? Vos produits seront perdus.")) return;
            const err = await s.resetToDefault();
            if (err) return say(err, false);
            setForm({ ...getSettings(), newPassword: '' });
            say('Boutique réinitialisée.');
          }}
          className="h-11 text-sm text-garance hover:underline cursor-pointer"
        >
          Réinitialiser la boutique
        </button>
        <button type="submit" disabled={saving} className={btnPrimary}>{saving ? 'Enregistrement…' : 'Enregistrer'}</button>
      </div>
    </form>
    </div>
  );
};
