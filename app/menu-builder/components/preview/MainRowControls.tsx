import type { Dispatch, SetStateAction } from "react";
import { Icon } from "@shopify/polaris";
import {
  ChevronDownIcon,
  DeleteIcon,
  DuplicateIcon,
  EditIcon,
  SearchIcon,
} from "@shopify/polaris-icons";

import type { MenuItem } from "../../types";
import { renderMenuIcon } from "../shared/MenuIcon";
import type { PreviewBlockDeps } from "./blocks/deps";
import type { TypographyStyle } from "./blocks/deps";

export type MainRowDeps = PreviewBlockDeps & {
  isVerticalMenu: boolean;
  showDividers: boolean;
  menuRowHeight: number;
  mainTypography: TypographyStyle;
  tabTypography: TypographyStyle;
  openMenuId: string | null;
  setOpenMenuId: Dispatch<SetStateAction<string | null>>;
  hoveredMenuId: string | null;
  isSearchOpen: boolean;
  setIsSearchOpen: Dispatch<SetStateAction<boolean>>;
  dropdownGroups: MenuItem[];
  registerPreviewMenuItem: (id: string) => (node: HTMLButtonElement | null) => void;
  handlePreviewHoverStart: (id: string) => void;
  handlePreviewHoverEnd: () => void;
  setSubmenuTemplateTargetId: Dispatch<SetStateAction<string | null>>;
};

export function renderMenuItemButtonImpl(deps: MainRowDeps, item: MenuItem) {
  const { menuItems, setMenuItems, selectedItemId, draggedItemId, draggedParentId,
    setDraggedItemId, setDraggedParentId, lastDragOverIdRef, findParentId, moveItem,
    handleSelectItem, handleDuplicateItem, openDeleteItemDialog,
    builderSettings, previewColors, isMobilePreview,
    isVerticalMenu, showDividers, menuRowHeight, mainTypography, tabTypography,
    openMenuId, setOpenMenuId, hoveredMenuId, isSearchOpen, setIsSearchOpen,
    dropdownGroups, registerPreviewMenuItem, handlePreviewHoverStart,
    handlePreviewHoverEnd, setSubmenuTemplateTargetId } = deps;
    const isActive = openMenuId === item.id;
    const isHovered = hoveredMenuId === item.id;
    const defaultBackground = isActive
      ? isMobilePreview
        ? previewColors.mainBackgroundHover
        : previewColors.tabBackgroundActive
      : isHovered
        ? previewColors.mainBackgroundHover
        : previewColors.mainBackground;
    const defaultTextColor = isActive
      ? isMobilePreview
        ? previewColors.mainTextHover
        : previewColors.tabHeadingActive
      : isHovered
        ? previewColors.mainTextHover
        : previewColors.mainText;
    const itemBackground =
      isActive || isHovered
        ? item.customBackgroundHoverColor ?? item.customBackgroundColor ?? defaultBackground
        : item.customBackgroundColor ?? defaultBackground;
    const itemTextColor =
      isActive || isHovered
        ? item.customTextHoverColor ?? item.customTextColor ?? defaultTextColor
        : item.customTextColor ?? defaultTextColor;
    const badgeText = item.badgeEnabled ? (item.badgeText ?? "").trim() : "";
    const iconWidthMode = item.iconWidthMode ?? "auto";
    const iconWidthUnit = item.iconWidthUnit ?? "%";
    const iconWidthValue = item.iconWidthValue ?? 50;
    const iconWidth =
      iconWidthMode === "custom" ? `${iconWidthValue}${iconWidthUnit}` : undefined;

    return (
      <div
        key={item.id}
        className="relative"
        style={{
          height: isVerticalMenu ? "auto" : "100%",
          width: isVerticalMenu ? "100%" : "auto",
          display: "flex",
          flexDirection: isVerticalMenu ? "column" : "row",
        }}
        onMouseEnter={() => handlePreviewHoverStart(item.id)}
        onMouseLeave={handlePreviewHoverEnd}
      >
        {hoveredMenuId === item.id && (
          <div
            className="absolute z-20 flex items-center gap-1 rounded-lg bg-gray-900 px-2 py-1 shadow-md"
            style={
              isMobilePreview
                ? {
                  top: `${menuRowHeight / 2}px`,
                  left: "50%",
                  transform: "translate(-50%, -50%)",
                }
                : { top: "-40px", left: 0 }
            }
            onMouseEnter={() => handlePreviewHoverStart(item.id)}
            onMouseLeave={handlePreviewHoverEnd}
          >
            <button
              type="button"
              onClick={() => handleSelectItem(item.id, true)}
              aria-label="Edit item"
              className="flex h-6 w-6 items-center justify-center rounded-md text-white hover:bg-gray-800"
            >
              <Icon source={EditIcon} />
            </button>
            <button
              type="button"
              onClick={() => handleDuplicateItem(item.id)}
              aria-label="Duplicate item"
              className="flex h-6 w-6 items-center justify-center rounded-md text-white hover:bg-gray-800"
            >
              <Icon source={DuplicateIcon} />
            </button>
            <button
              type="button"
              onClick={() => openDeleteItemDialog(item.id)}
              aria-label="Delete item"
              className="flex h-6 w-6 items-center justify-center rounded-md text-red-400 hover:bg-gray-800"
            >
              <Icon source={DeleteIcon} />
            </button>
          </div>
        )}
        <button
          type="button"
          onClick={() => {
            handleSelectItem(item.id, false, { keepPanel: true });
            setOpenMenuId((prev) => (prev === item.id ? null : item.id));
          }}
          ref={registerPreviewMenuItem(item.id)}
          draggable
          onDragStart={(event) => {
            event.dataTransfer.effectAllowed = "move";
            event.dataTransfer.setData("text/plain", item.id);
            lastDragOverIdRef.current = null;
            setDraggedItemId(item.id);
            setDraggedParentId(null);
            setOpenMenuId(item.id);
          }}
          onDragOver={(event) => {
            if (!draggedItemId) return;
            if (draggedParentId !== null) return;
            if (draggedItemId === item.id) return;
            event.preventDefault();
            if (lastDragOverIdRef.current === item.id) return;
            lastDragOverIdRef.current = item.id;
            setMenuItems((items) => moveItem(items, draggedItemId, item.id));
          }}
          onDragEnd={() => {
            setDraggedItemId(null);
            setDraggedParentId(null);
            lastDragOverIdRef.current = null;
          }}
          style={{
            background: itemBackground,
            borderRight:
              showDividers && !isVerticalMenu
                ? `1px solid ${previewColors.mainDivider}`
                : "none",
            borderBottom:
              showDividers && isVerticalMenu
                ? `1px solid ${previewColors.mainDivider}`
                : "none",
            borderRadius: 0,
            height: isVerticalMenu ? menuRowHeight : "100%",
            minWidth: isVerticalMenu ? "100%" : 80,
            padding: isVerticalMenu
              ? isMobilePreview
                ? "0 16px"
                : "0 12px"
              : `0 ${builderSettings.spacingMainPadding}px`,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: isVerticalMenu ? "space-between" : "flex-start",
            gap: 6,
            color: itemTextColor,
            cursor: "grab",
          }}
        >
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6, flex: 1 }}>
            {item.icon ? (
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: iconWidth,
                  minWidth: iconWidth,
                }}
              >
                {renderMenuIcon(item.icon, {
                  size: 14,
                  color: itemTextColor,
                  className: "text-current",
                })}
              </span>
            ) : null}
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                ...(isActive ? tabTypography : mainTypography),
                lineHeight: 1.2,
              }}
            >
              <span>{item.label}</span>
              {badgeText ? (
                <span
                  style={{
                    background: item.badgeType === "sold_out"
                      ? builderSettings.colorBadgeSoldOutBackground
                      : item.badgeType === "none"
                        ? builderSettings.colorBadgeDefaultBackground
                        : builderSettings.colorBadgeSaleBackground,
                    color: item.badgeType === "sold_out"
                      ? builderSettings.colorBadgeSoldOutText
                      : item.badgeType === "none"
                        ? builderSettings.colorBadgeDefaultText
                        : builderSettings.colorBadgeSaleText,
                    borderRadius: 9999,
                    padding: "2px 8px",
                    fontSize: 10,
                    fontWeight: 600,
                    letterSpacing: 0.2,
                  }}
                >
                  {badgeText}
                </span>
              ) : null}
            </span>
          </span>
          {builderSettings.elementsShowIndicators && item.children?.length ? (
            <span style={{ display: "inline-flex", marginLeft: "auto" }}>
              <ChevronDownIcon width="14" height="14" fill={itemTextColor} />
            </span>
          ) : null}
        </button>
        {isActive && dropdownGroups.length === 0 && (
          <div
            style={{
              width: "100%",
              position: isVerticalMenu ? "static" : "absolute",
              left: isVerticalMenu ? undefined : 0,
              top: isVerticalMenu ? undefined : "100%",
              marginTop: 0,
              zIndex: 15,
            }}
          >
            <button
              type="button"
              onClick={() => setSubmenuTemplateTargetId(item.id)}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: isVerticalMenu ? "center" : "flex-start",
                gap: isVerticalMenu ? 0 : 10,
                padding: "12px 16px",
                width: isVerticalMenu ? "100%" : "auto",
                minWidth: isVerticalMenu ? "auto" : 180,
                borderRadius: 0,
                border: "1px dashed #cbd5e1",
                background: isVerticalMenu ? "#ffffff" : previewColors.submenuBackground,
                color: isVerticalMenu ? "#111827" : previewColors.submenuText,
                fontSize: 14,
                fontWeight: 500,
                whiteSpace: "nowrap",
                position: isVerticalMenu ? "relative" : "static",
              }}
            >
              <span
                style={{
                  fontSize: 16,
                  lineHeight: 1,
                  ...(isVerticalMenu ? { position: "absolute", left: 16 } : {}),
                }}
              >
                +
              </span>
              Add submenu
            </button>
          </div>
        )}
      </div>
    );
}

export function renderAccountLinkButtonImpl(
  deps: MainRowDeps,
  link: {
    id: string;
    label: string;
    icon: string;
    iconWidthMode: "auto" | "custom";
    iconWidthValue: number;
    iconWidthUnit: "%" | "px";
  }
) {
  const { menuItems, setMenuItems, selectedItemId, draggedItemId, draggedParentId,
    setDraggedItemId, setDraggedParentId, lastDragOverIdRef, findParentId, moveItem,
    handleSelectItem, handleDuplicateItem, openDeleteItemDialog,
    builderSettings, previewColors, isMobilePreview,
    isVerticalMenu, showDividers, menuRowHeight, mainTypography, tabTypography,
    openMenuId, setOpenMenuId, hoveredMenuId, isSearchOpen, setIsSearchOpen,
    dropdownGroups, registerPreviewMenuItem, handlePreviewHoverStart,
    handlePreviewHoverEnd, setSubmenuTemplateTargetId } = deps;
    const label = link.label.trim();
    const hasLabel = label.length > 0;
    const iconWidth =
      link.iconWidthMode === "custom"
        ? `${link.iconWidthValue}${link.iconWidthUnit}`
        : undefined;
    return (
      <button
        key={link.id}
        type="button"
        style={{
          background: previewColors.mainBackground,
          color: previewColors.mainText,
          height: isVerticalMenu ? menuRowHeight : "100%",
          minWidth: hasLabel ? 80 : 48,
          padding: isVerticalMenu ? "0 12px" : hasLabel ? "0 16px" : "0 12px",
          borderLeft:
            showDividers && !isVerticalMenu ? `1px solid ${previewColors.mainDivider}` : "none",
          borderBottom:
            showDividers && isVerticalMenu ? `1px solid ${previewColors.mainDivider}` : "none",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: hasLabel ? "flex-start" : "center",
          gap: hasLabel ? 8 : 0,
          whiteSpace: "nowrap",
        }}
        onMouseEnter={(event) => {
          event.currentTarget.style.background = previewColors.mainBackgroundHover;
          event.currentTarget.style.color = previewColors.mainTextHover;
        }}
        onMouseLeave={(event) => {
          event.currentTarget.style.background = previewColors.mainBackground;
          event.currentTarget.style.color = previewColors.mainText;
        }}
      >
        {link.icon ? (
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: iconWidth,
              minWidth: iconWidth,
            }}
          >
            {renderMenuIcon(link.icon, {
              size: 14,
              color: previewColors.mainText,
              className: "text-current",
            })}
          </span>
        ) : null}
        {hasLabel ? (
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              ...(isVerticalMenu ? mainTypography : mainTypography),
              lineHeight: 1.2,
            }}
          >
            {label}
          </span>
        ) : null}
      </button>
    );
}

export function renderSearchControlImpl(deps: MainRowDeps, marginLeft?: string | number) {
  const { menuItems, setMenuItems, selectedItemId, draggedItemId, draggedParentId,
    setDraggedItemId, setDraggedParentId, lastDragOverIdRef, findParentId, moveItem,
    handleSelectItem, handleDuplicateItem, openDeleteItemDialog,
    builderSettings, previewColors, isMobilePreview,
    isVerticalMenu, showDividers, menuRowHeight, mainTypography, tabTypography,
    openMenuId, setOpenMenuId, hoveredMenuId, isSearchOpen, setIsSearchOpen,
    dropdownGroups, registerPreviewMenuItem, handlePreviewHoverStart,
    handlePreviewHoverEnd, setSubmenuTemplateTargetId } = deps;
    if (!builderSettings.elementsShowSearch || isMobilePreview) return null;
    return (
      <div
        style={{
          marginLeft: isVerticalMenu ? 0 : marginLeft ?? "auto",
          position: "relative",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          height: isVerticalMenu ? menuRowHeight : "100%",
          width: isVerticalMenu ? "100%" : 56,
          borderLeft:
            showDividers && !isVerticalMenu ? `1px solid ${previewColors.mainDivider}` : "none",
          borderTop:
            showDividers && isVerticalMenu ? `1px solid ${previewColors.mainDivider}` : "none",
        }}
      >
        <button
          type="button"
          onClick={() => setIsSearchOpen((prev) => !prev)}
          style={{
            height: "100%",
            width: "100%",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            color: previewColors.mainText,
            background: isSearchOpen ? previewColors.mainBackgroundHover : previewColors.mainBackground,
          }}
          onMouseEnter={(event) => {
            event.currentTarget.style.background = previewColors.mainBackgroundHover;
          }}
          onMouseLeave={(event) => {
            event.currentTarget.style.background = isSearchOpen
              ? previewColors.mainBackgroundHover
              : previewColors.mainBackground;
          }}
        >
          <SearchIcon width="18" height="18" fill={previewColors.mainText} />
        </button>
        {isSearchOpen && (
          <div
            style={{
              position: "absolute",
              right: 0,
              top: "100%",
              marginTop: 0,
              background: previewColors.submenuBackground,
              border: `1px solid ${previewColors.submenuBorder}`,
              borderRadius: 0,
              minWidth: isVerticalMenu ? "100%" : 180,
              padding: "14px 16px",
              display: "flex",
              alignItems: "center",
              gap: 12,
              color: previewColors.submenuText,
              boxShadow: "0 12px 24px rgba(15, 23, 42, 0.12)",
              zIndex: 20,
            }}
          >
            <span
              style={{
                flex: 1,
                fontSize: 16,
                color: previewColors.submenuText,
                opacity: 0.7,
              }}
            >
              Search for...
            </span>
            <SearchIcon width="18" height="18" fill={previewColors.submenuText} />
          </div>
        )}
      </div>
    );
}
