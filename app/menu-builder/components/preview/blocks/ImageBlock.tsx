import type { CSSProperties } from "react";
import { Icon } from "@shopify/polaris";
import {
  DeleteIcon,
  DuplicateIcon,
  EditIcon,
  TextAlignCenterIcon,
  TextAlignLeftIcon,
  TextAlignRightIcon,
} from "@shopify/polaris-icons";

import type { MenuItem, ProductSummary } from "../../../types";
import { updateItemById } from "../../../utils";
import type { PreviewBlockDeps } from "./deps";
export function renderImageBlockImpl(
  deps: PreviewBlockDeps,
    group: MenuItem,
    options: {
      flex?: string;
      wrapperStyle?: CSSProperties;
      imagePreviewHeight?: number;
      imageScale?: string;
    } = {}
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
    themeSettings,
    isMobilePreview,
    useImageSpaceLayout,
    useBlockFlexLayout,
    hoveredImageBlockId,
    setHoveredImageBlockId,
  } = deps;
    const isOverlayImage = group.blockTemplate === "image2";
    const imageWidth = Math.max(1, Math.min(12, group.imageWidth ?? 3));
    const imageFill = !group.imageNoFill;
    const imagePreviewHeight =
      options.imagePreviewHeight ?? (isMobilePreview ? 500 : useImageSpaceLayout ? 220 : 150);
    const imageTextAlign = group.imageTextAlign ?? "left";
    const imageTextAlignItems =
      imageTextAlign === "center"
        ? "center"
        : imageTextAlign === "right"
          ? "flex-end"
          : "flex-start";
    const imageFlexBasis = `${Math.round((imageWidth / 12) * 100)}%`;
    const isMultiLayout = Boolean(group.multiLayout);
    const isGroupSelected = selectedItemId === group.id;
    const isImageHovered = hoveredImageBlockId === group.id;

    return (
      <div
        key={group.id}
        className="relative border-1 border-transparent transition-colors hover:border-dotted hover:border-blue-500"
        draggable
        onMouseEnter={() => setHoveredImageBlockId(group.id)}
        onMouseLeave={() => {
          setHoveredImageBlockId((prev) => (prev === group.id ? null : prev));
        }}
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
          minHeight: useImageSpaceLayout ? 240 : undefined,
          flex: options.flex ??
            (useImageSpaceLayout
              ? isMultiLayout
                ? `0 0 ${imageFlexBasis}`
                : "0 0 20%"
              : useBlockFlexLayout
                ? `0 0 ${imageFlexBasis}`
                : undefined),
          minWidth: isMultiLayout ? 0 : undefined,
          order: useImageSpaceLayout ? 0 : undefined,
          border: isGroupSelected ? `1px dashed ${themeSettings.menuActive}` : undefined,
          padding: "6px",
          borderRadius: 0,
          ...options.wrapperStyle,
        }}
      >
        <div
          className="absolute left-1/2 top-3 z-10 flex -translate-x-1/2 items-center gap-1 rounded-full bg-gray-900 px-2 py-1 shadow-md transition-opacity"
          style={{
            opacity: isImageHovered ? 1 : 0,
            pointerEvents: isImageHovered ? "auto" : "none",
          }}
        >
          <button
            type="button"
            aria-label="Align left"
            className="flex h-6 w-6 items-center justify-center rounded-md text-white hover:bg-gray-800"
            onClick={() =>
              setMenuItems((items) =>
                updateItemById(items, group.id, () => ({
                  ...group,
                  imageTextAlign: "left",
                })),
              )
            }
          >
            <Icon source={TextAlignLeftIcon} />
          </button>
          <button
            type="button"
            aria-label="Align center"
            className="flex h-6 w-6 items-center justify-center rounded-md text-white hover:bg-gray-800"
            onClick={() =>
              setMenuItems((items) =>
                updateItemById(items, group.id, () => ({
                  ...group,
                  imageTextAlign: "center",
                })),
              )
            }
          >
            <Icon source={TextAlignCenterIcon} />
          </button>
          <button
            type="button"
            aria-label="Align right"
            className="flex h-6 w-6 items-center justify-center rounded-md text-white hover:bg-gray-800"
            onClick={() =>
              setMenuItems((items) =>
                updateItemById(items, group.id, () => ({
                  ...group,
                  imageTextAlign: "right",
                })),
              )
            }
          >
            <Icon source={TextAlignRightIcon} />
          </button>
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
            padding: isOverlayImage ? "0" : "5px",
            display: "flex",
            flexDirection: "column",
            gap: 10,
          }}
        >
          <div
            style={{
              borderRadius: 0,
              background: imageFill ? "#ffffff" : "transparent",
              border: imageFill && group.imageUrl ? "1px solid #e5e7eb" : "1px solid transparent",
              position: "relative",
              overflow: "hidden",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {group.imageUrl ? (
              <img
                src={group.imageUrl}
                alt={group.label}
                style={{ width: "100%", maxWidth: "100%", maxHeight: "100%" }}
              />
            ) : (
              <svg
                className="gm-placeholder-svg"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 525.5 525.5"
                style={{
                  display: "block",
                  width: "100%",
                  height: "100%",
                  maxWidth: "100%",
                  maxHeight: "100%",
                  fill: "rgba(133, 133, 133, 0.35)",
                  backgroundColor: "rgba(133, 133, 133, 0.1)",
                  border: "1px solid rgba(133, 133, 133, 0.2)",
                }}
              >
                <path d="M324.5 212.7H203c-1.6 0-2.8 1.3-2.8 2.8V308c0 1.6 1.3 2.8 2.8 2.8h121.6c1.6 0 2.8-1.3 2.8-2.8v-92.5c0-1.6-1.3-2.8-2.9-2.8zm1.1 95.3c0 .6-.5 1.1-1.1 1.1H203c-.6 0-1.1-.5-1.1-1.1v-92.5c0-.6.5-1.1 1.1-1.1h121.6c.6 0 1.1.5 1.1 1.1V308z" />
                <path d="M210.4 299.5H240v.1s.1 0 .2-.1h75.2v-76.2h-105v76.2zm1.8-7.2l20-20c1.6-1.6 3.8-2.5 6.1-2.5s4.5.9 6.1 2.5l11.5 11.5 16.8 16.8c-12.9 3.3-20.7 6.3-22.8 7.2h-27.7v-5.5zm101.5-10.1c-20.1 1.7-36.7 4.8-49.1 7.9l-16.9-16.9 26.3-26.3c1.6-1.6 3.8-2.5 6.1-2.5s4.5.9 6.1 2.5l27.5 27.5v7.8zm-68.9 15.5c9.7-3.5 33.9-10.9 68.9-13.8v13.8h-68.9zm68.9-72.7v46.8l-26.2-26.2c-1.9-1.9-4.5-3-7.3-3s-5.4 1.1-7.3 3l-18.8 18.8V225h101.4z" />
                <path d="M232.8 254c4.6 0 8.3-3.7 8.3-8.3s-3.7-8.3-8.3-8.3-8.3 3.7-8.3 8.3 3.7 8.3 8.3 8.3zm0-14.9c3.6 0 6.6 2.9 6.6 6.6s-2.9 6.6-6.6 6.6-6.6-2.9-6.6-6.6 3-6.6 6.6-6.6z" />
              </svg>
            )}
            {isOverlayImage ? (
              <div
                style={{
                  position: "absolute",
                  left: 16,
                  right: 16,
                  bottom: 16,
                  background: "#3f3f3f",
                  color: "#ffffff",
                  padding: "10px 12px",
                  textAlign: imageTextAlign,
                }}
              >
                <div
                  style={{
                    fontWeight: 600,
                    ...subheadingTypography,
                    lineHeight: 1.2,
                  }}
                >
                  {group.label}
                </div>
                <div
                  style={{
                    fontSize: 12,
                    ...descriptionTypography,
                    lineHeight: 1.2,
                    color: "#e5e7eb",
                  }}
                >
                  {group.description || "Sample description"}
                </div>
              </div>
            ) : null}
          </div>
          {!isOverlayImage ? (
            <>
              <div
                style={{
                  color: previewColors.submenuText,
                  fontWeight: 600,
                  ...subheadingTypography,
                  lineHeight: 1.2,
                  textAlign: imageTextAlign,
                  alignSelf: imageTextAlignItems,
                }}
              >
                {group.label}
              </div>
              <div
                style={{
                  color: previewColors.submenuDescription,
                  fontSize: 12,
                  ...descriptionTypography,
                  lineHeight: 1.2,
                  textAlign: imageTextAlign,
                  alignSelf: imageTextAlignItems,
                }}
              >
                {group.description || "Sample description"}
              </div>
            </>
          ) : null}
        </div>
      </div>
    );
}
