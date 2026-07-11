# Menu Builder Modularization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Split the 17,170-line `app/routes/app.menu-builder.tsx` into focused modules under `app/menu-builder/` with **zero behavior change**.

**Architecture:** The route file stays (Remix `flatRoutes()` requires it) but becomes a thin shell that re-exports `loader`/`action`/`links` from server modules and renders a slimmed `MenuBuilder` component. Render closures inside the component become stateless components with **explicit props** (no context). All hooks/state stay in `MenuBuilder`; extracted components receive state and callbacks via props.

**Tech Stack:** Remix 2 (flat routes), React 18, TypeScript, Polaris 12, Prisma, Vite 6.

## Global Constraints

- **ZERO behavior change.** This is a move-only refactor. No logic edits, no renames of behavior-carrying identifiers, no "while I'm here" cleanups.
- **Verification gate after EVERY task:** `npm run build` must pass AND `npx tsc --noEmit` must produce **no new errors** vs baseline (see protocol below). Commit only after both pass.
- The project has **220 pre-existing tsc errors** (179 in this file). They must be *moved*, never *fixed* and never *grown*. Baseline: `scratchpad/tsc-baseline.txt` (regenerate per protocol if missing).
- Route module `app/routes/app.menu-builder.tsx` must keep exporting: `links`, `loader`, `action`, `default`.
- Preserve verbatim: `const isPlusPlan = true; // planTier === "plus"; // TEMPORARY OVERRIDE FOR TESTING` (orig line 649).
- Extracted components must contain **no hooks** (the original closures contain none — all hooks live in `MenuBuilder`). If a closure appears to reference a hook directly, stop and pass the value via props instead.
- All new files live under `app/menu-builder/`. Named exports only (matches existing codebase style).
- Original-file line numbers cited below refer to the **pre-refactor file** (17,170 lines). They shift as tasks complete — locate code by function name, use line numbers for orientation only.
- Work on branch `refactor/menu-builder-modularization`. One commit per task, message format: `refactor(menu-builder): <what moved>`.

---

## TSC Differential Verification Protocol

Used by every task's "Verify" step. Because 179 baseline errors live inside the file being split, their file/line positions move — compare error *texts*, not positions.

```bash
# One-time (Task 1): create baseline
npx tsc --noEmit | grep 'error TS' | sed 's/^[^(]*([0-9,]*): //' | sort > docs/superpowers/plans/tsc-baseline-normalized.txt

# After each task:
npx tsc --noEmit | grep 'error TS' | sed 's/^[^(]*([0-9,]*): //' | sort > /tmp/tsc-now.txt
diff docs/superpowers/plans/tsc-baseline-normalized.txt /tmp/tsc-now.txt
```

Expected: empty diff. Acceptable: an error line disappears AND reappears identically (moved between files — already handled by stripping file/line). **Any `>` line (new error) = the task is broken; fix before committing.** A `<` line (error vanished) is only acceptable if the same error text appears elsewhere in the file; investigate otherwise — silently "fixing" an error means behavior may have changed.

Then:

```bash
npm run build   # must end with "✓ built in ..." and exit 0
```

---

## The Extraction Recipe (referenced by Tasks 4–20)

Converting a render closure `renderFoo = (...args) => JSX` into `components/<area>/Foo.tsx`:

1. **Create the new file.** Copy the closure body **verbatim**. Wrap as:
   ```tsx
   export function Foo(props: FooProps) {
     const { /* destructure every prop */ } = props;
     return ( /* verbatim JSX from the closure */ );
   }
   ```
   If the closure took arguments (e.g. `renderImageBlock(group, options)`), those become props too (`group`, plus the option fields).
2. **Derive props from the compiler.** Add an empty `type FooProps = {}` first, then run `npx tsc --noEmit 2>&1 | grep 'components/<area>/Foo'`. Every `Cannot find name 'X'` is a free variable → add `X` to `FooProps` and the destructure. Repeat until only baseline-class errors remain. Type each prop with the real type from the route file (state types are in `app/menu-builder/types.ts`; callback signatures are visible at the definition site).
3. **Replace the call site(s)** in the route file: `{renderFoo(a, b)}` → `<Foo a={a} b={b} x={x} … />`. Pass every prop explicitly — no spread of unknown bags.
4. **Delete the original closure** from the route file.
5. **Verify** per the TSC protocol + `npm run build`.
6. **Commit**: `git add -A && git commit -m "refactor(menu-builder): extract <Foo>"`.

**Rules:**
- If closure A calls closure B (e.g. `renderMenuTree` calls `renderAddBetween`), extract B first, or extract them into the same file in one task (the task list below already orders for this).
- Shared helpers used by many closures (`renderMenuIcon`, `renderSegmentedControl`) are extracted as components early (Task 6) so later tasks can import them.
- Refs passed as props keep their type: e.g. `registerPreviewRow: (id: string) => (node: HTMLDivElement | null) => void`.
- Never convert a prop callback to inline logic or vice versa. Copy, wire, delete — nothing else.

---

### Task 1: Branch + baselines

**Files:**
- Create: `docs/superpowers/plans/tsc-baseline-normalized.txt`

- [ ] **Step 1: Create branch**

```bash
git checkout -b refactor/menu-builder-modularization
```

- [ ] **Step 2: Record normalized tsc baseline**

```bash
npx tsc --noEmit | grep 'error TS' | sed 's/^[^(]*([0-9,]*): //' | sort > docs/superpowers/plans/tsc-baseline-normalized.txt
wc -l docs/superpowers/plans/tsc-baseline-normalized.txt
```

Expected: ~220 lines.

- [ ] **Step 3: Confirm build passes**

```bash
npm run build
```

Expected: `✓ built in …`, exit 0.

- [ ] **Step 4: Commit**

```bash
git add docs/superpowers/plans/
git commit -m "refactor(menu-builder): add modularization plan + tsc baseline"
```

---

### Task 2: Extract server code (loader + action)

**Files:**
- Create: `app/menu-builder/server/loader.server.ts`
- Create: `app/menu-builder/server/action.server.ts`
- Modify: `app/routes/app.menu-builder.tsx` (orig lines 228–427 loader, 429–545 action)

**Interfaces:**
- Produces: `loader` (LoaderFunction, orig 228–427, verbatim body) and `action` (ActionFunction, orig 429–545, verbatim body), re-exported by the route.

- [ ] **Step 1: Create `app/menu-builder/server/loader.server.ts`**

Move the entire `export const loader = async ({ request }: LoaderFunctionArgs) => { … }` block verbatim. Bring over exactly the imports it uses (check the loader body): `json`, `redirect` from `@remix-run/node`, `LoaderFunctionArgs` type, `authenticate` from `../../shopify.server`, `prisma` from `../../db.server`, plus any menu-builder helpers/types/constants it references (`MenuItem`, `BuilderSettings`, defaults from `../constants`, etc. — let the compiler enumerate).

- [ ] **Step 2: Create `app/menu-builder/server/action.server.ts`**

Move `export const action = async ({ request }: ActionFunctionArgs) => { … }` verbatim, with its imports (`authenticate`, `prisma`, `sendContactEmail` from `../../email.server`, `MenuItem`, `BuilderSettings` types).

- [ ] **Step 3: Re-export from the route file**

In `app/routes/app.menu-builder.tsx`, delete the moved blocks and add at the top:

```ts
export { loader } from "../menu-builder/server/loader.server";
export { action } from "../menu-builder/server/action.server";
```

The component still needs the loader/action *types* for `useLoaderData<typeof loader>` / `useFetcher<typeof action>` — the re-exported symbols satisfy this; if TS complains, import them explicitly: `import type { loader } from "../menu-builder/server/loader.server";` and keep usage identical.

- [ ] **Step 4: Remove now-unused imports from the route file** (only ones the compiler flags as unused AND were only used by loader/action — e.g. `crypto`, `prisma` if unused elsewhere).

- [ ] **Step 5: Verify** — TSC protocol (empty diff) + `npm run build` passes.

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "refactor(menu-builder): extract loader/action to server modules"
```

---

### Task 3: Extract module-level constants & pure helpers

**Files:**
- Create: `app/menu-builder/preview-images.ts` (orig 136–182: `PREVIEW_IMAGE_SOURCES`, `HOVER_PREVIEW_DELAY_MS`, `HOVER_PREVIEW_CLEAR_DELAY_MS`)
- Modify: `app/menu-builder/utils.ts` (append orig 184–222: `applySidebarDefaultExpansion`, `stripExpandedFromItems`, `buildMenuFingerprint`; orig 546–570: `filterVisibleItemsRecursive`, `findItemInTree`)
- Modify: `app/routes/app.menu-builder.tsx`

**Interfaces:**
- Produces (all `export`ed, signatures verbatim from source):
  - `applySidebarDefaultExpansion(items: MenuItem[]): MenuItem[]`
  - `stripExpandedFromItems(items: MenuItem[]): MenuItem[]`
  - `buildMenuFingerprint(items: MenuItem[], status: string, settings: BuilderSettings): string` (confirm exact params at source)
  - `filterVisibleItemsRecursive(items: MenuItem[], isMobile: boolean): MenuItem[]`
  - `findItemInTree(items: MenuItem[], id: string | null): MenuItem | null`
  - `PREVIEW_IMAGE_SOURCES`, `HOVER_PREVIEW_DELAY_MS`, `HOVER_PREVIEW_CLEAR_DELAY_MS`

- [ ] **Step 1: Move the five helpers into `app/menu-builder/utils.ts`** (verbatim, add `export`), move the three constants into `app/menu-builder/preview-images.ts` (verbatim, add `export`).
- [ ] **Step 2: Import them in the route file**, delete originals.
- [ ] **Step 3: Verify** — TSC protocol + build.
- [ ] **Step 4: Commit** — `refactor(menu-builder): extract module-level helpers and preview image constants`.

---

### Task 4: Worked example — extract `CodePanel` (smallest closure)

**Files:**
- Create: `app/menu-builder/components/panels/CodePanel.tsx`
- Modify: `app/routes/app.menu-builder.tsx` (orig 9105–9130, `renderCodePanel`)

**Interfaces:**
- Produces: `CodePanel(props)` — props per recipe step 2; expected shape (confirm with compiler): `{ builderSettings: BuilderSettings; updateBuilderSetting: <K extends keyof BuilderSettings>(key: K, value: BuilderSettings[K]) => void }` plus any Polaris imports the JSX needs.

- [ ] **Step 1:** Apply the Extraction Recipe to `renderCodePanel`. Call site `{renderCodePanel()}` becomes `<CodePanel builderSettings={builderSettings} updateBuilderSetting={updateBuilderSetting} … />`.
- [ ] **Step 2:** Verify (TSC protocol + build).
- [ ] **Step 3:** Commit — `refactor(menu-builder): extract CodePanel`.

---

### Task 5: Extract `ColorsPanel` and `TypographyPanel`

**Files:**
- Create: `app/menu-builder/components/panels/ColorsPanel.tsx` (orig 8070–8202, `renderColorsPanel`)
- Create: `app/menu-builder/components/panels/TypographyPanel.tsx` (orig 7811–8069, `renderTypographyPanel`)
- Modify: `app/routes/app.menu-builder.tsx`

Likely props (compiler confirms): `builderSettings`, `updateBuilderSetting`, color-picker open state + `toggleColorPicker`, font picker state + `openFontPickerFor`/`closeFontPicker`.

- [ ] **Step 1:** Recipe on `renderColorsPanel` → `ColorsPanel`. Verify. Commit `refactor(menu-builder): extract ColorsPanel`.
- [ ] **Step 2:** Recipe on `renderTypographyPanel` → `TypographyPanel`. Verify. Commit `refactor(menu-builder): extract TypographyPanel`.

---

### Task 6: Extract shared leaf helpers used across many closures

**Files:**
- Create: `app/menu-builder/components/shared/MenuIcon.tsx` (orig 4109–4143, `renderMenuIcon`)
- Create: `app/menu-builder/components/shared/SegmentedControl.tsx` (orig 4490–4518, `renderSegmentedControl`)
- Modify: `app/routes/app.menu-builder.tsx`

**Interfaces:**
- Produces: `MenuIcon` component and `SegmentedControl` component. **These are imported by most later tasks** — match the original closure argument lists 1:1 as props (confirm at source; `renderMenuIcon` takes the icon id + sizing args, `renderSegmentedControl` takes options + value + onChange).

- [ ] **Step 1:** Recipe on `renderMenuIcon` → `MenuIcon`. Note: it has MANY call sites (`renderMenuIcon(…)` inside sidebar tree, preview, account links). Replace every call site with `<MenuIcon … />`. Verify. Commit.
- [ ] **Step 2:** Recipe on `renderSegmentedControl` → `SegmentedControl`. Replace all call sites. Verify. Commit.

---

### Task 7: Extract `SettingsPanel`

**Files:**
- Create: `app/menu-builder/components/panels/SettingsPanel.tsx` (orig 8203–9104, ~900 lines, `renderSettingsPanel`)
- Modify: `app/routes/app.menu-builder.tsx`

Uses `MenuIcon`/`SegmentedControl` from Task 6 (import from `../shared/…`). Large props surface expected (settings, icon-picker openers, layout state) — compiler enumerates.

- [ ] **Step 1:** Recipe. Verify. Commit — `refactor(menu-builder): extract SettingsPanel`.

---

### Task 8: Extract resource picker panels

**Files:**
- Create: `app/menu-builder/components/pickers/ProductPickerPanel.tsx` (orig 1494–1576)
- Create: `app/menu-builder/components/pickers/CollectionPickerPanel.tsx` (orig 1577–1663)
- Create: `app/menu-builder/components/pickers/ImagePickerPanel.tsx` (orig 1664–1788)
- Create: `app/menu-builder/components/pickers/SubmenuImagePickerPanel.tsx` (orig 1422–1493)
- Modify: `app/routes/app.menu-builder.tsx`

Props: picker open/selection state, `toggleProductSelection`/`applyProductSelection`/`close…` callbacks, loader resources (products/collections lists), upload handlers, scroll refs.

- [ ] One recipe application per panel, **verify + commit after each** (4 commits).

---

### Task 9: Extract icon picker panels

**Files:**
- Create: `app/menu-builder/components/pickers/IconLibraryPanel.tsx` (orig 4169–4249)
- Create: `app/menu-builder/components/pickers/IconUploadPanel.tsx` (orig 4250–4287)
- Modify: `app/routes/app.menu-builder.tsx`

Props: `iconPicker` state (`IconPickerState`), `closeIconPicker`, `handleIconUploadFile`, `resolveCustomIconPreview`, scroll ref, DropZone state.

- [ ] Recipe per panel, verify + commit after each (2 commits).

---

### Task 10: Extract link picker

**Files:**
- Create: `app/menu-builder/components/pickers/LinkPickerContent.tsx` (orig 3972–4108, `renderLinkPickerContent`)
- Modify: `app/routes/app.menu-builder.tsx`

Note: original signature is `renderLinkPickerContent(onSelect: (url: string, label: string) => void)` — `onSelect` becomes a prop. Props also include loader-provided pages/collections/products lists and search state.

- [ ] Recipe, verify, commit — `refactor(menu-builder): extract LinkPickerContent`.

---

### Task 11: Extract template preview cards + panels + pickers

**Files:**
- Create: `app/menu-builder/components/templates/TemplatePreviewCard.tsx` (orig 1853–1910)
- Create: `app/menu-builder/components/templates/BlockTemplatePreviewCard.tsx` (orig 1911–1986)
- Create: `app/menu-builder/components/templates/SubmenuTemplatePreviewPanel.tsx` (orig 1987–2621, ~635 lines)
- Create: `app/menu-builder/components/templates/BlockTemplatePreviewPanel.tsx` (orig 2622–3803, ~1,180 lines)
- Create: `app/menu-builder/components/templates/BlockTemplatePicker.tsx` (orig 3804–3860)
- Create: `app/menu-builder/components/templates/SubmenuTemplatePicker.tsx` (orig 3861–3917)
- Modify: `app/routes/app.menu-builder.tsx`

Order matters: cards first (panels/pickers render them), then preview panels, then pickers. Props include hover-scheduling callbacks (`scheduleSubmenuTemplateHover`, `clearSubmenuTemplateHoverTimeout`, etc.) and `handleApplySubmenuTemplate`/`handleApplyBlockTemplate`.

- [ ] Recipe per file in the order listed, **verify + commit after each** (6 commits).

---

### Task 12: Extract preview content blocks (leaf renderers)

**Files:**
- Create: `app/menu-builder/components/preview/blocks/SpaceBlock.tsx` (orig 13784–13816)
- Create: `app/menu-builder/components/preview/blocks/ImageBlock.tsx` (orig 9791–10070)
- Create: `app/menu-builder/components/preview/blocks/ContactBlock.tsx` (orig 10071–10296)
- Create: `app/menu-builder/components/preview/blocks/HtmlBlock.tsx` (orig 10297–10427)
- Create: `app/menu-builder/components/preview/blocks/ProductBlock.tsx` (orig 10428–10982)
- Create: `app/menu-builder/components/preview/blocks/CollectionBlock.tsx` (orig 10983–11156)
- Create: `app/menu-builder/components/preview/blocks/BlogBlock.tsx` (orig 11157–11364)
- Modify: `app/routes/app.menu-builder.tsx`

These closures already take the `group`/`item` as an argument — it becomes the primary prop. Shared props: `previewColors`, typography style objects, `builderSettings`, resource maps from loader (`productResources` etc.), `contactFetcher` (ContactBlock), selection handlers.

- [ ] Recipe per block, **verify + commit after each** (7 commits).

---

### Task 13: Extract link-list block + toolbar

**Files:**
- Create: `app/menu-builder/components/preview/blocks/LinkListBlock.tsx` (orig 9205–9753, `renderLinkListBlock` + orig 9131–9204 `renderLinkListToolbarButtons` in the same file — toolbar is only used by/with the block)
- Create: `app/menu-builder/components/preview/FloatingLinkListToolbar.tsx` (orig 9754–9790)
- Modify: `app/routes/app.menu-builder.tsx`

- [ ] Recipe on `renderLinkListToolbarButtons` + `renderLinkListBlock` together (one file, two exports or one component + helper). Verify. Commit.
- [ ] Recipe on `renderFloatingLinkListToolbar` → `FloatingLinkListToolbar`. Verify. Commit.

---

### Task 14: Extract masonry + mega panel

**Files:**
- Create: `app/menu-builder/components/preview/ElementGroupMasonry.tsx` (orig 11365–11445)
- Create: `app/menu-builder/components/preview/MegaPanel.tsx` (orig 13817–14059, `renderMegaPanel(inline: boolean)` → prop `inline: boolean`)
- Modify: `app/routes/app.menu-builder.tsx`

MegaPanel composes the block components from Tasks 12–13 — it will import them directly and receive their shared props to forward. Extract Masonry first.

- [ ] Recipe on `renderElementGroupMasonry`. Verify. Commit.
- [ ] Recipe on `renderMegaPanel`. Verify. Commit.

---

### Task 15: Extract mobile preview panels

**Files:**
- Create: `app/menu-builder/components/preview/MobileBlockGroup.tsx` (orig 11695–11759)
- Create: `app/menu-builder/components/preview/MobileDropdownPanel.tsx` (orig 11760–12441, ~680 lines)
- Create: `app/menu-builder/components/preview/MobileHorizontalDropdownPanel.tsx` (orig 12442–13175, ~730 lines)
- Modify: `app/routes/app.menu-builder.tsx`

Order: MobileBlockGroup first (the panels render it).

- [ ] Recipe per file in order, verify + commit after each (3 commits).

---

### Task 16: Extract main-row preview pieces

**Files:**
- Create: `app/menu-builder/components/preview/MenuItemButton.tsx` (orig 13382–13630)
- Create: `app/menu-builder/components/preview/AccountLinkButton.tsx` (orig 13631–13705)
- Create: `app/menu-builder/components/preview/SearchControl.tsx` (orig 13706–13783; original arg `marginLeft?: string | number` becomes a prop)
- Modify: `app/routes/app.menu-builder.tsx`

Note: `MenuItemButton` uses `registerPreviewMenuItem` ref-registrar and hover handlers — pass as props, verbatim types.

- [ ] Recipe per file, verify + commit after each (3 commits).

---

### Task 17: Extract sidebar menu tree + menu panel

**Files:**
- Create: `app/menu-builder/components/panels/MenuTree.tsx` (orig 5380–5656: `renderAddBetween` + `renderMenuTree` — same file, tree recursion stays intact)
- Create: `app/menu-builder/components/panels/MenuPanel.tsx` (orig 5657–7810, ~2,150 lines, `renderMenuPanel`)
- Modify: `app/routes/app.menu-builder.tsx`

`renderMenuTree` is recursive and calls `renderAddBetween` — keep both in `MenuTree.tsx` (`MenuTree` component calls itself recursively via `<MenuTree item={child} depth={depth+1} parentItem={item} …/>`). It has the largest props surface (drag-drop state + handlers, selection, expand, edit-draft, icon rendering, badges). Extract `MenuTree` first; `MenuPanel` renders it.

- [ ] Recipe on `renderAddBetween` + `renderMenuTree` → `MenuTree.tsx`. Verify. Commit.
- [ ] Recipe on `renderMenuPanel` → `MenuPanel.tsx`. Verify. Commit.

---

### Task 18: Extract remaining pure in-component helpers to utils

**Files:**
- Modify: `app/menu-builder/utils.ts`
- Modify: `app/routes/app.menu-builder.tsx`

Candidates (verify each is state-free — takes all inputs as arguments — before moving; skip any that aren't): `findParentId` (orig 5337), `reorderItems` (5348), `moveItem` (5358), `extractBlockItemsFromTemplate` (4895), `buildTabsBlockItems` (4909), `buildTabsTemplateItems` (4933), `getBlockSpan` (4541), `getSubmenuJustify` (11633), `resolveTypographyStyle` (11563 — takes settings via closure; if so, add a settings parameter is a behavior-preserving mechanical change ONLY if all call sites pass the same `builderSettings`; otherwise leave in place).

- [ ] Move each verified-pure helper, update call sites, verify + commit once — `refactor(menu-builder): move pure tree/template helpers to utils`.

---

### Task 19: Slim the route file & final structure check

**Files:**
- Modify: `app/routes/app.menu-builder.tsx`

- [ ] **Step 1:** Remove all now-unused imports (compiler + eslint report them: `npm run lint -- app/routes/app.menu-builder.tsx`).
- [ ] **Step 2:** Measure: `wc -l app/routes/app.menu-builder.tsx` — target: the file now contains only imports, re-exports, `MenuBuilder` state/hooks/handlers, and the top-level JSX composition. Expect roughly 3,000–5,000 lines (state+handlers are legitimately large; further handler extraction into hooks is a FUTURE task, not this plan).
- [ ] **Step 3:** Full verify: TSC protocol (empty diff vs baseline) + `npm run build`.
- [ ] **Step 4:** Commit — `refactor(menu-builder): final route-file cleanup`.

---

### Task 20: Manual smoke test (user-assisted)

No automated tests exist for the builder UI; the compiler + build gates cover structure, not interaction. Before merging:

- [ ] **Step 1:** Run `npm run dev` (Shopify CLI tunnel; user logs in if prompted).
- [ ] **Step 2:** In the embedded app, walk this checklist in the Menu Builder:
  - Menü açılıyor, kayıtlı öğeler sidebar'da görünüyor
  - Sürükle-bırak ile öğe taşıma çalışıyor
  - Öğe ekle / çoğalt / sil çalışıyor
  - Panel sekmeleri: Menu / Settings / Typography / Colors / Code hepsi açılıyor
  - Renk ve font picker'ları açılıp değer değiştiriyor
  - Şablon önizleme (submenu + block template hover preview) çalışıyor
  - Ürün / koleksiyon / görsel / ikon picker'ları açılıyor ve seçim uyguluyor
  - Desktop ↔ Mobile önizleme geçişi çalışıyor; mobile drawer açılıyor
  - Save / Publish çalışıyor, sayfa yenileyince veri duruyor
  - Dirty-state uyarısı (kaydetmeden çıkma koruması) çalışıyor
- [ ] **Step 3:** Herhangi bir kırılmada: `git log --oneline` ile hangi extraction'dan sonra kırıldığını bul, o commit'i incele (her task ayrı commit = ikili arama kolay).

---

## Self-Review Notes

- **Coverage:** All 40 render closures in the original file are assigned to Tasks 4–17; server code Task 2; module helpers Task 3; pure in-component helpers Task 18; cleanup Task 19; behavioral verification Task 20.
- **Dependency order verified:** shared leaves (Task 6) before their consumers (7, 12, 16, 17); cards before template panels (11); MobileBlockGroup before mobile panels (15); MenuTree before MenuPanel (17); blocks (12–13) before MegaPanel (14).
- **No TDD cycle:** this is a move-only refactor with no existing test suite; the test cycle is replaced by the TSC-differential + build gate per task, plus Task 20's manual behavioral checklist. Writing characterization tests for a 17k-line Polaris UI first would be a larger project than the refactor itself and was explicitly descoped.
