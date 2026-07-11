import type { CSSProperties } from "react";
import { Icon } from "@shopify/polaris";
import {
  CollectionIcon,
  DeleteIcon,
  DuplicateIcon,
  EditIcon,
} from "@shopify/polaris-icons";

import type { MenuItem, ProductSummary } from "../../../types";
import { updateItemById } from "../../../utils";
import type { PreviewBlockDeps } from "./deps";
export function renderCollectionBlockImpl(
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
    descriptionTypography,
    useImageSpaceLayout,
    collections,
    registerPreviewRow,
    themeSettings,
    isMobilePreview,
    builderSettings,
    useBlockFlexLayout,
  } = deps;
    const isGroupSelected = selectedItemId === group.id;
    const collectionWidth = Math.max(1, Math.min(12, group.imageWidth ?? 3));
    const collectionFlexBasis = `${Math.round((collectionWidth / 12) * 100)}%`;
    const collectionItems = group.children ?? [];
    const displayItems =
      collectionItems.length > 0 ? collectionItems : Array.from({ length: 3 }, () => null);
    const collectionLayout = group.collectionLayout ?? "image-top";
    const isHorizontalLayout = collectionLayout === "image-left";
    const imageBoxSize = isHorizontalLayout ? 60 : undefined;

    return (
      <div
        key={group.id}
        className="group relative border-1 border-transparent transition-colors hover:border-dotted hover:border-blue-500"
        ref={registerPreviewRow(group.id)}

        draggable
        onDragStart={(event) => {
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
          setDraggedItemId(null);
          setDraggedParentId(null);
          lastDragOverIdRef.current = null;
        }}
        style={{
          willChange: "transform",
          flex:
            options.flex ??
            ((useImageSpaceLayout || useBlockFlexLayout) ? `0 0 ${collectionFlexBasis}` : undefined),
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
            borderRadius: 16,
            background: "transparent",
            padding: "5px",
            display: "flex",
            flexDirection: "column",
            gap: 10,
          }}
        >
          <div
            style={{
              display: "flex",
              gap: 16,
              flexWrap: "nowrap",
            }}
          >
            {displayItems.map((child, index) => {
              const selectedCollection = child
                ? collections.find((collection) => collection.id === child.collectionIds?.[0])
                : null;
              const title = selectedCollection?.title ?? child?.label ?? "Collection title";
              const imageSrc = selectedCollection?.image?.url;
              const imageAlt = selectedCollection?.image?.altText ?? title;
              return (
                <div
                  key={child?.id ?? `collection-placeholder-${index}`}
                  style={{
                    display: "flex",
                    flexDirection: isHorizontalLayout ? "row" : "column",
                    gap: isHorizontalLayout ? 12 : 8,
                    flex: "0 1 32%",
                    minWidth: 0,
                    alignItems: isHorizontalLayout ? "center" : "stretch",
                  }}
                >
                  <div
                    style={{
                      border: "1px solid #e5e7eb",
                      background: "#f3f4f4",
                      width: isHorizontalLayout ? imageBoxSize : "100%",
                      height: isHorizontalLayout ? imageBoxSize : undefined,
                      aspectRatio: isHorizontalLayout ? undefined : "1 / 1",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      overflow: "hidden",
                      flexShrink: 0,
                    }}
                  >
                    {imageSrc ? (
                      <img
                        src={imageSrc}
                        alt={imageAlt}
                        style={{ width: "100%", height: "100%", objectFit: "contain" }}
                      />
                    ) : (
                      <Icon source={CollectionIcon} tone="subdued" />
                    )}
                  </div>
                  <div
                    style={{
                      color: previewColors.submenuText,
                      fontWeight: 600,
                      ...subheadingTypography,
                      lineHeight: 1.2,
                      ...(isHorizontalLayout
                        ? { whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }
                        : {}),
                    }}
                  >
                    {title}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
}
