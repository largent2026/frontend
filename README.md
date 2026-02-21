# Frontend — Dyson E-Commerce (Next.js)

Site e-commerce Dyson Reconditionnés (Next.js 14, App Router).

## Déploiement sur Vercel

1. **Pousser le code sur GitHub** (dépôt `largent2026/frontend`).
2. Sur [Vercel](https://vercel.com) : **Add New → Project**, importer le dépôt **frontend**.
3. **Framework Preset** : Next.js (détecté automatiquement).
4. **Environment Variables** — ajouter :
   - `NEXT_PUBLIC_API_URL` = URL de l’API backend (ex. `https://ton-api.onrender.com/api/v1`)

5. **Deploy** : Vercel build (`npm run build`) et déploie. Tu obtiens une URL (ex. `https://frontend-xxx.vercel.app`).
6. Cette URL frontend doit être mise dans le **backend** (Render) en `FRONTEND_URL` pour CORS et les liens d’emails.

**Note** : Après le premier déploiement, mets à jour `FRONTEND_URL` sur Render avec l’URL Vercel réelle.
