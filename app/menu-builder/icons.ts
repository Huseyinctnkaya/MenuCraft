import type { LucideIcon } from "lucide-react";
import * as LucideIcons from "lucide-react";

const EXCLUDED_LUCIDE_EXPORTS = new Set(["Icon", "LucideIcon"]);

const formatLucideLabel = (name: string) =>
  name.replace(/([a-z0-9])([A-Z])/g, "$1 $2").replace(/([A-Z])([A-Z][a-z])/g, "$1 $2");

const formatLucideId = (name: string) =>
  name.replace(/([a-z0-9])([A-Z])/g, "$1-$2").replace(/([A-Z])([A-Z][a-z])/g, "$1-$2").toLowerCase();

const rawLucideIcons = Object.entries(LucideIcons)
  .filter(([name, IconComponent]) => {
    if (EXCLUDED_LUCIDE_EXPORTS.has(name)) return false;
    if (!/^[A-Z]/.test(name)) return false;
    return typeof IconComponent === "function" || (typeof IconComponent === "object" && IconComponent);
  })
  .map(([name, IconComponent]) => ({
    id: formatLucideId(name),
    label: formatLucideLabel(name),
    Icon: IconComponent as LucideIcon,
  }));

const uniqueLucideIcons = new Map<string, { id: string; label: string; Icon: LucideIcon }>();
for (const icon of rawLucideIcons) {
  if (!uniqueLucideIcons.has(icon.id)) {
    uniqueLucideIcons.set(icon.id, icon);
  }
}

export const ICON_LIBRARY = Array.from(uniqueLucideIcons.values()).sort((a, b) =>
  a.label.localeCompare(b.label)
);

export const ICON_LIBRARY_BY_ID = Object.fromEntries(ICON_LIBRARY.map((icon) => [icon.id, icon]));
export const ICON_PREFIX = "lucide:";
