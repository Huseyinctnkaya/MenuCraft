import type { Dispatch, MutableRefObject, SetStateAction } from "react";
import { BlockStack, Box, Icon } from "@shopify/polaris";
import {
  ChevronDownIcon,
  ChevronRightIcon,
  DeleteIcon,
  DragHandleIcon,
  DuplicateIcon,
  EditIcon,
  FormsIcon,
  TextFontListIcon,
  TextIcon,
} from "@shopify/polaris-icons";

import { ICON_PREFIX } from "../../icons";
import type { MenuItem } from "../../types";
import { renderMenuIcon } from "../shared/MenuIcon";

export type MenuTreeDeps = {
  menuItems: MenuItem[];
  setMenuItems: Dispatch<SetStateAction<MenuItem[]>>;
  selectedItemId: string | null;
  draggedItemId: string | null;
  draggedParentId: string | null;
  setDraggedItemId: Dispatch<SetStateAction<string | null>>;
  setDraggedParentId: Dispatch<SetStateAction<string | null>>;
  lastDragOverIdRef: MutableRefObject<string | null>;
  sidebarRowRefs: MutableRefObject<Map<string, HTMLDivElement>>;
  registerSidebarRow: (id: string) => (node: HTMLDivElement | null) => void;
  findParentId: (
    items: MenuItem[],
    id: string,
    parentId?: string | null
  ) => string | null | undefined;
  moveItem: (items: MenuItem[], draggedId: string, targetId: string) => MenuItem[];
  handleSelectItem: (id: string, openEdit?: boolean, options?: { keepPanel?: boolean }) => void;
  handleToggleExpand: (id: string) => void;
  handleAddChild: (parentId: string, role: "group" | "item") => void;
  handleDuplicateItem: (id: string) => void;
  openDeleteItemDialog: (id: string) => void;
  handleOpenAddRoot: (targetId?: string | null) => void;
  handleOpenBlockTemplatePicker: (menuId: string) => void;
  setSubmenuTemplateTargetId: Dispatch<SetStateAction<string | null>>;
};

export function renderAddBetweenImpl(
  deps: MenuTreeDeps,
  parentId: string | null,
  afterId: string | undefined,
  depth: number
) {
  const { menuItems, setMenuItems, selectedItemId, draggedItemId, draggedParentId,
    setDraggedItemId, setDraggedParentId, lastDragOverIdRef, sidebarRowRefs,
    registerSidebarRow, findParentId, moveItem, handleSelectItem,
    handleToggleExpand, handleAddChild, handleDuplicateItem,
    openDeleteItemDialog, handleOpenAddRoot, handleOpenBlockTemplatePicker,
    setSubmenuTemplateTargetId } = deps;
    return null;
}

export function renderMenuTreeImpl(
  deps: MenuTreeDeps,
  item: MenuItem,
  depth: number = 0,
  parentItem?: MenuItem
) {
  const { menuItems, setMenuItems, selectedItemId, draggedItemId, draggedParentId,
    setDraggedItemId, setDraggedParentId, lastDragOverIdRef, sidebarRowRefs,
    registerSidebarRow, findParentId, moveItem, handleSelectItem,
    handleToggleExpand, handleAddChild, handleDuplicateItem,
    openDeleteItemDialog, handleOpenAddRoot, handleOpenBlockTemplatePicker,
    setSubmenuTemplateTargetId } = deps;
  const renderMenuTree = (i: MenuItem, d: number = 0, p?: MenuItem) => renderMenuTreeImpl(deps, i, d, p);
  const renderAddBetween = (pid: string | null, aid: string | undefined, dep: number) =>
    renderAddBetweenImpl(deps, pid, aid, dep);
    if (item.blockTemplate === "space") {
      return null;
    }
    if (item.blockTemplate === "multi") {
      return (
        <div key={item.id} className="mt-0">
          {item.children?.map((child) => renderMenuTree(child, depth))}
        </div>
      );
    }
    const isSelected = selectedItemId === item.id;
    const hasChildren = Boolean(item.children?.length);
    const hasBlockChildren = Boolean(item.children?.some((child) => child.blockTemplate));
    const isImageBlock =
      item.role === "group" && (item.blockTemplate === "image" || item.blockTemplate === "image2");
    const isContactBlock = item.role === "group" && item.blockTemplate === "contact";
    const isHtmlBlock = item.role === "group" && item.blockTemplate === "html";
    const isCollectionListBlock = item.role === "group" && item.blockTemplate === "collection";
    const isCollectionItem = item.role === "item" && item.blockTemplate === "collection";
    const isBlogBlock =
      item.role === "group" && (item.blockTemplate === "blogs" || item.blockTemplate === "blogs-latest");
    const isProductListBlock =
      item.role === "group" &&
      (item.blockTemplate === "product" ||
        item.blockTemplate === "product-grid" ||
        item.blockTemplate === "product-carousel" ||
        item.blockTemplate === "product-grid-horizontal") &&
      Boolean(item.children?.length);
    const isProductBlock =
      item.role === "group" &&
      (item.blockTemplate === "product" ||
        item.blockTemplate === "product-horizontal" ||
        item.blockTemplate === "product-grid" ||
        item.blockTemplate === "product-carousel" ||
        item.blockTemplate === "product-grid-horizontal") &&
      !isProductListBlock;
    const isVisualBlock = isImageBlock || isContactBlock || isProductBlock || isHtmlBlock || isBlogBlock;
    const isExpanded = item.expanded ?? item.role !== "item";
    const showToggle = item.role !== "item" && !isVisualBlock;
    const isDropdownMenu =
      item.role === "menu" &&
      (item.submenuType === "dropdown" ||
        item.submenuType === "horizontal-dropdown" ||
        item.submenuTemplate === "dropdown");
    const resolvedIcon =
      item.icon ??
      (isContactBlock
        ? `${ICON_PREFIX}mail`
        : isProductBlock || isProductListBlock
          ? `${ICON_PREFIX}tag`
          : isCollectionListBlock || isCollectionItem
            ? `${ICON_PREFIX}folder`
            : isBlogBlock
              ? `${ICON_PREFIX}newspaper`
              : isHtmlBlock
                ? `${ICON_PREFIX}code`
                : undefined);
    const itemIcon =
      item.role === "group"
        ? item.blockTemplate === "contact"
          ? FormsIcon
          : TextFontListIcon
        : TextIcon;
    const depthIndent = depth === 0 ? 0 : depth * 8;

    const renderDragHandle = () => (
      <span
        className="absolute inset-0 flex items-center justify-center cursor-move text-gray-400 opacity-0 transition-opacity group-hover:opacity-100"
        draggable
        onDragStart={(event) => {
          event.dataTransfer.effectAllowed = "move";
          event.dataTransfer.setData("text/plain", item.id);
          const row = sidebarRowRefs.current.get(item.id);
          if (row) {
            event.dataTransfer.setDragImage(row, 24, 16);
          }
          setDraggedItemId(item.id);
          const parentId = findParentId(menuItems, item.id);
          setDraggedParentId(parentId ?? null);
          lastDragOverIdRef.current = null;
        }}
        onDragEnd={() => {
          setDraggedItemId(null);
          setDraggedParentId(null);
          lastDragOverIdRef.current = null;
        }}
        aria-label="Drag to reorder"
      >
        <Icon source={DragHandleIcon} tone="subdued" />
      </span>
    );

    return (
      <div key={item.id} className="mt-0">
        <Box paddingInlineStart="0" style={{ paddingInlineStart: depthIndent }}>
          <div>
            <div
              className={`group flex items-center gap-2 rounded-lg px-0 py-1 transition-colors ${isSelected ? "bg-gray-50" : "hover:bg-gray-50"
                }`}
              ref={registerSidebarRow(item.id)}
              style={{ willChange: "transform" }}
              onDragOver={(event) => {
                if (!draggedItemId) return;
                const targetParentId = findParentId(menuItems, item.id);
                if (draggedParentId !== targetParentId) return;
                if (draggedItemId === item.id) return;
                event.preventDefault();
                if (lastDragOverIdRef.current === item.id) return;
                lastDragOverIdRef.current = item.id;
                setMenuItems((items) => moveItem(items, draggedItemId, item.id));
              }}
              onDrop={(event) => {
                event.preventDefault();
                if (!draggedItemId) return;
                const targetParentId = findParentId(menuItems, item.id);
                if (draggedParentId !== targetParentId) return;
                setMenuItems((items) => moveItem(items, draggedItemId, item.id));
                setDraggedItemId(null);
                setDraggedParentId(null);
                lastDragOverIdRef.current = null;
              }}
            >
              {showToggle ? (
                <span className="relative flex h-5 w-5 items-center justify-center text-gray-500">
                  <button
                    type="button"
                    onClick={() => handleToggleExpand(item.id)}
                    aria-label={isExpanded ? "Collapse" : "Expand"}
                    className="flex h-5 w-5 items-center justify-center text-gray-500 hover:text-gray-700"
                  >
                    <Icon source={isExpanded ? ChevronDownIcon : ChevronRightIcon} tone="subdued" />
                  </button>
                </span>
              ) : null}
              <div className="flex min-w-0 flex-1 items-center gap-2 text-left text-sm text-gray-700">
                <span className="relative flex h-5 w-5 items-center justify-center text-gray-500">
                  <span className="pointer-events-none transition-opacity group-hover:opacity-0">
                    {resolvedIcon
                      ? renderMenuIcon(resolvedIcon, { size: 16, className: "text-gray-500" })
                      : <Icon source={itemIcon} tone="subdued" />}
                  </span>
                  {renderDragHandle()}

                </span>
                {/* Rebuild Trigger */}
                <span
                  className={`min-w-0 truncate ${item.role === "menu" ? "font-medium" : "font-normal"}`}
                  title={item.label}
                >
                  {item.label}
                </span>
              </div>
              <div
                className="flex items-center gap-1.5 opacity-0 transition-opacity group-hover:opacity-100"
              >
                <button
                  type="button"
                  onClick={() => handleSelectItem(item.id, true)}
                  aria-label="Edit item"
                  className="flex h-7 w-7 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                >
                  <Icon source={EditIcon} tone="subdued" />
                </button>
                <button
                  type="button"
                  onClick={() => handleDuplicateItem(item.id)}
                  aria-label="Duplicate item"
                  className="flex h-7 w-7 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                >
                  <Icon source={DuplicateIcon} tone="subdued" />
                </button>
                <button
                  type="button"
                  onClick={() => openDeleteItemDialog(item.id)}
                  aria-label="Delete item"
                  className="flex h-7 w-7 items-center justify-center rounded-lg border border-gray-200 bg-white text-red-600 hover:bg-gray-100 hover:text-red-700"
                >
                  <Icon source={DeleteIcon} tone="critical" />
                </button>
              </div>
            </div>

            {item.role !== "item" ? (
              <div
                style={{
                  maxHeight: isExpanded ? 9999 : 0,
                  opacity: isExpanded ? 1 : 0,
                  overflow: isExpanded ? "visible" : "hidden",
                  transition: "max-height 140ms ease, opacity 140ms ease",
                }}
              >
                <Box>
                  <div className="ml-0 border-l border-dashed border-gray-300/70">
                    <div className={`rounded-lg transition-all duration-150 ${draggedItemId && draggedParentId === item.id ? "border-2 border-dotted border-blue-500 bg-blue-50/40 p-2 my-1" : "border-2 border-transparent p-0"}`}>
                      <BlockStack>
                        {hasChildren
                          ? item.children?.map((child, index) => (
                            <div key={child.id}>
                              {index === 0 && renderAddBetween(item.id, undefined, depth + 1)}
                              {renderMenuTree(child, depth + 1, item)}
                              {renderAddBetween(item.id, child.id, depth + 1)}
                            </div>
                          ))
                          : null}
                        {item.role === "menu" ? (
                          <button
                            type="button"
                            onClick={() => {
                              if (isDropdownMenu) {
                                handleOpenAddRoot(item.id);
                                return;
                              }
                              if (hasChildren) {
                                handleOpenBlockTemplatePicker(item.id);
                              } else {
                                setSubmenuTemplateTargetId(item.id);
                              }
                            }}
                            className="mt-2 flex items-center gap-2 rounded-lg px-2 py-1 text-sm font-medium text-blue-600 hover:bg-gray-100 hover:text-blue-700"
                          >
                            <span className="h-5 w-5" />
                            <span className="flex h-5 w-5 items-center justify-center rounded-full border-2 border-blue-600 text-blue-600 text-xs leading-none">
                              +
                            </span>
                            {isDropdownMenu ? "Add item" : hasChildren ? "Add block" : "Add submenu"}
                          </button>
                        ) : null}
                        {item.role === "group" && !isVisualBlock ? (
                          <button
                            type="button"
                            onClick={() => {
                              const isDropdownChildItem =
                                parentItem?.submenuType === "dropdown" ||
                                parentItem?.submenuTemplate === "dropdown" ||
                                parentItem?.submenuTemplate === "simple-left-tabs" ||
                                parentItem?.submenuTemplate === "simple-right-tabs" ||
                                parentItem?.submenuTemplate === "two-nested-tabs-right" ||
                                parentItem?.submenuTemplate === "three-nested-tabs-right" ||
                                parentItem?.submenuTemplate === "custom-normal-dropdown" ||
                                parentItem?.submenuTemplate === "two-level-tabs" ||
                                parentItem?.submenuTemplate === "three-level-tabs";
                              if (hasBlockChildren && !item.blockTemplate) {
                                handleOpenBlockTemplatePicker(item.id);
                                return;
                              }
                              if (item.blockTemplate === "links" || isDropdownChildItem) {
                                handleOpenAddRoot(item.id);
                              } else {
                                handleAddChild(item.id, "item");
                              }
                            }}
                            className="mt-2 flex items-center gap-2 rounded-lg px-2 py-1 text-sm font-medium text-blue-600 hover:bg-gray-100 hover:text-blue-700"
                          >
                            <span className="h-5 w-5" />
                            <span className="flex h-5 w-5 items-center justify-center rounded-full border-2 border-blue-600 text-blue-600 text-xs leading-none">
                              +
                            </span>
                            {hasBlockChildren && !item.blockTemplate ? "Add block" : "Add item"}
                          </button>
                        ) : null}
                      </BlockStack>
                    </div>
                  </div>
                </Box>
              </div>
            ) : null}
          </div>
        </Box>
      </div>
    );
}
