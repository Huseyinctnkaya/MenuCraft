import type { CSSProperties } from "react";
import { Button, Icon } from "@shopify/polaris";
import {
  ChevronRightIcon,
  PlusIcon,
} from "@shopify/polaris-icons";

import type { MenuItem, ProductSummary } from "../../../types";
import { updateItemById } from "../../../utils";
import type { PreviewBlockDeps } from "./deps";
export function renderSpaceBlockImpl(
  deps: PreviewBlockDeps,
    group: MenuItem,
    options?: { isSelected?: boolean; wrapperStyle?: CSSProperties }
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
    handleOpenBlockTemplatePicker,
    openDeleteItemDialog,
    handleDuplicateItem,
    previewColors,
    isMobilePreview,
    useImageSpaceLayout,
    previewMenu,
    registerPreviewRow,
    themeSettings,
  } = deps;
    const isSelected = options?.isSelected ?? selectedItemId === group.id;
    return (
      <div
        key={group.id}
        ref={registerPreviewRow(group.id)}
        style={{
          willChange: "transform",
          border: isSelected ? `1px dashed ${themeSettings.menuActive}` : "1px dashed #cbd5e1",
          borderRadius: 10,
          padding: "16px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: previewColors.submenuBackground,
          ...options?.wrapperStyle,
        }}
      >
        <Button
          variant="secondary"
          icon={PlusIcon}
          size="slim"
          onClick={() => handleOpenBlockTemplatePicker(previewMenu?.id ?? group.id)}
        >
          Add block
        </Button>
      </div>
    );
}
