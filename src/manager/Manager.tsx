import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, Check, Eye, EyeOff, Gem, LayoutGrid, LogOut, Megaphone, Store as StoreIcon } from 'lucide-react';
import { deleteAllEvents, fetchEvents, useStore } from '../lib/store';
import { CATEGORIES, IMG } from '../lib/initialData';
import { Action, computeStats } from '../lib/analytics';
import { AnalyticsEvent } from '../types';
import { Marketing } from './Marketing';
import { Overview } from './Overview';
import { Products } from './Products';
import { Shop } from './Shop';

type Tab = 'produits' | 'marketing' | 'boutique';
const TABS = [
  { id: 'produits', label: 'Produits', Icon: Gem },
  { id: 'marketing', label: 'Marketing', Icon: Megaphone },
  { id: 'boutique', label: 'Boutique', Icon: StoreIcon },
] as const;

/** L'onglet vient de l'adresse (#gerant/produits) : le bouton Retour et les favoris fonctionnent. */
const tabFromHash = (): Tab => {
  const t = window.location.hash.split('/')[1];
  return TABS.find((x) => x.id === t)?.id ?? 'produits';
};

/** Police des titres, chargée seulement quand le gérant ouvre son espace. */
function useDisplayFont() {
  useEffect(() => {
    if (document.getElementById('gerant-font')) return;
    const l = document.createElement('link');
    l.id = 'gerant-font';
    l.rel = 'stylesheet';
    l.href = 'https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,500;12..96,600;12..96,700&display=swap';
    document.head.appendChild(l);
  }, []);
}

const Login: React.FC = () => {
  const s = useStore();
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  return (
    <main className="shop min-h-full grid lg:grid-cols-2">
      {/* Photo de la boutique, sur grand écran seulement */}
      <div className="on-dark relative hidden lg:block bg-velvet-deep">
        <img src={s.settings.bannerImage || IMG.hero} alt="" className="absolute inset-0 w-full h-full object-cover object-[62%_50%]" />
        <p className="absolute inset-x-0 bottom-0 bg-velvet text-porcelain px-10 py-6 font-heading text-3xl font-extrabold tracking-tight">{s.settings.shopName}</p>
      </div>

      <div className="flex items-center px-5 py-10 sm:px-12 lg:px-16">
        <form
          className="w-full max-w-md mx-auto flex flex-col"
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            const err = await s.loginAdmin(password);
            setBusy(false);
            if (err) setError(err);
          }}
        >
          <p className="lg:hidden mb-10 font-heading text-xl font-extrabold tracking-tight">{s.settings.shopName}</p>
          <h1 className="text-4xl sm:text-5xl font-extrabold">Espace gérant</h1>
          <p className="mt-4 text-moss max-w-[40ch]">Suivez les produits que vos clientes demandent, mettez à jour vos prix et préparez vos statuts.</p>

          <label htmlFor="g-pass" className="mt-9 block text-sm font-semibold mb-1.5">Mot de passe</label>
          <div className="relative">
            <input
              id="g-pass"
              type={show ? 'text' : 'password'}
              autoFocus
              autoComplete="current-password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); if (error) setError(''); }}
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? 'g-pass-err' : undefined}
              className="w-full h-12 rounded-sm border border-velvet/55 bg-paper pl-4 pr-14 text-base text-velvet outline-none focus:border-tag focus:ring-1 focus:ring-tag aria-[invalid=true]:border-tag aria-[invalid=true]:border-2"
            />
            <button
              type="button"
              onClick={() => setShow((v) => !v)}
              aria-pressed={show}
              aria-label={show ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
              className="absolute right-0.5 top-1/2 -translate-y-1/2 w-11 h-11 text-moss hover:text-velvet flex items-center justify-center cursor-pointer"
            >
              {show ? <EyeOff className="w-5 h-5" aria-hidden="true" /> : <Eye className="w-5 h-5" aria-hidden="true" />}
            </button>
          </div>
          {error && <p id="g-pass-err" role="alert" className="mt-2 text-sm font-semibold text-tag">{error}</p>}

          <button
            type="submit"
            disabled={busy || !password}
            className="mt-6 h-12 w-full rounded-sm bg-velvet hover:bg-velvet-deep disabled:opacity-50 disabled:hover:bg-velvet text-white font-semibold cursor-pointer disabled:cursor-not-allowed"
          >
            {busy ? 'Connexion…' : 'Se connecter'}
          </button>
          <a href="#" className="mt-3 self-start inline-flex h-11 items-center gap-1.5 text-sm font-semibold text-moss hover:text-velvet">
            <ArrowLeft className="w-4 h-4" aria-hidden="true" /> Retour à la boutique
          </a>
        </form>
      </div>
    </main>
  );
};

export const Manager: React.FC = () => {
  useDisplayFont();
  const s = useStore();
  const { isAdmin, products, settings } = s;
  const [tab, setTab] = useState<Tab>(tabFromHash);
  const [period, setPeriod] = useState(30);
  const [data, setData] = useState<{ events: AnalyticsEvent[]; truncated: boolean } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [openId, setOpenId] = useState<string | null>(null);
  const [statusId, setStatusId] = useState<string | null>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  const say = useCallback((msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3500);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setData(await fetchEvents(period));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Impossible de charger les chiffres.');
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    if (isAdmin) void load();
  }, [isAdmin, load]);

  const stats = useMemo(() => computeStats(data?.events ?? [], products, period, CATEGORIES), [data, products, period]);

  useEffect(() => {
    const onHash = () => setTab(tabFromHash());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);
  useEffect(() => {
    scroller.current?.scrollTo({ top: 0 });
  }, [tab]);

  const go = (t: Tab) => {
    window.location.hash = `gerant/${t}`;
  };

  const onAction = async (a: Action) => {
    if (a.kind === 'patch') {
      setBusy(true);
      const err = await s.updateProduct(a.productId, a.patch);
      setBusy(false);
      return say(err ?? 'Modifié. Le site est à jour.', !err);
    }
    if (a.kind === 'edit') setOpenId(a.productId);
    else setStatusId(a.productId);
    go('produits');
  };

  const clearAll = async () => {
    if (!confirm('Effacer toutes les statistiques ? Cette action est définitive.')) return;
    try {
      await deleteAllEvents();
      say('Statistiques remises à zéro.');
      void load();
    } catch (e) {
      say(e instanceof Error ? e.message : 'Échec.', false);
    }
  };

  const nav = (cls: string, item: string) =>
    TABS.map(({ id, label, Icon }) => (
      <button key={id} type="button" onClick={() => go(id)} aria-current={tab === id ? 'page' : undefined} className={`${cls} ${tab === id ? item : ''}`}>
        <Icon className="w-5 h-5" aria-hidden="true" />
        <span>{label}</span>
      </button>
    ));

  return (
    <div ref={scroller} className="gerant fixed inset-0 overflow-y-auto bg-papier text-encre font-sans">
      {!isAdmin ? (
        <Login />
      ) : (
        <div className="min-h-full lg:grid lg:grid-cols-[15rem_1fr]">
          <aside className="hidden lg:flex flex-col gap-1 sticky top-0 h-screen p-5 border-r border-encre/20">
            <div className="font-display text-xl font-semibold mb-4">{settings.shopName}</div>
            {nav('h-12 px-3 rounded-lg flex items-center gap-3 text-[15px] cursor-pointer text-encre/80 hover:bg-encre/10', 'bg-encre text-feuille hover:bg-encre')}
            <div className="mt-auto flex flex-col gap-1 text-sm">
              <a href="#" className="h-11 px-3 flex items-center underline underline-offset-4 decoration-or">Voir la boutique</a>
              <button type="button" onClick={() => { s.logoutAdmin(); }} className="h-11 px-3 flex items-center gap-2 cursor-pointer text-left"><LogOut className="w-4 h-4" /> Déconnexion</button>
            </div>
          </aside>

          <div className="min-w-0">
            <header className="lg:hidden sticky top-0 z-10 bg-papier/95 backdrop-blur border-b border-encre/15 px-4 h-14 flex items-center justify-between pt-[env(safe-area-inset-top)]">
              <span className="font-display text-lg font-semibold">{settings.shopName}</span>
              <div className="flex items-center gap-1 text-sm">
                <a href="#" className="h-11 px-3 inline-flex items-center underline underline-offset-4 decoration-or">Boutique</a>
                <button type="button" onClick={() => s.logoutAdmin()} className="w-11 h-11 flex items-center justify-center cursor-pointer" aria-label="Se déconnecter"><LogOut className="w-5 h-5" /></button>
              </div>
            </header>

            <main className="w-full max-w-6xl mx-auto px-4 sm:px-8 lg:px-12 pt-6 pb-32 lg:pb-16">
              {tab === 'produits' && <Products stats={stats} say={say} openId={openId} onOpened={() => setOpenId(null)} />}
              {tab === 'marketing' && <Marketing />}
              {tab === 'boutique' && <Shop say={say} />}
            </main>

            <nav aria-label="Navigation" className="lg:hidden fixed bottom-0 inset-x-0 z-20 bg-feuille border-t border-encre/20 grid grid-cols-3 pb-[env(safe-area-inset-bottom)]">
              {nav('h-16 flex flex-col items-center justify-center gap-0.5 text-[12px] cursor-pointer text-encre/70', 'text-encre font-semibold shadow-[inset_0_3px_0_var(--color-or)]')}
            </nav>
          </div>
        </div>
      )}

      {toast && (
        <div role="status" className={`fixed z-30 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-sm bottom-24 lg:bottom-6 rounded-lg px-4 py-3 text-sm font-medium flex items-center gap-2 shadow-lg ${toast.ok ? 'bg-encre text-feuille' : 'bg-garance text-white'}`}>
          {toast.ok && <Check className="w-4 h-4 shrink-0" />} {toast.msg}
        </div>
      )}
    </div>
  );
};
