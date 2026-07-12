# Storefront Analytics Pipeline Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement storefront impression/click tracking through the Shopify App Proxy and delete the insecure public analytics endpoint, per `docs/superpowers/specs/2026-07-12-analytics-pipeline-design.md`.

**Architecture:** The theme-extension script (`menucraft-embed.js`) fires `impression` events after menu render and `click` events via a delegated capture-phase listener, delivered with `navigator.sendBeacon` to `/apps/menucraft/analytics`. Shopify's App Proxy signs and forwards to a new `proxy.analytics.tsx` route, which verifies the signature with `authenticate.public.appProxy`, takes `shop` from the session (never the client), validates the payload, and writes `MenuEvent` rows. The dead public endpoint `api.analytics.tsx` is deleted.

**Tech Stack:** Remix 2 (flat routes), `@shopify/shopify-app-remix` app-proxy auth, Prisma (`MenuEvent`, unchanged schema), vanilla JS theme extension.

## Global Constraints

- **No test framework exists in this repo** (no vitest/jest). The per-task test cycle is: `npm run build` passes AND `npx tsc --noEmit` errors match `docs/superpowers/plans/tsc-baseline-normalized.txt` (protocol below) AND `node --check` for the extension JS. Plus curl-based negative tests where specified.
- `eventType` accepts exactly `"impression"` and `"click"` — reject anything else with 400.
- `shop` comes only from the verified proxy session. Any `shop` field in the request body is ignored.
- String fields (`menuName`, `itemId`, `itemLabel`, `itemType`) are trimmed and truncated to 255 chars; missing/non-string → `null`.
- Tracking code in the embed script must never throw into menu-rendering code paths — every tracking entry point is wrapped in try/catch.
- No Prisma schema changes, no dashboard changes.
- Commits go directly on `main` (user preference), message prefix `feat(analytics):` / `fix(analytics):` / `chore(analytics):`.

### TSC Differential Protocol (used by every task's Verify step)

```bash
npx tsc --noEmit | grep 'error TS' | sed 's/^[^(]*([0-9,]*): //' | sort > /tmp/tsc-now.txt
diff docs/superpowers/plans/tsc-baseline-normalized.txt /tmp/tsc-now.txt
```

Expected: empty diff (`api.analytics.tsx` has no baseline errors, so Task 3's deletion doesn't change it either). Any `>` line = new error, fix before committing.

---

### Task 1: App Proxy analytics route

**Files:**
- Create: `app/routes/proxy.analytics.tsx`

**Interfaces:**
- Consumes: `shopify.authenticate.public.appProxy(request)` from `app/shopify.server.ts` (default export `shopify`); `prisma` from `app/db.server.ts`.
- Produces: HTTP endpoint `POST /proxy/analytics`, reachable on storefronts as `POST /apps/menucraft/analytics` (app-proxy config in `shopify.app.toml`: prefix `apps`, subpath `menucraft`, url `…/proxy`). Accepts a JSON body (sent as `text/plain` by sendBeacon): `{ eventType: "impression"|"click", menuId?: number, menuName?: string, itemId?: string, itemLabel?: string, itemType?: string }`. Returns `{ ok: true }` on success.

- [ ] **Step 1: Create `app/routes/proxy.analytics.tsx`**

```tsx
import { json } from "@remix-run/node";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";

import prisma from "../db.server";
import shopify from "../shopify.server";

const MAX_FIELD_LENGTH = 255;

const cleanString = (value: unknown): string | null => {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed.slice(0, MAX_FIELD_LENGTH);
};

export const loader = async (_args: LoaderFunctionArgs) => {
  return json({ ok: false, error: "Method Not Allowed" }, { status: 405 });
};

export const action = async ({ request }: ActionFunctionArgs) => {
  if (request.method !== "POST") {
    return json({ ok: false, error: "Method Not Allowed" }, { status: 405 });
  }

  let shop: string | undefined;
  try {
    const { session } = await shopify.authenticate.public.appProxy(request);
    shop = session?.shop;
  } catch {
    return json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }
  if (!shop) {
    return json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  // sendBeacon cannot send Content-Type: application/json, so parse manually.
  let payload: unknown;
  try {
    payload = JSON.parse(await request.text());
  } catch {
    return json({ ok: false, error: "Invalid payload" }, { status: 400 });
  }
  if (!payload || typeof payload !== "object") {
    return json({ ok: false, error: "Invalid payload" }, { status: 400 });
  }

  const body = payload as Record<string, unknown>;
  const eventType = body.eventType;
  if (eventType !== "impression" && eventType !== "click") {
    return json({ ok: false, error: "Invalid eventType" }, { status: 400 });
  }

  const menuIdValue = Number(body.menuId);
  const menuId = Number.isFinite(menuIdValue) ? menuIdValue : null;

  try {
    await prisma.menuEvent.create({
      data: {
        shop,
        menuId,
        menuName: cleanString(body.menuName),
        itemId: cleanString(body.itemId),
        itemLabel: cleanString(body.itemLabel),
        itemType: cleanString(body.itemType),
        eventType,
        source: "storefront",
      },
    });
  } catch (error) {
    console.error("[analytics] Failed to record event", error);
    return json({ ok: false, error: "Failed to record event" }, { status: 500 });
  }

  return json({ ok: true });
};
```

- [ ] **Step 2: Verify build + tsc diff**

Run: `npm run build` → expect `✓ built in …`.
Run the TSC Differential Protocol → expect empty diff.

- [ ] **Step 3: Negative test — unsigned direct POST is rejected**

With the dev server NOT required (route logic only needs build), this check runs during Task 4's live session; here, statically confirm: the action's first meaningful statement is the `authenticate.public.appProxy` call, and `shop` from the body is never read (grep check):

Run: `grep -n "body.shop\|payload.shop" app/routes/proxy.analytics.tsx`
Expected: no output.

- [ ] **Step 4: Commit**

```bash
git add app/routes/proxy.analytics.tsx
git commit -m "feat(analytics): add app-proxy analytics ingestion route"
```

---

### Task 2: Embed script tracking (impression + click)

**Files:**
- Modify: `extensions/menucraft-embed/assets/menucraft-embed.js`
  - near line 9 (`PROXY_URL` const) — add analytics constants/helpers
  - `buildLink` (~line 350) — stamp `data-mc-item-id`
  - `renderMenu` (~line 1608) — set active menu info + fire impression
  - module tail (near the existing `document.addEventListener("click", …)` around line 2054) — delegated click listener

**Interfaces:**
- Consumes: Task 1's endpoint at `"/apps/menucraft/analytics"`; menu payload shape from `proxy.menu` (`data.menu.id`, `data.menu.name`, items with `id`).
- Produces: JSON event payloads matching Task 1's contract.

- [ ] **Step 1: Add analytics helpers after the `PROXY_URL` constant**

Directly below `const PROXY_URL = "/apps/menucraft/menu";` add:

```js
  const ANALYTICS_URL = "/apps/menucraft/analytics";

  let activeMenuInfo = null; // { id, name } of the currently rendered menu
  let lastImpressionKey = null;

  const sendEvent = (payload) => {
    try {
      const body = JSON.stringify(payload);
      if (navigator.sendBeacon) {
        const blob = new Blob([body], { type: "text/plain" });
        if (navigator.sendBeacon(ANALYTICS_URL, blob)) return;
      }
      fetch(ANALYTICS_URL, {
        method: "POST",
        body,
        keepalive: true,
        credentials: "include",
      }).catch(() => {});
    } catch (e) {
      /* analytics must never break the menu */
    }
  };

  const trackImpression = (menu) => {
    try {
      const key = window.location.pathname + "::" + menu.id;
      if (lastImpressionKey === key) return;
      lastImpressionKey = key;
      sendEvent({
        eventType: "impression",
        menuId: menu.id,
        menuName: menu.name || null,
      });
    } catch (e) {
      /* ignore */
    }
  };
```

The `lastImpressionKey` (pathname + menu id) dedupes the double-render path in `loadMenu` (cache render + fresh render) while still counting a new impression after turbo/turbolinks navigations, which change the pathname without reloading the script.

- [ ] **Step 2: Stamp menu item id in `buildLink`**

In `buildLink`, right after `link.href = item.url || "#";` add:

```js
    if (item.id) link.dataset.mcItemId = item.id;
```

- [ ] **Step 3: Hook impression in `renderMenu`**

At the very top of `const renderMenu = (menu) => {` body (before `const settings = …`) add:

```js
    activeMenuInfo = { id: menu.id, name: menu.name || null };
```

At the very end of the `renderMenu` function body (immediately before its closing `};`) add:

```js
    trackImpression(menu);
```

- [ ] **Step 4: Add the delegated click listener at module scope**

Next to the existing module-level `document.addEventListener("click", …)` (Section 9/10 area, ~line 2054), add a new capture-phase listener (capture so it runs before navigation-preventing handlers):

```js
  const resolveItemType = (anchor) => {
    const cls = anchor.className || "";
    if (cls.indexOf("mc-product") !== -1) return "product";
    if (cls.indexOf("mc-collection") !== -1) return "collection";
    if (cls.indexOf("mc-blog") !== -1) return "blog";
    if (cls.indexOf("mc-search") !== -1) return "search";
    return "link";
  };

  document.addEventListener(
    "click",
    (e) => {
      try {
        const anchor =
          e.target && e.target.closest ? e.target.closest(".mc-menu a[href]") : null;
        if (!anchor) return;
        if (!activeMenuInfo) return;
        sendEvent({
          eventType: "click",
          menuId: activeMenuInfo.id,
          menuName: activeMenuInfo.name,
          itemId: (anchor.dataset && anchor.dataset.mcItemId) || null,
          itemLabel: (anchor.textContent || "").trim().slice(0, 255) || null,
          itemType: resolveItemType(anchor),
        });
      } catch (err) {
        /* ignore */
      }
    },
    true
  );
```

- [ ] **Step 5: Syntax check**

Run: `node --check extensions/menucraft-embed/assets/menucraft-embed.js`
Expected: no output, exit 0.

- [ ] **Step 6: Commit**

```bash
git add extensions/menucraft-embed/assets/menucraft-embed.js
git commit -m "feat(analytics): track storefront impressions and clicks via app proxy"
```

---

### Task 3: Delete the insecure public endpoint

**Files:**
- Delete: `app/routes/api.analytics.tsx`

- [ ] **Step 1: Confirm zero references, then delete**

Run: `grep -rn "api/analytics\|api.analytics" app/ extensions/ --include="*.ts*" --include="*.js" --include="*.liquid" | grep -v node_modules | grep -v "app/routes/api.analytics.tsx"`
Expected: no output.

```bash
git rm app/routes/api.analytics.tsx
```

- [ ] **Step 2: Verify build + tsc diff**

Run: `npm run build` → `✓ built in …`. Run the TSC Differential Protocol → empty diff.

- [ ] **Step 3: Commit**

```bash
git commit -m "chore(analytics): remove unauthenticated public analytics endpoint"
```

---

### Task 4: Live end-to-end verification (user-assisted)

No automated harness can exercise the Shopify proxy signature; this runs against the dev store.

- [ ] **Step 1:** User runs `npm run dev` (type `! npm run dev` in the prompt) and, once the tunnel is up, opens the dev-store **storefront** (not admin) on a page where the MenuCraft menu renders.
- [ ] **Step 2:** Load a page, click 2-3 menu items (a plain link and, if present, a product/collection card).
- [ ] **Step 3:** Verify rows landed:

```bash
sqlite3 prisma/dev.sqlite "SELECT eventType, menuName, itemLabel, itemType, source FROM MenuEvent ORDER BY id DESC LIMIT 10;"
```

Expected: 1+ `impression` row and one `click` row per click, `source = storefront`, correct labels/types.

- [ ] **Step 4:** Open the app's Analytics page in admin — impressions/clicks/CTR now non-zero; clicked items appear under Top Links.
- [ ] **Step 5:** Negative test — unsigned direct POST bypassing Shopify must be rejected and write nothing:

```bash
curl -s -o /dev/null -w "%{http_code}\n" -X POST "$(grep application_url shopify.app.toml | cut -d'"' -f2)/proxy/analytics" -d '{"eventType":"impression","menuId":1}'
sqlite3 prisma/dev.sqlite "SELECT COUNT(*) FROM MenuEvent WHERE source = 'storefront' AND shop NOT LIKE '%.myshopify.com';"
```

Expected: `401` (or `400`), and count `0`.

- [ ] **Step 6:** Push:

```bash
git push origin main
```

---

## Self-Review Notes

- **Spec coverage:** server route → Task 1; embed tracking (helper, impression, click, item-id stamping) → Task 2; endpoint deletion → Task 3; verification incl. negative test → Tasks 1/4. Out-of-scope items (batching, bot filtering, viewport impressions, dashboard) have no tasks, by design.
- **Type consistency:** payload field names (`eventType`, `menuId`, `menuName`, `itemId`, `itemLabel`, `itemType`) identical across Task 1 (server parse), Task 2 (client send), and the `MenuEvent` schema.
- **No TDD cycle:** repo has no test framework; gates are build + tsc-differential + `node --check` + live E2E, matching the project's established verification pattern.
