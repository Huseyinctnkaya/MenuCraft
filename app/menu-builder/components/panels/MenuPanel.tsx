import type { Dispatch, MutableRefObject, ReactNode, SetStateAction } from "react";
import {
  ActionList,
  BlockStack,
  Box,
  Button,
  Card,
  Checkbox,
  ColorPicker,
  Divider,
  Icon,
  InlineStack,
  Popover,
  RangeSlider,
  Select,
  Text,
  TextField,
} from "@shopify/polaris";
import {
  ArrowLeftIcon,
  CollectionIcon,
  DeleteIcon,
  ImageIcon,
  PlusIcon,
  SearchIcon,
  UploadIcon,
  XCircleIcon,
} from "@shopify/polaris-icons";

import { ICON_PREFIX } from "../../icons";
import type {
  AddableItem,
  BlogSummary,
  BuilderSettings,
  CustomAddItem,
  HsbColor,
  IconPickerState,
  MenuItem,
  PageSummary,
  ProductSummary,
} from "../../types";
import { buildId, hexToHsb, hsbToHex, normalizeHexInput, updateItemById } from "../../utils";
import { CollectionPickerPanel } from "../pickers/CollectionPickerPanel";
import type { CollectionPickerItem } from "../pickers/CollectionPickerPanel";
import { ImagePickerPanel } from "../pickers/ImagePickerPanel";
import { ProductPickerPanel } from "../pickers/ProductPickerPanel";
import { SubmenuImagePickerPanel } from "../pickers/SubmenuImagePickerPanel";

type ItemColorPickerKey =
  | "customTextColor"
  | "customBackgroundColor"
  | "customTextHoverColor"
  | "customBackgroundHoverColor"
  | null;

export type MenuPanelDeps = {
  menuItems: MenuItem[];
  setMenuItems: Dispatch<SetStateAction<MenuItem[]>>;
  selectedItemId: string | null;
  selectedItem: MenuItem | null;
  menuView: "list" | "edit" | "add-root";
  setMenuView: Dispatch<SetStateAction<"list" | "edit" | "add-root">>;
  editDraft: MenuItem | null;
  setEditDraft: Dispatch<SetStateAction<MenuItem | null>>;
  updateEditDraft: <K extends keyof MenuItem>(key: K, value: MenuItem[K]) => void;
  updateEditDraftItemById: (id: string, updater: (item: MenuItem) => MenuItem) => void;
  removeEditDraftItemById: (id: string) => void;
  handleUpdateSelected: <K extends keyof MenuItem>(key: K, value: MenuItem[K]) => void;
  builderSettings: BuilderSettings;
  setBuilderSettings: Dispatch<SetStateAction<BuilderSettings>>;
  isProPlan: boolean;
  draggedItemId: string | null;
  draggedParentId: string | null;
  renderMenuTree: (item: MenuItem, depth?: number, parentItem?: MenuItem) => ReactNode;
  renderLinkPickerContent: (onSelect: (url: string, label: string) => void) => ReactNode;
  renderIconLibraryPanel: () => ReactNode;
  renderIconUploadPanel: () => ReactNode;
  iconPickerState: IconPickerState | null;
  openIconPicker: (
    target: IconPickerState["target"],
    itemId: string,
    mode: IconPickerState["mode"]
  ) => void;
  resolveCustomIconPreview: (icon?: string) => ReactNode;
  editIconMenuOpenId: string | null;
  setEditIconMenuOpenId: Dispatch<SetStateAction<string | null>>;
  linkPickerOpenId: string | null;
  setLinkPickerOpenId: Dispatch<SetStateAction<string | null>>;
  setLinkSearchQuery: Dispatch<SetStateAction<string>>;
  setLinkPickerCategory: Dispatch<SetStateAction<string | null>>;
  itemColorPickerKey: ItemColorPickerKey;
  setItemColorPickerKey: Dispatch<SetStateAction<ItemColorPickerKey>>;
  itemColorPickerHsb: HsbColor | null;
  setItemColorPickerHsb: Dispatch<SetStateAction<HsbColor | null>>;
  submenuColorPickerOpen: boolean;
  setSubmenuColorPickerOpen: Dispatch<SetStateAction<boolean>>;
  submenuColorPickerHsb: HsbColor | null;
  setSubmenuColorPickerHsb: Dispatch<SetStateAction<HsbColor | null>>;
  submenuImagePickerOpen: boolean;
  setSubmenuImagePickerOpen: Dispatch<SetStateAction<boolean>>;
  handleSubmenuBackgroundUpload: (file?: File | null) => void;
  imagePickerOpen: boolean;
  setImagePickerOpen: Dispatch<SetStateAction<boolean>>;
  imagePickerSelection: string | null;
  setImagePickerSelection: Dispatch<SetStateAction<string | null>>;
  currentImageUrl: string | null;
  handleImageUpload: (file?: File | null) => void;
  productPickerOpen: boolean;
  productPickerSearch: string;
  setProductPickerSearch: Dispatch<SetStateAction<string>>;
  productPickerSelection: Record<string, boolean>;
  productPickerTargetId: string | null;
  openProductPicker: (targetId?: string | null) => void;
  closeProductPicker: () => void;
  toggleProductSelection: (id: string) => void;
  applyProductSelection: () => void;
  collectionPickerOpen: boolean;
  collectionPickerSearch: string;
  setCollectionPickerSearch: Dispatch<SetStateAction<string>>;
  collectionPickerSelection: Record<string, boolean>;
  collectionPickerTargetId: string | null;
  openCollectionPicker: (targetId?: string | null) => void;
  closeCollectionPicker: () => void;
  toggleCollectionSelection: (id: string) => void;
  applyCollectionSelection: () => void;
  addItemsTab: "select" | "custom";
  setAddItemsTab: Dispatch<SetStateAction<"select" | "custom">>;
  addItemsSearch: string;
  setAddItemsSearch: Dispatch<SetStateAction<string>>;
  selectedAddItems: Record<string, AddableItem>;
  updateSelectableItem: (item: AddableItem, checked: boolean) => void;
  handleAddSelectedItems: () => void;
  customItems: CustomAddItem[];
  updateCustomItem: (id: string, updates: Partial<CustomAddItem>) => void;
  addCustomItemRow: () => void;
  handleAddCustomItems: () => void;
  customItemsScrollRef: MutableRefObject<HTMLDivElement | null>;
  handleOpenAddRoot: (targetId?: string | null) => void;
  handleCloseAddRoot: () => void;
  handleSubmenuTypeChange: (value: string) => void;
  handleSubmenuWidthAlignmentChange: (value: string) => void;
  handleFlyoutTypeChange: (value: string) => void;
  handleFlyoutAlignmentChange: (value: string) => void;
  resolveSubmenuWidthAlignment: (item: MenuItem) => string;
  products: ProductSummary[];
  collections: CollectionPickerItem[];
  blogs: BlogSummary[];
  pages: PageSummary[];
};

export function renderMenuPanelImpl(deps: MenuPanelDeps) {
  const {
    menuItems,
    setMenuItems,
    selectedItemId,
    selectedItem,
    menuView,
    setMenuView,
    editDraft,
    setEditDraft,
    updateEditDraft,
    updateEditDraftItemById,
    removeEditDraftItemById,
    handleUpdateSelected,
    builderSettings,
    setBuilderSettings,
    isProPlan,
    draggedItemId,
    draggedParentId,
    renderMenuTree,
    renderLinkPickerContent,
    renderIconLibraryPanel,
    renderIconUploadPanel,
    iconPickerState,
    openIconPicker,
    resolveCustomIconPreview,
    editIconMenuOpenId,
    setEditIconMenuOpenId,
    linkPickerOpenId,
    setLinkPickerOpenId,
    setLinkSearchQuery,
    setLinkPickerCategory,
    itemColorPickerKey,
    setItemColorPickerKey,
    itemColorPickerHsb,
    setItemColorPickerHsb,
    submenuColorPickerOpen,
    setSubmenuColorPickerOpen,
    submenuColorPickerHsb,
    setSubmenuColorPickerHsb,
    submenuImagePickerOpen,
    setSubmenuImagePickerOpen,
    handleSubmenuBackgroundUpload,
    imagePickerOpen,
    setImagePickerOpen,
    imagePickerSelection,
    setImagePickerSelection,
    currentImageUrl,
    handleImageUpload,
    productPickerOpen,
    productPickerSearch,
    setProductPickerSearch,
    productPickerSelection,
    productPickerTargetId,
    openProductPicker,
    closeProductPicker,
    toggleProductSelection,
    applyProductSelection,
    collectionPickerOpen,
    collectionPickerSearch,
    setCollectionPickerSearch,
    collectionPickerSelection,
    collectionPickerTargetId,
    openCollectionPicker,
    closeCollectionPicker,
    toggleCollectionSelection,
    applyCollectionSelection,
    addItemsTab,
    setAddItemsTab,
    addItemsSearch,
    setAddItemsSearch,
    selectedAddItems,
    updateSelectableItem,
    handleAddSelectedItems,
    customItems,
    updateCustomItem,
    addCustomItemRow,
    handleAddCustomItems,
    customItemsScrollRef,
    handleOpenAddRoot,
    handleCloseAddRoot,
    handleSubmenuTypeChange,
    handleSubmenuWidthAlignmentChange,
    handleFlyoutTypeChange,
    handleFlyoutAlignmentChange,
    resolveSubmenuWidthAlignment,
    products,
    collections,
    blogs,
    pages,
  } = deps;
    if (menuView === "edit" && selectedItem) {
      const editingItem = editDraft ?? selectedItem;
      const isRootItem = menuItems.some((item) => item.id === editingItem.id);
      const isImageBlock =
        editingItem.blockTemplate === "image" || editingItem.blockTemplate === "image2";
      const isContactBlock = editingItem.blockTemplate === "contact";
      const isLinkListBlock = editingItem.blockTemplate === "links";
      const isCollectionListBlock =
        editingItem.blockTemplate === "collection" && editingItem.role === "group";
      const isBlogBlock = editingItem.blockTemplate === "blogs" && editingItem.role === "group";
      const isLatestBlogBlock =
        editingItem.blockTemplate === "blogs-latest" && editingItem.role === "group";
      const isProductListBlock =
        (editingItem.blockTemplate === "product" ||
          editingItem.blockTemplate === "product-grid" ||
          editingItem.blockTemplate === "product-carousel" ||
          editingItem.blockTemplate === "product-grid-horizontal") &&
        editingItem.role === "group" &&
        Boolean(editingItem.children?.length);
      const isProductItem =
        editingItem.blockTemplate === "product" && editingItem.role === "item";
      const isCollectionItem =
        editingItem.blockTemplate === "collection" && editingItem.role === "item";
      const isProductBlock =
        (editingItem.blockTemplate === "product-horizontal" ||
          ((editingItem.blockTemplate === "product" ||
            editingItem.blockTemplate === "product-grid" ||
            editingItem.blockTemplate === "product-carousel" ||
            editingItem.blockTemplate === "product-grid-horizontal") &&
            editingItem.role === "group")) &&
        !isProductListBlock;
      const isHtmlBlock = editingItem.blockTemplate === "html";
      const isVisualBlock =
        isImageBlock ||
        isContactBlock ||
        isProductBlock ||
        isProductItem ||
        isCollectionItem ||
        isBlogBlock ||
        isLatestBlogBlock ||
        isHtmlBlock;
      const linkListItems = isLinkListBlock ? editingItem.children ?? [] : [];
      const productListItems = isProductListBlock ? editingItem.children ?? [] : [];
      const collectionListItems = isCollectionListBlock ? editingItem.children ?? [] : [];
      const itemColorOptions = [
        { label: "Text color", key: "customTextColor" },
        { label: "Background color", key: "customBackgroundColor" },
        { label: "Hover text color", key: "customTextHoverColor" },
        { label: "Hover background color", key: "customBackgroundHoverColor" },
      ] as const;
      const hasCustomItemColors = itemColorOptions.some(
        (option) => Boolean(editingItem[option.key])
      );
      if (iconPickerState?.target === "edit" || iconPickerState?.target === "settings") {
        return (
          <Card padding="0">
            {iconPickerState.mode === "library" ? renderIconLibraryPanel() : renderIconUploadPanel()}
          </Card>
        );
      }
      if (imagePickerOpen) {
        return <ImagePickerPanel
          imagePickerOpen={imagePickerOpen}
          setImagePickerOpen={setImagePickerOpen}
          imagePickerSelection={imagePickerSelection}
          setImagePickerSelection={setImagePickerSelection}
          builderSettings={builderSettings}
          setBuilderSettings={setBuilderSettings}
          currentImageUrl={currentImageUrl}
          handleImageUpload={handleImageUpload}
          updateEditDraft={updateEditDraft}
        />;
      }
      if (submenuImagePickerOpen) {
        return <SubmenuImagePickerPanel
          submenuImagePickerOpen={submenuImagePickerOpen}
          setSubmenuImagePickerOpen={setSubmenuImagePickerOpen}
          editDraft={editDraft}
          selectedItem={selectedItem}
          builderSettings={builderSettings}
          menuView={menuView}
          handleSubmenuBackgroundUpload={handleSubmenuBackgroundUpload}
          updateEditDraft={updateEditDraft}
          handleUpdateSelected={handleUpdateSelected}
        />;
      }
      if (productPickerOpen) {
        return <ProductPickerPanel
          productPickerOpen={productPickerOpen}
          productPickerSearch={productPickerSearch}
          setProductPickerSearch={setProductPickerSearch}
          productPickerSelection={productPickerSelection}
          productPickerTargetId={productPickerTargetId}
          products={products}
          toggleProductSelection={toggleProductSelection}
          closeProductPicker={closeProductPicker}
          applyProductSelection={applyProductSelection}
        />;
      }
      if (collectionPickerOpen) {
        return <CollectionPickerPanel
          collectionPickerOpen={collectionPickerOpen}
          collectionPickerSearch={collectionPickerSearch}
          setCollectionPickerSearch={setCollectionPickerSearch}
          collectionPickerSelection={collectionPickerSelection}
          collectionPickerTargetId={collectionPickerTargetId}
          collections={collections}
          toggleCollectionSelection={toggleCollectionSelection}
          closeCollectionPicker={closeCollectionPicker}
          applyCollectionSelection={applyCollectionSelection}
        />;
      }
      return (
        <div className="flex h-full flex-col border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 px-4 py-3">
            <InlineStack gap="200" blockAlign="center">
              <Button
                variant="plain"
                icon={ArrowLeftIcon}
                onClick={() => {
                  setEditDraft(null);
                  setMenuView("list");
                }}
                accessibilityLabel="Back"
              />
              <Text as="h2" variant="headingMd">
                Edit item
              </Text>
            </InlineStack>
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto px-4 py-4" onScroll={() => setLinkPickerOpenId(null)}>
            <BlockStack gap="400">
              <BlockStack gap="300">
                <Text as="h3" variant="headingSm">
                  General
                </Text>
                {!isVisualBlock && !isLinkListBlock && !isProductListBlock && !isCollectionListBlock ? (
                  <BlockStack gap="200">
                    <Text as="h4" variant="headingSm">
                      Icon
                    </Text>
                    <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 px-3 py-4 text-center">
                      <div className="flex flex-col items-center gap-3">
                        {editingItem.icon ? (
                          <>
                            <div className="flex h-12 w-12 items-center justify-center rounded-md bg-white shadow-sm">
                              {resolveCustomIconPreview(editingItem.icon)}
                            </div>
                            <Popover
                              active={editIconMenuOpenId === editingItem.id}
                              onClose={() => setEditIconMenuOpenId(null)}
                              activator={
                                <Button
                                  variant="secondary"
                                  disclosure
                                  onClick={() =>
                                    setEditIconMenuOpenId((prev) =>
                                      prev === editingItem.id ? null : editingItem.id
                                    )
                                  }
                                >
                                  Change
                                </Button>
                              }
                            >
                              <ActionList
                                items={[
                                  {
                                    content: "Select icon",
                                    icon: ImageIcon,
                                    onAction: () => {
                                      setEditIconMenuOpenId(null);
                                      openIconPicker("edit", editingItem.id, "library");
                                    },
                                  },
                                  {
                                    content: "Upload icon",
                                    icon: UploadIcon,
                                    onAction: () => {
                                      setEditIconMenuOpenId(null);
                                      openIconPicker("edit", editingItem.id, "upload");
                                    },
                                  },
                                  {
                                    content: "Remove",
                                    icon: DeleteIcon,
                                    destructive: true,
                                    onAction: () => {
                                      setEditIconMenuOpenId(null);
                                      updateEditDraft("icon", "");
                                    },
                                  },
                                ]}
                              />
                            </Popover>
                          </>
                        ) : (
                          <InlineStack align="center" blockAlign="center" gap="200">
                            <button
                              type="button"
                              className="text-sm font-medium text-blue-600 hover:text-blue-700"
                              onClick={() => openIconPicker("edit", editingItem.id, "library")}
                            >
                              Select icon
                            </button>
                            <Text as="span" variant="bodySm" tone="subdued">
                              or
                            </Text>
                            <button
                              type="button"
                              className="text-sm font-medium text-blue-600 hover:text-blue-700"
                              onClick={() => openIconPicker("edit", editingItem.id, "upload")}
                            >
                              Upload icon
                            </button>
                          </InlineStack>
                        )}
                      </div>
                    </div>
                    <Select
                      label="Icon width"
                      options={[
                        { label: "Automatic", value: "auto" },
                        { label: "Custom", value: "custom" },
                      ]}
                      value={editingItem.iconWidthMode ?? "auto"}
                      onChange={(value) => updateEditDraft("iconWidthMode", value as MenuItem["iconWidthMode"])}
                    />
                    {(editingItem.iconWidthMode ?? "auto") === "custom" ? (
                      <InlineStack gap="200" blockAlign="center">
                        <div style={{ flex: 1 }}>
                          <TextField
                            label="Width"
                            type="number"
                            value={String(editingItem.iconWidthValue ?? 50)}
                            onChange={(value) => {
                              const next = Number(value);
                              if (!Number.isFinite(next)) return;
                              updateEditDraft("iconWidthValue", Math.max(1, next));
                            }}
                            autoComplete="off"
                          />
                        </div>
                        <div style={{ width: 110 }}>
                          <Select
                            label="Unit"
                            options={[
                              { label: "%", value: "%" },
                              { label: "px", value: "px" },
                            ]}
                            value={editingItem.iconWidthUnit ?? "%"}
                            onChange={(value) =>
                              updateEditDraft("iconWidthUnit", value as MenuItem["iconWidthUnit"])
                            }
                          />
                        </div>
                      </InlineStack>
                    ) : null}
                  </BlockStack>
                ) : null}
                {isLinkListBlock ? (
                  <>
                    <InlineStack gap="200" blockAlign="center">
                      <div style={{ flex: 1 }}>
                        <RangeSlider
                          label="Width"
                          value={editingItem.linkWidth ?? 3}
                          min={1}
                          max={12}
                          onChange={(value) => updateEditDraft("linkWidth", value)}
                        />
                      </div>
                      <div style={{ width: 90 }}>
                        <TextField
                          label="Width"
                          labelHidden
                          type="number"
                          value={String(editingItem.linkWidth ?? 3)}
                          onChange={(value) => {
                            const next = Number(value);
                            if (!Number.isFinite(next)) return;
                            const clamped = Math.max(1, Math.min(12, next));
                            updateEditDraft("linkWidth", clamped);
                          }}
                          suffix="/12"
                          autoComplete="off"
                        />
                      </div>
                    </InlineStack>
                    <InlineStack gap="200" blockAlign="center">
                      <div style={{ flex: 1 }}>
                        <RangeSlider
                          label="Column count"
                          value={editingItem.linkColumns ?? 2}
                          min={1}
                          max={4}
                          onChange={(value) => updateEditDraft("linkColumns", value)}
                        />
                      </div>
                      <div style={{ width: 90 }}>
                        <TextField
                          label="Column count"
                          labelHidden
                          type="number"
                          value={String(editingItem.linkColumns ?? 2)}
                          onChange={(value) => {
                            const next = Number(value);
                            if (!Number.isFinite(next)) return;
                            const clamped = Math.max(1, Math.min(4, next));
                            updateEditDraft("linkColumns", clamped);
                          }}
                          autoComplete="off"
                        />
                      </div>
                    </InlineStack>
                  </>
                ) : isContactBlock ? (
                  <>
                    <InlineStack gap="200" blockAlign="center">
                      <div style={{ flex: 1 }}>
                        <RangeSlider
                          label="Width"
                          value={editingItem.imageWidth ?? 3}
                          min={1}
                          max={12}
                          onChange={(value) => updateEditDraft("imageWidth", value)}
                        />
                      </div>
                      <div style={{ width: 90 }}>
                        <TextField
                          label="Width"
                          labelHidden
                          type="number"
                          value={String(editingItem.imageWidth ?? 3)}
                          onChange={(value) => {
                            const next = Number(value);
                            if (!Number.isFinite(next)) return;
                            const clamped = Math.max(1, Math.min(12, next));
                            updateEditDraft("imageWidth", clamped);
                          }}
                          suffix="/12"
                          autoComplete="off"
                        />
                      </div>
                    </InlineStack>
                    <TextField
                      label="Title"
                      value={editingItem.contactTitle ?? ""}
                      onChange={(value) => updateEditDraft("contactTitle", value)}
                      autoComplete="off"
                    />
                    <TextField
                      label="Description"
                      value={editingItem.contactDescription ?? ""}
                      onChange={(value) => updateEditDraft("contactDescription", value)}
                      autoComplete="off"
                    />
                    <TextField
                      label="Name"
                      value={editingItem.contactNameLabel ?? ""}
                      onChange={(value) => updateEditDraft("contactNameLabel", value)}
                      autoComplete="off"
                    />
                    <TextField
                      label="Email"
                      value={editingItem.contactEmailLabel ?? ""}
                      onChange={(value) => updateEditDraft("contactEmailLabel", value)}
                      autoComplete="off"
                    />
                    <TextField
                      label="Phone number"
                      value={editingItem.contactPhoneLabel ?? ""}
                      onChange={(value) => updateEditDraft("contactPhoneLabel", value)}
                      autoComplete="off"
                    />
                    <TextField
                      label="Message"
                      value={editingItem.contactMessageLabel ?? ""}
                      onChange={(value) => updateEditDraft("contactMessageLabel", value)}
                      autoComplete="off"
                    />
                    <TextField
                      label="Send"
                      value={editingItem.contactSubmitLabel ?? ""}
                      onChange={(value) => updateEditDraft("contactSubmitLabel", value)}
                      autoComplete="off"
                    />
                    <TextField
                      label="Success message"
                      value={editingItem.contactSuccessMessage ?? ""}
                      onChange={(value) => updateEditDraft("contactSuccessMessage", value)}
                      autoComplete="off"
                    />
                  </>
                ) : isHtmlBlock ? (
                  <>
                    <InlineStack gap="200" blockAlign="center">
                      <div style={{ flex: 1 }}>
                        <RangeSlider
                          label="Width"
                          value={editingItem.imageWidth ?? 3}
                          min={1}
                          max={12}
                          onChange={(value) => updateEditDraft("imageWidth", value)}
                        />
                      </div>
                      <div style={{ width: 90 }}>
                        <TextField
                          label="Width"
                          labelHidden
                          type="number"
                          value={String(editingItem.imageWidth ?? 3)}
                          onChange={(value) => {
                            const next = Number(value);
                            if (!Number.isFinite(next)) return;
                            const clamped = Math.max(1, Math.min(12, next));
                            updateEditDraft("imageWidth", clamped);
                          }}
                          suffix="/12"
                          autoComplete="off"
                        />
                      </div>
                    </InlineStack>
                    <TextField
                      label="Title"
                      value={editingItem.label}
                      onChange={(value) => updateEditDraft("label", value)}
                      autoComplete="off"
                    />
                    <TextField
                      label="HTML"
                      value={editingItem.htmlContent ?? ""}
                      onChange={(value) => updateEditDraft("htmlContent", value)}
                      autoComplete="off"
                      multiline={8}
                    />
                  </>
                ) : isCollectionListBlock ? (
                  <>
                    <InlineStack gap="200" blockAlign="center">
                      <div style={{ flex: 1 }}>
                        <RangeSlider
                          label="Width"
                          value={editingItem.imageWidth ?? 3}
                          min={1}
                          max={12}
                          onChange={(value) => updateEditDraft("imageWidth", value)}
                        />
                      </div>
                      <div style={{ width: 90 }}>
                        <TextField
                          label="Width"
                          labelHidden
                          type="number"
                          value={String(editingItem.imageWidth ?? 3)}
                          onChange={(value) => {
                            const next = Number(value);
                            if (!Number.isFinite(next)) return;
                            const clamped = Math.max(1, Math.min(12, next));
                            updateEditDraft("imageWidth", clamped);
                          }}
                          suffix="/12"
                          autoComplete="off"
                        />
                      </div>
                    </InlineStack>
                  </>
                ) : isBlogBlock || isLatestBlogBlock ? (
                  <>
                    <InlineStack gap="200" blockAlign="center">
                      <div style={{ flex: 1 }}>
                        <RangeSlider
                          label="Width"
                          value={editingItem.imageWidth ?? 3}
                          min={1}
                          max={12}
                          onChange={(value) => updateEditDraft("imageWidth", value)}
                        />
                      </div>
                      <div style={{ width: 90 }}>
                        <TextField
                          label="Width"
                          labelHidden
                          type="number"
                          value={String(editingItem.imageWidth ?? 3)}
                          onChange={(value) => {
                            const next = Number(value);
                            if (!Number.isFinite(next)) return;
                            const clamped = Math.max(1, Math.min(12, next));
                            updateEditDraft("imageWidth", clamped);
                          }}
                          suffix="/12"
                          autoComplete="off"
                        />
                      </div>
                    </InlineStack>
                    <TextField
                      label="Heading"
                      value={editingItem.label}
                      onChange={(value) => updateEditDraft("label", value)}
                      autoComplete="off"
                    />
                    {isBlogBlock ? (
                      <Select
                        label="Blog type"
                        options={[
                          { label: "Select blog", value: "" },
                          ...blogs.map((blog) => ({ label: blog.title, value: blog.id })),
                        ]}
                        value={editingItem.blogIds?.[0] ?? ""}
                        onChange={(value) => {
                          const selectedBlog = blogs.find((blog) => blog.id === value);
                          updateEditDraft("blogIds", value ? [value] : []);
                          updateEditDraft("url", selectedBlog?.handle ? `/blogs/${selectedBlog.handle}` : "");
                        }}
                      />
                    ) : null}
                  </>
                ) : isProductListBlock ? (
                  <>
                    <InlineStack gap="200" blockAlign="center">
                      <div style={{ flex: 1 }}>
                        <RangeSlider
                          label="Width"
                          value={editingItem.productWidth ?? 3}
                          min={1}
                          max={12}
                          onChange={(value) => updateEditDraft("productWidth", value)}
                        />
                      </div>
                      <div style={{ width: 90 }}>
                        <TextField
                          label="Width"
                          labelHidden
                          type="number"
                          value={String(editingItem.productWidth ?? 3)}
                          onChange={(value) => {
                            const next = Number(value);
                            if (!Number.isFinite(next)) return;
                            const clamped = Math.max(1, Math.min(12, next));
                            updateEditDraft("productWidth", clamped);
                          }}
                          suffix="/12"
                          autoComplete="off"
                        />
                      </div>
                    </InlineStack>
                  </>
                ) : isCollectionItem ? (
                  <TextField
                    label="Title"
                    value={editingItem.label}
                    onChange={(value) => updateEditDraft("label", value)}
                    autoComplete="off"
                  />
                ) : isProductItem ? (
                  <TextField
                    label="Title"
                    value={editingItem.label}
                    onChange={(value) => updateEditDraft("label", value)}
                    autoComplete="off"
                  />
                ) : isProductBlock ? (
                  <>
                    <InlineStack gap="200" blockAlign="center">
                      <div style={{ flex: 1 }}>
                        <RangeSlider
                          label="Width"
                          value={editingItem.productWidth ?? 3}
                          min={1}
                          max={12}
                          onChange={(value) => updateEditDraft("productWidth", value)}
                        />
                      </div>
                      <div style={{ width: 90 }}>
                        <TextField
                          label="Width"
                          labelHidden
                          type="number"
                          value={String(editingItem.productWidth ?? 3)}
                          onChange={(value) => {
                            const next = Number(value);
                            if (!Number.isFinite(next)) return;
                            const clamped = Math.max(1, Math.min(12, next));
                            updateEditDraft("productWidth", clamped);
                          }}
                          suffix="/12"
                          autoComplete="off"
                        />
                      </div>
                    </InlineStack>
                    <BlockStack gap="200">
                      <Text as="h4" variant="headingSm">
                        Layout
                      </Text>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => updateEditDraft("productLayout", "image-top")}
                          className={`rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${(editingItem.productLayout ?? "image-top") === "image-top"
                            ? "border-blue-600 bg-blue-50 text-blue-700"
                            : "border-gray-300 text-gray-600 hover:border-gray-400"
                            }`}
                        >
                          Image on top
                        </button>
                        <button
                          type="button"
                          onClick={() => updateEditDraft("productLayout", "image-left")}
                          className={`rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${editingItem.productLayout === "image-left"
                            ? "border-blue-600 bg-blue-50 text-blue-700"
                            : "border-gray-300 text-gray-600 hover:border-gray-400"
                            }`}
                        >
                          Image on left
                        </button>
                      </div>
                    </BlockStack>
                  </>
                ) : (
                  <>
                    <TextField
                      label="Title"
                      value={editingItem.label}
                      onChange={(value) => updateEditDraft("label", value)}
                      onFocus={() => setLinkPickerOpenId(null)}
                      autoComplete="off"
                    />
                    <Popover
                      active={linkPickerOpenId === "editingItem"}
                      activator={
                        <TextField
                          label="Link"
                          value={editingItem.url}
                          onChange={(value) => updateEditDraft("url", value)}
                          onFocus={() => setLinkPickerOpenId("editingItem")}
                          autoComplete="off"
                          placeholder="Search or paste a link"
                          connectedRight={
                            <Button
                              icon={XCircleIcon}
                              onClick={() => updateEditDraft("url", "")}
                              accessibilityLabel="Clear link"
                            />
                          }
                        />
                      }
                      onClose={() => {
                        setLinkPickerOpenId(null);
                        setLinkSearchQuery("");
                        setLinkPickerCategory(null);
                      }}
                      autofocusTarget="none"
                    >
                      {renderLinkPickerContent((url, label) => {
                        updateEditDraft("url", url);
                        if (!editingItem.label) {
                          updateEditDraft("label", label);
                        }
                      })}
                    </Popover>
                    {editingItem.url ? (
                      <Checkbox
                        label="Open in new tab"
                        checked={Boolean(editingItem.openInNewTab)}
                        onChange={(value) => updateEditDraft("openInNewTab", value)}
                      />
                    ) : null}
                    <TextField
                      label="Description"
                      value={editingItem.description ?? ""}
                      onChange={(value) => updateEditDraft("description", value)}
                      onFocus={() => setLinkPickerOpenId(null)}
                      autoComplete="off"
                    />
                  </>
                )}
              </BlockStack>

              {isLinkListBlock ? (
                <>
                  <Divider />
                  <BlockStack gap="400">
                    {linkListItems.length ? (
                      linkListItems.map((child, index) => {
                        const isHeadingItem = Boolean(child.isHeading);
                        const itemTitle = isHeadingItem ? "Heading" : child.label || "Menu item";
                        return (
                          <BlockStack key={child.id} gap="300">
                            <InlineStack align="space-between" blockAlign="center">
                              <Text as="h3" variant="headingSm">
                                {itemTitle}
                              </Text>
                              <button
                                type="button"
                                onClick={() => removeEditDraftItemById(child.id)}
                                className="text-sm text-red-600 hover:text-red-700"
                              >
                                Remove
                              </button>
                            </InlineStack>
                            <Checkbox
                              label="Use as heading"
                              checked={isHeadingItem}
                              onChange={(value) => {
                                updateEditDraftItemById(child.id, (item) => ({
                                  ...item,
                                  isHeading: value,
                                }));
                              }}
                            />
                            <Text as="p" variant="bodySm" tone="subdued">
                              Icon
                            </Text>
                            <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 px-3 py-4 text-center">
                              <div className="flex flex-col items-center gap-3">
                                {child.icon ? (
                                  <>
                                    <div className="flex h-12 w-12 items-center justify-center rounded-md bg-white shadow-sm">
                                      {resolveCustomIconPreview(child.icon)}
                                    </div>
                                    <Popover
                                      active={editIconMenuOpenId === child.id}
                                      onClose={() => setEditIconMenuOpenId(null)}
                                      activator={
                                        <Button
                                          variant="secondary"
                                          disclosure
                                          onClick={() =>
                                            setEditIconMenuOpenId((prev) =>
                                              prev === child.id ? null : child.id
                                            )
                                          }
                                        >
                                          Change
                                        </Button>
                                      }
                                    >
                                      <ActionList
                                        items={[
                                          {
                                            content: "Select icon",
                                            icon: ImageIcon,
                                            onAction: () => {
                                              setEditIconMenuOpenId(null);
                                              openIconPicker("edit", child.id, "library");
                                            },
                                          },
                                          {
                                            content: "Upload icon",
                                            icon: UploadIcon,
                                            onAction: () => {
                                              setEditIconMenuOpenId(null);
                                              openIconPicker("edit", child.id, "upload");
                                            },
                                          },
                                          {
                                            content: "Remove",
                                            icon: DeleteIcon,
                                            destructive: true,
                                            onAction: () => {
                                              setEditIconMenuOpenId(null);
                                              updateEditDraftItemById(child.id, (item) => ({
                                                ...item,
                                                icon: "",
                                              }));
                                            },
                                          },
                                        ]}
                                      />
                                    </Popover>
                                  </>
                                ) : (
                                  <InlineStack align="center" blockAlign="center" gap="200">
                                    <button
                                      type="button"
                                      className="text-sm font-medium text-blue-600 hover:text-blue-700"
                                      onClick={() => openIconPicker("edit", child.id, "library")}
                                    >
                                      Select icon
                                    </button>
                                    <Text as="span" variant="bodySm" tone="subdued">
                                      or
                                    </Text>
                                    <button
                                      type="button"
                                      className="text-sm font-medium text-blue-600 hover:text-blue-700"
                                      onClick={() => openIconPicker("edit", child.id, "upload")}
                                    >
                                      Upload icon
                                    </button>
                                  </InlineStack>
                                )}
                              </div>
                            </div>
                            <TextField
                              label="Title"
                              value={child.label}
                              onChange={(value) =>
                                updateEditDraftItemById(child.id, (item) => ({ ...item, label: value }))
                              }
                              onFocus={() => setLinkPickerOpenId(null)}
                              autoComplete="off"
                            />
                            <Popover
                              active={linkPickerOpenId === child.id}
                              activator={
                                <TextField
                                  label="Link"
                                  value={child.url}
                                  onChange={(value) =>
                                    updateEditDraftItemById(child.id, (item) => ({ ...item, url: value }))
                                  }
                                  onFocus={() => setLinkPickerOpenId(child.id)}
                                  autoComplete="off"
                                  placeholder="Search or paste a link"
                                  connectedRight={
                                    <Button
                                      icon={XCircleIcon}
                                      onClick={() =>
                                        updateEditDraftItemById(child.id, (item) => ({ ...item, url: "" }))
                                      }
                                      accessibilityLabel="Clear link"
                                    />
                                  }
                                />
                              }
                              onClose={() => {
                                setLinkPickerOpenId(null);
                                setLinkSearchQuery("");
                                setLinkPickerCategory(null);
                              }}
                              autofocusTarget="none"
                            >
                              {renderLinkPickerContent((url, label) => {
                                updateEditDraftItemById(child.id, (item) => ({
                                  ...item,
                                  url,
                                  label: item.label || label,
                                }));
                              })}
                            </Popover>
                            {child.url ? (
                              <Checkbox
                                label="Open in new tab"
                                checked={Boolean(child.openInNewTab)}
                                onChange={(value) =>
                                  updateEditDraftItemById(child.id, (item) => ({ ...item, openInNewTab: value }))
                                }
                              />
                            ) : null}
                            <TextField
                              label="Description"
                              value={child.description ?? ""}
                              onChange={(value) =>
                                updateEditDraftItemById(child.id, (item) => ({ ...item, description: value }))
                              }
                              onFocus={() => setLinkPickerOpenId(null)}
                              autoComplete="off"
                            />
                            <InlineStack align="space-between" blockAlign="center">
                              <Text as="p" variant="bodySm">
                                Badge
                              </Text>
                              {isProPlan ? (
                                <button
                                  type="button"
                                  role="switch"
                                  aria-checked={Boolean(child.badgeEnabled)}
                                  onClick={() =>
                                    updateEditDraftItemById(child.id, (item) => ({
                                      ...item,
                                      badgeEnabled: !item.badgeEnabled,
                                    }))
                                  }
                                  className={`flex h-6 w-10 items-center rounded-full px-0.5 transition-colors ${child.badgeEnabled ? "bg-blue-600" : "bg-gray-200"
                                    }`}
                                >
                                  <span
                                    className={`h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${child.badgeEnabled ? "translate-x-4" : "translate-x-0"
                                      }`}
                                  />
                                </button>
                              ) : (
                                <div className="flex h-6 w-10 items-center rounded-full bg-gray-200 px-0.5">
                                  <span className="h-5 w-5 rounded-full bg-white shadow-sm" />
                                </div>
                              )}
                            </InlineStack>
                            {isProPlan ? (
                              child.badgeEnabled ? (
                                <BlockStack gap="200">
                                  <TextField
                                    label="Badge text"
                                    value={child.badgeText ?? ""}
                                    onChange={(value) =>
                                      updateEditDraftItemById(child.id, (item) => ({
                                        ...item,
                                        badgeText: value,
                                      }))
                                    }
                                    autoComplete="off"
                                  />
                                  <Select
                                    label="Badge type"
                                    options={[
                                      { label: "None", value: "none" },
                                      { label: "Sale", value: "sale" },
                                      { label: "Sold Out", value: "sold_out" },
                                    ]}
                                    value={child.badgeType ?? "none"}
                                    onChange={(value) => {
                                      const type = value as any;
                                      let newText = child.badgeText;
                                      if (type === "sale") newText = "Sale";
                                      else if (type === "sold_out") newText = "Sold Out";
                                      else if (type === "none") newText = "";

                                      updateEditDraftItemById(child.id, (item) => ({
                                        ...item,
                                        badgeType: type,
                                        badgeText: newText,
                                      }));
                                    }}
                                  />
                                </BlockStack>
                              ) : null
                            ) : (
                              <Text as="p" variant="bodySm" tone="subdued">
                                This option is available on the{" "}
                                <span className="text-blue-600">Pro plan</span>
                              </Text>
                            )}
                            {index < linkListItems.length - 1 ? <Divider /> : null}
                          </BlockStack>
                        );
                      })
                    ) : (
                      <Text as="p" variant="bodySm" tone="subdued">
                        No items yet.
                      </Text>
                    )}
                  </BlockStack>
                </>
              ) : null}

              {isProductListBlock ? (
                <>
                  <Divider />
                  <BlockStack gap="300">
                    <Text as="h3" variant="headingSm">
                      Items
                    </Text>
                    {productListItems.length ? (
                      (() => {
                        let productItemIndex = 0;
                        return productListItems.map((child, index) => {
                          const isHeadingItem = Boolean(child.isHeading);
                          const label = isHeadingItem ? "Heading" : `Product item ${++productItemIndex}`;
                          const selectedProduct = products.find((product) => product.id === child.productIds?.[0]);
                          return (
                            <BlockStack key={child.id} gap="300">
                              <InlineStack align="space-between" blockAlign="center">
                                <Text as="h4" variant="headingSm">
                                  {label}
                                </Text>
                                {(!isHeadingItem && productListItems.filter((i) => !i.isHeading).length <= 1) ? null : (
                                  <button
                                    type="button"
                                    onClick={() => removeEditDraftItemById(child.id)}
                                    className="text-sm font-medium text-red-600 hover:text-red-700"
                                  >
                                    Remove
                                  </button>
                                )}
                              </InlineStack>
                              {isHeadingItem ? (
                                <TextField
                                  label="Title"
                                  value={child.label}
                                  onChange={(value) =>
                                    updateEditDraftItemById(child.id, (item) => ({ ...item, label: value }))
                                  }
                                  autoComplete="off"
                                />
                              ) : child.productIds?.length ? (
                                <div className="rounded-xl border border-gray-200 bg-gray-100 p-3">
                                  <div className="flex items-center gap-3">
                                    <div className="h-12 w-12 overflow-hidden rounded-md border border-gray-200 bg-white">
                                      <img
                                        src={selectedProduct?.featuredImage?.url ?? "/product.png"}
                                        alt={selectedProduct?.featuredImage?.altText ?? selectedProduct?.title ?? ""}
                                        className="h-full w-full object-cover"
                                      />
                                    </div>
                                    <div className="flex-1 text-sm font-medium text-gray-700">
                                      {selectedProduct?.title ?? "Example Product Title"}
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        updateEditDraftItemById(child.id, (item) => ({
                                          ...item,
                                          productIds: [],
                                          url: "",
                                        }))
                                      }
                                      className="flex h-7 w-7 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                                      aria-label="Remove selection"
                                    >
                                      <span className="text-base leading-none">×</span>
                                    </button>
                                  </div>
                                  <div className="mt-3">
                                    <button
                                      type="button"
                                      onClick={() => openProductPicker(child.id)}
                                      className="w-full rounded-lg border border-gray-200 bg-white py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
                                    >
                                      Change
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => openProductPicker(child.id)}
                                  className="w-full rounded-lg border border-gray-200 bg-white py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
                                >
                                  Select product
                                </button>
                              )}
                              {index < productListItems.length - 1 ? <Divider /> : null}
                            </BlockStack>
                          );
                        });
                      })()
                    ) : (
                      <Text as="p" variant="bodySm" tone="subdued">
                        No items yet.
                      </Text>
                    )}
                    <div className="pt-3">
                      <Button
                        fullWidth
                        icon={PlusIcon}
                        onClick={() => {
                          const newItem: MenuItem = {
                            id: buildId(),
                            label: "Example Product Title",
                            url: "",
                            role: "item",
                            blockTemplate: "product",
                            productLayout: "image-top",
                            productIds: [],
                            icon: `${ICON_PREFIX}tag`,
                          };
                          updateEditDraftItemById(editingItem.id, (item) => ({
                            ...item,
                            children: [...(item.children ?? []), newItem],
                          }));
                        }}
                      >
                        Add product
                      </Button>
                    </div>
                  </BlockStack>
                </>
              ) : null}

              {isCollectionListBlock ? (
                <>
                  <Divider />
                  <BlockStack gap="300">
                    <Text as="h3" variant="headingSm">
                      Items
                    </Text>
                    {collectionListItems.length ? (
                      collectionListItems.map((child, index) => {
                        const selectedCollection = collections.find(
                          (collection) => collection.id === child.collectionIds?.[0]
                        );
                        return (
                          <BlockStack key={child.id} gap="300">
                            <InlineStack align="space-between" blockAlign="center">
                              <Text as="h4" variant="headingSm">
                                Collection item {index + 1}
                              </Text>
                              {collectionListItems.length <= 1 ? null : (
                                <button
                                  type="button"
                                  onClick={() => removeEditDraftItemById(child.id)}
                                  className="text-sm font-medium text-red-600 hover:text-red-700"
                                >
                                  Remove
                                </button>
                              )}
                            </InlineStack>
                            {child.collectionIds?.length ? (
                              <div className="rounded-xl border border-gray-200 bg-gray-100 p-3">
                                <div className="flex items-center gap-3">
                                  <div className="flex h-12 w-12 items-center justify-center rounded-md border border-gray-200 bg-white">
                                    <Icon source={CollectionIcon} tone="subdued" />
                                  </div>
                                  <div className="flex-1 text-sm font-medium text-gray-700">
                                    {selectedCollection?.title ?? "Collection title"}
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      updateEditDraftItemById(child.id, (item) => ({
                                        ...item,
                                        collectionIds: [],
                                        url: "",
                                      }))
                                    }
                                    className="flex h-7 w-7 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                                    aria-label="Remove selection"
                                  >
                                    <span className="text-base leading-none">×</span>
                                  </button>
                                </div>
                                <div className="mt-3">
                                  <button
                                    type="button"
                                    onClick={() => openCollectionPicker(child.id)}
                                    className="w-full rounded-lg border border-gray-200 bg-white py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
                                  >
                                    Change
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => openCollectionPicker(child.id)}
                                className="w-full rounded-lg border border-gray-200 bg-white py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
                              >
                                Select collection
                              </button>
                            )}
                            {index < collectionListItems.length - 1 ? <Divider /> : null}
                          </BlockStack>
                        );
                      })
                    ) : (
                      <Text as="p" variant="bodySm" tone="subdued">
                        No items yet.
                      </Text>
                    )}
                    <div className="pt-3">
                      <Button
                        fullWidth
                        icon={PlusIcon}
                        onClick={() => {
                          const newItem: MenuItem = {
                            id: buildId(),
                            label: "Collection item",
                            url: "",
                            role: "item",
                            blockTemplate: "collection",
                            collectionIds: [],
                            icon: `${ICON_PREFIX}collection`,
                          };
                          updateEditDraftItemById(editingItem.id, (item) => ({
                            ...item,
                            children: [...(item.children ?? []), newItem],
                          }));
                        }}
                      >
                        Add collection
                      </Button>
                    </div>
                  </BlockStack>
                </>
              ) : null}

              {isProductBlock || isProductItem ? (
                <>
                  <Divider />
                  <BlockStack gap="300">
                    <Text as="h3" variant="headingSm">
                      Product
                    </Text>
                    {editingItem.productIds?.length ? (
                      <div className="rounded-xl border border-gray-200 bg-gray-100 p-3">
                        <div className="flex items-center gap-3">
                          <div className="h-12 w-12 overflow-hidden rounded-md border border-gray-200 bg-white">
                            <img
                              src={
                                products.find((product) => product.id === editingItem.productIds?.[0])
                                  ?.featuredImage?.url ?? "/product.png"
                              }
                              alt=""
                              className="h-full w-full object-cover"
                            />
                          </div>
                          <div className="flex-1 text-sm font-medium text-gray-700">
                            {products.find((product) => product.id === editingItem.productIds?.[0])
                              ?.title ?? "Example Product Title"}
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              updateEditDraft("productIds", []);
                              updateEditDraft("url", "");
                            }}
                            className="flex h-7 w-7 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                            aria-label="Remove selection"
                          >
                            <span className="text-base leading-none">×</span>
                          </button>
                        </div>
                        <div className="mt-3">
                          <button
                            type="button"
                            onClick={() => openProductPicker(isProductItem ? editingItem.id : null)}
                            className="w-full rounded-lg border border-gray-200 bg-white py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
                          >
                            Change
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => openProductPicker(isProductItem ? editingItem.id : null)}
                        className="w-full rounded-lg border border-gray-200 bg-white py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
                      >
                        {isProductItem ? "Select product" : "Select products"}
                      </button>
                    )}
                  </BlockStack>
                </>
              ) : null}

              {isCollectionItem ? (
                <>
                  <Divider />
                  <BlockStack gap="300">
                    <Text as="h3" variant="headingSm">
                      Collection
                    </Text>
                    {editingItem.collectionIds?.length ? (
                      <div className="rounded-xl border border-gray-200 bg-gray-100 p-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-12 w-12 items-center justify-center rounded-md border border-gray-200 bg-white">
                            <Icon source={CollectionIcon} tone="subdued" />
                          </div>
                          <div className="flex-1 text-sm font-medium text-gray-700">
                            {collections.find((collection) => collection.id === editingItem.collectionIds?.[0])
                              ?.title ?? "Collection title"}
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              updateEditDraft("collectionIds", []);
                              updateEditDraft("url", "");
                            }}
                            className="flex h-7 w-7 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                            aria-label="Remove selection"
                          >
                            <span className="text-base leading-none">×</span>
                          </button>
                        </div>
                        <div className="mt-3">
                          <button
                            type="button"
                            onClick={() => openCollectionPicker(editingItem.id)}
                            className="w-full rounded-lg border border-gray-200 bg-white py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
                          >
                            Change
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => openCollectionPicker(editingItem.id)}
                        className="w-full rounded-lg border border-gray-200 bg-white py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
                      >
                        Select collection
                      </button>
                    )}
                  </BlockStack>
                </>
              ) : null}
              {!isVisualBlock && !isLinkListBlock && !isProductListBlock && !isCollectionListBlock && isRootItem ? (
                <>
                  <Divider />
                  <BlockStack gap="300">
                    <InlineStack align="space-between" blockAlign="center">
                      <Text as="h3" variant="headingSm">
                        Colors
                      </Text>
                      <button
                        type="button"
                        className={`text-sm ${isProPlan ? "text-gray-600 hover:text-gray-800" : "text-gray-400"}`}
                        disabled={!isProPlan || !hasCustomItemColors}
                        onClick={() => {
                          if (!isProPlan) return;
                          updateEditDraft("customTextColor", undefined);
                          updateEditDraft("customBackgroundColor", undefined);
                          updateEditDraft("customTextHoverColor", undefined);
                          updateEditDraft("customBackgroundHoverColor", undefined);
                          setItemColorPickerKey(null);
                          setItemColorPickerHsb(null);
                        }}
                      >
                        Clear settings
                      </button>
                    </InlineStack>
                    {isProPlan ? (
                      <div className="relative rounded-lg p-3">
                        {itemColorOptions.map((option) => {
                          const value = editingItem[option.key] ?? "";
                          const isOpen = itemColorPickerKey === option.key;
                          const displayValue = value ? value.toUpperCase() : "Transparent";
                          return (
                            <div key={option.key} className="relative py-2">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setItemColorPickerKey((prev) => {
                                        const next = prev === option.key ? null : option.key;
                                        if (next) {
                                          const current = value || "#FFFFFF";
                                          setItemColorPickerHsb(hexToHsb(current));
                                        } else {
                                          setItemColorPickerHsb(null);
                                        }
                                        return next;
                                      });
                                      setLinkPickerOpenId(null);
                                    }}
                                    className={`h-10 w-10 rounded-full border-2 shadow-sm ${isOpen ? "border-blue-500 ring-2 ring-blue-500/30" : "border-gray-300"}`}
                                    style={{
                                      backgroundColor: value || "transparent",
                                      backgroundImage: value
                                        ? undefined
                                        : "linear-gradient(45deg,#e5e7eb 25%,transparent 25%),linear-gradient(-45deg,#e5e7eb 25%,transparent 25%),linear-gradient(45deg,transparent 75%,#e5e7eb 75%),linear-gradient(-45deg,transparent 75%,#e5e7eb 75%)",
                                      backgroundSize: "10px 10px",
                                      backgroundPosition: "0 0, 0 5px, 5px -5px, -5px 0px",
                                    }}
                                    aria-label={option.label}
                                  />
                                  <Text as="span" variant="bodySm">
                                    {option.label}
                                  </Text>
                                </div>
                                <Text as="span" variant="bodySm" tone="subdued">
                                  {displayValue}
                                </Text>
                              </div>
                              {isOpen ? (
                                <div
                                  className="absolute left-0 top-full z-20 mt-2 w-64 rounded-lg border border-gray-200 bg-white p-3 shadow-lg"
                                  onMouseDown={(event) => event.stopPropagation()}
                                >
                                  <BlockStack gap="200">
                                    <ColorPicker
                                      color={itemColorPickerHsb ?? hexToHsb(value || "#FFFFFF")}
                                      onChange={(color) => {
                                        setItemColorPickerHsb({ ...color });
                                        updateEditDraft(option.key, hsbToHex(color) as MenuItem[typeof option.key]);
                                      }}
                                    />
                                    <TextField
                                      label="Hex"
                                      labelHidden
                                      value={itemColorPickerHsb ? hsbToHex(itemColorPickerHsb) : value || "#FFFFFF"}
                                      onChange={(next) => {
                                        if (!next.trim()) {
                                          updateEditDraft(option.key, undefined);
                                          setItemColorPickerHsb(null);
                                          return;
                                        }
                                        const normalized = normalizeHexInput(next);
                                        updateEditDraft(option.key, normalized as MenuItem[typeof option.key]);
                                        setItemColorPickerHsb(hexToHsb(normalized));
                                      }}
                                      autoComplete="off"
                                    />
                                  </BlockStack>
                                </div>
                              ) : null}
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="relative rounded-lg p-3">
                        <div className="pointer-events-none opacity-50">
                          {itemColorOptions.map((option) => (
                            <div key={option.key} className="flex items-center justify-between py-2">
                              <div className="flex items-center gap-3">
                                <span className="h-10 w-10 rounded-full border border-gray-300 bg-white" />
                                <Text as="span" variant="bodySm">
                                  {option.label}
                                </Text>
                              </div>
                              <Text as="span" variant="bodySm" tone="subdued">
                                Transparent
                              </Text>
                            </div>
                          ))}
                        </div>
                        <p className="pt-2 text-sm text-gray-500">Available on the Pro plan</p>
                      </div>
                    )}
                  </BlockStack>

                  <Divider />

                  <BlockStack gap="300">
                    <InlineStack align="space-between" blockAlign="center">
                      <Text as="h3" variant="headingSm">
                        Badge
                      </Text>
                      {isProPlan ? (
                        <button
                          type="button"
                          role="switch"
                          aria-checked={Boolean(editingItem.badgeEnabled)}
                          onClick={() =>
                            updateEditDraft("badgeEnabled", !Boolean(editingItem.badgeEnabled))
                          }
                          className={`flex h-6 w-10 items-center rounded-full px-0.5 transition-colors ${editingItem.badgeEnabled ? "bg-blue-600" : "bg-gray-200"
                            }`}
                        >
                          <span
                            className={`h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${editingItem.badgeEnabled ? "translate-x-4" : "translate-x-0"
                              }`}
                          />
                        </button>
                      ) : (
                        <div className="flex h-6 w-10 items-center rounded-full bg-gray-200 px-0.5">
                          <span className="h-5 w-5 rounded-full bg-white shadow-sm" />
                        </div>
                      )}
                    </InlineStack>
                    {isProPlan ? (
                      editingItem.badgeEnabled ? (
                        <BlockStack gap="200">
                          <TextField
                            label="Badge text"
                            value={editingItem.badgeText ?? ""}
                            onChange={(value) => updateEditDraft("badgeText", value)}
                            autoComplete="off"
                          />
                          <Select
                            label="Badge type"
                            options={[
                              { label: "None", value: "none" },
                              { label: "Sale", value: "sale" },
                              { label: "Sold Out", value: "sold_out" },
                            ]}
                            value={editingItem.badgeType ?? "none"}
                            onChange={(value) => {
                              const type = value as any;
                              let newText = editingItem.badgeText;
                              if (type === "sale") newText = "Sale";
                              else if (type === "sold_out") newText = "Sold Out";
                              else if (type === "none") newText = "";

                              setMenuItems((items) =>
                                updateItemById(items, editingItem.id, (item) => ({
                                  ...item,
                                  badgeType: type,
                                  badgeText: newText,
                                }))
                              );
                              setEditDraft({
                                ...editingItem,
                                badgeType: type,
                                badgeText: newText,
                              });
                            }}
                          />
                        </BlockStack>
                      ) : null
                    ) : (
                      <Text as="p" variant="bodySm" tone="subdued">
                        Available on the Pro plan
                      </Text>
                    )}
                  </BlockStack>

                  {editingItem.role === "menu" ? (
                    <>
                      <Divider />
                      <BlockStack gap="500">
                        <Text as="h3" variant="headingSm">
                          Submenu
                        </Text>
                        {editingItem.submenuType === "dropdown" ||
                          editingItem.submenuType === "horizontal-dropdown" ||
                          editingItem.submenuTemplate === "dropdown" ||
                          editingItem.submenuTemplate === "horizontal-dropdown" ||
                          editingItem.submenuTemplate === "custom-normal-dropdown" ? (
                          <>
                            <Select
                              label="Type"
                              options={[
                                { label: "None", value: "none" },
                                { label: "Vertical dropdown", value: "vertical" },
                                { label: "Horizontal dropdown", value: "horizontal" },
                              ]}
                              value={
                                editingItem.submenuType === "horizontal-dropdown"
                                  ? "horizontal"
                                  : editingItem.submenuType === "dropdown"
                                    ? "vertical"
                                    : "none"
                              }
                              onChange={handleFlyoutTypeChange}
                            />
                            {editingItem.submenuType && (
                              <BlockStack gap="200">
                                <Select
                                  label="Alignment"
                                  options={[
                                    { label: "Center", value: "center" },
                                    { label: "Left", value: "left" },
                                    { label: "Right", value: "right" },
                                  ]}
                                  value={editingItem.submenuContentAlign ?? "center"}
                                  onChange={handleFlyoutAlignmentChange}
                                />
                              </BlockStack>
                            )}
                          </>
                        ) : (
                          <>
                            <Select
                              label="Type"
                              options={[
                                { label: "None", value: "none" },
                                { label: "Mega menu", value: "mega" },
                              ]}
                              value={editingItem.submenuType ? "mega" : "none"}
                              onChange={handleSubmenuTypeChange}
                            />
                            {editingItem.submenuType !== undefined && (
                              <>
                                <BlockStack gap="200">
                                  <Select
                                    label="Width + alignment"
                                    options={[
                                      { label: "Full width", value: "full" },
                                      { label: "Center", value: "center" },
                                      { label: "Left", value: "left" },
                                      { label: "Right", value: "right" },
                                    ]}
                                    value={resolveSubmenuWidthAlignment(editingItem)}
                                    onChange={handleSubmenuWidthAlignmentChange}
                                  />
                                  {editingItem.submenuWidth === "content" && (
                                    <TextField
                                      label="Width"
                                      type="number"
                                      suffix="px"
                                      value={String(editingItem.submenuCustomWidth ?? 600)}
                                      onChange={(val) => updateEditDraft("submenuCustomWidth", parseInt(val) || 0)}
                                      autoComplete="off"
                                    />
                                  )}
                                </BlockStack>
                                <Select
                                  label="Content alignment"
                                  options={[
                                    { label: "Center", value: "center" },
                                    { label: "Left", value: "left" },
                                    { label: "Right", value: "right" },
                                    { label: "Space around", value: "space-around" },
                                    { label: "Space between", value: "space-between" },
                                    { label: "Space evenly", value: "space-evenly" },
                                  ]}
                                  value={editingItem.submenuContentAlign ?? "center"}
                                  onChange={(value) =>
                                    updateEditDraft("submenuContentAlign", value as MenuItem["submenuContentAlign"])
                                  }
                                />
                                <div className="relative">
                                  <InlineStack gap="400" blockAlign="center">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setSubmenuColorPickerOpen((prev) => {
                                          const next = !prev;
                                          if (next) {
                                            const current = editingItem.submenuBackgroundColor || "#FFFFFF";
                                            setSubmenuColorPickerHsb(hexToHsb(current));
                                          } else {
                                            setSubmenuColorPickerHsb(null);
                                          }
                                          return next;
                                        });
                                      }}
                                      className={`h-10 w-10 rounded-full border-2 shadow-sm ${submenuColorPickerOpen
                                        ? "border-blue-500 ring-2 ring-blue-500/30"
                                        : "border-gray-300"
                                        }`}
                                      style={{
                                        backgroundColor: editingItem.submenuBackgroundColor || "transparent",
                                        backgroundImage: editingItem.submenuBackgroundColor
                                          ? undefined
                                          : "linear-gradient(45deg,#e5e7eb 25%,transparent 25%),linear-gradient(-45deg,#e5e7eb 25%,transparent 25%),linear-gradient(45deg,transparent 75%,#e5e7eb 75%),linear-gradient(-45deg,transparent 75%,#e5e7eb 75%)",
                                        backgroundSize: "10px 10px",
                                        backgroundPosition: "0 0, 0 5px, 5px -5px, -5px 0px",
                                      }}
                                      aria-label="Background color"
                                    />
                                    <BlockStack gap="100">
                                      <Text as="p" variant="bodyMd">
                                        Background color
                                      </Text>
                                      <Text as="p" variant="bodySm" tone="subdued">
                                        {editingItem.submenuBackgroundColor
                                          ? editingItem.submenuBackgroundColor.toUpperCase()
                                          : "Transparent"}
                                      </Text>
                                    </BlockStack>
                                  </InlineStack>
                                  {submenuColorPickerOpen && (
                                    <div
                                      className="absolute left-0 top-full z-20 mt-2 w-64 rounded-lg border border-gray-200 bg-white p-3 shadow-lg"
                                      onMouseDown={(event) => event.stopPropagation()}
                                    >
                                      <BlockStack gap="200">
                                        <ColorPicker
                                          color={submenuColorPickerHsb ?? hexToHsb("#FFFFFF")}
                                          onChange={(color) => {
                                            setSubmenuColorPickerHsb({ ...color });
                                            updateEditDraft("submenuBackgroundColor", hsbToHex(color));
                                          }}
                                        />
                                        <TextField
                                          label="Hex"
                                          labelHidden
                                          value={
                                            submenuColorPickerHsb
                                              ? hsbToHex(submenuColorPickerHsb)
                                              : editingItem.submenuBackgroundColor || "#FFFFFF"
                                          }
                                          onChange={(next) => {
                                            const normalized = normalizeHexInput(next);
                                            updateEditDraft("submenuBackgroundColor", normalized);
                                            setSubmenuColorPickerHsb(hexToHsb(normalized));
                                          }}
                                          autoComplete="off"
                                        />
                                      </BlockStack>
                                    </div>
                                  )}
                                </div>
                                <div>
                                  <Text as="p" variant="bodyMd" fontWeight="semibold">
                                    Background image
                                  </Text>
                                  {!editingItem.submenuBackgroundImage ? (
                                    <div className="mt-2 flex h-28 w-full items-center justify-center rounded-lg border border-dashed border-gray-300 bg-gray-50">
                                      <Button variant="secondary" onClick={() => setSubmenuImagePickerOpen(true)}>
                                        Select photo
                                      </Button>
                                    </div>
                                  ) : null}
                                  {editingItem.submenuBackgroundImage ? (
                                    <div className="mt-2 overflow-hidden rounded-lg border border-gray-300 bg-white">
                                      <div className="relative flex h-40 w-full items-center justify-center bg-gray-50 p-4">
                                        <img
                                          src={editingItem.submenuBackgroundImage}
                                          alt="Background preview"
                                          className="h-full w-auto object-contain shadow-sm rounded-sm"
                                        />
                                      </div>
                                      <div className="flex border-t border-gray-200 divide-x divide-gray-200">
                                        <button
                                          type="button"
                                          onClick={() => setSubmenuImagePickerOpen(true)}
                                          className="flex-1 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                                        >
                                          Change
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => updateEditDraft("submenuBackgroundImage", "")}
                                          className="flex-1 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                                        >
                                          Remove
                                        </button>
                                      </div>
                                    </div>
                                  ) : null}
                                </div>
                              </>
                            )}
                          </>
                        )}
                      </BlockStack>
                    </>
                  ) : null}
                </>
              ) : null}

              {isImageBlock ? (
                <>
                  <Divider />
                  <BlockStack gap="300">
                    <Text as="h3" variant="headingSm">
                      Image
                    </Text>
                    <div>
                      <Text as="p" variant="bodySm" tone="subdued">
                        Image
                      </Text>
                      {editingItem.imageUrl ? (
                        <div className="mt-2 overflow-hidden rounded-xl border border-gray-200 bg-white">
                          <div className="bg-gray-50 px-4 py-5">
                            <img
                              src={editingItem.imageUrl}
                              alt=""
                              className="mx-auto h-40 w-full object-contain"
                            />
                          </div>
                          <div className="flex border-t border-gray-200">
                            <button
                              type="button"
                              onClick={() => setImagePickerOpen(true)}
                              className="flex-1 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                            >
                              Change
                            </button>
                            <div className="w-px bg-gray-200" />
                            <button
                              type="button"
                              onClick={() => updateEditDraft("imageUrl", "")}
                              className="flex-1 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="mt-2 flex h-28 w-full items-center justify-center rounded-lg border border-dashed border-gray-300 bg-gray-50">
                          <Button variant="secondary" onClick={() => setImagePickerOpen(true)}>
                            Select photo
                          </Button>
                        </div>
                      )}
                    </div>
                    <InlineStack gap="200" blockAlign="center">
                      <div style={{ flex: 1 }}>
                        <RangeSlider
                          label="Width"
                          value={editingItem.imageWidth ?? 3}
                          min={1}
                          max={12}
                          onChange={(value) => updateEditDraft("imageWidth", value)}
                        />
                      </div>
                      <div style={{ width: 90 }}>
                        <TextField
                          label="Width"
                          labelHidden
                          type="number"
                          value={String(editingItem.imageWidth ?? 3)}
                          onChange={(value) => {
                            const next = Number(value);
                            if (!Number.isFinite(next)) return;
                            const clamped = Math.max(1, Math.min(12, next));
                            updateEditDraft("imageWidth", clamped);
                          }}
                          suffix="/12"
                          autoComplete="off"
                        />
                      </div>
                    </InlineStack>
                    <Checkbox
                      label="No fill"
                      checked={Boolean(editingItem.imageNoFill)}
                      onChange={(value) => updateEditDraft("imageNoFill", value)}
                    />
                  </BlockStack>
                </>
              ) : null}

              <Divider />

              <BlockStack gap="300">
                <Text as="h3" variant="headingSm">
                  Visibility
                </Text>
                <Checkbox
                  label="Hide on desktop"
                  checked={Boolean(editingItem.hideOnDesktop)}
                  onChange={(value) => updateEditDraft("hideOnDesktop", value)}
                />
                <Checkbox
                  label="Hide on mobile"
                  checked={Boolean(editingItem.hideOnMobile)}
                  onChange={(value) => updateEditDraft("hideOnMobile", value)}
                />
                <Checkbox
                  label="Hide when logged in"
                  checked={Boolean(editingItem.hideWhenLoggedIn)}
                  onChange={(value) => updateEditDraft("hideWhenLoggedIn", value)}
                />
                <Checkbox
                  label="Show only when logged out"
                  checked={Boolean(editingItem.showWhenLoggedOut)}
                  onChange={(value) => updateEditDraft("showWhenLoggedOut", value)}
                />
                <Checkbox
                  label="Publish scheduling"
                  checked={Boolean(editingItem.schedulePublish)}
                  onChange={(value) => updateEditDraft("schedulePublish", value)}
                />
              </BlockStack>

              <Divider />

              <BlockStack gap="300">
                <Text as="h3" variant="headingSm">
                  Advanced
                </Text>
                <TextField
                  label="Extra class name"
                  value={editingItem.extraClassName ?? ""}
                  onChange={(value) => updateEditDraft("extraClassName", value)}
                  autoComplete="off"
                />
              </BlockStack>
            </BlockStack>
          </div>

          <div className="border-t border-gray-200 bg-white px-4 py-3">
            <InlineStack align="end" gap="200">
              <Button
                variant="tertiary"
                onClick={() => {
                  setEditDraft(null);
                  setMenuView("list");
                }}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={() => {
                  if (editDraft && selectedItemId) {
                    setMenuItems((items) =>
                      updateItemById(items, selectedItemId, () => ({ ...editDraft }))
                    );
                  }
                  setEditDraft(null);
                  setMenuView("list");
                }}
              >
                Apply changes
              </Button>
            </InlineStack>
          </div>
        </div>
      );
    }

    if (menuView === "add-root") {
      const staticItems: AddableItem[] = [
        { id: "static-home", label: "Home", url: "/" },
        { id: "static-all-collections", label: "All collections", url: "/collections" },
        { id: "static-all-products", label: "All products", url: "/collections/all" },
        { id: "static-search", label: "Search", url: "/search" },
      ];
      const collectionItems: AddableItem[] = collections.map((collection) => ({
        id: `collection-${collection.id}`,
        label: collection.title,
        url: `/collections/${collection.handle}`,
      }));
      const pageItems: AddableItem[] = pages.map((page) => ({
        id: `page-${page.id}`,
        label: page.title,
        url: `/pages/${page.handle}`,
      }));
      const productItems: AddableItem[] = products.map((product) => ({
        id: `product-${product.id}`,
        label: product.title,
        url: `/products/${product.handle}`,
      }));
      const searchValue = addItemsSearch.trim().toLowerCase();
      const filterItems = (items: AddableItem[]) =>
        searchValue ? items.filter((item) => item.label.toLowerCase().includes(searchValue)) : items;
      const selectedCount = Object.keys(selectedAddItems).length;
      const hasCustomItems = customItems.some((item) => item.title.trim().length > 0);
      const isSelectTab = addItemsTab === "select";
      const showFooter = !iconPickerState;
      const footerDisabled = isSelectTab ? selectedCount === 0 : !hasCustomItems;
      const handleFooterAction = isSelectTab ? handleAddSelectedItems : handleAddCustomItems;

      const renderCheckboxItem = (item: AddableItem) => (
        <Checkbox
          key={item.id}
          label={item.label}
          checked={Boolean(selectedAddItems[item.id])}
          onChange={(checked) => updateSelectableItem(item, checked)}
        />
      );

      if (iconPickerState) {
        return (
          <div className="flex min-h-0 flex-1 flex-col bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
            {iconPickerState.mode === "library" ? renderIconLibraryPanel() : renderIconUploadPanel()}
          </div>
        );
      }
      if (imagePickerOpen) {
        return (
          <div className="flex min-h-0 flex-1 flex-col bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
            {<ImagePickerPanel
          imagePickerOpen={imagePickerOpen}
          setImagePickerOpen={setImagePickerOpen}
          imagePickerSelection={imagePickerSelection}
          setImagePickerSelection={setImagePickerSelection}
          builderSettings={builderSettings}
          setBuilderSettings={setBuilderSettings}
          currentImageUrl={currentImageUrl}
          handleImageUpload={handleImageUpload}
          updateEditDraft={updateEditDraft}
        />}
          </div>
        );
      }

      return (
        <div className="flex min-h-0 flex-1 flex-col bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
          <div className="flex min-h-0 flex-1 flex-col">
            <div className="sticky top-0 z-30 border-b border-gray-200 bg-white">
              <Box padding="400">
                <InlineStack gap="200" blockAlign="center">
                  <Button
                    variant="plain"
                    icon={ArrowLeftIcon}
                    onClick={handleCloseAddRoot}
                    accessibilityLabel="Back"
                  />
                  <Text as="h2" variant="headingMd">
                    Create menu items
                  </Text>
                </InlineStack>
              </Box>
              <Divider />
              <Box padding="400">
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setAddItemsTab("select")}
                    className={`rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${addItemsTab === "select"
                      ? "border-blue-600 bg-blue-50 text-blue-700"
                      : "border-gray-300 text-gray-600 hover:border-gray-400"
                      }`}
                  >
                    Select items
                  </button>
                  <button
                    type="button"
                    onClick={() => setAddItemsTab("custom")}
                    className={`rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${addItemsTab === "custom"
                      ? "border-blue-600 bg-blue-50 text-blue-700"
                      : "border-gray-300 text-gray-600 hover:border-gray-400"
                      }`}
                  >
                    Add item
                  </button>
                </div>
              </Box>
            </div>
            <div ref={customItemsScrollRef} className="relative z-0 flex-1 min-h-0 overflow-y-auto" onScroll={() => setLinkPickerOpenId(null)}>
              {isSelectTab ? (
                <>
                  <Box padding="400">
                    <TextField
                      label="Search"
                      labelHidden
                      value={addItemsSearch}
                      onChange={setAddItemsSearch}
                      placeholder="Search"
                      autoComplete="off"
                      prefix={<Icon source={SearchIcon} tone="subdued" />}
                    />
                  </Box>
                  <Divider />
                  <div className="px-4 py-4">
                    <BlockStack gap="300">
                      <BlockStack gap="200">
                        {filterItems(staticItems).map(renderCheckboxItem)}
                      </BlockStack>
                      <Divider />
                      <BlockStack gap="200">
                        <Text as="h3" variant="headingSm">
                          Collections
                        </Text>
                        <BlockStack gap="200">
                          {filterItems(collectionItems).map(renderCheckboxItem)}
                        </BlockStack>
                      </BlockStack>
                      <Divider />
                      <BlockStack gap="200">
                        <Text as="h3" variant="headingSm">
                          Pages
                        </Text>
                        <BlockStack gap="200">
                          {filterItems(pageItems).map(renderCheckboxItem)}
                        </BlockStack>
                      </BlockStack>
                      <Divider />
                      <BlockStack gap="200">
                        <Text as="h3" variant="headingSm">
                          Products
                        </Text>
                        <BlockStack gap="200">
                          {filterItems(productItems).map(renderCheckboxItem)}
                        </BlockStack>
                      </BlockStack>
                    </BlockStack>
                  </div>
                </>
              ) : iconPickerState ? (
                iconPickerState.mode === "library"
                  ? renderIconLibraryPanel()
                  : renderIconUploadPanel()
              ) : (
                <div className="px-4 py-4 pb-2">
                  <BlockStack gap="400">
                    {customItems.map((item, index) => (
                      <div
                        key={item.id}
                        className={linkPickerOpenId === item.id ? "relative z-[120]" : "relative"}
                      >
                        <BlockStack gap="300">
                          <BlockStack gap="200">
                            <Text as="h3" variant="headingSm">
                              Icon
                            </Text>
                            <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 px-3 py-4 text-center">
                              <div className="flex flex-col items-center gap-3">
                                {item.icon ? (
                                  <div className="flex h-12 w-12 items-center justify-center rounded-md bg-white shadow-sm">
                                    {resolveCustomIconPreview(item.icon)}
                                  </div>
                                ) : null}
                                <InlineStack align="center" blockAlign="center" gap="200">
                                  <button
                                    type="button"
                                    className="text-sm font-medium text-blue-600 hover:text-blue-700"
                                    onClick={() => openIconPicker("custom", item.id, "library")}
                                  >
                                    Select icon
                                  </button>
                                  <Text as="span" variant="bodySm" tone="subdued">
                                    or
                                  </Text>
                                  <button
                                    type="button"
                                    className="text-sm font-medium text-blue-600 hover:text-blue-700"
                                    onClick={() => openIconPicker("custom", item.id, "upload")}
                                  >
                                    Upload icon
                                  </button>
                                </InlineStack>
                                {item.icon ? (
                                  <div className="flex justify-center">
                                    <button
                                      type="button"
                                      className="text-sm font-medium text-red-600 hover:text-red-700"
                                      onClick={() => updateCustomItem(item.id, { icon: "" })}
                                    >
                                      Remove icon
                                    </button>
                                  </div>
                                ) : null}
                              </div>
                            </div>
                          </BlockStack>
                          <TextField
                            label="Title"
                            value={item.title}
                            onChange={(value) => updateCustomItem(item.id, { title: value })}
                            onFocus={() => setLinkPickerOpenId(null)}
                            autoComplete="off"
                          />
                          <Popover
                            active={linkPickerOpenId === item.id}
                            activator={
                              <TextField
                                label="Link"
                                value={item.url}
                                onChange={(value) => updateCustomItem(item.id, { url: value })}
                                onFocus={() => setLinkPickerOpenId(item.id)}
                                autoComplete="off"
                                placeholder="Search or paste a link"
                                connectedRight={
                                  <Button
                                    icon={XCircleIcon}
                                    onClick={() => updateCustomItem(item.id, { url: "" })}
                                    accessibilityLabel="Clear link"
                                  />
                                }
                              />
                            }
                            onClose={() => {
                              setLinkPickerOpenId(null);
                              setLinkSearchQuery("");
                              setLinkPickerCategory(null);
                            }}
                            autofocusTarget="none"
                          >
                            {renderLinkPickerContent((url, label) => {
                              updateCustomItem(item.id, {
                                url,
                                title: item.title || label,
                              });
                            })}
                          </Popover>
                          <TextField
                            label="Description"
                            value={item.description}
                            onChange={(value) => updateCustomItem(item.id, { description: value })}
                            onFocus={() => setLinkPickerOpenId(null)}
                            autoComplete="off"
                          />
                          {index < customItems.length - 1 ? <Divider /> : null}
                        </BlockStack>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={addCustomItemRow}
                      className="text-sm font-medium text-blue-600 hover:text-blue-700"
                    >
                      + New item
                    </button>
                  </BlockStack>
                </div>
              )}
            </div>
            {showFooter ? (
              <div className="sticky bottom-0 z-30 shrink-0 border-t border-gray-200 bg-white px-4 py-3">
                <InlineStack align="end" gap="200">
                  <Button variant="tertiary" onClick={handleCloseAddRoot}>
                    Cancel
                  </Button>
                  <Button variant="primary" onClick={handleFooterAction} disabled={footerDisabled}>
                    Add
                  </Button>
                </InlineStack>
              </div>
            ) : null}
          </div>

        </div>
      );
    }

    return (
      <div className="flex flex-col h-full bg-white">
        <div className="flex flex-col border-b border-gray-200 px-4 py-3 shrink-0">
          <Text as="h2" variant="headingSm">
            Menu items
          </Text>
          <Text as="p" variant="bodySm" tone="subdued">
            Drag to reorder items.
          </Text>
        </div>
        <div className="p-2 flex-1 overflow-y-auto min-h-0">

          <div
            className={`rounded-lg border-2 border-dotted transition-all duration-150 ${draggedItemId && draggedParentId === null ? "border-blue-500 bg-blue-50/40 p-2" : "border-transparent"
              }`}
          >
            <BlockStack gap="100">
              {menuItems.map((item) => renderMenuTree(item))}
            </BlockStack>
          </div>
          <Box>
            <button
              type="button"
              onClick={() => handleOpenAddRoot()}
              className="flex w-full items-center gap-2 rounded-lg px-2 py-1 text-sm font-medium text-blue-600 hover:bg-gray-100"
            >
              <span className="flex h-5 w-5 items-center justify-center rounded-full border-2 border-blue-600 text-blue-600 text-xs leading-none">
                +
              </span>
              Add item
            </button>
          </Box>
        </div>
      </div>
    );
}
