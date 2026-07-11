import type { CSSProperties } from "react";

import type { MenuItem } from "../../types";
import type { PreviewBlockDeps } from "./blocks/deps";
import { renderBlogBlockImpl } from "./blocks/BlogBlock";
import { renderCollectionBlockImpl } from "./blocks/CollectionBlock";
import { renderContactBlockImpl } from "./blocks/ContactBlock";
import { renderHtmlBlockImpl } from "./blocks/HtmlBlock";
import { renderImageBlockImpl } from "./blocks/ImageBlock";
import { renderLinkListBlockImpl } from "./blocks/LinkListBlock";
import { renderProductBlockImpl } from "./blocks/ProductBlock";
import { renderSpaceBlockImpl } from "./blocks/SpaceBlock";
import { renderElementGroupMasonryImpl } from "./ElementGroupMasonry";

export type MegaPanelDeps = PreviewBlockDeps & {
  dropdownGroups: MenuItem[];
  linkBlockCount: number;
  submenuMaxWidth: number | null;
  isDropdownMenu: boolean;
  isHorizontalDropdownMenu: boolean;
  getBlockSpan: (item: MenuItem) => number;
};

export function renderMegaPanelImpl(deps: MegaPanelDeps, inline: boolean) {
  const {
    builderSettings,
    previewColors,
    selectedItemId,
    isMobilePreview,
    useImageSpaceLayout,
    useBlockFlexLayout,
    dropdownGroups,
    linkBlockCount,
    submenuMaxWidth,
    isDropdownMenu,
    isHorizontalDropdownMenu,
    getBlockSpan,
  } = deps;
  const renderImageBlock = (g: MenuItem, o: Parameters<typeof renderImageBlockImpl>[2] = {}) =>
    renderImageBlockImpl(deps, g, o);
  const renderContactBlock = (g: MenuItem, o: Parameters<typeof renderContactBlockImpl>[2] = {}) =>
    renderContactBlockImpl(deps, g, o);
  const renderHtmlBlock = (g: MenuItem, o: Parameters<typeof renderHtmlBlockImpl>[2] = {}) =>
    renderHtmlBlockImpl(deps, g, o);
  const renderProductBlock = (g: MenuItem, o: Parameters<typeof renderProductBlockImpl>[2] = {}) =>
    renderProductBlockImpl(deps, g, o);
  const renderCollectionBlock = (g: MenuItem, o: Parameters<typeof renderCollectionBlockImpl>[2] = {}) =>
    renderCollectionBlockImpl(deps, g, o);
  const renderBlogBlock = (g: MenuItem, o: Parameters<typeof renderBlogBlockImpl>[2] = {}) =>
    renderBlogBlockImpl(deps, g, o);
  const renderSpaceBlock = (g: MenuItem, o: Parameters<typeof renderSpaceBlockImpl>[2] = {}) =>
    renderSpaceBlockImpl(deps, g, o);
  const renderLinkListBlock = (g: MenuItem, o: Parameters<typeof renderLinkListBlockImpl>[2] = {}) =>
    renderLinkListBlockImpl(deps, g, o);
  const renderElementGroupMasonry = (groups: MenuItem[]) =>
    renderElementGroupMasonryImpl(deps, groups);
    if (dropdownGroups.length === 0 || isDropdownMenu || isHorizontalDropdownMenu) return null;
    const isMobileInline = inline && isMobilePreview;
    const panelStyle: CSSProperties = {
      background: previewColors.submenuBackground,
      border: builderSettings.submenuShowBorder
        ? `1px solid ${previewColors.submenuBorder}`
        : "none",
      borderRadius: 0,
      marginTop: 0,
      padding: "10px",
      boxShadow: "0 10px 30px rgba(15, 23, 42, 0.15)",
      maxWidth: submenuMaxWidth ?? "none",
      overflowY: "visible",
      maxHeight: "none",
      scrollbarWidth: "none",
      msOverflowStyle: "none",
      opacity: 1,
      transform:
        builderSettings.animationEffect === "slide"
          ? "translateY(0)"
          : builderSettings.animationEffect === "scale"
            ? "scale(1)"
            : "none",
      transition: `opacity ${builderSettings.animationDuration}ms ease ${builderSettings.animationDelay}ms, transform ${builderSettings.animationDuration}ms ease ${builderSettings.animationDelay}ms`,
    };

    if (inline) {
      panelStyle.width = "100%";
      panelStyle.maxWidth = "100%";
      panelStyle.boxShadow = "0 6px 18px rgba(15, 23, 42, 0.12)";
    }
    if (isMobileInline) {
      panelStyle.overflowY = "visible";
      panelStyle.maxHeight = "none";
    }

    return (
      <div className="menu-builder-hide-scrollbar" style={panelStyle}>
        {(() => {
          const orderedDropdownGroups = useImageSpaceLayout
            ? dropdownGroups.some((group) => group.multiLayout)
              ? dropdownGroups
              : [...dropdownGroups].sort((a, b) => {
                const aPriority =
                  a.blockTemplate === "image" ||
                    a.blockTemplate === "image2" ||
                    a.blockTemplate === "contact" ||
                    a.blockTemplate === "product" ||
                    a.blockTemplate === "product-horizontal" ||
                    a.blockTemplate === "product-grid" ||
                    a.blockTemplate === "product-carousel" ||
                    a.blockTemplate === "product-grid-horizontal"
                    ? 0
                    : 1;
                const bPriority =
                  b.blockTemplate === "image" ||
                    b.blockTemplate === "image2" ||
                    b.blockTemplate === "contact" ||
                    b.blockTemplate === "product" ||
                    b.blockTemplate === "product-horizontal" ||
                    b.blockTemplate === "product-grid" ||
                    b.blockTemplate === "product-carousel" ||
                    b.blockTemplate === "product-grid-horizontal"
                    ? 0
                    : 1;
                return aPriority - bPriority;
              })
            : dropdownGroups;
          const masonryGroups = orderedDropdownGroups.filter(
            (group) => group.multiLayout === "multi-element-group-masonry"
          );
          const renderQueue: Array<
            | { type: "masonry"; key: string }
            | { type: "group"; key: string; group: MenuItem }
          > = [];
          let masonryInserted = false;
          orderedDropdownGroups.forEach((group) => {
            if (group.multiLayout === "multi-element-group-masonry") {
              if (!masonryInserted) {
                renderQueue.push({
                  type: "masonry",
                  key: "multi-element-group-masonry",
                });
                masonryInserted = true;
              }
              return;
            }
            renderQueue.push({ type: "group", key: group.id, group });
          });

          return (
            <div
              style={{
                display: isMobileInline ? "flex" : useBlockFlexLayout ? "flex" : "grid",
                gridTemplateColumns: isMobileInline
                  ? undefined
                  : useBlockFlexLayout
                    ? undefined
                    : `repeat(${dropdownGroups.length}, minmax(0, 1fr))`,
                flexDirection: isMobileInline ? "column" : undefined,
                gap: isMobileInline ? 12 : useImageSpaceLayout ? 0 : 24,
                alignItems: useBlockFlexLayout ? "flex-start" : undefined,
                flexWrap: useBlockFlexLayout ? "wrap" : undefined,
                color: previewColors.submenuText,
              }}
            >
              {renderQueue.map((entry) => {
                if (entry.type === "masonry") {
                  return renderElementGroupMasonry(masonryGroups);
                }
                const group = entry.group;
                const isGroupSelected = selectedItemId === group.id;
                if (group.blockTemplate === "space") {
                  const spaceGridColumn = useImageSpaceLayout ? undefined : "1 / -1";
                  const spaceFlex = useImageSpaceLayout
                    ? linkBlockCount >= 2
                      ? "0 0 100%"
                      : "1 1 auto"
                    : undefined;
                  const spaceOrder = useImageSpaceLayout ? (linkBlockCount >= 2 ? 2 : 1) : undefined;
                  return renderSpaceBlock(group, {
                    isSelected: isGroupSelected,
                    wrapperStyle: {
                      flex: isMobileInline ? "1 1 100%" : spaceFlex,
                      order: spaceOrder,
                      width: isMobileInline ? "100%" : undefined,
                    },
                  });
                }
                const span = getBlockSpan(group);
                const desktopGap = useImageSpaceLayout ? 0 : 24;
                const commonFlexBasis = isMobileInline
                  ? "100%"
                  : `calc(${(span / 12) * 100}% - ${desktopGap * (1 - span / 12)}px)`;
                const commonFlexStyle = isMobileInline || !useBlockFlexLayout ? {} : { flex: `0 0 ${commonFlexBasis}` };

                if (group.blockTemplate === "links") {
                  return renderLinkListBlock(group, {
                    flex: isMobileInline ? "1 1 100%" : "auto",
                    wrapperStyle: {
                      minWidth: 0,
                      width: isMobileInline ? "100%" : undefined,
                      ...commonFlexStyle
                    },
                    toolbarPlacement: "floating",
                  });
                }
                if (
                  group.blockTemplate === "image" ||
                  group.blockTemplate === "image2" ||
                  group.blockTemplate === "contact" ||
                  group.blockTemplate === "product" ||
                  group.blockTemplate === "product-horizontal" ||
                  group.blockTemplate === "product-grid" ||
                  group.blockTemplate === "product-carousel" ||
                  group.blockTemplate === "product-grid-horizontal" ||
                  group.blockTemplate === "collection" ||
                  group.blockTemplate === "blogs" ||
                  group.blockTemplate === "blogs-latest" ||
                  group.blockTemplate === "html"
                ) {
                  if (group.blockTemplate === "image" || group.blockTemplate === "image2") {
                    return renderImageBlock(group, {
                      flex: isMobileInline ? "1 1 100%" : "auto",
                      wrapperStyle: {
                        minWidth: 0,
                        width: isMobileInline ? "100%" : undefined,
                        ...commonFlexStyle
                      },
                    });
                  }
                  if (group.blockTemplate === "contact") {
                    return renderContactBlock(group, {
                      flex: isMobileInline ? "1 1 100%" : "auto",
                      wrapperStyle: {
                        width: isMobileInline ? "100%" : undefined,
                        ...commonFlexStyle
                      },
                    });
                  }
                  if (
                    group.blockTemplate === "product" ||
                    group.blockTemplate === "product-horizontal" ||
                    group.blockTemplate === "product-grid" ||
                    group.blockTemplate === "product-carousel" ||
                    group.blockTemplate === "product-grid-horizontal"
                  ) {
                    return renderProductBlock(group, {
                      flex: isMobileInline ? "1 1 100%" : "auto",
                      wrapperStyle: {
                        width: isMobileInline ? "100%" : undefined,
                        ...commonFlexStyle
                      },
                    });
                  }
                  if (group.blockTemplate === "collection") {
                    return renderCollectionBlock(group, {
                      flex: isMobileInline ? "1 1 100%" : "auto",
                      wrapperStyle: {
                        width: isMobileInline ? "100%" : undefined,
                        ...commonFlexStyle
                      },
                    });
                  }
                  if (group.blockTemplate === "blogs" || group.blockTemplate === "blogs-latest") {
                    return renderBlogBlock(group, {
                      flex: isMobileInline ? "1 1 100%" : "auto",
                      wrapperStyle: {
                        width: isMobileInline ? "100%" : undefined,
                        ...commonFlexStyle
                      },
                    });
                  }
                  if (group.blockTemplate === "html") {
                    return renderHtmlBlock(group, {
                      flex: isMobileInline ? "1 1 100%" : "auto",
                      wrapperStyle: {
                        width: isMobileInline ? "100%" : undefined,
                        ...commonFlexStyle
                      },
                    });
                  }
                }
                if (group.blockTemplate === "multi") {
                  return (
                    <div
                      key={group.id}
                      style={{ flex: "1 1 100%", width: isMobileInline ? "100%" : undefined }}
                    >
                      {group.children?.map((child) => renderMultiBlock(child))}
                    </div>
                  );
                }
                return null;
              })}
            </div>
          );
        })()}
      </div>
    );
}
