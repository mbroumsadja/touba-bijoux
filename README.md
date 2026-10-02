# TOUBA BIJOUX — Next.js (site + API dans une seule application)

Le front React (Vite) et le serveur Express ont été regroupés dans **une seule application Next.js** (App Router).
Les composants, le store et les styles sont inchangés ; les routes Express sont devenues des routes API Next (`src/app/api/*`).

## Lancer
```bash
cp .env.example .env.local     # collez MONGODB_URI et un JWT_SECRET
npm install
npm run dev                    # http://localhost:3000 (site + /api)
npm run build && npm start     # production
```
Variables : `MONGODB_URI`, `MONGODB_DB`, `JWT_SECRET`, `ADMIN_PASSWORD`, `NEXT_PUBLIC_SITE_URL` (adresse publique, utilisée pour l'aperçu WhatsApp `og:image`).

## Ce qui a changé
| Avant (Vite + Express) | Maintenant (Next.js) |
|---|---|
| `index.html`, `src/main.tsx` | `src/app/layout.tsx` (métadonnées, polices, JSON-LD) + `src/app/page.tsx` |
| `src/App.tsx` (SPA) | inchangé, chargé côté client via `src/app/ClientApp.tsx` |
| `server/app.js`, `server/index.js` | `src/app/api/**/route.ts` + `src/server/*` (db, auth, validation) |
| `server/seed.js` | `src/server/seed.ts` |
| `src/index.css` | `src/app/globals.css` |
| `vite.config.ts` (proxy `/api`) | supprimé : site et API sont sur le même port |
| `npm run dev:server` + `npm run dev` | un seul `npm run dev` |

L'espace gérant reste sur `/#gerant`. Les URLs de l'API sont identiques (`/api/data`, `/api/login`, `/api/products`, `/api/settings`, `/api/events`, `/api/stats`, `/api/reset`, `/api/health`).

## Déploiement
- **Serveur Node classique** (Render, VPS) : `npm run build && npm start`. Les limiteurs d'essais (connexion, événements) fonctionnent en mémoire comme avant.
- **Vercel** : possible, mais le corps des requêtes est limité à ~4,5 Mo (photos compressées : OK) et les limiteurs en mémoire ne sont pas partagés entre instances. Définissez `JWT_SECRET` obligatoirement.
