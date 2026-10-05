import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Check, ExternalLink, Gem, Lock, LogOut, Store as StoreIcon, type LucideIcon } from 'lucide-react';
import { fetchEvents, useStore } from '../lib/store';
import { CATEGORIES } from '../lib/initialData';
import { computeStats } from '../lib/analytics';
import { AnalyticsEvent } from '../types';
import { ProductRoute, Products } from './Products';
import { Shop } from './Shop';
import { ConfirmDialog, btnPrimary, inputCls } from './ui';

/** Navigation du tableau de bord : des rubriques regroupées, chacune une adresse (#gerant/<rubrique>). */
const GROUPS = ['Catalogue', 'Réglages'] as const;
const TABS = [
  { id: 'produits', label: 'Produits', Icon: Gem, group: 'Catalogue' },
  { id: 'boutique', label: 'Boutique', Icon: StoreIcon, group: 'Réglages' },
] as const;
type Tab = (typeof TABS)[number]['id'];

const STATS_DAYS = 30;

interface Route {
  tab: Tab;
  product: ProductRoute;
}

/**
 * L'adresse décrit l'écran : le bouton Retour, les favoris et les liens partagés fonctionnent.
 *   #gerant/produits                    liste
 *   #gerant/produits/nouveau            création
 *   #gerant/produits/modifier/<id>      modification
 *   #gerant/boutique                    réglages
 */
const parseRoute = (): Route => {
  const [, rawTab, sub, rawId] = window.location.hash.replace(/^#/, '').split('/');
  const tab = TABS.find((t) => t.id === rawTab)?.id ?? 'produits';
  if (tab === 'produits' && sub === 'nouveau') return { tab, product: { mode: 'new' } };
  if (tab === 'produits' && sub === 'modifier' && rawId) {
    try {
      return { tab, product: { mode: 'edit', id: decodeURIComponent(rawId) } };
    } catch {
      /* adresse mal formée : on retombe sur la liste */
    }
  }
  return { tab, product: { mode: 'list' } };
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
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  return (
    <main className="min-h-full flex items-center justify-center p-6">
      <form
        className="w-full max-w-sm flex items-center justify-center flex-col gap-3 bg-ivory/5 border border-ivory/10 rounded-2xl p-6 sm:p-8"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          const err = await s.loginAdmin(password);
          setBusy(false);
          if (err) setError(err);
        }}
      >
        <span className="w-12 h-12 rounded-full bg-encre text-feuille flex items-center justify-center"><Lock className="w-5 h-5" /></span>
        <h1 className="mt-5 font-display text-4xl font-semibold leading-tight text-encre">Espace gérant</h1>
        <p className="mt-2 text-encre/75">Gérez vos produits, mettez à jour vos prix et suivez ce que vos clientes demandent.</p>
        <label htmlFor="g-pass" className="sr-only">Mot de passe</label>
        <input id="g-pass" type="password" autoFocus autoComplete="current-password" placeholder="Mot de passe" value={password} onChange={(e) => setPassword(e.target.value)} className={`${inputCls} mt-6`} />
        {error && <p role="alert" className="mt-3 text-sm text-garance">{error}</p>}
        <button type="submit" disabled={busy || !password} className={`${btnPrimary} w-full mt-4`}>{busy ? 'Connexion…' : 'Se connecter'}</button>
        <a href="#" className="mt-4 inline-flex h-11 items-center text-sm underline underline-offset-4 decoration-or">Retour à la boutique</a>
      </form>
    </main>
  );
};

const NavLink: React.FC<{ id: Tab; label: string; Icon: LucideIcon; active: boolean; onGo: (id: Tab) => void; variant: 'side' | 'bottom' }> = ({ id, label, Icon, active, onGo, variant }) => (
  <a
    href={`#gerant/${id}`}
    aria-current={active ? 'page' : undefined}
    onClick={(e) => {
      e.preventDefault();
      onGo(id);
    }}
    className={
      variant === 'side'
        ? `h-12 px-3 rounded-lg flex items-center gap-3 text-[15px] cursor-pointer transition-colors ${active ? 'bg-encre text-feuille font-medium' : 'text-encre/80 hover:bg-encre/10'}`
        : `h-16 flex flex-col items-center justify-center gap-0.5 text-[12px] cursor-pointer ${active ? 'text-encre font-semibold shadow-[inset_0_3px_0_var(--color-or)]' : 'text-encre/70'}`
    }
  >
    <Icon className="w-5 h-5" aria-hidden="true" />
    <span>{label}</span>
  </a>
);

export const Manager: React.FC = () => {
  useDisplayFont();
  const s = useStore();
  const { isAdmin, products, settings } = s;
  const [route, setRoute] = useState<Route>(parseRoute);
  const [events, setEvents] = useState<AnalyticsEvent[]>([]);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const [leaveTo, setLeaveTo] = useState<string | null>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const mainRef = useRef<HTMLElement>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const dirty = useRef(false); // un formulaire contient des modifications non enregistrées
  const savedTop = useRef(0); // position de la liste, restaurée au retour d'un formulaire

  const say = useCallback((msg: string, ok = true) => {
    clearTimeout(toastTimer.current);
    setToast({ msg, ok });
    toastTimer.current = setTimeout(() => setToast(null), 4000);
  }, []);

  const setDirty = useCallback((d: boolean) => {
    dirty.current = d;
  }, []);

  // Chiffres des clientes (vues, demandes) : affichés dans la liste et le formulaire.
  useEffect(() => {
    if (!isAdmin) return;
    let live = true;
    fetchEvents(STATS_DAYS)
      .then((d) => live && setEvents(d.events))
      .catch(() => {
        /* la liste fonctionne sans les chiffres */
      });
    return () => {
      live = false;
    };
  }, [isAdmin]);
  const stats = useMemo(() => computeStats(events, products, STATS_DAYS, CATEGORIES), [events, products]);

  useEffect(() => {
    const onHash = () => setRoute(parseRoute());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  /** Change d'écran. Avec des modifications non enregistrées, demande d'abord confirmation. */
  const go = useCallback((path: string, force = false) => {
    if (!force && dirty.current) {
      setLeaveTo(path);
      return;
    }
    dirty.current = false;
    const cur = parseRoute();
    if (cur.tab === 'produits' && cur.product.mode === 'list') savedTop.current = scroller.current?.scrollTop ?? 0;
    window.location.hash = `gerant/${path}`;
  }, []);

  // À chaque changement d'écran : retour en haut (ou à la position de la liste), et le focus passe au contenu.
  const mode = route.product.mode;
  const editId = route.product.mode === 'edit' ? route.product.id : '';
  const prev = useRef({ tab: route.tab, mode });
  useEffect(() => {
    const el = scroller.current;
    const from = prev.current;
    if (el) {
      const backToList = route.tab === 'produits' && mode === 'list' && from.tab === 'produits' && from.mode !== 'list';
      el.scrollTo({ top: backToList ? savedTop.current : 0 });
    }
    prev.current = { tab: route.tab, mode };
    mainRef.current?.focus({ preventScroll: true });
  }, [route.tab, mode, editId]);

  return (
    <div ref={scroller} className="gerant fixed inset-0 overflow-y-auto bg-papier text-encre font-sans">
      {!isAdmin ? (
        <Login />
      ) : (
        <div className="min-h-full lg:grid lg:grid-cols-[15rem_1fr]">
          <button
            type="button"
            onClick={() => mainRef.current?.focus()}
            className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-40 focus:h-11 focus:px-4 focus:rounded-full focus:bg-encre focus:text-feuille"
          >
            Aller au contenu
          </button>

          <aside className="hidden lg:flex flex-col sticky top-0 h-screen p-5 border-r border-encre/15 bg-feuille">
            <div className="flex items-center gap-3 mb-8">
              <span className="w-10 h-10 shrink-0 rounded-full bg-encre text-feuille flex items-center justify-center"><Gem className="w-5 h-5" aria-hidden="true" /></span>
              <div className="min-w-0">
                <div className="font-display text-lg font-semibold leading-tight truncate">{settings.shopName}</div>
                <div className="text-xs text-encre/70">Espace gérant</div>
              </div>
            </div>
            <nav aria-label="Navigation principale" className="flex flex-col gap-5">
              {GROUPS.map((g) => (
                <div key={g}>
                  <div className="px-3 mb-1 text-xs font-medium text-encre/70">{g}</div>
                  {TABS.filter((t) => t.group === g).map((t) => (
                    <NavLink key={t.id} id={t.id} label={t.label} Icon={t.Icon} active={route.tab === t.id} onGo={go} variant="side" />
                  ))}
                </div>
              ))}
            </nav>
            <div className="mt-auto pt-4 border-t border-encre/15 flex flex-col gap-1 text-sm">
              <a href="#" className="h-11 px-3 flex items-center gap-2 rounded-lg hover:bg-encre/10"><ExternalLink className="w-4 h-4" aria-hidden="true" /> Voir la boutique</a>
              <button type="button" onClick={() => s.logoutAdmin()} className="h-11 px-3 flex items-center gap-2 rounded-lg cursor-pointer text-left hover:bg-encre/10"><LogOut className="w-4 h-4" aria-hidden="true" /> Déconnexion</button>
            </div>
          </aside>

          <div className="min-w-0">
            <header className="lg:hidden sticky top-0 z-10 bg-papier/95 backdrop-blur border-b border-encre/15 px-4 h-14 flex items-center justify-between pt-[env(safe-area-inset-top)]">
              <span className="font-display text-lg font-semibold truncate">{settings.shopName}</span>
              <div className="flex items-center gap-1 text-sm">
                <a href="#" className="h-11 px-3 inline-flex items-center underline underline-offset-4 decoration-or">Boutique</a>
                <button type="button" onClick={() => s.logoutAdmin()} className="w-11 h-11 flex items-center justify-center cursor-pointer" aria-label="Se déconnecter"><LogOut className="w-5 h-5" /></button>
              </div>
            </header>

            <main ref={mainRef} tabIndex={-1} style={{ outline: 'none' }} className="w-full max-w-6xl mx-auto px-4 sm:px-8 xl:px-12 pt-6 pb-32 lg:pb-16">
              {route.tab === 'produits' && <Products route={route.product} go={go} stats={stats} say={say} onDirty={setDirty} />}
              {route.tab === 'boutique' && <Shop say={say} />}
            </main>

            <nav aria-label="Navigation principale" className="lg:hidden fixed bottom-0 inset-x-0 z-20 bg-feuille border-t border-encre/20 grid grid-cols-2 pb-[env(safe-area-inset-bottom)]">
              {TABS.map((t) => (
                <NavLink key={t.id} id={t.id} label={t.label} Icon={t.Icon} active={route.tab === t.id} onGo={go} variant="bottom" />
              ))}
            </nav>
          </div>

          <ConfirmDialog
            open={leaveTo !== null}
            danger
            title="Quitter sans enregistrer ?"
            message="Les modifications de ce produit seront perdues."
            confirmLabel="Quitter"
            cancelLabel="Continuer à modifier"
            onConfirm={() => {
              const path = leaveTo;
              setLeaveTo(null);
              if (path) go(path, true);
            }}
            onCancel={() => setLeaveTo(null)}
          />
        </div>
      )}

      {toast && (
        // En haut : en bas, la notification recouvrirait la barre « Annuler / Enregistrer » des formulaires.
        <div role="status" className={`fixed z-30 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-sm top-[calc(3.5rem+env(safe-area-inset-top)+0.5rem)] lg:top-6 rounded-lg px-4 py-3 text-sm font-medium flex items-center gap-2 shadow-lg ${toast.ok ? 'bg-encre text-feuille' : 'bg-garance text-white'}`}>
          {toast.ok && <Check className="w-4 h-4 shrink-0" aria-hidden="true" />} {toast.msg}
        </div>
      )}
    </div>
  );
};
