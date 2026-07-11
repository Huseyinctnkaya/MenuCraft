import { ICON_LIBRARY_BY_ID, ICON_PREFIX } from "../../icons";

export const renderMenuIcon = (
  icon?: string,
  options?: { size?: number; className?: string; color?: string }
) => {
  if (!icon) return null;
  const size = options?.size ?? 16;
  const className = options?.className ?? "";
  const color = options?.color;
  if (icon.startsWith("data:")) {
    return (
      <img
        src={icon}
        alt=""
        className={`object-contain ${className}`}
        style={{ width: size, height: size }}
      />
    );
  }
  if (icon.startsWith(ICON_PREFIX)) {
    const iconId = icon.slice(ICON_PREFIX.length);
    const option = ICON_LIBRARY_BY_ID[iconId];
    if (option) {
      return (
        <option.Icon
          size={size}
          strokeWidth={1.6}
          className={className}
          style={color ? { color } : undefined}
        />
      );
    }
  }
  return null;
};
