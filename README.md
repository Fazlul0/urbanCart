# Nogor Car

Car accessories store on **Cloudflare Workers + D1 + Pages**. Domain: **nogorcar.store**.

## Live URLs

| App | URL |
|-----|-----|
| Store | https://nogorcar.store |
| Admin | https://admin.nogorcar.store |
| API | https://api.nogorcar.store |

Transitional Cloudflare hosts (until DNS fully cut over):

| App | URL |
|-----|-----|
| Store (Pages) | https://urbancart-7he.pages.dev |
| Admin (Pages) | https://urbancart-admin.pages.dev |
| API (Workers) | https://urbancart-api.fazlulkarim362.workers.dev |

Admin login: `admin@urbancart.com` (password in secrets)  
Demo user: `demo@urbancart.com` / `Demo@123`

## Architecture

```
client/   → Cloudflare Pages  (store SPA) → nogorcar.store
admin/    → Cloudflare Pages  (admin SPA) → admin.nogorcar.store
worker/   → Cloudflare Worker + D1         → api.nogorcar.store
```

| Layer | Tech |
|-------|------|
| Storefront | React (Vite) → Cloudflare Pages |
| Admin | React (Vite) → Cloudflare Pages |
| API | Hono on Cloudflare Workers |
| Database | Cloudflare D1 (SQLite) |
| Auth | JWT (`jose`) + PBKDF2 password hashing |

## Custom domain setup (Cloudflare)

1. Add `nogorcar.store` as a zone in Cloudflare (or transfer DNS from Namecheap).
2. Pages → **urbancart** project → Custom domains → `nogorcar.store` + `www.nogorcar.store`.
3. Pages → **urbancart-admin** project → Custom domain → `admin.nogorcar.store`.
4. Workers → **urbancart-api** → Triggers / Custom Domains → `api.nogorcar.store`.
5. DNS records (proxied orange cloud):
   - `nogorcar.store` / `www` → Pages
   - `admin` → Pages (admin)
   - `api` → Worker

## Local setup

```bash
# Install
npm run install:all

# Apply D1 schema (local)
cd worker && npx wrangler d1 migrations apply urbancart --local

# Start API (port 8787)
npm run dev:api

# Seed demo data (API must be running; ALLOW_SEED=true in worker/.dev.vars)
curl -X POST http://localhost:8787/api/dev/seed

# Start frontends (proxy /api → :8787)
npm run dev:client   # http://localhost:5173
npm run dev:admin    # http://localhost:5174
```

## Deploy

```bash
# API (binds custom domain api.nogorcar.store + CLIENT_URL / ADMIN_URL)
cd worker && CLOUDFLARE_ACCOUNT_ID=afeeea28ef4b58aad33f54322feaab68 npx wrangler deploy

# Frontends (VITE_API_URL=https://api.nogorcar.store/api)
npm run deploy:client
npm run deploy:admin
```

## Brand

- **Domain:** nogorcar.store  
- **Display name:** from Admin → Site Branding (defaults to Nogor Car)  
- **Colors:** Black `#111111` · Gold `#C9A227` · White  
