import type { PageSummary } from "./types";

/**
 * Template presets ship with placeholder content — items labelled "Menu item 1"
 * pointing at "" or "/". Shopify App Review flagged the result under 5.1.2:
 * applying a template produced a storefront menu whose items went nowhere.
 *
 * The storefront no longer renders URL-less items as dead links, but a preset
 * full of "Menu item 1 → /" is still a menu that does nothing useful. So when a
 * merchant applies a template, fill its placeholders with destinations that
 * actually exist in their shop.
 *
 * The builder loader already fetches collections and pages for the resource
 * pickers, so this needs no extra Admin API call.
 */

export type LinkDestination = { label: string; url: string };

type CollectionLike = { title: string; handle: string };

/**
 * Destinations that exist on every Shopify storefront. Used when a shop has no
 * collections or pages yet (a brand-new dev store), so a preset can never fall
 * back to placeholder URLs.
 */
const UNIVERSAL_DESTINATIONS: LinkDestination[] = [
  { label: "Shop all", url: "/collections/all" },
  { label: "Search", url: "/search" },
];

/**
 * Real destinations to draw on when filling a template, collections first
 * because a menu is usually built around them.
 */
export const buildLinkPool = (
  collections: CollectionLike[] = [],
  pages: PageSummary[] = []
): LinkDestination[] => {
  const pool: LinkDestination[] = [
    ...collections
      .filter((c) => c && c.handle && c.title)
      .map((c) => ({ label: c.title, url: `/collections/${c.handle}` })),
    ...pages
      .filter((p) => p && p.handle && p.title)
      .map((p) => ({ label: p.title, url: `/pages/${p.handle}` })),
  ];
  return pool.length > 0 ? pool : UNIVERSAL_DESTINATIONS;
};

/**
 * Labels the presets use for "put something real here". Matched exactly (after
 * trimming) so a merchant's own wording is never overwritten.
 */
const PLACEHOLDER_LABEL = /^(menu|submenu|dropdown) item \d+$/i;
const PLACEHOLDER_HEADING = /^heading$/i;

/** A URL is a placeholder when it goes nowhere useful: "", "#", or the homepage. */
const isPlaceholderUrl = (url: string | undefined) => {
  const trimmed = (url || "").trim();
  return trimmed === "" || trimmed === "#" || trimmed === "/";
};

/**
 * The shape hydration actually reads. Preset builders return object literals
 * whose inferred types are narrower than MenuItem, so this stays structural —
 * every other field is carried through untouched.
 */
type HydratableItem = {
  label?: string;
  url?: string;
  children?: unknown;
  blockTemplate?: unknown;
  isHeading?: boolean;
};

/**
 * Replace placeholder labels and URLs with real destinations from the shop.
 *
 * Only touches items that still carry preset placeholder text, so re-applying a
 * template over a menu a merchant has already edited leaves their work alone.
 * Blocks (product grids, images, contact forms) are structural and keep their
 * own labels; their content comes from the resource pickers.
 *
 * Generic over the item type: the returned tree has exactly the shape that went
 * in, so this can wrap any preset builder without widening its type.
 *
 * @param items menu items straight out of a preset builder
 * @param pool  destinations from buildLinkPool()
 */
export const hydratePresetItems = <T extends HydratableItem>(
  items: T[],
  pool: LinkDestination[]
): T[] => {
  if (!Array.isArray(items) || items.length === 0) return items;
  const destinations = pool && pool.length > 0 ? pool : UNIVERSAL_DESTINATIONS;

  // Walk the tree in render order so the labels a shopper reads top-to-bottom
  // follow the shop's own collection order rather than jumping around.
  let cursor = 0;
  const next = () => destinations[cursor++ % destinations.length];

  const walk = (list: HydratableItem[]): HydratableItem[] =>
    list.map((item) => {
      if (!item) return item;

      const childList = Array.isArray(item.children) ? (item.children as HydratableItem[]) : null;
      const hasChildren = Boolean(childList && childList.length > 0);
      const label = (item.label || "").trim();
      let hydrated = item;

      if (item.blockTemplate) {
        // Structural block: leave it alone, just recurse into its contents.
      } else if (PLACEHOLDER_HEADING.test(label)) {
        // A heading is inert text on the storefront, so it needs a real name
        // but no URL of its own.
        hydrated = { ...item, label: next().label };
      } else if (PLACEHOLDER_LABEL.test(label) && isPlaceholderUrl(item.url)) {
        const destination = next();
        hydrated = { ...item, label: destination.label, url: destination.url };
      } else if (isPlaceholderUrl(item.url) && !hasChildren && !item.isHeading) {
        // Custom label the merchant kept, but still no destination — give it one
        // rather than leaving a link that goes nowhere.
        hydrated = { ...item, url: next().url };
      }

      return hasChildren ? { ...hydrated, children: walk(childList as HydratableItem[]) } : hydrated;
    });

  return walk(items) as T[];
};
