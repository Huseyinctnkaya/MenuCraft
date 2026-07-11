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
export function renderContactBlockImpl(
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
    builderSettings,
    contactFetcher,
    menu,
    registerPreviewRow,
    themeSettings,
    isMobilePreview,
    useBlockFlexLayout,
    collections,
  } = deps;
    const isGroupSelected = selectedItemId === group.id;
    const contactWidth = Math.max(1, Math.min(12, group.imageWidth ?? 3));
    const contactFlexBasis = `${Math.round((contactWidth / 12) * 100)}%`;
    const contactNamePlaceholder = group.contactNameLabel || "Name";
    const contactEmailPlaceholder = group.contactEmailLabel || "Email";
    const contactPhonePlaceholder = group.contactPhoneLabel || "Phone number";
    const contactMessagePlaceholder = group.contactMessageLabel || "Message";
    const contactSubmitLabel = group.contactSubmitLabel || "Send";
    const contactSuccessMessage =
      group.contactSuccessMessage || "Thanks for contacting us. We'll get back to you soon.";
    const activeContactItemId = contactFetcher.submission?.formData.get("menuItemId");
    const isContactSubmitting =
      contactFetcher.state !== "idle" && activeContactItemId === group.id;
    const contactSuccess =
      contactFetcher.data?.ok && contactFetcher.data?.menuItemId === group.id;

    return (
      <div
        key={group.id}
        className="group relative border-1 border-transparent transition-colors hover:border-dotted hover:border-blue-500"
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
        ref={registerPreviewRow(group.id)}
        style={{
          willChange: "transform",
          minHeight: useImageSpaceLayout ? 240 : undefined,
          flex: options.flex ?? (useImageSpaceLayout ? `0 0 ${contactFlexBasis}` : undefined),
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
        <contactFetcher.Form
          method="post"
          style={{
            border: "1px solid #e5e7eb",
            background: "#ffffff",
            padding: "16px",
            display: "flex",
            flexDirection: "column",
            gap: 12,
          }}
        >
          <input type="hidden" name="intent" value="contact-submit" />
          <input type="hidden" name="menuId" value={menu.id} />
          <input type="hidden" name="menuItemId" value={group.id} />
          <div>
            <div
              style={{
                color: previewColors.submenuHeading,
                fontWeight: 600,
                ...subheadingTypography,
                lineHeight: 1.2,
              }}
            >
              {group.contactTitle || "Contact"}
            </div>
            {group.contactDescription ? (
              <div
                style={{
                  marginTop: 4,
                  color: previewColors.submenuDescription,
                  ...descriptionTypography,
                  lineHeight: 1.3,
                }}
              >
                {group.contactDescription}
              </div>
            ) : null}
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: isMobilePreview ? "minmax(0, 1fr)" : "repeat(2, minmax(0, 1fr))",
              gap: 10,
            }}
          >
            <input
              type="text"
              name="name"
              placeholder={contactNamePlaceholder}
              draggable={false}
              style={{
                height: 34,
                border: "1px solid #e5e7eb",
                padding: "6px 10px",
                fontSize: 12,
                color: "#111827",
              }}
            />
            <input
              type="email"
              name="email"
              placeholder={contactEmailPlaceholder}
              draggable={false}
              style={{
                height: 34,
                border: "1px solid #e5e7eb",
                padding: "6px 10px",
                fontSize: 12,
                color: "#111827",
              }}
            />
          </div>
          <input
            type="text"
            name="phone"
            placeholder={contactPhonePlaceholder}
            draggable={false}
            style={{
              height: 34,
              border: "1px solid #e5e7eb",
              padding: "6px 10px",
              fontSize: 12,
              color: "#111827",
            }}
          />
          <textarea
            name="message"
            placeholder={contactMessagePlaceholder}
            draggable={false}
            style={{
              height: 80,
              border: "1px solid #e5e7eb",
              padding: "6px 10px",
              fontSize: 12,
              color: "#111827",
              resize: "none",
            }}
          />
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button
              type="submit"
              disabled={isContactSubmitting}
              style={{
                border: "1px solid #94a3b8",
                padding: "6px 16px",
                fontSize: 12,
                color: "#111827",
                background: isContactSubmitting ? "#f1f5f9" : "#ffffff",
                cursor: isContactSubmitting ? "not-allowed" : "pointer",
              }}
            >
              {contactSubmitLabel}
            </button>
            {contactSuccess ? (
              <span
                style={{
                  fontSize: 12,
                  color: "#16a34a",
                  ...descriptionTypography,
                }}
              >
                {contactSuccessMessage}
              </span>
            ) : null}
          </div>
        </contactFetcher.Form>
      </div>
    );
}
