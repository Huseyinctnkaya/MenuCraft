import type { CSSProperties } from "react";
import { Icon } from "@shopify/polaris";
import {
  BlogIcon,
  DeleteIcon,
  DuplicateIcon,
  EditIcon,
} from "@shopify/polaris-icons";

import type { MenuItem, ProductSummary } from "../../../types";
import { updateItemById } from "../../../utils";
import type { PreviewBlockDeps } from "./deps";
export function renderBlogBlockImpl(
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
    blogs,
    latestArticles,
    registerPreviewRow,
    themeSettings,
    isMobilePreview,
    builderSettings,
    useBlockFlexLayout,
  } = deps;
    const isGroupSelected = selectedItemId === group.id;
    const blogWidth = Math.max(1, Math.min(12, group.imageWidth ?? 3));
    const blogFlexBasis = `${Math.round((blogWidth / 12) * 100)}%`;
    const isLatestBlock = group.blockTemplate === "blogs-latest";
    const selectedBlogId = group.blogIds?.[0];
    const selectedBlog =
      !isLatestBlock
        ? blogs.find((blog) => blog.id === selectedBlogId) ??
        (group.url
          ? blogs.find((blog) => group.url === `/blogs/${blog.handle}`)
          : undefined)
        : undefined;
    const blogArticles = isLatestBlock
      ? latestArticles
      : selectedBlog?.articles?.nodes ?? [];
    const headingTitle = group.label || (isLatestBlock ? "Latest blog" : "Articles");
    const hasSelection = isLatestBlock ? true : Boolean(selectedBlog);
    const displayCards = hasSelection ? blogArticles : Array.from({ length: 4 }, () => null);
    const showEmptyState = hasSelection && blogArticles.length === 0;

    return (
      <div
        key={group.id}
        className="group relative border-1 border-transparent transition-colors hover:border-dotted hover:border-blue-500"
        ref={registerPreviewRow(group.id)}
        style={{
          willChange: "transform",
          flex:
            options.flex ??
            (useImageSpaceLayout || useBlockFlexLayout ? `0 0 ${blogFlexBasis}` : undefined),
          order: useImageSpaceLayout ? 0 : undefined,
          border: isGroupSelected ? `1px dashed ${themeSettings.menuActive}` : undefined,
          padding: "6px",
          borderRadius: 0,
          ...options.wrapperStyle,
        }}
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
              color: previewColors.submenuHeading,
              fontWeight: 600,
              ...subheadingTypography,
              lineHeight: 1.2,
            }}
          >
            {headingTitle}
          </div>
          <div
            style={{
              borderTop: `1px solid ${previewColors.submenuHeading}`,
              opacity: 0.5,
            }}
          />
          {showEmptyState ? (
            <div
              style={{
                color: previewColors.submenuText,
                ...subheadingTypography,
                opacity: 0.7,
              }}
            >
              No posts found.
            </div>
          ) : (
            <div
              style={{
                display: "flex",
                gap: 16,
                flexWrap: "nowrap",
                justifyContent: displayCards.length === 1 ? "flex-start" : "space-between",
              }}
            >
              {displayCards.map((article, index) => {
                const title = article?.title ?? `Blog post ${index + 1}`;
                const imageSrc = article?.image?.url;
                const imageAlt = article?.image?.altText ?? title;
                const isSingleCard = displayCards.length === 1;
                return (
                  <div
                    key={article?.id ?? `${group.id}-blog-card-${index}`}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 8,
                      flex: isSingleCard ? "0 0 25%" : "1 1 0",
                      maxWidth: isSingleCard ? "25%" : undefined,
                      minWidth: 0,
                    }}
                  >
                    <div
                      style={{
                        border: "1px solid #e5e7eb",
                        background: "#f3f4f4",
                        width: "100%",
                        aspectRatio: "1 / 1",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        overflow: "hidden",
                      }}
                    >
                      {imageSrc ? (
                        <img
                          src={imageSrc}
                          alt={imageAlt}
                          style={{ width: "100%", height: "100%", objectFit: "cover" }}
                        />
                      ) : (
                        <Icon source={BlogIcon} tone="subdued" />
                      )}
                    </div>
                    <div
                      style={{
                        color: previewColors.submenuText,
                        fontWeight: 600,
                        ...subheadingTypography,
                        lineHeight: 1.2,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {title}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div >
    );
}
