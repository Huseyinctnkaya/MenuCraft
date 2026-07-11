import type { CSSProperties } from "react";
import { Icon } from "@shopify/polaris";
import {
  DeleteIcon,
  DuplicateIcon,
  EditIcon,
} from "@shopify/polaris-icons";

import type { MenuItem, ProductSummary } from "../../../types";
import { updateItemById } from "../../../utils";
import type { PreviewBlockDeps } from "./deps";
export function renderHtmlBlockImpl(
  deps: PreviewBlockDeps,
    group: MenuItem,
    options: { flex?: string; wrapperStyle?: CSSProperties } = {}
) {
  const {
    menuItems,
    setMenuItems,
    draggedItemId,
    draggedParentId,
    setDraggedItemId,
    setDraggedParentId,
    lastDragOverIdRef,
    findParentId,
    moveItem,
    selectedItemId,
    handleSelectItem,
    handleDuplicateItem,
    openDeleteItemDialog,
    previewColors,
    subheadingTypography,
    useImageSpaceLayout,
    registerPreviewRow,
    themeSettings,
    isMobilePreview,
    descriptionTypography,
    builderSettings,
    useBlockFlexLayout,
  } = deps;
    const isGroupSelected = selectedItemId === group.id;
    const htmlWidth = Math.max(1, Math.min(12, group.imageWidth ?? 3));
    const htmlFlexBasis = `${Math.round((htmlWidth / 12) * 100)}%`;
    const htmlContent = group.htmlContent ?? "";
    const htmlHasIframe = /<iframe /i.test(htmlContent);
    const allowHtmlDrag = !htmlHasIframe;
    const htmlTitle = (group.label ?? "").trim();
    const showHtmlTitle = Boolean(htmlTitle) && htmlTitle.toLowerCase() !== "custom html";
    const htmlMinHeight =
      useImageSpaceLayout && group.multiLayout !== "multi-element-group-masonry" ? 240 : undefined;

    return (
      <div
        key={group.id}
        className="group relative border-1 border-transparent transition-colors hover:border-dotted hover:border-blue-500"
        ref={registerPreviewRow(group.id)}
        draggable={allowHtmlDrag}
        onDragStart={(event) => {
          if (!allowHtmlDrag) return;
          event.dataTransfer.effectAllowed = "move";
          event.dataTransfer.setData("text/plain", group.id);
          setDraggedItemId(group.id);
          const parentId = findParentId(menuItems, group.id);
          setDraggedParentId(parentId ?? null);
          lastDragOverIdRef.current = null;
        }}
        onDragOver={(event) => {
          if (!draggedItemId) return;
          const targetParentId = findParentId(menuItems, group.id);
          if (draggedParentId !== targetParentId) return;
          if (draggedItemId === group.id) return;
          event.preventDefault();
          if (lastDragOverIdRef.current === group.id) return;
          lastDragOverIdRef.current = group.id;
          setMenuItems((items) => moveItem(items, draggedItemId, group.id));
        }}
        onDrop={(event) => {
          event.preventDefault();
          if (!draggedItemId) return;
          const targetParentId = findParentId(menuItems, group.id);
          if (draggedParentId !== targetParentId) return;
          setMenuItems((items) => moveItem(items, draggedItemId, group.id));
          setDraggedItemId(null);
          setDraggedParentId(null);
          lastDragOverIdRef.current = null;
        }}
        onDragEnd={() => {
          if (!allowHtmlDrag) return;
          setDraggedItemId(null);
          setDraggedParentId(null);
          lastDragOverIdRef.current = null;
        }}
        style={{
          willChange: "transform",
          minHeight: htmlMinHeight,
          flex: options.flex ?? (useImageSpaceLayout ? `0 0 ${htmlFlexBasis}` : undefined),
          order: useImageSpaceLayout ? 0 : undefined,
          border: isGroupSelected ? `1px dashed ${themeSettings.menuActive}` : undefined,
          padding: "6px",
          borderRadius: 0,
          ...options.wrapperStyle,
        }}
      >
        <div className="pointer-events-none absolute right-4 top-3 z-10 flex items-center gap-1 rounded-full bg-gray-900 px-2 py-1 shadow-md opacity-0 transition-opacity group-hover:pointer-events-auto group-hover:opacity-100">
          <button
            type="button"
            onClick={() => handleSelectItem(group.id, true)}
            aria-label="Edit item"
            className="flex h-6 w-6 items-center justify-center rounded-md text-white hover:bg-gray-800"
          >
            <Icon source={EditIcon} />
          </button>
          <button
            type="button"
            onClick={() => handleDuplicateItem(group.id)}
            aria-label="Duplicate item"
            className="flex h-6 w-6 items-center justify-center rounded-md text-white hover:bg-gray-800"
          >
            <Icon source={DuplicateIcon} />
          </button>
          <button
            type="button"
            onClick={() => openDeleteItemDialog(group.id)}
            aria-label="Delete item"
            className="flex h-6 w-6 items-center justify-center rounded-md text-red-400 hover:bg-gray-800"
          >
            <Icon source={DeleteIcon} />
          </button>
        </div>
        <div
          style={{
            border: "1px solid #e5e7eb",
            background: "#ffffff",
            padding: "16px",
            display: "flex",
            flexDirection: "column",
            gap: 12,
          }}
        >
          {showHtmlTitle ? (
            <div
              style={{
                color: previewColors.submenuHeading,
                fontWeight: 600,
                ...subheadingTypography,
                lineHeight: 1.2,
              }}
            >
              {htmlTitle}
            </div>
          ) : null}
          <div
            style={{
              color: previewColors.submenuText,
              ...descriptionTypography,
              lineHeight: 1.4,
            }}
            // Intentionally raw to preview embedded content.
            dangerouslySetInnerHTML={{
              __html: htmlContent || "Add your custom HTML here.",
            }}
          />
        </div>
      </div>
    );
}
