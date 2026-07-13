# SQLite → Postgres Migration — Design

**Date:** 2026-07-13
**Status:** Approved

## Problem

All app data — Shopify sessions, menus, analytics events, billing state, templates — lives in a single SQLite file (`prisma/dev.sqlite`) hardcoded in `schema.prisma`. Any redeploy or container restart loses everything. Two pieces of raw SQL are SQLite-specific and would break on any other database. This blocks production hosting and App Store release.

## Decision Summary

- **Approach:** clean cut. Switch the Prisma provider to `postgresql`, drive the URL from `DATABASE_URL`, and reset the migration history to a single fresh `init` migration. There is no production data to preserve; converting 10 SQLite migrations has zero value.
- **Local dev:** Homebrew PostgreSQL 16 (already installed and running on the dev machine as a brew service; user explicitly prefers no Docker for local dev). ~~Docker Compose~~ — revised 2026-07-13 after user feedback.
- **Rejected:** dual schema (SQLite dev / PG prod — drift trap) and hand-translating the migration history (effort without benefit).

## Changes

### 1. Prisma schema (`prisma/schema.prisma`)

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

Models unchanged. `Json` columns become native `jsonb`; `BigInt userId` maps cleanly.

### 2. Migration reset

- Delete `prisma/migrations/` entirely.
- Generate one fresh migration: `npx prisma migrate dev --name init` (against the local Docker PG).
- Delete `prisma/dev.sqlite` and `prisma/dev.sqlite3` from disk; `.gitignore` entries stay (harmless) plus keep them ignored for old checkouts.
- **Local test data is discarded.** Templates come back via `npm run seed:templates`; the dev-store test menu is recreated by hand (~1 minute).

### 3. Local environment (revised: Homebrew, no Docker)

- Uses the machine's existing Homebrew `postgresql@16` service (`brew services start postgresql@16`) and the pre-existing empty `menucraft` database.
- `.env` (gitignored) gains `DATABASE_URL=postgresql://huseyin@localhost:5432/menucraft` (brew trust auth via macOS user).
- New `.env.example` documenting `DATABASE_URL` (and noting `SHOPIFY_*` vars come from Shopify CLI in dev).
- `package.json` scripts: `"db:up": "brew services start postgresql@16"`, `"db:down": "brew services stop postgresql@16"`.
- README Quick Start updated: `npm run db:up` before `npm run dev`.

### 4. Replace SQLite-specific raw SQL (behavior identical)

- `app/menu-builder/server/action.server.ts` — the `$executeRaw UPDATE Menu SET settings = …` workaround becomes a normal `tx.menu.update({ where: { id: menuId }, data: { settings } })` inside the existing transaction (the surrounding shop-scoped `findFirst` already guards ownership). The raw statement was a SQLite JSON-write workaround; on PG (and current Prisma) the typed update is correct.
- `app/routes/app.mega-menus.tsx` — the `$queryRaw … json_array_length(items) …` query becomes `prisma.menu.findMany({ where: { shop }, orderBy: { id: "asc" }, select: { id, name, status, items } })` with `itemCount` computed in JS (`Array.isArray(items) ? items.length : 0`). Menu counts per shop are small; portability beats the micro-optimization.

### 5. Verification

- `npm run build` + tsc differential (vs `docs/superpowers/plans/tsc-baseline-normalized.txt`) green at every step. Note: the mega-menus change may *resolve* baseline errors tied to the `any[]` raw query — acceptable, baseline updated.
- Live: `npm run db:up` → `npm run dev` → app loads (session created in PG), save/publish a menu, storefront renders it, analytics events land in PG (`MenuEvent` count grows), mega-menus list shows correct item counts, re-entering the app does not force re-auth.
- `docker compose down && up` → data survives (named volume).

## Out of Scope

- Production Postgres provisioning (hosting task; `DATABASE_URL` makes it plug-in).
- Connection pooling (pgbouncer/Prisma Accelerate).
- Migrating existing SQLite contents (test data only).
