# Menu Tree Shopify-Feel Rework Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the menu builder's item tree (`app/menu-builder/components/panels/MenuTree.tsx`) look and animate like a genuine Shopify Polaris navigation/section list instead of a hand-tuned Tailwind approximation.

**Architecture:** Single-file styling/interaction pass. No new components, no data/logic changes. Swap the hand-rolled expand/collapse `<div>` for Polaris's `Collapsible`, replace hardcoded Tailwind gray/spacing utility classes with Polaris CSS custom properties (`var(--p-color-*)`, `var(--p-space-*)`, `var(--p-motion-*)`, `var(--p-shadow-*)`), rotate a single chevron icon instead of swapping two icon components, and add a lightweight "lifted" visual to the row currently being dragged.

**Tech Stack:** React (function-returning-JSX pattern already used in this file, not converted to a stateful component), `@shopify/polaris` v12 (`Collapsible`, `Icon`, `Box`, `BlockStack`), Tailwind v4 (arbitrary-value syntax `bg-[var(--...)]` for pseudo-class states Polaris tokens can't express via inline `style`).

## Global Constraints

- Design spec: `docs/superpowers/specs/2026-08-05-menu-tree-shopify-feel-design.md` — every task here implements a section of it.
- Full sibling-reflow drag-and-drop reorder animation is explicitly OUT of scope (confirmed with user during brainstorming). Only a "lifted" visual on the dragged row itself.
- No test framework applies to this change (pure UI/animation pass on JSX/CSS, no business logic). Verification is `npx tsc --noEmit` (must stay clean — this file already has pre-existing, unrelated Polaris `Button`/`Box` prop-type errors elsewhere in the codebase; only check no *new* errors appear in `MenuTree.tsx` itself) plus a manual visual check via `npm run dev` (Shopify CLI dev server).
- Every color/spacing value being replaced must come from the confirmed-real token list below — do not invent token names.

**Confirmed-real Polaris tokens used in this plan** (verified against `node_modules/@shopify/polaris/build/esm/styles.css`):
- `--p-color-bg-surface-hover`, `--p-color-bg-surface-selected`
- `--p-color-text`, `--p-color-text-secondary`
- `--p-color-border-secondary`
- `--p-motion-duration-150` (150ms), `--p-motion-ease-in-out` (`cubic-bezier(0.42, 0, 0.58, 1)`)
- `--p-shadow-300`

---

### Task 1: Swap the hand-rolled expand/collapse for Polaris's `Collapsible`, rotate the chevron

**Files:**
- Modify: `app/menu-builder/components/panels/MenuTree.tsx:1-13` (imports), `:198-209` (toggle button), `:258-266` (collapse wrapper)

**Interfaces:**
- Consumes: `isExpanded` (existing local const, `item.expanded ?? item.role !== "item"`), `handleToggleExpand(id: string)` (existing prop, unchanged).
- Produces: nothing new consumed by other tasks — this task is self-contained.

- [ ] **Step 1: Add the `Collapsible` import and drop the now-unused `ChevronDownIcon` import**

`ChevronDownIcon` is currently only used at line 206 to swap with `ChevronRightIcon` based on expand state; Task 1 Step 3 replaces that swap with a single rotating `ChevronRightIcon`, so `ChevronDownIcon` becomes unused (confirmed via `grep -n "ChevronDownIcon" app/menu-builder/components/panels/MenuTree.tsx` — only one hit, line 206, before this change).

In `app/menu-builder/components/panels/MenuTree.tsx`, change:

```tsx
import { BlockStack, Box, Icon } from "@shopify/polaris";
import {
  ChevronDownIcon,
  ChevronRightIcon,
  DeleteIcon,
  DragHandleIcon,
  DuplicateIcon,
  EditIcon,
  FormsIcon,
  TextFontListIcon,
  TextIcon,
} from "@shopify/polaris-icons";
```

to:

```tsx
import { BlockStack, Box, Collapsible, Icon } from "@shopify/polaris";
import {
  ChevronRightIcon,
  DeleteIcon,
  DragHandleIcon,
  DuplicateIcon,
  EditIcon,
  FormsIcon,
  TextFontListIcon,
  TextIcon,
} from "@shopify/polaris-icons";
```

- [ ] **Step 2: Verify the import change compiles**

Run: `npx tsc --noEmit -p . 2>&1 | grep "MenuTree.tsx"`
Expected: no new errors mentioning `ChevronDownIcon` or `Collapsible` (any output should be identical to the pre-existing `Button`/`Box` prop-type noise already present elsewhere in the file before this change — capture that baseline first with `git stash` + the same command if unsure).

- [ ] **Step 3: Rotate a single chevron instead of swapping two icon components**

In the same file, change the toggle button block (currently around line 198):

```tsx
{showToggle ? (
  <span className="relative flex h-5 w-5 items-center justify-center text-gray-500">
    <button
      type="button"
      onClick={() => handleToggleExpand(item.id)}
      aria-label={isExpanded ? "Collapse" : "Expand"}
      className="flex h-5 w-5 items-center justify-center text-gray-500 hover:text-gray-700"
    >
      <Icon source={isExpanded ? ChevronDownIcon : ChevronRightIcon} tone="subdued" />
    </button>
  </span>
) : null}
```

to:

```tsx
{showToggle ? (
  <span className="relative flex h-5 w-5 items-center justify-center text-[var(--p-color-text-secondary)]">
    <button
      type="button"
      onClick={() => handleToggleExpand(item.id)}
      aria-label={isExpanded ? "Collapse" : "Expand"}
      aria-expanded={isExpanded}
      aria-controls={`menu-tree-panel-${item.id}`}
      className="flex h-5 w-5 items-center justify-center text-[var(--p-color-text-secondary)] hover:text-[var(--p-color-text)]"
      style={{
        transform: isExpanded ? "rotate(90deg)" : "rotate(0deg)",
        transition: "transform var(--p-motion-duration-150) var(--p-motion-ease-in-out)",
      }}
    >
      <Icon source={ChevronRightIcon} tone="subdued" />
    </button>
  </span>
) : null}
```

(The `text-gray-500`/`hover:text-gray-700` → Polaris-token swap here is folded into this step since it's the same two lines being touched; the rest of the file's gray tokens are handled in Task 2.)

- [ ] **Step 4: Replace the manual max-height/opacity div with `Collapsible`**

In the same file, change the collapse wrapper (currently around line 258):

```tsx
{item.role !== "item" ? (
  <div
    style={{
      maxHeight: isExpanded ? 9999 : 0,
      opacity: isExpanded ? 1 : 0,
      overflow: isExpanded ? "visible" : "hidden",
      transition: "max-height 140ms ease, opacity 140ms ease",
    }}
  >
```

to:

```tsx
{item.role !== "item" ? (
  <Collapsible id={`menu-tree-panel-${item.id}`} open={isExpanded}>
```

And its closing tag — change:

```tsx
              </div>
            ) : null}
          </div>
        </Box>
      </div>
    );
}
```

to:

```tsx
              </Collapsible>
            ) : null}
          </div>
        </Box>
      </div>
    );
}
```

(Only the specific `</div>` that closes the wrapper opened in this step changes to `</Collapsible>` — the file has several other closing `</div>` tags at similar indentation; use the unique surrounding context `) : null}\n          </div>\n        </Box>\n      </div>\n    );\n}` shown above to find the exact one, which is the last block in the file.)

- [ ] **Step 5: Manual verification**

Run: `npm run dev` (Shopify CLI dev server), open the menu builder, and for a menu item with nested children:
- Click the chevron to collapse/expand — confirm the icon rotates smoothly (no more instant icon swap) and the panel height animates smoothly (no jump).
- Confirm collapsed children are not just hidden but the panel takes zero space (open browser devtools, confirm no `max-height: 9999px` leftover in the DOM).

- [ ] **Step 6: Commit**

```bash
git add app/menu-builder/components/panels/MenuTree.tsx
git commit -m "feat(menu-builder): use Polaris Collapsible for menu tree expand/collapse"
```

---

### Task 2: Replace hardcoded Tailwind gray colors with Polaris design tokens

**Files:**
- Modify: `app/menu-builder/components/panels/MenuTree.tsx` (multiple lines, listed below)

**Interfaces:**
- Consumes: nothing new.
- Produces: nothing new consumed by other tasks.

This task is a mechanical, file-wide substitution of every remaining hardcoded `gray-*` Tailwind color utility for the equivalent Polaris CSS custom property, plus widening the row's vertical padding slightly and switching the nested-level indent line from dashed to solid (Shopify's own nested lists use solid separators). `ChevronDownIcon`/chevron colors were already handled in Task 1 Step 3 — this task covers everything else.

- [ ] **Step 1: Drag-handle icon color**

In `renderDragHandle()`, change:

```tsx
        className="absolute inset-0 flex items-center justify-center cursor-move text-gray-400 opacity-0 transition-opacity group-hover:opacity-100"
```

to:

```tsx
        className="absolute inset-0 flex items-center justify-center cursor-move text-[var(--p-color-text-secondary)] opacity-0 transition-opacity group-hover:opacity-100"
```

- [ ] **Step 2: Row container — padding and hover/selected background**

Change:

```tsx
              className={`group flex items-center gap-2 rounded-lg px-0 py-1 transition-colors ${isSelected ? "bg-gray-50" : "hover:bg-gray-50"
                }`}
```

to:

```tsx
              className={`group flex items-center gap-2 rounded-lg px-0 py-1.5 transition-colors ${isSelected ? "bg-[var(--p-color-bg-surface-selected)]" : "hover:bg-[var(--p-color-bg-surface-hover)]"
                }`}
```

- [ ] **Step 3: Icon/drag-handle wrapper and label text color**

Change:

```tsx
              <div className="flex min-w-0 flex-1 items-center gap-2 text-left text-sm text-gray-700">
                <span className="relative flex h-5 w-5 items-center justify-center text-gray-500">
                  <span className="pointer-events-none transition-opacity group-hover:opacity-0">
                    {resolvedIcon
                      ? renderMenuIcon(resolvedIcon, { size: 16, className: "text-gray-500" })
                      : <Icon source={itemIcon} tone="subdued" />}
                  </span>
```

to:

```tsx
              <div className="flex min-w-0 flex-1 items-center gap-2 text-left text-sm text-[var(--p-color-text)]">
                <span className="relative flex h-5 w-5 items-center justify-center text-[var(--p-color-text-secondary)]">
                  <span className="pointer-events-none transition-opacity group-hover:opacity-0">
                    {resolvedIcon
                      ? renderMenuIcon(resolvedIcon, { size: 16, className: "text-[var(--p-color-text-secondary)]" })
                      : <Icon source={itemIcon} tone="subdued" />}
                  </span>
```

- [ ] **Step 4: Edit/Duplicate/Delete action buttons — border and hover background**

Change (Edit button):

```tsx
                  className="flex h-7 w-7 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                >
                  <Icon source={EditIcon} tone="subdued" />
```

to:

```tsx
                  className="flex h-7 w-7 items-center justify-center rounded-lg border border-[var(--p-color-border-secondary)] bg-white text-[var(--p-color-text-secondary)] hover:bg-[var(--p-color-bg-surface-hover)] hover:text-[var(--p-color-text)]"
                >
                  <Icon source={EditIcon} tone="subdued" />
```

Change (Duplicate button — identical className pattern, second occurrence):

```tsx
                  className="flex h-7 w-7 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                >
                  <Icon source={DuplicateIcon} tone="subdued" />
```

to:

```tsx
                  className="flex h-7 w-7 items-center justify-center rounded-lg border border-[var(--p-color-border-secondary)] bg-white text-[var(--p-color-text-secondary)] hover:bg-[var(--p-color-bg-surface-hover)] hover:text-[var(--p-color-text)]"
                >
                  <Icon source={DuplicateIcon} tone="subdued" />
```

Change (Delete button — keeps its critical/red tone, only the neutral hover background changes):

```tsx
                  className="flex h-7 w-7 items-center justify-center rounded-lg border border-gray-200 bg-white text-red-600 hover:bg-gray-100 hover:text-red-700"
```

to:

```tsx
                  className="flex h-7 w-7 items-center justify-center rounded-lg border border-[var(--p-color-border-secondary)] bg-white text-red-600 hover:bg-[var(--p-color-bg-surface-hover)] hover:text-red-700"
```

- [ ] **Step 5: Indent line — dashed to solid, tokenized color**

Change:

```tsx
                  <div className="ml-0 border-l border-dashed border-gray-300/70">
```

to:

```tsx
                  <div className="ml-0 border-l border-[var(--p-color-border-secondary)]">
```

- [ ] **Step 6: "Add item"/"Add submenu"/"Add block" button hover background (both occurrences)**

Both occurrences share this exact className string. Change:

```tsx
                            className="mt-2 flex items-center gap-2 rounded-lg px-2 py-1 text-sm font-medium text-blue-600 hover:bg-gray-100 hover:text-blue-700"
```

to (both places it appears):

```tsx
                            className="mt-2 flex items-center gap-2 rounded-lg px-2 py-1 text-sm font-medium text-blue-600 hover:bg-[var(--p-color-bg-surface-hover)] hover:text-blue-700"
```

- [ ] **Step 7: Verify no leftover hardcoded gray utility classes**

Run: `grep -n "gray-[0-9]" app/menu-builder/components/panels/MenuTree.tsx`
Expected: no output (every `gray-*` utility in this file has been replaced).

- [ ] **Step 8: Typecheck**

Run: `npx tsc --noEmit -p . 2>&1 | grep "MenuTree.tsx"`
Expected: same pre-existing error set as Task 1 Step 2's baseline, no new ones.

- [ ] **Step 9: Manual verification**

Run: `npm run dev`, open the menu builder, and confirm:
- Hovering an unselected row shows the Polaris hover gray (should look identical to hovering a row in Shopify admin's own nav — a very light, barely-there gray, not the previous slightly different Tailwind `gray-50`).
- Selecting a row shows the Polaris selected background.
- The nested-level indent line is now a thin solid line, not dashed.

- [ ] **Step 10: Commit**

```bash
git add app/menu-builder/components/panels/MenuTree.tsx
git commit -m "style(menu-builder): replace hardcoded gray utilities with Polaris tokens in menu tree"
```

---

### Task 3: Add a "lifted" visual to the row being dragged

**Files:**
- Modify: `app/menu-builder/components/panels/MenuTree.tsx:172-176` (row container style)

**Interfaces:**
- Consumes: `draggedItemId` (existing prop from `MenuTreeDeps`, already destructured at the top of `renderMenuTreeImpl`).
- Produces: nothing new consumed by other tasks.

- [ ] **Step 1: Apply elevation/opacity while this row is the one being dragged**

Change:

```tsx
              ref={registerSidebarRow(item.id)}
              style={{ willChange: "transform" }}
```

to:

```tsx
              ref={registerSidebarRow(item.id)}
              style={{
                willChange: "transform",
                ...(draggedItemId === item.id
                  ? { opacity: 0.6, boxShadow: "var(--p-shadow-300)" }
                  : {}),
              }}
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit -p . 2>&1 | grep "MenuTree.tsx"`
Expected: same baseline as before, no new errors.

- [ ] **Step 3: Manual verification**

Run: `npm run dev`, open the menu builder, start dragging a row by its drag handle (hover the row to reveal it, then press and hold), and confirm:
- The row being dragged gets a subtle shadow and dims slightly while the mouse button is held down.
- Releasing the drag (or dropping on a target) removes the shadow/opacity immediately — no leftover inline style stuck on a row after drop.

- [ ] **Step 4: Commit**

```bash
git add app/menu-builder/components/panels/MenuTree.tsx
git commit -m "feat(menu-builder): add lifted visual feedback to the dragged menu tree row"
```

---

### Task 4: Full end-to-end manual pass

**Files:** none (verification-only task).

**Interfaces:**
- Consumes: the combined output of Tasks 1–3.
- Produces: nothing — this is the final sign-off task.

- [ ] **Step 1: Run the full typecheck one more time**

Run: `npx tsc --noEmit -p . 2>&1 | grep "MenuTree.tsx"`
Expected: identical to the pre-change baseline (no errors newly introduced across all three tasks combined).

- [ ] **Step 2: Full interaction walkthrough**

Run: `npm run dev`, open the menu builder with a menu that has at least 2 levels of nesting, and walk through:
- Expand/collapse a top-level item, then a nested item inside it — confirm both animate smoothly and independently.
- Select different rows — confirm the selected background matches Polaris's tone.
- Drag-reorder two sibling items — confirm the lifted-row feedback appears/disappears correctly and the reorder itself still works (drop still moves the item, per existing `moveItem` logic — this plan did not touch that logic).
- Compare side-by-side against Shopify admin's own theme editor section list (or another Polaris `Collapsible`-based list already in this app, e.g. the FAQ section in `app.support.tsx`) to confirm the expand/collapse motion feels the same.

- [ ] **Step 3: Final commit (only if Step 2 surfaced fixes)**

If manual verification in Step 2 required any tweaks, commit them:

```bash
git add app/menu-builder/components/panels/MenuTree.tsx
git commit -m "fix(menu-builder): polish menu tree Shopify-feel details from manual QA"
```

If no fixes were needed, skip this step — Tasks 1–3's commits already cover the full change.
