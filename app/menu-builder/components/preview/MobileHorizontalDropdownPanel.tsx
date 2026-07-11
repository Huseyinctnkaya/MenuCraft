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

import type { MenuItem } from "../../types";
import { updateItemById } from "../../utils";
import { renderMenuIcon } from "../shared/MenuIcon";
import type { MobilePanelDeps } from "./mobile-deps";
import { renderMobileBlockGroupImpl } from "./MobileBlockGroup";

export function renderMobileHorizontalDropdownPanelImpl(deps: MobilePanelDeps) {
  const {
    menuItems,
    setMenuItems,
    selectedItemId,
    previewColors,
    themeSettings,
    builderSettings,
    subtextTypography,
    descriptionTypography,
    handleSelectItem,
    handleDuplicateItem,
    openDeleteItemDialog,
    handleOpenAddRoot,
    previewMenu,
    horizontalDropdownItems,
    dropdownContentAlign,
    dropdownAlignJustify,
    shouldInlineMobileHorizontalDropdownPanel,
    activeHorizontalItemId,
    setActiveHorizontalItemId,
    activeHorizontalChildId,
    setActiveHorizontalChildId,
    activeHorizontalGrandchildId,
    setActiveHorizontalGrandchildId,
  } = deps;
  const renderMobileBlockGroup = (group: MenuItem) => renderMobileBlockGroupImpl(deps, group);
    if (!previewMenu || !shouldInlineMobileHorizontalDropdownPanel) return null;
    const dropdownItemHeight = builderSettings.spacingLinkListRowHeight;
    const activeItem =
      horizontalDropdownItems.find((child) => child.id === activeHorizontalItemId) ?? null;
    const applyMobileHorizontalAlign = (align: MenuItem["submenuContentAlign"]) => {
      setMenuItems((items) =>
        updateItemById(items, previewMenu.id, (item) => ({
          ...item,
          submenuContentAlign: align ?? "center",
        }))
      );
    };

    return (
      <div
        style={{
          background: previewColors.submenuBackground,
          border: builderSettings.submenuShowBorder
            ? `1px solid ${previewColors.submenuBorder}`
            : "none",
          borderRadius: 0,
          boxShadow: "0 10px 20px rgba(15, 23, 42, 0.12)",
          width: "100%",
          maxWidth: "100%",
          overflow: "hidden",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 0, padding: 0 }}>
          {horizontalDropdownItems.map((child) => {
            const hasChildren = Boolean(child.children?.length);
            const isActive = activeItem?.id === child.id;
            const hasDirectBlocks = (child.children ?? []).some((entry) => entry.blockTemplate);
            const hasNestedBlocks =
              !hasDirectBlocks &&
              (child.children ?? []).some((entry) =>
                (entry.children ?? []).some((grandchild) => grandchild.blockTemplate)
              );
            const hasDeepNestedBlocks =
              !hasDirectBlocks &&
              !hasNestedBlocks &&
              (child.children ?? []).some((entry) =>
                (entry.children ?? []).some((grandchild) =>
                  (grandchild.children ?? []).some((leaf) => leaf.blockTemplate)
                )
              );
            const activeNestedItem = hasNestedBlocks
              ? (child.children ?? []).find((entry) => entry.id === activeHorizontalChildId) ?? null
              : null;
            const activeNestedBlocks = (activeNestedItem?.children ?? []).filter(
              (entry) => entry.blockTemplate
            );
            const activeNestedHasBlocks = activeNestedBlocks.length > 0;
            const activeDeepParent = hasDeepNestedBlocks
              ? (child.children ?? []).find((entry) => entry.id === activeHorizontalChildId) ?? null
              : null;
            const deepChildren = activeDeepParent?.children ?? [];
            const activeDeepChild = deepChildren.find(
              (entry) => entry.id === activeHorizontalGrandchildId
            );
            const activeDeepBlocks = (activeDeepChild?.children ?? []).filter(
              (entry) => entry.blockTemplate
            );
            const activeDeepHasBlocks = activeDeepBlocks.length > 0;
            return (
              <div key={child.id} style={{ display: "flex", flexDirection: "column" }}>
                <div className="group/item relative">
                  <button
                    type="button"
                    onClick={() => {
                      handleSelectItem(child.id);
                      if (hasChildren) {
                        setActiveHorizontalItemId((prev) => (prev === child.id ? null : child.id));
                        setActiveHorizontalChildId(null);
                        setActiveHorizontalGrandchildId(null);
                      } else {
                        setActiveHorizontalItemId(null);
                        setActiveHorizontalChildId(null);
                        setActiveHorizontalGrandchildId(null);
                      }
                    }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: dropdownAlignJustify,
                      gap: 12,
                      minHeight: dropdownItemHeight,
                      padding: "18px 20px",
                      paddingRight: hasChildren ? 44 : 20,
                      borderRadius: 0,
                      border: "none",
                      background: "transparent",
                      color: previewColors.submenuText,
                      width: "100%",
                      textAlign: dropdownContentAlign,
                      ...subtextTypography,
                      lineHeight: 1.2,
                      position: "relative",
                    }}
                  >
                    <span style={{ flex: 1, textAlign: dropdownContentAlign }}>{child.label}</span>
                    {hasChildren ? (
                      <span
                        aria-hidden="true"
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          transform: isActive ? "rotate(180deg)" : "rotate(0deg)",
                          transition: "transform 150ms ease",
                          position: "absolute",
                          right: 20,
                        }}
                      >
                        <ChevronDownIcon width="14" height="14" fill={previewColors.submenuText} />
                      </span>
                    ) : null}
                  </button>
                  <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 opacity-0 transition-opacity group-hover/item:pointer-events-auto group-hover/item:opacity-100">
                    <div className="flex items-center gap-1 rounded-full bg-gray-900 px-2 py-1 shadow-md">
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          handleSelectItem(child.id, true);
                        }}
                        aria-label="Edit item"
                        className="flex h-5 w-5 items-center justify-center rounded-md text-white hover:bg-gray-800"
                      >
                        <Icon source={EditIcon} />
                      </button>
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          handleDuplicateItem(child.id);
                        }}
                        aria-label="Duplicate item"
                        className="flex h-5 w-5 items-center justify-center rounded-md text-white hover:bg-gray-800"
                      >
                        <Icon source={DuplicateIcon} />
                      </button>
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          openDeleteItemDialog(child.id);
                        }}
                        aria-label="Delete item"
                        className="flex h-5 w-5 items-center justify-center rounded-md text-red-400 hover:bg-gray-800"
                      >
                        <Icon source={DeleteIcon} />
                      </button>
                    </div>
                  </div>
                </div>
                {isActive && hasChildren ? (
                  <div
                    style={{
                      border: `1px solid ${previewColors.submenuBorder}`,
                      borderBottom: "none",
                      borderRadius: 0,
                      padding: "12px 16px",
                      display: "flex",
                      flexDirection: "column",
                      gap: 6,
                      background: "#ffffff",
                    }}
                  >
                    {hasDirectBlocks ? (
                      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                        {(child.children ?? [])
                          .filter((entry) => entry.blockTemplate)
                          .map((entry) => renderMobileBlockGroup(entry))}
                      </div>
                    ) : hasNestedBlocks ? (
                      <>
                        {(child.children ?? []).map((subItem) => {
                          const subItemHasBlocks = (subItem.children ?? []).some(
                            (entry) => entry.blockTemplate
                          );
                          const isSubItemActive = activeHorizontalChildId === subItem.id;
                          return (
                            <div
                              key={subItem.id}
                              className="group/subitem relative"
                              style={{ display: "flex", flexDirection: "column" }}
                            >
                              <button
                                type="button"
                                onClick={() => {
                                  handleSelectItem(subItem.id);
                                  if (subItemHasBlocks) {
                                    setActiveHorizontalChildId((prev) =>
                                      prev === subItem.id ? null : subItem.id
                                    );
                                  } else {
                                    setActiveHorizontalChildId(null);
                                  }
                                  setActiveHorizontalGrandchildId(null);
                                }}
                                style={{
                                  textAlign: dropdownContentAlign,
                                  border: "none",
                                  background: "transparent",
                                  color: previewColors.submenuText,
                                  padding: "14px 0",
                                  paddingRight: subItemHasBlocks ? 24 : 0,
                                  ...subtextTypography,
                                  lineHeight: 1.2,
                                  width: "100%",
                                  position: "relative",
                                }}
                              >
                                {subItem.label}
                                {subItemHasBlocks ? (
                                  <span
                                    aria-hidden="true"
                                    style={{
                                      display: "inline-flex",
                                      alignItems: "center",
                                      justifyContent: "center",
                                      transform: `${isSubItemActive ? "rotate(180deg)" : "rotate(0deg)"
                                        } translateY(-50%)`,
                                      transition: "transform 150ms ease",
                                      position: "absolute",
                                      right: 0,
                                      top: "50%",
                                    }}
                                  >
                                    <ChevronDownIcon
                                      width="14"
                                      height="14"
                                      fill={previewColors.submenuText}
                                    />
                                  </span>
                                ) : null}
                              </button>
                              <div className="pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 opacity-0 transition-opacity group-hover/subitem:pointer-events-auto group-hover/subitem:opacity-100">
                                <div className="flex items-center gap-1 rounded-full bg-gray-900 px-2 py-1 shadow-md">
                                  <button
                                    type="button"
                                    onClick={(event) => {
                                      event.stopPropagation();
                                      handleSelectItem(subItem.id, true);
                                    }}
                                    aria-label="Edit item"
                                    className="flex h-5 w-5 items-center justify-center rounded-md text-white hover:bg-gray-800"
                                  >
                                    <Icon source={EditIcon} />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={(event) => {
                                      event.stopPropagation();
                                      handleDuplicateItem(subItem.id);
                                    }}
                                    aria-label="Duplicate item"
                                    className="flex h-5 w-5 items-center justify-center rounded-md text-white hover:bg-gray-800"
                                  >
                                    <Icon source={DuplicateIcon} />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={(event) => {
                                      event.stopPropagation();
                                      openDeleteItemDialog(subItem.id);
                                    }}
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
                        <button
                          type="button"
                          onClick={() => handleOpenAddRoot(child.id)}
                          className="text-sm font-medium"
                          style={{
                            alignSelf: "stretch",
                            width: "100%",
                            minHeight: dropdownItemHeight,
                            textAlign: dropdownContentAlign,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: dropdownAlignJustify,
                            gap: 8,
                            padding: "6px 0",
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
                        {activeNestedHasBlocks ? (
                          <div
                            style={{
                              marginTop: 8,
                              paddingTop: 12,
                              borderTop: `1px solid ${previewColors.submenuBorder}`,
                              display: "flex",
                              flexDirection: "column",
                              gap: 12,
                            }}
                          >
                            {activeNestedBlocks.map((entry) => renderMobileBlockGroup(entry))}
                          </div>
                        ) : null}
                      </>
                    ) : hasDeepNestedBlocks ? (
                      <>
                        {(child.children ?? []).map((subItem) => {
                          const subItemHasChildren = Boolean(subItem.children?.length);
                          const isSubItemActive = activeHorizontalChildId === subItem.id;
                          return (
                            <div
                              key={subItem.id}
                              className="group/subitem relative"
                              style={{ display: "flex", flexDirection: "column" }}
                            >
                              <button
                                type="button"
                                onClick={() => {
                                  handleSelectItem(subItem.id);
                                  if (subItemHasChildren) {
                                    setActiveHorizontalChildId((prev) =>
                                      prev === subItem.id ? null : subItem.id
                                    );
                                  } else {
                                    setActiveHorizontalChildId(null);
                                  }
                                  setActiveHorizontalGrandchildId(null);
                                }}
                                style={{
                                  textAlign: dropdownContentAlign,
                                  border: "none",
                                  background: "transparent",
                                  color: previewColors.submenuText,
                                  padding: "14px 0",
                                  paddingRight: subItemHasChildren ? 24 : 0,
                                  ...subtextTypography,
                                  lineHeight: 1.2,
                                  width: "100%",
                                  position: "relative",
                                }}
                              >
                                {subItem.label}
                                {subItemHasChildren ? (
                                  <span
                                    aria-hidden="true"
                                    style={{
                                      display: "inline-flex",
                                      alignItems: "center",
                                      justifyContent: "center",
                                      transform: `${isSubItemActive ? "rotate(180deg)" : "rotate(0deg)"
                                        } translateY(-50%)`,
                                      transition: "transform 150ms ease",
                                      position: "absolute",
                                      right: 0,
                                      top: "50%",
                                    }}
                                  >
                                    <ChevronDownIcon
                                      width="14"
                                      height="14"
                                      fill={previewColors.submenuText}
                                    />
                                  </span>
                                ) : null}
                              </button>
                              <div className="pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 opacity-0 transition-opacity group-hover/subitem:pointer-events-auto group-hover/subitem:opacity-100">
                                <div className="flex items-center gap-1 rounded-full bg-gray-900 px-2 py-1 shadow-md">
                                  <button
                                    type="button"
                                    onClick={(event) => {
                                      event.stopPropagation();
                                      handleSelectItem(subItem.id, true);
                                    }}
                                    aria-label="Edit item"
                                    className="flex h-5 w-5 items-center justify-center rounded-md text-white hover:bg-gray-800"
                                  >
                                    <Icon source={EditIcon} />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={(event) => {
                                      event.stopPropagation();
                                      handleDuplicateItem(subItem.id);
                                    }}
                                    aria-label="Duplicate item"
                                    className="flex h-5 w-5 items-center justify-center rounded-md text-white hover:bg-gray-800"
                                  >
                                    <Icon source={DuplicateIcon} />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={(event) => {
                                      event.stopPropagation();
                                      openDeleteItemDialog(subItem.id);
                                    }}
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

                        {activeDeepParent ? (
                          <div
                            style={{
                              marginTop: 8,
                              paddingTop: 12,
                              borderTop: `1px solid ${previewColors.submenuBorder}`,
                              display: "flex",
                              flexDirection: "column",
                              gap: 6,
                            }}
                          >
                            {deepChildren.map((deepItem) => {
                              const deepItemHasBlocks = (deepItem.children ?? []).some(
                                (entry) => entry.blockTemplate
                              );
                              const isDeepActive = activeHorizontalGrandchildId === deepItem.id;
                              return (
                                <div
                                  key={deepItem.id}
                                  className="group/subitem relative"
                                  style={{ display: "flex", flexDirection: "column" }}
                                >
                                  <button
                                    type="button"
                                    onClick={() => {
                                      handleSelectItem(deepItem.id);
                                      if (deepItemHasBlocks) {
                                        setActiveHorizontalGrandchildId((prev) =>
                                          prev === deepItem.id ? null : deepItem.id
                                        );
                                      } else {
                                        setActiveHorizontalGrandchildId(null);
                                      }
                                    }}
                                    style={{
                                      textAlign: dropdownContentAlign,
                                      border: "none",
                                      background: "transparent",
                                      color: previewColors.submenuText,
                                      padding: "14px 0",
                                      paddingRight: deepItemHasBlocks ? 24 : 0,
                                      ...subtextTypography,
                                      lineHeight: 1.2,
                                      width: "100%",
                                      position: "relative",
                                    }}
                                  >
                                    {deepItem.label}
                                    {deepItemHasBlocks ? (
                                      <span
                                        aria-hidden="true"
                                        style={{
                                          display: "inline-flex",
                                          alignItems: "center",
                                          justifyContent: "center",
                                          transform: `${isDeepActive ? "rotate(180deg)" : "rotate(0deg)"
                                            } translateY(-50%)`,
                                          transition: "transform 150ms ease",
                                          position: "absolute",
                                          right: 0,
                                          top: "50%",
                                        }}
                                      >
                                        <ChevronDownIcon
                                          width="14"
                                          height="14"
                                          fill={previewColors.submenuText}
                                        />
                                      </span>
                                    ) : null}
                                  </button>
                                  <div className="pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 opacity-0 transition-opacity group-hover/subitem:pointer-events-auto group-hover/subitem:opacity-100">
                                    <div className="flex items-center gap-1 rounded-full bg-gray-900 px-2 py-1 shadow-md">
                                      <button
                                        type="button"
                                        onClick={(event) => {
                                          event.stopPropagation();
                                          handleSelectItem(deepItem.id, true);
                                        }}
                                        aria-label="Edit item"
                                        className="flex h-5 w-5 items-center justify-center rounded-md text-white hover:bg-gray-800"
                                      >
                                        <Icon source={EditIcon} />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={(event) => {
                                          event.stopPropagation();
                                          handleDuplicateItem(deepItem.id);
                                        }}
                                        aria-label="Duplicate item"
                                        className="flex h-5 w-5 items-center justify-center rounded-md text-white hover:bg-gray-800"
                                      >
                                        <Icon source={DuplicateIcon} />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={(event) => {
                                          event.stopPropagation();
                                          openDeleteItemDialog(deepItem.id);
                                        }}
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
                            {activeDeepHasBlocks ? (
                              <div
                                style={{
                                  marginTop: 8,
                                  paddingTop: 12,
                                  borderTop: `1px solid ${previewColors.submenuBorder}`,
                                  display: "flex",
                                  flexDirection: "column",
                                  gap: 12,
                                }}
                              >
                                {activeDeepBlocks.map((entry) => renderMobileBlockGroup(entry))}
                              </div>
                            ) : null}
                          </div>
                        ) : null}
                      </>
                    ) : (
                      <>
                        {(child.children ?? []).map((subItem) => (
                          <div
                            key={subItem.id}
                            className="group/subitem relative"
                            style={{ display: "flex", flexDirection: "column" }}
                          >
                            <button
                              type="button"
                              onClick={() => handleSelectItem(subItem.id)}
                              style={{
                                textAlign: dropdownContentAlign,
                                border: "none",
                                background: "transparent",
                                color: previewColors.submenuText,
                                padding: "14px 0",
                                ...subtextTypography,
                                lineHeight: 1.2,
                                width: "100%",
                              }}
                            >
                              {subItem.label}
                            </button>
                            <div className="pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 opacity-0 transition-opacity group-hover/subitem:pointer-events-auto group-hover/subitem:opacity-100">
                              <div className="flex items-center gap-1 rounded-full bg-gray-900 px-2 py-1 shadow-md">
                                <button
                                  type="button"
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    handleSelectItem(subItem.id, true);
                                  }}
                                  aria-label="Edit item"
                                  className="flex h-5 w-5 items-center justify-center rounded-md text-white hover:bg-gray-800"
                                >
                                  <Icon source={EditIcon} />
                                </button>
                                <button
                                  type="button"
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    handleDuplicateItem(subItem.id);
                                  }}
                                  aria-label="Duplicate item"
                                  className="flex h-5 w-5 items-center justify-center rounded-md text-white hover:bg-gray-800"
                                >
                                  <Icon source={DuplicateIcon} />
                                </button>
                                <button
                                  type="button"
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    openDeleteItemDialog(subItem.id);
                                  }}
                                  aria-label="Delete item"
                                  className="flex h-5 w-5 items-center justify-center rounded-md text-red-400 hover:bg-gray-800"
                                >
                                  <Icon source={DeleteIcon} />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}

                      </>
                    )}
                  </div>
                ) : null}
              </div>
            );
          })}
          <button
            type="button"
            onClick={() => handleOpenAddRoot(previewMenu.id)}
            className="text-sm font-medium"
            style={{
              alignSelf: "stretch",
              width: "100%",
              minHeight: dropdownItemHeight,
              textAlign: dropdownContentAlign,
              display: "flex",
              alignItems: "center",
              justifyContent: dropdownAlignJustify,
              gap: 8,
              padding: "12px 20px 18px",
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
          <div
            style={{
              marginTop: 0,
              padding: "12px 0 0",
              display: "flex",
              justifyContent: "center",
              width: "100%",
            }}
          >
            <div
              style={{
                background: "#1f2933",
                borderRadius: 0,
                padding: "0",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                width: "100%",
              }}
            >
              <button
                type="button"
                aria-label="Align left"
                onClick={() => applyMobileHorizontalAlign("left")}
                className="flex h-8 w-8 items-center justify-center rounded-md text-white hover:bg-gray-700"
              >
                <Icon source={TextAlignLeftIcon} />
              </button>
              <button
                type="button"
                aria-label="Align center"
                onClick={() => applyMobileHorizontalAlign("center")}
                className="flex h-8 w-8 items-center justify-center rounded-md text-white hover:bg-gray-700"
              >
                <Icon source={TextAlignCenterIcon} />
              </button>
              <button
                type="button"
                aria-label="Align right"
                onClick={() => applyMobileHorizontalAlign("right")}
                className="flex h-8 w-8 items-center justify-center rounded-md text-white hover:bg-gray-700"
              >
                <Icon source={TextAlignRightIcon} />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
}
