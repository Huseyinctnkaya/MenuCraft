import { createPortal } from "react-dom";

import { findItemPath } from "../../utils";
import { renderLinkListToolbarButtonsImpl } from "./blocks/LinkListBlock";
import type { PreviewBlockDeps } from "./blocks/deps";

export function renderFloatingLinkListToolbarImpl(
  deps: PreviewBlockDeps,
  floatingLinkListToolbarPosition: { left: number; top: number } | null
) {
  const {
    menuItems,
    floatingLinkListToolbarId,
    floatingLinkListToolbarHoverRef,
    hideFloatingLinkListToolbarTimeoutRef,
    setFloatingLinkListToolbarId,
  } = deps;
  const renderLinkListToolbarButtons = (g: Parameters<typeof renderLinkListToolbarButtonsImpl>[1]) =>
    renderLinkListToolbarButtonsImpl(deps, g);
  if (!floatingLinkListToolbarId || !floatingLinkListToolbarPosition) return null;
  const group = findItemPath(menuItems, floatingLinkListToolbarId)?.slice(-1)[0];
  if (!group) return null;
  return createPortal(
    <div
      className="pointer-events-auto fixed z-50 -translate-x-1/2"
      style={{
        left: floatingLinkListToolbarPosition.left,
        top: floatingLinkListToolbarPosition.top,
      }}
      onMouseEnter={() => {
        floatingLinkListToolbarHoverRef.current = true;
        if (hideFloatingLinkListToolbarTimeoutRef.current) {
          clearTimeout(hideFloatingLinkListToolbarTimeoutRef.current);
        }
      }}
      onMouseLeave={() => {
        floatingLinkListToolbarHoverRef.current = false;
        if (hideFloatingLinkListToolbarTimeoutRef.current) {
          clearTimeout(hideFloatingLinkListToolbarTimeoutRef.current);
        }
        hideFloatingLinkListToolbarTimeoutRef.current = setTimeout(() => {
          if (!floatingLinkListToolbarHoverRef.current) {
            setFloatingLinkListToolbarId(null);
          }
        }, 100);
      }}
    >
      <div className="flex items-center gap-1 rounded-full bg-gray-900 px-2 py-1 shadow-md">
        {renderLinkListToolbarButtons(group)}
      </div>
    </div>,
    document.body
  );
}
