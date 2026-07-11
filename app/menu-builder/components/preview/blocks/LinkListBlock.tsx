import type { CSSProperties } from "react";
import { Icon } from "@shopify/polaris";
import {
  ChevronDownIcon,
  DeleteIcon,
  DuplicateIcon,
  EditIcon,
  TextAlignCenterIcon,
  TextAlignLeftIcon,
  TextAlignRightIcon,
} from "@shopify/polaris-icons";

import type { MenuItem } from "../../../types";
import { updateItemById } from "../../../utils";
import { renderMenuIcon } from "../../shared/MenuIcon";
import type { PreviewBlockDeps } from "./deps";

export function renderLinkListToolbarButtonsImpl(deps: PreviewBlockDeps, group: MenuItem) {
  const {
    handleSelectItem,
    handleDuplicateItem,
    openDeleteItemDialog,
    setMenuItems,
    hideFloatingLinkListToolbarTimeoutRef,
    setFloatingLinkListToolbarId,
    floatingLinkListToolbarHoverRef,
  } = deps;
  return (
    <>
      <button
        type="button"
        aria-label="Align left"
        className="flex h-6 w-6 items-center justify-center rounded-md text-white hover:bg-gray-800"
        onClick={() =>
          setMenuItems((items) =>
            updateItemById(items, group.id, () => ({
              ...group,
              linkTextAlign: "left",
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
              linkTextAlign: "center",
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
              linkTextAlign: "right",
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
    </>
  );
}

export function renderLinkListBlockImpl(
  deps: PreviewBlockDeps,
    group: MenuItem,
    options: {
      flex?: string;
      wrapperStyle?: CSSProperties;
      toolbarPlacement?: "inline" | "floating";
    } = {}
) {
  const {
    menuItems,
    setMenuItems,
    selectedItemId,
    draggedItemId,
    draggedParentId,
    setDraggedItemId,
    setDraggedParentId,
    lastDragOverIdRef,
    findParentId,
    moveItem,
    handleSelectItem,
    handleDuplicateItem,
    openDeleteItemDialog,
    registerPreviewRow,
    builderSettings,
    themeSettings,
    previewColors,
    subheadingTypography,
    subtextTypography,
    descriptionTypography,
    isMobilePreview,
    useImageSpaceLayout,
    useBlockFlexLayout,
    mobileLinkListExpandedById,
    setMobileLinkListExpandedById,
    handleOpenAddRoot,
    hideFloatingLinkListToolbarTimeoutRef,
    setFloatingLinkListToolbarId,
    floatingLinkListToolbarHoverRef,
  } = deps;
  const renderLinkListToolbarButtons = (g: MenuItem) => renderLinkListToolbarButtonsImpl(deps, g);
    const useFloatingToolbar = options.toolbarPlacement === "floating";
    const headingItem = group.children?.find((child) => child.isHeading);
    const linkItems = (group.children ?? []).filter((child) => child.id !== headingItem?.id);
    const isMobileLinkList = isMobilePreview && Boolean(headingItem);
    const isMobileExpanded = !isMobileLinkList
      ? true
      : Boolean(mobileLinkListExpandedById[group.id]);
    const columnCount = Math.max(1, group.linkColumns ?? 2);
    const resolvedColumnCount = isMobilePreview ? 1 : columnCount;
    const itemsPerColumn = linkItems.length
      ? Math.ceil(linkItems.length / resolvedColumnCount)
      : 0;
    const columnsItems = Array.from({ length: resolvedColumnCount }, (_, columnIndex) =>
      linkItems.slice(columnIndex * itemsPerColumn, (columnIndex + 1) * itemsPerColumn)
    );
    const linkWidth = Math.max(1, Math.min(12, group.linkWidth ?? 3));
    const linkFlexBasis = columnCount === 3 ? "70%" : `${Math.round((linkWidth / 12) * 100)}%`;
    const linkTextAlign = group.linkTextAlign ?? "left";
    const linkJustify =
      linkTextAlign === "center" ? "center" : linkTextAlign === "right" ? "flex-end" : "flex-start";
    const linkAlignItems =
      linkTextAlign === "center" ? "center" : linkTextAlign === "right" ? "flex-end" : "flex-start";
    const headingLabel = headingItem?.label ?? "";
    const headingSelected = headingItem ? selectedItemId === headingItem.id : false;
    const headingIcon = headingItem?.icon;
    const isGroupSelected = selectedItemId === group.id;
    const scheduleHideFloatingLinkListToolbar = () => {
      if (hideFloatingLinkListToolbarTimeoutRef.current) {
        clearTimeout(hideFloatingLinkListToolbarTimeoutRef.current);
      }
      hideFloatingLinkListToolbarTimeoutRef.current = setTimeout(() => {
        if (!floatingLinkListToolbarHoverRef.current) {
          setFloatingLinkListToolbarId(null);
        }
      }, 100);
    };

    return (
      <div
        key={group.id}
        className="group relative border-1 border-transparent transition-colors hover:border-dotted hover:border-blue-500"
        ref={registerPreviewRow(group.id)}
        onMouseEnter={() => {
          if (!useFloatingToolbar) return;
          if (hideFloatingLinkListToolbarTimeoutRef.current) {
            clearTimeout(hideFloatingLinkListToolbarTimeoutRef.current);
          }
          setFloatingLinkListToolbarId(group.id);
        }}
        onMouseLeave={() => {
          if (!useFloatingToolbar) return;
          scheduleHideFloatingLinkListToolbar();
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
        style={{
          willChange: "transform",
          flex: options.flex ?? (useBlockFlexLayout ? `0 0 ${linkFlexBasis}` : undefined),
          order: useImageSpaceLayout ? 0 : undefined,
          minWidth: group.multiLayout ? 0 : undefined,
          border: isGroupSelected ? `1px dashed ${themeSettings.menuActive}` : undefined,
          padding: "0",
          borderRadius: 0,
          ...options.wrapperStyle,
        }}
      >
        <div
          style={{
            borderRadius: 16,
            background: "transparent",
            padding: "6px 12px 12px",
            display: "flex",
            flexDirection: "column",
            gap: 12,
          }}
        >
          {headingItem ? (
            <>
              <div>
                <div className="group/heading relative">
                  <button
                    type="button"
                    onClick={() => {
                      if (isMobileLinkList) {
                        setMobileLinkListExpandedById((prev) => ({
                          ...prev,
                          [group.id]: !isMobileExpanded,
                        }));
                      }
                      handleSelectItem(headingItem.id);
                    }}
                    style={Object.assign({}, subheadingTypography, {
                      width: "100%",
                      textAlign: linkTextAlign,
                      border: "none",
                      borderRadius: 8,
                      padding: "4px 8px",
                      background: "transparent",
                      color: previewColors.submenuHeading,
                      fontWeight: 600,
                      lineHeight: 1.2,
                    })}
                  >
                    <span
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        justifyContent: "space-between",
                        width: "100%",
                      }}
                    >
                      <span
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                          justifyContent: linkJustify,
                          flex: 1,
                        }}
                      >
                        {headingIcon ? (
                          <span
                            aria-hidden="true"
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            {renderMenuIcon(headingIcon, {
                              size: 16,
                              className: "text-gray-500",
                              color: previewColors.submenuHeading,
                            })}
                          </span>
                        ) : null}
                        <div style={{ display: "flex", flexDirection: "column", alignItems: linkAlignItems }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <span style={{ textAlign: linkTextAlign }}>{headingLabel}</span>
                            {headingItem?.badgeEnabled && headingItem.badgeText ? (
                              <span
                                style={{
                                  background: headingItem.badgeType === "sold_out"
                                    ? builderSettings.colorBadgeSoldOutBackground
                                    : headingItem.badgeType === "none"
                                      ? builderSettings.colorBadgeDefaultBackground
                                      : builderSettings.colorBadgeSaleBackground,
                                  color: headingItem.badgeType === "sold_out"
                                    ? builderSettings.colorBadgeSoldOutText
                                    : headingItem.badgeType === "none"
                                      ? builderSettings.colorBadgeDefaultText
                                      : builderSettings.colorBadgeSaleText,
                                  borderRadius: 9999,
                                  padding: "2px 8px",
                                  fontSize: 10,
                                  fontWeight: 600,
                                  letterSpacing: 0.2,
                                }}
                              >
                                {headingItem.badgeText}
                              </span>
                            ) : null}
                          </div>
                          {headingItem?.description ? (
                            <div
                              style={Object.assign({}, descriptionTypography, {
                                fontSize: 12,
                                fontWeight: 400,
                                opacity: 0.8,
                                marginTop: 2,
                                color: previewColors.submenuDescription,
                                textAlign: linkTextAlign,
                              })}
                            >
                              {headingItem.description}
                            </div>
                          ) : null}
                        </div>
                      </span>
                      {isMobileLinkList ? (
                        <span
                          aria-hidden="true"
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: previewColors.submenuHeading,
                            transform: isMobileExpanded ? "rotate(180deg)" : "rotate(0deg)",
                            transition: "transform 150ms ease",
                          }}
                        >
                          <ChevronDownIcon width="16" height="16" fill={previewColors.submenuHeading} />
                        </span>
                      ) : null}
                    </span>
                  </button>
                  <div className="pointer-events-none absolute -right-2 top-1/2 -translate-y-1/2 opacity-0 transition-opacity group-hover/heading:pointer-events-auto group-hover/heading:opacity-100">
                    <div className="flex items-center gap-1 rounded-full bg-gray-900 px-2 py-1 shadow-md">
                      <button
                        type="button"
                        onClick={() => handleSelectItem(headingItem.id, true)}
                        aria-label="Edit item"
                        className="flex h-5 w-5 items-center justify-center rounded-md text-white hover:bg-gray-800"
                      >
                        <Icon source={EditIcon} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDuplicateItem(headingItem.id)}
                        aria-label="Duplicate item"
                        className="flex h-5 w-5 items-center justify-center rounded-md text-white hover:bg-gray-800"
                      >
                        <Icon source={DuplicateIcon} />
                      </button>
                      <button
                        type="button"
                        onClick={() => openDeleteItemDialog(headingItem.id)}
                        aria-label="Delete item"
                        className="flex h-5 w-5 items-center justify-center rounded-md text-red-400 hover:bg-gray-800"
                      >
                        <Icon source={DeleteIcon} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              <div
                style={{
                  borderTop: `1px solid ${previewColors.submenuHeading}`,
                  opacity: 0.5,
                }}
              />
            </>
          ) : null}
          {!isMobileLinkList || isMobileExpanded ? (
            <div
              style={{
                display: "flex",
                gap: 32,
              }}
            >
              {columnsItems.map((column, columnIndex) => (
                <div key={`column-${columnIndex}`} style={{ display: "flex", flexDirection: "column", gap: 6, flex: "1 1 0" }}>
                  {column.map((child) => {
                    const isChildSelected = selectedItemId === child.id;
                    const childBaseTextColor = child.customTextColor ?? previewColors.submenuText;
                    const childHoverTextColor =
                      child.customTextHoverColor ?? previewColors.submenuTextHover;
                    const childBaseBackground = child.customBackgroundColor ?? "transparent";
                    const childHoverBackground =
                      child.customBackgroundHoverColor ?? childBaseBackground;
                    const childDescriptionColor =
                      child.customTextColor ?? previewColors.submenuDescription;
                    const childBadgeText = child.badgeEnabled ? (child.badgeText ?? "").trim() : "";
                    const isHeadingChild = Boolean(child.isHeading);
                    return (
                      <div key={child.id} className="group/item relative">
                        {isHeadingChild ? (
                          <div
                            style={{
                              padding: "4px 8px",
                              marginTop: 8,
                              textAlign: linkTextAlign,
                              cursor: "pointer",
                              border: isChildSelected
                                ? `1px dashed ${themeSettings.menuActive}`
                                : "1px solid transparent",
                              borderRadius: 8,
                            }}
                            onClick={() => handleSelectItem(child.id)}
                          >
                            <div
                              style={Object.assign({}, subheadingTypography, {
                                color: previewColors.submenuHeading,
                                fontWeight: 600,
                                fontSize: 13,
                                lineHeight: 1.2,
                                marginBottom: 4,
                              })}
                            >
                              {child.label}
                            </div>
                            <div
                              style={{
                                borderTop: `1px solid ${previewColors.submenuHeading}`,
                                opacity: 0.3,
                                marginBottom: 4,
                              }}
                            />
                            {child.description ? (
                              <div
                                style={Object.assign({}, descriptionTypography, {
                                  fontSize: 11,
                                  fontWeight: 400,
                                  opacity: 0.8,
                                  color: previewColors.submenuDescription,
                                  textAlign: linkTextAlign,
                                })}
                              >
                                {child.description}
                              </div>
                            ) : null}
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleSelectItem(child.id)}
                            onMouseEnter={(event) => {
                              event.currentTarget.style.color = childHoverTextColor;
                              event.currentTarget.style.background = childHoverBackground;
                            }}
                            onMouseLeave={(event) => {
                              event.currentTarget.style.color = childBaseTextColor;
                              event.currentTarget.style.background = childBaseBackground;
                            }}
                            style={{
                              textAlign: linkTextAlign,
                              border: isChildSelected
                                ? `1px dashed ${themeSettings.menuActive}`
                                : "1px solid transparent",
                              borderRadius: 8,
                              padding: "6px 8px",
                              background: childBaseBackground,
                              color: childBaseTextColor,
                              width: "100%",
                              ...subtextTypography,
                              lineHeight: 1.2,
                            }}
                          >
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 8,
                                justifyContent: linkJustify,
                                width: "100%",
                              }}
                            >
                              {child.icon ? (
                                <span
                                  aria-hidden="true"
                                  style={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                  }}
                                >
                                  {renderMenuIcon(child.icon, {
                                    size: 16,
                                    className: "text-gray-500",
                                    color: childBaseTextColor,
                                  })}
                                </span>
                              ) : null}
                              <div
                                style={{
                                  display: "flex",
                                  flexDirection: "column",
                                  alignItems: linkAlignItems,
                                  textAlign: linkTextAlign,
                                }}
                              >
                                <div
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 8,
                                    flexWrap: "wrap",
                                    justifyContent: linkJustify,
                                    fontWeight: 600,
                                    ...subheadingTypography,
                                    lineHeight: 1.2,
                                  }}
                                >
                                  <span>{child.label}</span>
                                  {childBadgeText ? (
                                    <span
                                      style={{
                                        background:
                                          child.badgeType === "sold_out"
                                            ? builderSettings.colorBadgeSoldOutBackground
                                            : child.badgeType === "none"
                                              ? builderSettings.colorBadgeDefaultBackground
                                              : builderSettings.colorBadgeSaleBackground,
                                        color:
                                          child.badgeType === "sold_out"
                                            ? builderSettings.colorBadgeSoldOutText
                                            : child.badgeType === "none"
                                              ? builderSettings.colorBadgeDefaultText
                                              : builderSettings.colorBadgeSaleText,
                                        borderRadius: 9999,
                                        padding: "2px 8px",
                                        fontSize: 10,
                                        fontWeight: 600,
                                        letterSpacing: 0.2,
                                      }}
                                    >
                                      {childBadgeText}
                                    </span>
                                  ) : null}
                                </div>
                                {child.description ? (
                                  <div
                                    style={{
                                      fontSize: 12,
                                      ...descriptionTypography,
                                      lineHeight: 1.3,
                                      color: childDescriptionColor,
                                    }}
                                  >
                                    {child.description}
                                  </div>
                                ) : null}
                              </div>
                            </div>
                          </button>
                        )}
                        <div className="pointer-events-none absolute -right-2 top-1/2 -translate-y-1/2 opacity-0 transition-opacity group-hover/item:pointer-events-auto group-hover/item:opacity-100">
                          <div className="flex items-center gap-1 rounded-full bg-gray-900 px-2 py-1 shadow-md">
                            <button
                              type="button"
                              onClick={() => handleSelectItem(child.id, true)}
                              aria-label="Edit item"
                              className="flex h-5 w-5 items-center justify-center rounded-md text-white hover:bg-gray-800"
                            >
                              <Icon source={EditIcon} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDuplicateItem(child.id)}
                              aria-label="Duplicate item"
                              className="flex h-5 w-5 items-center justify-center rounded-md text-white hover:bg-gray-800"
                            >
                              <Icon source={DuplicateIcon} />
                            </button>
                            <button
                              type="button"
                              onClick={() => openDeleteItemDialog(child.id)}
                              aria-label="Delete item"
                              className="flex h-5 w-5 items-center justify-center rounded-md text-red-400 hover:bg-gray-800"
                            >
                              <Icon source={DeleteIcon} />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          ) : null}
          <button
            type="button"
            onClick={() => handleOpenAddRoot(group.id)}
            className="text-sm font-medium"
            style={{
              alignSelf: "stretch",
              minHeight: builderSettings.spacingLinkListRowHeight,
              textAlign: linkTextAlign,
              display: "flex",
              alignItems: "center",
              justifyContent: linkJustify,
              gap: 8,
              width: "100%",
              padding: "6px 8px",
              color: themeSettings.menuActive,
              background: "transparent",
              border: "none",
              ...descriptionTypography,
            }}
            onMouseEnter={(event) => {
              event.currentTarget.style.color = previewColors.submenuTextHover;
            }}
            onMouseLeave={(event) => {
              event.currentTarget.style.color = themeSettings.menuActive;
            }}
          >
            <span
              aria-hidden="true"
              style={{
                width: 20,
                height: 20,
                borderRadius: 9999,
                border: "2px solid currentColor",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 14,
                lineHeight: 1,
              }}
            >
              +
            </span>
            Add item
          </button>
        </div>
        {!useFloatingToolbar ? (
          <div className="pointer-events-none absolute left-1/2 top-full z-10 -translate-x-1/2 pt-4 opacity-0 transition-opacity group-hover:pointer-events-auto group-hover:opacity-100">
            <div className="flex items-center gap-1 rounded-full bg-gray-900 px-2 py-1 shadow-md">
              {renderLinkListToolbarButtons(group)}
            </div>
          </div>
        ) : null}
      </div>
    );
}
