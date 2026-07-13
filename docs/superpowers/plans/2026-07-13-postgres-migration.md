# SQLite → Postgres Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Switch MenuCraft from a hardcoded SQLite file to env-driven Postgres, per `docs/superpowers/specs/2026-07-13-postgres-migration-design.md`.

**Architecture:** Prisma provider becomes `postgresql` with `url = env("DATABASE_URL")`; migration history is reset to a single `init` migration generated against a local Docker Compose Postgres. Two SQLite-specific raw SQL usages are replaced with portable Prisma calls (identical behavior). Local dev uses `docker compose up -d` before `shopify app dev`.

**Tech Stack:** Prisma 6, postgres:17-alpine (Docker Compose), Shopify CLI dev (injects `.env`).

## Global Constraints

- No model changes in `schema.prisma` — only the `datasource` block changes.
- Behavior of replaced raw SQL must be identical (same data written, same fields returned).
- Local test data is discarded by design; templates restored via `npm run seed:templates`.
- `.env` is already gitignored (`.gitignore` lines 14-15); never commit it. `.env.example` IS committed.
- Verification gate per task: `npm run build` passes AND tsc differential vs `docs/superpowers/plans/tsc-baseline-normalized.txt` shows no `>` (new) lines. Disappearing baseline errors from the mega-menus rewrite are acceptable; update the baseline in the same commit.
- Commits directly on `main`, prefix `feat(db):` / `chore(db):` / `docs:`.

### TSC Differential Protocol

```bash
npx tsc --noEmit | grep 'error TS' | sed 's/^[^(]*([0-9,]*): //' | sort > /tmp/tsc-now.txt
diff docs/superpowers/plans/tsc-baseline-normalized.txt /tmp/tsc-now.txt
```

---

### Task 1: Local Postgres via Docker Compose + env plumbing

**Files:**
- Create: `docker-compose.yml`
- Create: `.env` (NOT committed)
- Create: `.env.example`
- Modify: `package.json` (scripts)

**Interfaces:**
- Produces: reachable Postgres at `postgresql://menucraft:menucraft@localhost:5432/menucraft`; `DATABASE_URL` env var available to Prisma CLI and `shopify app dev`.

- [ ] **Step 1: Create `docker-compose.yml`**

```yaml
services:
  db:
    image: postgres:17-alpine
    container_name: menucraft-db
    environment:
      POSTGRES_USER: menucraft
      POSTGRES_PASSWORD: menucraft
      POSTGRES_DB: menucraft
    ports:
      - "5432:5432"
    volumes:
      - menucraft-pgdata:/var/lib/postgresql/data

volumes:
  menucraft-pgdata:
```

- [ ] **Step 2: Create `.env`** (local only, gitignored)

```
DATABASE_URL=postgresql://menucraft:menucraft@localhost:5432/menucraft
```

- [ ] **Step 3: Create `.env.example`**

```
# Local Postgres (docker compose up -d)
DATABASE_URL=postgresql://menucraft:menucraft@localhost:5432/menucraft

# SHOPIFY_API_KEY / SHOPIFY_API_SECRET / SCOPES are injected by `shopify app dev`
# in development. Set them explicitly for production deploys.
```

- [ ] **Step 4: Add npm scripts** — in `package.json` `scripts`, after `"dev"`:

```json
    "db:up": "docker compose up -d",
    "db:down": "docker compose down",
```

- [ ] **Step 5: Start the database and verify** (requires Docker Desktop running; if the daemon is down, ask the user to launch Docker Desktop first)

Run: `npm run db:up && docker compose ps`
Expected: `menucraft-db` state `running`.
Run: `docker exec menucraft-db pg_isready -U menucraft`
Expected: `accepting connections`.

- [ ] **Step 6: Commit** (verify `git status` does NOT list `.env`)

```bash
git add docker-compose.yml .env.example package.json
git commit -m "feat(db): add local Postgres via docker compose"
```

---

### Task 2: Provider switch + migration reset

**Files:**
- Modify: `prisma/schema.prisma` (datasource block only)
- Delete: `prisma/migrations/*` (all 10 + lock file), `prisma/dev.sqlite`, `prisma/dev.sqlite3`
- Create: `prisma/migrations/<timestamp>_init/` (generated)

**Interfaces:**
- Consumes: running Postgres from Task 1.
- Produces: Prisma client generated for PG; schema applied to local DB.

- [ ] **Step 1: Update the datasource block**

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

(Also delete the stale comment above it about adapter string lengths only if it's inaccurate — otherwise leave comments untouched.)

- [ ] **Step 2: Reset migration history and SQLite files**

```bash
rm -rf prisma/migrations
rm -f prisma/dev.sqlite prisma/dev.sqlite3 prisma/dev.sqlite-journal
```

- [ ] **Step 3: Generate the init migration against local PG**

Run: `npx prisma migrate dev --name init`
Expected: `Your database is now in sync with your schema.` and a new `prisma/migrations/*_init/migration.sql` containing `CREATE TABLE "Session" …` etc.

- [ ] **Step 4: Seed templates**

Run: `npm run seed:templates`
Expected: exits 0.
Run: `docker exec menucraft-db psql -U menucraft -d menucraft -c 'SELECT COUNT(*) FROM "MenuTemplate";'`
Expected: count > 0.

- [ ] **Step 5: Verify build + tsc diff**

Run: `npm run build` → `✓ built in …`. TSC protocol → no `>` lines.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat(db): switch Prisma to Postgres with fresh init migration"
```

---

### Task 3: Replace SQLite-specific raw SQL

**Files:**
- Modify: `app/menu-builder/server/action.server.ts:113-121` (the `$executeRaw` block)
- Modify: `app/routes/app.mega-menus.tsx:41-47` (the `$queryRaw` block) and the downstream `itemCount` consumer if its type changes

**Interfaces:**
- Consumes: Prisma client from Task 2.
- Produces: identical runtime behavior with portable Prisma calls.

- [ ] **Step 1: action.server.ts — replace raw settings update**

Replace:

```ts
    if (settings) {
      await tx.$executeRaw`
        UPDATE Menu
        SET settings = ${JSON.stringify(settings)}
        WHERE id = ${menuId} AND shop = ${shop}
      `;
    }
```

with:

```ts
    if (settings) {
      await tx.menu.update({
        where: { id: menuId },
        data: { settings },
      });
    }
```

(Ownership is already enforced by the `findFirst({ where: { id: menuId, shop } })` guard before the transaction.)

- [ ] **Step 2: app.mega-menus.tsx — replace raw list query**

Replace:

```ts
    prisma.$queryRaw<any[]>`
      SELECT id, name, status, json_array_length(items) as itemCount
      FROM Menu
      WHERE shop = ${shop}
      ORDER BY id ASC
    `,
```

with:

```ts
    prisma.menu
      .findMany({
        where: { shop },
        orderBy: { id: "asc" },
        select: { id: true, name: true, status: true, items: true },
      })
      .then((rows) =>
        rows.map(({ items, ...rest }) => ({
          ...rest,
          itemCount: Array.isArray(items) ? items.length : 0,
        }))
      ),
```

Check the downstream usage of `menus` in the same file (it consumed `id/name/status/itemCount` from the raw rows — field names are preserved). Fix any type complaints the compiler raises by matching the previous `any[]`-era usage, not by changing behavior.

- [ ] **Step 3: Verify build + tsc diff**

Run: `npm run build` → green. TSC protocol → no `>` lines; if baseline errors disappeared (the old `any[]` raw query hid types), update the baseline:

```bash
cp /tmp/tsc-now.txt docs/superpowers/plans/tsc-baseline-normalized.txt
```

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat(db): replace SQLite-specific raw SQL with portable Prisma queries"
```

---

### Task 4: Docs (README Quick Start)

**Files:**
- Modify: `README.md` (Quick Start section)

- [ ] **Step 1:** Update Quick Start to:

```markdown
1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Start the local database** (requires Docker):
   ```bash
   npm run db:up
   ```

3. **Configure environment**: copy `.env.example` to `.env` (the default
   `DATABASE_URL` matches the docker-compose database).

4. **Start Development**:
   ```bash
   npm run dev
   ```

5. **Seed Templates**:
   ```bash
   npm run seed:templates
   ```
```

(Remove the old separate "Database Setup / npm run setup" step — `shopify app dev` runs `prisma generate`, and migrations apply via `npm run setup` only in production/docker.)

- [ ] **Step 2: Commit**

```bash
git add README.md
git commit -m "docs: update quick start for local Postgres workflow"
```

---

### Task 5: Live end-to-end verification (user-assisted)

- [ ] **Step 1:** `npm run db:up` (if not running) → user runs `! npm run dev`.
- [ ] **Step 2:** User opens the app in admin (fresh OAuth lands a Session row in PG):

```bash
docker exec menucraft-db psql -U menucraft -d menucraft -c 'SELECT shop FROM "Session";'
```

Expected: the dev store domain.

- [ ] **Step 3:** User opens Menu Builder (auto-creates a menu), saves/publishes; user opens the storefront and clicks menu items. Verify:

```bash
docker exec menucraft-db psql -U menucraft -d menucraft -c 'SELECT status, COUNT(*) FROM "Menu" GROUP BY status;'
docker exec menucraft-db psql -U menucraft -d menucraft -c 'SELECT "eventType", COUNT(*) FROM "MenuEvent" GROUP BY "eventType";'
```

Expected: 1+ menu; impression/click rows growing.

- [ ] **Step 4:** Mega Menus page shows the menu list with correct item counts; Analytics page shows non-zero numbers.
- [ ] **Step 5:** Persistence: `npm run db:down && npm run db:up`, reload app — no re-auth, data intact.
- [ ] **Step 6:** Push:

```bash
git push origin main
```

---

## Self-Review Notes

- **Spec coverage:** datasource switch → Task 2; migration reset → Task 2; docker-compose + env + scripts → Task 1; raw SQL replacements → Task 3; README → Task 4; live verification incl. persistence → Task 5. Out-of-scope items have no tasks.
- **Type consistency:** mega-menus replacement preserves the consumed field names (`id`, `name`, `status`, `itemCount`).
- **No TDD:** no test framework in repo; gates are build + tsc-differential + live E2E, per project convention.
