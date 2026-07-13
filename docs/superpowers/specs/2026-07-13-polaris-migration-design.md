# Full Polaris UI Migration — Design

**Date:** 2026-07-13
**Status:** Approved

## Problem

The app's frontend is visually inconsistent with Shopify admin. Most admin pages (`app._index`, `app.mega-menus`, `app.analytics`, `app.pricing`, `app.settings`, `app.support`, `app.install-status`, `app.documentation`, `Sidebar`) are built with a custom Tailwind UI kit (`app/components/ui/Button|Card|Badge`) plus `lucide-react` icons — a Polaris look-alike, not real Polaris. `@shopify/polaris` (`^12.0.0`) is already a dependency and is used correctly in a few places (`app.additional.tsx`, and partially in `app._index.tsx` / `app.mega-menus.tsx` / `app.settings.tsx` via `Modal`, `Select`, `Banner`, `Text`). This inconsistency makes the app feel off-brand inside Shopify admin and is the reason for this migration.

## Decision Summary

- **Approach:** convert every admin-chrome page to real Polaris components (`Page`, `Layout`, `Card`, `BlockStack`, `InlineStack`, `Text`, `Badge`, `Button`, `Banner`, `IndexTable`/`DataTable`, `FormLayout`, `TextField`, `Select`, `Checkbox`, `ProgressBar`/`List`, etc.). Data loading, actions, and business logic in each route are unchanged — this is a presentation-layer rewrite.
- **Navigation:** replace the fixed custom `Sidebar.tsx` with App Bridge's `<NavMenu>` (`@shopify/app-bridge-react`), the standard pattern for embedded Shopify admin apps. Nav links render inside Shopify admin's own chrome; pages go full-width.
- **Menu Builder canvas is excluded:** `app.menu-builder.tsx` and its side panels (`MenuTree`, `SettingsPanel`, `ColorsPanel`, `TypographyPanel`, `CodePanel`, pickers) get converted to Polaris since they're admin form controls. The central live-preview/canvas (`MegaPanel`, `preview/blocks/*`, `MobileDropdownPanel`, `MobileHorizontalDropdownPanel`, `ElementGroupMasonry`, `FloatingLinkListToolbar`) stays exactly as-is — it renders the actual storefront menu design the merchant is building, not admin UI, and must not be restyled by Polaris.
- **Rejected:** rewriting the canvas/preview in Polaris too (would corrupt the actual on-storefront appearance merchants are designing) — explicitly rejected by user during design review.
- Old UI kit (`app/components/ui/Button.tsx`, `Card.tsx`, `Badge.tsx`, `utils.ts`) is deleted once nothing imports it anymore.

## Changes

### 1. App shell & navigation (`app/routes/app.tsx`, `app/components/Sidebar.tsx`)

- Remove `<Sidebar />` and the `flex`/`ml-64` wrapper layout.
- Add `<NavMenu>` from `@shopify/app-bridge-react` inside the `AppProvider`, with `<Link>` items matching the current nav: Dashboard (`/app`), Analytics (`/app/analytics`), Mega Menus (`/app/mega-menus`), Install & Theme Status (`/app/install-status`), Pricing & Plans (`/app/pricing`), Support (`/app/support`), Settings (`/app/settings`).
- Keep the `isBuilderView` branch (menu-builder still gets its own full-bleed layout, no nav chrome needed there beyond what App Bridge already provides).
- Add Polaris i18n: import Polaris English translations and pass via `<AppProvider i18n={...}>` if not already effectively defaulted (verify current Polaris major version's default i18n behavior; add explicit `en.json` if required).
- Keep the Polaris stylesheet `<link>` pattern already used ad-hoc per-route (`polarisStyles` from `@shopify/polaris/build/esm/styles.css?url`) — hoist it once to `app.tsx` `links()` so every child route gets it without repeating per-file.

### 2. Dashboard (`app/routes/app._index.tsx`)

- `Page` wrapping the whole view (title "Dashboard" or similar), `Layout`/`Layout.Section` for the feature cards, status card, and setup checklist.
- Feature cards (Create Mega Menu / Mobile Menu / Import Menu) → Polaris `Card` with `InlineStack`/`BlockStack`, `Badge` for "Plus".
- App Status card → Polaris `Card`, `Badge` (success/critical) replacing custom green/rose dots, `Button` for "Configure" actions.
- Setup checklist → Polaris `List` with `Icon` (CheckCircle/circle) or a simple `BlockStack` of rows; keep existing completion logic untouched.
- Theme select inline editor → already partially Polaris (`Select`); wrap in `Card`/`FormLayout` instead of the raw bordered div.
- FAQ accordion → Polaris `Collapsible` + `Button` (disclosure) instead of custom chevron toggle, or keep custom disclosure logic but restyle with Polaris `Text`/`Box`.
- Upgrade modal → already Polaris `Modal`; no change needed beyond removing now-redundant custom `Card`.

### 3. Mega Menus (`app/routes/app.mega-menus.tsx`)

- `Page` with primary action "Create New Menu", secondary actions "Import from File" / "Import from Shopify".
- Menu limit banner → Polaris `Banner` (already partly there; formalize).
- Menu list table → Polaris `IndexTable` (rows: Menu Name, Status via `Badge`, Items, Views, Actions with `Button`/`ButtonGroup` for Customize/Duplicate/Delete), replacing the custom HTML table.
- Delete/duplicate confirmation → Polaris `Modal`.

### 4. Analytics (`app/routes/app.analytics.tsx`)

- `Page` + `Layout` + `Card` wrapping each chart section. `recharts` chart components themselves are kept as-is (Polaris has no charting primitive) but every card, filter control, and stat tile around them becomes Polaris (`Card`, `Text`, `Select` for date range, `BlockStack`).

### 5. Pricing & Plans (`app/routes/app.pricing.tsx`)

- Plan comparison cards → Polaris `Card` + `Badge` ("Current plan") + `Button` (upgrade/downgrade actions), laid out with `InlineGrid` or `Layout`.

### 6. Settings (`app/routes/app.settings.tsx`)

- `Page` + `Layout.AnnotatedSection` per settings group (shop info, preferences, billing/plan, users) with `FormLayout`, `TextField`, `Select`, `Checkbox` replacing custom form markup. `Form` (Remix) submission mechanics unchanged.

### 7. Support (`app/routes/app.support.tsx`) & Documentation (`app/routes/app.documentation.tsx`)

- `Page` + `Layout` + `Card` + `Text`/`List`, following the existing `app.additional.tsx` boilerplate page as the reference pattern for structure.

### 8. Install & Theme Status (`app/routes/app.install-status.tsx`)

- `Page` + `Card` per status row (app embed, connected theme, app block), `Badge` for active/inactive, `Button` for "Configure"/theme editor links, `Select` + `Modal`/inline panel for theme picker (mirrors Dashboard's theme-picker pattern — reuse the same Polaris structure).

### 9. Menu Builder side panels only (`app/menu-builder/components/panels/*`, `pickers/*`)

- `MenuTree`, `SettingsPanel`, `ColorsPanel`, `TypographyPanel`, `CodePanel` and the picker panels (`CollectionPickerPanel`, `IconLibraryPanel`, `IconUploadPanel`, `ImagePickerPanel`, `LinkPickerContent`, `ProductPickerPanel`, `SubmenuImagePickerPanel`) get their form controls (buttons, inputs, tabs, color swatches, selects) rebuilt with Polaris equivalents (`TextField`, `ColorPicker`, `Tabs`, `Button`, `Popover`, `ResourceList`/`Listbox` for pickers).
- Everything under `app/menu-builder/components/preview/**` (including `blocks/*`, `MegaPanel`, `MainRowControls`, `MobileDropdownPanel`, `MobileHorizontalDropdownPanel`, `ElementGroupMasonry`, `FloatingLinkListToolbar`) and `mobile-deps.ts`/`deps.ts` are **out of scope** — no visual changes, since they render the merchant's actual menu design output.

### 10. Cleanup

- Once no route/component imports `app/components/ui/Button.tsx`, `Card.tsx`, `Badge.tsx`, or `utils.ts`, delete them.
- Remove now-unused `lucide-react` icon imports only where a Polaris `Icon`/built-in glyph fully replaces them; otherwise `lucide-react` may remain for icons Polaris doesn't provide (evaluate per-page).

## Testing / Verification

- `npm run lint` and `tsc` (project's existing baseline-diff approach, per `docs/superpowers/plans/tsc-baseline-normalized.txt` if still applicable) after each page conversion.
- `npm run dev` (Shopify CLI tunnel) and manually click through every converted page in an actual embedded session to confirm `NavMenu` renders correctly inside Shopify admin (it will not render in a bare non-embedded browser tab — expected).
- Manually verify: Dashboard setup checklist state, Mega Menus create/duplicate/delete/import flows, Analytics charts still render data, Pricing upgrade/downgrade actions, Settings form save round-trip, Support/Documentation static content, Install Status theme picker + embed/block detection.
- Menu Builder: confirm the live preview/canvas pixel output is unchanged before/after (side-by-side), while panel controls are visually Polaris.

## Out of Scope

- Menu Builder's live-preview/canvas visual design (explicitly excluded, see Decision Summary).
- Any backend/business-logic changes — loaders, actions, Prisma queries, billing logic, GraphQL calls are untouched; this is presentation-only.
- New features or UX changes beyond adopting Polaris components (e.g., no new charts, no new settings fields).
