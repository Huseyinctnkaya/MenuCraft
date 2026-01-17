import type { HsbColor, MenuItem, RgbColor } from "./types";

export const buildId = () => Math.random().toString(36).slice(2, 9);

export const clampNumber = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

export const hexToRgb = (value: string): RgbColor => {
  const cleaned = value.replace("#", "").trim();
  const normalized =
    cleaned.length === 3
      ? cleaned
          .split("")
          .map((char) => char + char)
          .join("")
      : cleaned;
  if (normalized.length !== 6) {
    return { red: 0, green: 0, blue: 0 };
  }
  const intValue = Number.parseInt(normalized, 16);
  if (Number.isNaN(intValue)) {
    return { red: 0, green: 0, blue: 0 };
  }
  return {
    red: (intValue >> 16) & 255,
    green: (intValue >> 8) & 255,
    blue: intValue & 255,
  };
};

export const rgbToHex = ({ red, green, blue }: RgbColor) => {
  const toHex = (channel: number) =>
    clampNumber(Math.round(channel), 0, 255).toString(16).padStart(2, "0").toUpperCase();
  return `#${toHex(red)}${toHex(green)}${toHex(blue)}`;
};

export const rgbToHsb = ({ red, green, blue }: RgbColor): HsbColor => {
  const r = red / 255;
  const g = green / 255;
  const b = blue / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;

  let hue = 0;
  if (delta !== 0) {
    if (max === r) {
      hue = ((g - b) / delta) % 6;
    } else if (max === g) {
      hue = (b - r) / delta + 2;
    } else {
      hue = (r - g) / delta + 4;
    }
    hue *= 60;
    if (hue < 0) hue += 360;
  }

  const saturation = max === 0 ? 0 : delta / max;
  const brightness = max;

  return {
    hue,
    saturation,
    brightness,
    alpha: 1,
  };
};

export const hsbToRgb = ({ hue, saturation, brightness }: HsbColor): RgbColor => {
  const h = clampNumber(hue, 0, 360);
  const normalizedS =
    saturation > 1 ? clampNumber(saturation, 0, 100) / 100 : clampNumber(saturation, 0, 1);
  const normalizedV =
    brightness > 1 ? clampNumber(brightness, 0, 100) / 100 : clampNumber(brightness, 0, 1);
  const s = normalizedS;
  const v = normalizedV;
  const c = v * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = v - c;
  let r = 0;
  let g = 0;
  let b = 0;

  if (h >= 0 && h < 60) {
    r = c;
    g = x;
  } else if (h >= 60 && h < 120) {
    r = x;
    g = c;
  } else if (h >= 120 && h < 180) {
    g = c;
    b = x;
  } else if (h >= 180 && h < 240) {
    g = x;
    b = c;
  } else if (h >= 240 && h < 300) {
    r = x;
    b = c;
  } else {
    r = c;
    b = x;
  }

  return {
    red: Math.round((r + m) * 255),
    green: Math.round((g + m) * 255),
    blue: Math.round((b + m) * 255),
  };
};

export const hexToHsb = (value: string) => rgbToHsb(hexToRgb(value));

export const hsbToHex = (color: HsbColor) => rgbToHex(hsbToRgb(color));

export const normalizeHexInput = (value: string) => {
  const cleaned = value.replace(/[^0-9a-fA-F]/g, "").slice(0, 6);
  return `#${cleaned.toUpperCase()}`;
};

export const findItemPath = (
  items: MenuItem[],
  id: string | null,
  path: MenuItem[] = []
): MenuItem[] | null => {
  if (!id) return null;
  for (const item of items) {
    const nextPath = [...path, item];
    if (item.id === id) return nextPath;
    if (item.children?.length) {
      const found = findItemPath(item.children, id, nextPath);
      if (found) return found;
    }
  }
  return null;
};

export const updateItemById = (
  items: MenuItem[],
  id: string,
  updater: (item: MenuItem) => MenuItem
): MenuItem[] =>
  items.map((item) => {
    if (item.id === id) return updater(item);
    if (item.children?.length) {
      const nextChildren = updateItemById(item.children, id, updater);
      if (nextChildren !== item.children) {
        return { ...item, children: nextChildren };
      }
    }
    return item;
  });

export const addChildById = (items: MenuItem[], parentId: string, newItem: MenuItem): MenuItem[] =>
  items.map((item) => {
    if (item.id === parentId) {
      const nextChildren = item.children ? [...item.children, newItem] : [newItem];
      return { ...item, expanded: true, children: nextChildren };
    }
    if (item.children?.length) {
      return { ...item, children: addChildById(item.children, parentId, newItem) };
    }
    return item;
  });

const buildCopyLabel = (label: string) =>
  label.trim().endsWith("Copy") ? `${label} 2` : `${label} Copy`;

const cloneMenuItem = (item: MenuItem): MenuItem => ({
  ...item,
  id: buildId(),
  label: buildCopyLabel(item.label),
  children: item.children?.map(cloneMenuItem),
});

export const duplicateItemById = (
  items: MenuItem[],
  id: string
): { items: MenuItem[]; duplicatedId: string | null } => {
  const index = items.findIndex((entry) => entry.id === id);
  if (index >= 0) {
    const copy = cloneMenuItem(items[index]);
    const next = [...items];
    next.splice(index + 1, 0, copy);
    return { items: next, duplicatedId: copy.id };
  }

  let duplicatedId: string | null = null;
  const next = items.map((item) => {
    if (!item.children?.length) return item;
    const result = duplicateItemById(item.children, id);
    if (result.items !== item.children) {
      duplicatedId = result.duplicatedId;
      return { ...item, children: result.items };
    }
    return item;
  });

  return duplicatedId ? { items: next, duplicatedId } : { items, duplicatedId: null };
};

export const removeItemById = (items: MenuItem[], id: string): MenuItem[] => {
  let changed = false;
  const next = items.reduce<MenuItem[]>((acc, item) => {
    if (item.id === id) {
      changed = true;
      return acc;
    }
    let nextItem = item;
    if (item.children?.length) {
      const nextChildren = removeItemById(item.children, id);
      if (nextChildren !== item.children) {
        changed = true;
        nextItem = { ...item, children: nextChildren };
      }
    }
    acc.push(nextItem);
    return acc;
  }, []);

  return changed ? next : items;
};

export const normalizeMultiBlocks = (items: MenuItem[]): MenuItem[] => {
  let changed = false;
  const next = items.flatMap((item) => {
    if (item.blockTemplate === "multi") {
      changed = true;
      return normalizeMultiBlocks(item.children ?? []);
    }
    let nextItem = item;
    if (item.children?.length) {
      const nextChildren = normalizeMultiBlocks(item.children);
      if (nextChildren !== item.children) {
        changed = true;
        nextItem = { ...item, children: nextChildren };
      }
    }
    return [nextItem];
  });
  return changed ? next : items;
};
