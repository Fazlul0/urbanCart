# Hello Puku — Tiny Tutorial

A 60-second tour of the **Nogor Car** repo and how to run it with **Puku** in the loop.

## What this repo is

A car-accessories store with three deployable apps:

| App | Stack | Where it runs |
|---|---|---|
| `client/` (storefront) | React + Vite | Cloudflare Pages → `nogorcar.store` |
| `admin/` (back office) | React + Vite | Cloudflare Pages → `admin.nogorcar.store` |
| `worker/` (API) | Hono on Workers + D1 | Cloudflare Worker → `api.nogorcar.store` |

## Hello, Puku 👋

Puku is the AI assistant inside Puku Editor. Use it to **read**, **search**, and **edit** the repo.

A typical first turn looks like:

> *"Read the README, then summarize how the three apps talk to each other."*

Puku will:

1. Read `README.md` for the high-level layout.
2. Grep across `client/`, `admin/`, and `worker/` to confirm the wiring.
3. Reply with a short brief (no fluff, just the flow).

## Try it yourself

A few small, safe prompts to start with:

- *"Where is the auth check in the API worker?"*
- *"List the routes the storefront calls on page load."*
- *"What env vars does the admin app need at build time?"*

Each one is a read-only task — Puku uses search and file tools, never modifies your code.

## Shell command example

Puku runs shell commands for you. To bring the whole stack up locally:

```bash
# from the repo root
npm run install:all

# apply the D1 schema to your local SQLite
cd worker && npx wrangler d1 migrations apply urbancart --local

# start the API on http://localhost:8787
npm run dev:api

# in two more terminals:
npm run dev:client   # http://localhost:5173 (storefront)
npm run dev:admin    # http://localhost:5174 (admin)
```

Seed the demo data (API must be running, and `ALLOW_SEED=true` in `worker/.dev.vars`):

```bash
curl -X POST http://localhost:8787/api/dev/seed
```

## Next steps

- Run `npm run deploy:client` and `npm run deploy:admin` to publish.
- Wire `nogorcar.store`, `admin.nogorcar.store`, and `api.nogorcar.store` as custom domains in Cloudflare.
- Ask Puku to add a new admin screen, write a migration, or audit a route — it can edit and verify in the same turn.
