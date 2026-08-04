# Menu Tree — Match Shopify Admin's Section/Block List Feel — Design

**Date:** 2026-08-05
**Status:** Approved

## Problem

The item-level theme rendering work is done. The remaining complaint is about the menu builder's own editor UI: the left-side item tree (`app/menu-builder/components/panels/MenuTree.tsx`) — expand/collapse, hover, selected state, spacing, drag handle — doesn't feel like Shopify admin's own navigation/section list components. It reads as a custom Tailwind approximation rather than genuine Polaris. The expand/collapse animation in particular (a hand-rolled `max-height`/`opacity` transition) is mechanical rather than the smooth, native feel Shopify's own theme editor and Polaris navigation lists have.

## Goal

Rework `MenuTree.tsx`'s visual and interaction language to match Shopify admin's own Polaris design system as closely as possible, using Polaris's actual components and design tokens rather than hand-tuned approximations — so it's authentically "Shopify," not "close to Shopify."

## Decision Summary

- **Approach:** adopt Polaris's own `Collapsible` component for expand/collapse (real Shopify height-animation and easing, not a hand-rolled `max-height` transition), and replace hardcoded Tailwind gray/spacing values with Polaris CSS custom properties (`var(--p-color-*)`, `var(--p-space-*)`) so colors and spacing track Polaris itself.
- The existing "deps + recursive render function" pattern (`renderMenuTreeImpl`) stays — this is not a rewrite into a stateful component, just a styling/animation pass on the same structure.
- **In scope:** row spacing/padding, hover state, selected state, indent-line style, drag-handle color, text colors, chevron rotation timing (hand-matched to `Collapsible`'s transition duration since Polaris doesn't animate the disclosure icon itself), and a lightweight "lifted" visual (shadow/opacity) on the row actively being dragged.
- **Explicitly out of scope (confirmed with user):** smooth FLIP-style reorder animation where sibling rows slide to make room during drag-and-drop. That requires measuring and animating every sibling's position delta and is a separate, larger effort. This pass only adds a subtle "being dragged" visual to the dragged row itself — siblings still reposition instantly on drop, as today.
- **Rejected:** hand-tuning Tailwind values to visually approximate Polaris (rejected by user — an approximation always drifts from the real thing and requires manual resync whenever Polaris's own design tokens change).

## Changes

### `app/menu-builder/components/panels/MenuTree.tsx`

1. **Expand/collapse** — replace the manual
   ```tsx
   <div style={{ maxHeight: isExpanded ? 9999 : 0, opacity: isExpanded ? 1 : 0, overflow: ..., transition: "max-height 140ms ease, opacity 140ms ease" }}>
   ```
   with Polaris's `Collapsible`:
   ```tsx
   <Collapsible open={isExpanded} id={`menu-tree-${item.id}`} transition={{ duration: "200ms", timingFunction: "ease-in-out" }}>
   ```
   `Collapsible` measures actual content height (no `9999` hack) and uses Shopify's real easing curve.

2. **Chevron rotation** — add a `transform: rotate(...)` CSS transition on the toggle icon wrapper, duration/easing matched to `Collapsible`'s `200ms ease-in-out` so the icon and panel move in the same rhythm (Polaris doesn't animate this itself; it's a small manual addition kept consistent with the rest of the motion).

3. **Row spacing** — adjust vertical padding on the row (`py-1` → closer to Polaris's own list-row padding, `py-1.5`) to match Polaris's density.

4. **Hover / selected background** — replace `hover:bg-gray-50` / `bg-gray-50` (selected) with `var(--p-color-bg-surface-hover)` / `var(--p-color-bg-surface-selected)`.

5. **Indent lines** — replace the dashed `border-l border-dashed border-gray-300/70` with a solid, low-contrast line using `var(--p-color-border-secondary)` (Shopify's nested lists use solid, not dashed, separators).

6. **Text/icon colors** — replace `text-gray-700` / `text-gray-500` with `var(--p-color-text)` / `var(--p-color-text-secondary)`; drag-handle and chevron icons keep Polaris's `subdued` icon tone (already used via `<Icon tone="subdued">`, no change needed there beyond consistency).

7. **Dragged-row feedback** — while `draggedItemId === item.id`, apply a subtle elevation (`box-shadow` + slightly reduced opacity) to the row being dragged, so there's tactile feedback even without the full sibling-reflow animation.

### Testing

Manual verification only (this is a pure UI/interaction pass, no data/logic change): open the menu builder, expand/collapse nested items at a few depths and confirm the animation feels smooth and matches the existing `Collapsible` usage already in the app (`app.support.tsx`, `app.documentation.tsx`, `app._index.tsx`) so the motion is consistent across the whole product, verify hover/selected colors read correctly, and drag an item to confirm the lifted-row feedback appears and disappears correctly with no leftover inline styles after drop.
