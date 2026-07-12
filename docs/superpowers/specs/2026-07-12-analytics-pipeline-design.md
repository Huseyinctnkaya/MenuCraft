# Storefront Analytics Pipeline — Design

**Date:** 2026-07-12
**Status:** Approved

## Problem

The analytics dashboard (`app/routes/app.analytics.tsx`) reads `MenuEvent` rows, but nothing writes them. The only writer, `app/routes/api.analytics.tsx`, has zero callers and is publicly reachable (CORS `*`, no authentication) — anyone can fabricate events for any shop. The storefront embed script has no tracking code at all, so the dashboard always shows zeros.

## Goal

Implement the producer side of the analytics pipeline, secured by Shopify's App Proxy signature, and delete the insecure dead endpoint. After this change the dashboard shows real impression/click data.

## Event Contract (fixed by the existing dashboard)

The dashboard already expects exactly this shape on `MenuEvent` (schema unchanged, no migration):

| Field | Value |
|---|---|
| `eventType` | `"impression"` or `"click"` — nothing else |
| `menuId` | numeric menu id (from proxy menu payload) |
| `menuName` | menu name (used for Top Menus grouping) |
| `itemId` | clicked item id (click events only) |
| `itemLabel` | clicked item label (Top Links grouping) |
| `itemType` | item kind, e.g. `product` / `collection` / `link` (Top Links "type" column) |
| `source` | `"storefront"` (schema default) |
| `shop` | **from the verified proxy session — never from the client payload** |

## Architecture

```
storefront (menucraft-embed.js)
  └─ navigator.sendBeacon POST /apps/menucraft/analytics   (fallback: fetch keepalive)
       └─ Shopify App Proxy (adds signed query params, incl. shop)
            └─ app/routes/proxy.analytics.tsx
                 ├─ authenticate.public.appProxy(request)  → verified shop
                 ├─ validate + sanitize JSON body
                 └─ prisma.menuEvent.create
```

### 1. Server — `app/routes/proxy.analytics.tsx` (new)

- `action` handles POST only; other methods → 405. `loader` → 405.
- Verify via `shopify.authenticate.public.appProxy(request)` (same library pattern as `proxy.menu.tsx`). Take `shop` from the returned session/params — ignore any `shop` field in the body.
- Body parsing: `await request.text()` then `JSON.parse` (sendBeacon cannot set `Content-Type: application/json`, so `request.json()` may reject).
- Validation:
  - `eventType` must be `"impression"` or `"click"`, else 400.
  - `menuId`: coerced to number, `null` if not finite.
  - `menuName`, `itemId`, `itemLabel`, `itemType`: strings, trimmed, truncated to 255 chars, `null` if absent/not string.
- Write with `source: "storefront"`. Response: `{ ok: true }` (beacon ignores it anyway).
- Failures return 4xx/5xx JSON but never leak internals.

### 2. Storefront — `extensions/menucraft-embed/assets/menucraft-embed.js`

- New constant `ANALYTICS_URL = "/apps/menucraft/analytics"` next to the existing `PROXY_URL`.
- One `sendEvent(payload)` helper: `navigator.sendBeacon(ANALYTICS_URL, new Blob([JSON.stringify(payload)], { type: "text/plain" }))`; if `sendBeacon` is unavailable or returns `false`, fall back to `fetch(ANALYTICS_URL, { method: "POST", body, keepalive: true })`. Entire helper wrapped in try/catch — tracking must never break the menu.
- **Impression:** fired once per page load, right after the menu successfully renders, with `menuId` + `menuName` from the proxy menu payload.
- **Click:** delegated listener on menu link/item activation. Payload includes `menuId`, `menuName`, `itemId`, `itemLabel`, `itemType`. `itemType` derived from the item's data (product/collection/blog resource ids or block template → otherwise `"link"`).
- No tracking inside the admin builder preview — the embed script only runs on the storefront, so this is automatic.

### 3. Cleanup

- Delete `app/routes/api.analytics.tsx` (dead code, public write access).

## Out of Scope (deliberate, YAGNI)

- Viewport-visibility impressions (header menu is effectively always visible; render = impression).
- Event batching (volume is ~1 impression + sparse clicks per page).
- Bot filtering and rate limiting. The proxy signature already blocks off-storefront fabrication; in-storefront abuse (console spam on a real shop page) is an accepted v1 risk.
- Dashboard changes — it already consumes this contract.

## Verification

- `npm run build` passes; `npx tsc --noEmit` shows no new errors vs `docs/superpowers/plans/tsc-baseline-normalized.txt` (`api.analytics.tsx` has no baseline errors, so deleting it changes nothing in the diff).
- Manual: run `npm run dev`, open the dev-store storefront, load a page with the menu, click menu items; confirm `MenuEvent` rows appear and the dashboard renders non-zero impressions/clicks/CTR.
- Negative: `curl -X POST https://<app-url>/proxy/analytics` (unsigned, direct) must return 4xx and write nothing.
