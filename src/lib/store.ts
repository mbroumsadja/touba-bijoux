import { useSyncExternalStore } from 'react';
import { AnalyticsEvent, AppLanguage, Product, ProductCategory, StoreSettings } from '../types';
import { CATEGORIES, INITIAL_SETTINGS } from './initialData';

const LANG_KEY = 'touba_lang_v2';
const TOKEN_KEY = 'touba_admin_token';
const DATA_CACHE_KEY = 'touba_catalog_cache_v1';

const NETWORK_ERROR = 'Serveur injoignable : vérifiez la connexion et réessayez.';

function readLocal(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

const detectLang = (): AppLanguage => {
  const saved = readLocal(LANG_KEY);
  if (saved === 'fr' || saved === 'en') return saved;
  return typeof navigator !== 'undefined' && navigator.language?.toLowerCase().startsWith('en') ? 'en' : 'fr';
};

let token: string | null = (() => {
  try {
    return sessionStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
})();

function saveToken(next: string | null) {
  token = next;
  try {
    if (next) sessionStorage.setItem(TOKEN_KEY, next);
    else sessionStorage.removeItem(TOKEN_KEY);
  } catch {
    /* navigation privée : la session vit en mémoire */
  }
}

// État en mémoire : la liste de produits vient de MongoDB via /api/data.
function readDataCache(): { products: Product[]; settings: StoreSettings } | null {
  try {
    const raw = localStorage.getItem(DATA_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { products?: Product[]; settings?: Partial<StoreSettings> };
    if (!Array.isArray(parsed.products)) return null;
    return {
      products: parsed.products,
      settings: { ...INITIAL_SETTINGS, ...parsed.settings },
    };
  } catch {
    return null;
  }
}

let state = {
  products: readDataCache()?.products ?? [],
  settings: readDataCache()?.settings ?? (INITIAL_SETTINGS as StoreSettings),
  lang: detectLang(),
  isAdmin: token !== null,
  ready: Boolean(readDataCache()), // affiche immédiatement le cache si disponible
  offline: false, // true si le serveur n'a pas répondu
};

const listeners = new Set<() => void>();
const subscribe = (cb: () => void) => {
  listeners.add(cb);
  return () => listeners.delete(cb);
};
const getSnapshot = () => state;
export const getSettings = () => state.settings;

function commit(patch: Partial<typeof state>) {
  state = { ...state, ...patch };
  listeners.forEach((l) => l());
}

class ApiError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
  }
}

async function api<T>(path: string, init: { method?: string; body?: unknown } = {}): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`/api${path}`, {
      method: init.method ?? 'GET',
      headers: {
        ...(init.body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: init.body !== undefined ? JSON.stringify(init.body) : undefined,
    });
  } catch {
    throw new ApiError(NETWORK_ERROR, 0);
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (res.status === 401 && token) {
      saveToken(null);
      commit({ isAdmin: false });
    }
    throw new ApiError((data as { error?: string }).error || 'Une erreur est survenue.', res.status);
  }
  return data as T;
}

/** Exécute une écriture : retourne null si tout va bien, sinon le message d'erreur à afficher. */
async function run(fn: () => Promise<void>): Promise<string | null> {
  try {
    await fn();
    return null;
  } catch (e) {
    return e instanceof Error ? e.message : 'Une erreur est survenue.';
  }
}

async function load() {
  const cached = readDataCache();
  if (cached) {
    commit({ products: cached.products, settings: cached.settings, ready: true, offline: false });
  }

  try {
    const data = await api<{ products: Product[]; settings: StoreSettings }>('/data');
    const nextSettings = { ...INITIAL_SETTINGS, ...data.settings };
    try {
      localStorage.setItem(DATA_CACHE_KEY, JSON.stringify({ products: data.products, settings: nextSettings }));
    } catch {
      /* ignore */
    }
    commit({ products: data.products, settings: nextSettings, ready: true, offline: false });
  } catch {
    if (!cached) commit({ ready: true, offline: true });
    else commit({ offline: false });
  }
}

export function nextReference(category: ProductCategory, products: Product[]): string {
  const prefix = CATEGORIES.find((c) => c.id === category)?.prefix ?? 'P';
  const max = products
    .filter((p) => p.reference.startsWith(`${prefix}-`))
    .reduce((m, p) => Math.max(m, parseInt(p.reference.slice(prefix.length + 1), 10) || 0), 0);
  return `${prefix}-${String(max + 1).padStart(3, '0')}`;
}

const actions = {
  setLanguage(lang: AppLanguage) {
    try {
      localStorage.setItem(LANG_KEY, lang);
    } catch {
      /* ignore */
    }
    commit({ lang });
  },
  addProduct(data: Omit<Product, 'id'>) {
    return run(async () => {
      const created = await api<Product>('/products', { method: 'POST', body: data });
      commit({ products: [created, ...state.products] });
    });
  },
  updateProduct(id: string, data: Partial<Product>) {
    return run(async () => {
      const updated = await api<Product>(`/products/${encodeURIComponent(id)}`, { method: 'PATCH', body: data });
      commit({ products: state.products.map((p) => (p.id === id ? updated : p)) });
    });
  },
  deleteProduct(id: string) {
    return run(async () => {
      await api(`/products/${encodeURIComponent(id)}`, { method: 'DELETE' });
      commit({ products: state.products.filter((p) => p.id !== id) });
    });
  },
  updateSettings(data: Partial<StoreSettings> & { newPassword?: string }) {
    return run(async () => {
      const next = await api<StoreSettings>('/settings', { method: 'PUT', body: data });
      commit({ settings: { ...INITIAL_SETTINGS, ...next } });
    });
  },
  resetToDefault() {
    return run(async () => {
      const data = await api<{ products: Product[]; settings: StoreSettings }>('/reset', { method: 'POST' });
      commit({ products: data.products, settings: { ...INITIAL_SETTINGS, ...data.settings } });
    });
  },
  async loginAdmin(password: string): Promise<string | null> {
    const err = await run(async () => {
      const { token: t } = await api<{ token: string }>('/login', { method: 'POST', body: { password } });
      saveToken(t);
      commit({ isAdmin: true });
    });
    if (!err) await load(); // recharge avec les produits masqués
    return err;
  },
  logoutAdmin() {
    saveToken(null);
    commit({ isAdmin: false });
    void load();
  },
};

export const hasAdminToken = () => token !== null;
export const fetchEvents = (days: number) => api<{ events: AnalyticsEvent[]; truncated: boolean }>(`/stats?days=${days}`);
export const deleteAllEvents = () => api<{ ok: true }>('/events', { method: 'DELETE' });

void load();

export function useStore() {
  const s = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  return { ...s, ...actions, tr: (fr: string, en: string) => (s.lang === 'fr' ? fr : en) };
}
