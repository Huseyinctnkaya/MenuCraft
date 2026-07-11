import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import type { LinksFunction } from "@remix-run/node";
import { useFetcher, useLocation, useNavigate, useLoaderData, useRouteLoaderData } from "@remix-run/react";
import { createPortal } from "react-dom";
import createApp from "@shopify/app-bridge";
import { Fullscreen } from "@shopify/app-bridge/actions";
import {
  Badge,
  BlockStack,
  Box,
  Button,
  ButtonGroup,
  ActionList,
  Card,
  ColorPicker,
  Checkbox,
  ChoiceList,
  Divider,
  DropZone,
  InlineStack,
  Modal,
  Popover,
  RangeSlider,
  Select,
  Text,
  TextField,
  Icon,
  Link,
} from "@shopify/polaris";
import {
  ArrowLeftIcon,
  ArrowsOutHorizontalIcon,
  BlogIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CodeIcon,
  CollectionIcon,
  CollectionListIcon,
  DesktopIcon,
  FormsIcon,
  DragHandleIcon,
  DuplicateIcon,
  EditIcon,
  DeleteIcon,
  ImageIcon,
  HomeIcon,
  MenuIcon,
  MobileIcon,
  PaintBrushRoundIcon,
  PlusIcon,
  UploadIcon,
  PageIcon,
  ProductIcon,
  ProductListIcon,
  SearchIcon,
  SettingsIcon,
  TextAlignCenterIcon,
  TextAlignLeftIcon,
  TextAlignRightIcon,
  TextFontListIcon,
  TextIcon,
  XCircleIcon,
} from "@shopify/polaris-icons";
import polarisStyles from "@shopify/polaris/build/esm/styles.css?url";
import type { loader as appLoader } from "./app";
import { ALL_BILLING_PLAN_NAMES, getPlanSelection } from "../config/billing";
import type {
  AddableItem,
  BlogSummary,
  BlockTemplateId,
  BuilderSettings,
  CustomAddItem,
  FontPickerState,
  HsbColor,
  IconPickerState,
  LatestArticleSummary,
  MenuItem,
  PageSummary,
  ProductSummary,
  RailPanel,
  SubmenuTemplateId,
  ThemeSettings,
} from "../menu-builder/types";
import {
  BLOCK_TEMPLATES,
  DEFAULT_BUILDER_SETTINGS,
  FONT_OPTIONS,
  LINK_SUGGESTIONS,
  SUBMENU_TEMPLATES,
  buildDefaultMenuItems,
} from "../menu-builder/constants";
import { ICON_LIBRARY, ICON_LIBRARY_BY_ID, ICON_PREFIX } from "../menu-builder/icons";
import {
  addChildById,
  applySidebarDefaultExpansion,
  buildId,
  buildMenuFingerprint,
  duplicateItemById,
  filterVisibleItemsRecursive,
  findItemInTree,
  findItemPath,
  hexToHsb,
  hsbToHex,
  normalizeHexInput,
  normalizeMultiBlocks,
  removeItemById,
  updateItemById,
} from "../menu-builder/utils";
import {
  buildCollectionListItems,
  buildDropdownMenuItems,
  buildEasyColumnLinkItems,
  buildEasyColumnWithIcons,
  buildHorizontalProductGridItems,
  buildMultiBlockLinkGroups,
  buildMultiBlockPreset,
  buildProductCarouselItems,
  buildProductGridItems,
  buildProductListItems,
  buildSimpleLeftTabsItems,
  buildSimpleRightTabsItems,
  buildSimpleTopTabsItems,
  buildTwoTopTabsItems,
  buildThreeTopTabsItems,
  buildThreeLevelTabsItems,
  buildTwoLevelTabsItems,
  buildTwoNestedTabsRightItems,
  buildThreeNestedTabsRightItems,
  buildCustomNormalDropdownItems,
  buildThreeColumnLinkItems,
  buildTwoColumnLinkItems,
} from "../menu-builder/presets";
import {
  HOVER_PREVIEW_CLEAR_DELAY_MS,
  HOVER_PREVIEW_DELAY_MS,
  PREVIEW_IMAGE_SOURCES,
} from "../menu-builder/preview-images";
import { CodePanel } from "../menu-builder/components/panels/CodePanel";
import { ColorsPanel } from "../menu-builder/components/panels/ColorsPanel";
import { TypographyPanel } from "../menu-builder/components/panels/TypographyPanel";
import { SettingsPanel } from "../menu-builder/components/panels/SettingsPanel";
import { SubmenuImagePickerPanel } from "../menu-builder/components/pickers/SubmenuImagePickerPanel";
import { ProductPickerPanel } from "../menu-builder/components/pickers/ProductPickerPanel";
import { CollectionPickerPanel } from "../menu-builder/components/pickers/CollectionPickerPanel";
import { ImagePickerPanel } from "../menu-builder/components/pickers/ImagePickerPanel";
import { IconLibraryPanel } from "../menu-builder/components/pickers/IconLibraryPanel";
import { IconUploadPanel } from "../menu-builder/components/pickers/IconUploadPanel";
import { LinkPickerContent } from "../menu-builder/components/pickers/LinkPickerContent";
import { renderTemplatePreviewCard } from "../menu-builder/components/templates/TemplatePreviewCard";
import { renderBlockTemplatePreviewCard } from "../menu-builder/components/templates/BlockTemplatePreviewCard";
import { SubmenuTemplatePreviewPanel } from "../menu-builder/components/templates/SubmenuTemplatePreviewPanel";
import { BlockTemplatePreviewPanel } from "../menu-builder/components/templates/BlockTemplatePreviewPanel";
import { BlockTemplatePicker } from "../menu-builder/components/templates/BlockTemplatePicker";
import { SubmenuTemplatePicker } from "../menu-builder/components/templates/SubmenuTemplatePicker";
import type { PreviewBlockDeps } from "../menu-builder/components/preview/blocks/deps";
import { renderImageBlockImpl } from "../menu-builder/components/preview/blocks/ImageBlock";
import { renderContactBlockImpl } from "../menu-builder/components/preview/blocks/ContactBlock";
import { renderHtmlBlockImpl } from "../menu-builder/components/preview/blocks/HtmlBlock";
import { renderProductBlockImpl } from "../menu-builder/components/preview/blocks/ProductBlock";
import { renderCollectionBlockImpl } from "../menu-builder/components/preview/blocks/CollectionBlock";
import { renderBlogBlockImpl } from "../menu-builder/components/preview/blocks/BlogBlock";
import { renderSpaceBlockImpl } from "../menu-builder/components/preview/blocks/SpaceBlock";
import {
  renderLinkListBlockImpl,
  renderLinkListToolbarButtonsImpl,
} from "../menu-builder/components/preview/blocks/LinkListBlock";
import { renderFloatingLinkListToolbarImpl } from "../menu-builder/components/preview/FloatingLinkListToolbar";
import { renderElementGroupMasonryImpl } from "../menu-builder/components/preview/ElementGroupMasonry";
import {
  renderMegaPanelImpl,
  type MegaPanelDeps,
} from "../menu-builder/components/preview/MegaPanel";
import type { MobilePanelDeps } from "../menu-builder/components/preview/mobile-deps";
import { renderMobileBlockGroupImpl } from "../menu-builder/components/preview/MobileBlockGroup";
import { renderMobileDropdownPanelImpl } from "../menu-builder/components/preview/MobileDropdownPanel";
import { renderMobileHorizontalDropdownPanelImpl } from "../menu-builder/components/preview/MobileHorizontalDropdownPanel";
import {
  renderAccountLinkButtonImpl,
  renderMenuItemButtonImpl,
  renderSearchControlImpl,
  type MainRowDeps,
} from "../menu-builder/components/preview/MainRowControls";
import {
  renderAddBetweenImpl,
  renderMenuTreeImpl,
  type MenuTreeDeps,
} from "../menu-builder/components/panels/MenuTree";
import {
  renderMenuPanelImpl,
  type MenuPanelDeps,
} from "../menu-builder/components/panels/MenuPanel";
import { renderMenuIcon } from "../menu-builder/components/shared/MenuIcon";
import { renderSegmentedControl } from "../menu-builder/components/shared/SegmentedControl";



export const links: LinksFunction = () => [
  { rel: "stylesheet", href: polarisStyles },
];

export { loader } from "../menu-builder/server/loader.server";
export { action } from "../menu-builder/server/action.server";

import type { loader } from "../menu-builder/server/loader.server";
import type { action } from "../menu-builder/server/action.server";


export default function MenuBuilder() {
  const loaderData = useLoaderData<typeof loader>();

  // Defensive check for loader errors or missing data to prevent blank screen crashes
  if (!loaderData || ("ok" in loaderData && loaderData.ok === false)) {
    const errorMsg = (loaderData as any)?.error || "Failed to load menu data. Please try again.";
    return (
      <div style={{ padding: "40px", textAlign: "center", backgroundColor: "#f9fafb", minHeight: "100vh" }}>
        <div style={{ maxWidth: "500px", margin: "0 auto", padding: "24px", backgroundColor: "#ffffff", borderRadius: "8px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
          <h2 style={{ fontSize: "20px", fontWeight: "600", color: "#b91c1c", marginBottom: "12px" }}>Application Error</h2>
          <p style={{ color: "#374151", marginBottom: "20px" }}>{errorMsg}</p>
          <button
            onClick={() => window.location.href = "/app/mega-menus"}
            style={{ padding: "10px 20px", backgroundColor: "#4f46e5", color: "#ffffff", borderRadius: "6px", border: "none", cursor: "pointer", fontWeight: "500" }}
          >
            Go Back to Menus
          </button>
        </div>
      </div>
    );
  }

  const {
    menu,
    menuItems: initialMenuItems = [],
    menuSettingsRaw,
    menuSettings,
    collections,
    products,
    blogs,
    latestArticles,
    pages,
    menus,
    shopDomain,
  } = loaderData;
  const normalizedMenuSettings = useMemo(() => {
    const next = { ...menuSettings } as BuilderSettings;
    const hasIconWidthSettings =
      menuSettingsRaw &&
      Object.prototype.hasOwnProperty.call(menuSettingsRaw, "accountLoginIconWidthMode");
    const legacyAccountLabels: Partial<Record<keyof BuilderSettings, string>> = {
      accountLoginLabel: "Login",
      accountRegisterLabel: "Register",
      accountAccountLabel: "Account",
      accountLogoutLabel: "Logout",
    };
    if (!hasIconWidthSettings) {
      (Object.entries(legacyAccountLabels) as [keyof BuilderSettings, string][]).forEach(
        ([key, legacy]) => {
          const current = next[key];
          if (typeof current === "string" && current.trim() === legacy) {
            next[key] = "" as never;
          }
        }
      );
    }
    return next;
  }, [menuSettings, menuSettingsRaw]);
  const normalizedMenuItems = useMemo(
    () => normalizeMultiBlocks(initialMenuItems),
    [initialMenuItems]
  );
  const defaultExpandedMenuItems = useMemo(
    () => applySidebarDefaultExpansion(normalizedMenuItems),
    [normalizedMenuItems]
  );
  const savedSnapshotRef = useRef<{
    status: "active" | "draft";
    items: MenuItem[];
    settings: BuilderSettings;
  }>({
    status: menu.status === "active" ? "active" : "draft",
    items: defaultExpandedMenuItems,
    settings: { ...DEFAULT_BUILDER_SETTINGS, ...normalizedMenuSettings },
  });
  const appData = useRouteLoaderData<typeof appLoader>("routes/app");
  const apiKey = appData?.apiKey ?? "";
  const planTier = (appData as { planTier?: string } | null)?.planTier;
  const isPlusPlan = true; // planTier === "plus"; // TEMPORARY OVERRIDE FOR TESTING
  const isProPlan = planTier === "pro" || isPlusPlan;
  const navigate = useNavigate();
  const location = useLocation();
  const saveFetcher = useFetcher<typeof action>();
  const contactFetcher = useFetcher<typeof action>();
  const [activePanel, setActivePanel] = useState<RailPanel>("menu");
  const [menuView, setMenuView] = useState<"list" | "edit" | "add-root">("list");
  const [addItemsTargetId, setAddItemsTargetId] = useState<string | null>(null);
  const [addItemAfterId, setAddItemAfterId] = useState<string | undefined>(undefined);
  const [menuStatus, setMenuStatus] = useState<"active" | "draft">(
    menu.status === "active" ? "active" : "draft"
  );
  const menuEnabled = menuStatus === "active";
  const [previewMode, setPreviewMode] = useState<"desktop" | "mobile">("desktop");
  const [selectedItemId, setSelectedItemId] = useState<string | null>(
    normalizedMenuItems[0]?.id ?? null
  );
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [hoveredMenuId, setHoveredMenuId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<MenuItem | null>(null);
  const hoverClearTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [draggedItemId, setDraggedItemId] = useState<string | null>(null);
  const [draggedParentId, setDraggedParentId] = useState<string | null>(null);
  const sidebarRowRefs = useRef(new Map<string, HTMLDivElement>());
  const settingsScrollRef = useRef<HTMLDivElement | null>(null);
  const settingsScrollTopRef = useRef(0);
  const lastIconPickerTargetRef = useRef<IconPickerState["target"] | null>(null);
  const previewRowRefs = useRef(new Map<string, HTMLDivElement>());
  const prevSidebarPositionsRef = useRef(new Map<string, DOMRect>());
  const prevPreviewPositionsRef = useRef(new Map<string, DOMRect>());
  const lastDragOverIdRef = useRef<string | null>(null);
  const prevMenuIdRef = useRef(menu.id);
  const appBridgeRef = useRef<ReturnType<typeof createApp> | null>(null);
  const fullscreenExitRequestedRef = useRef(false);
  const fullscreenExitArmedRef = useRef(false);
  const fullscreenExitArmTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fullscreenExitNavigateTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const exitGuardRef = useRef({ isDirty: false, requiresExplicitSave: false, isSaving: false });
  const [fullscreenPhase, setFullscreenPhase] = useState<"entering" | "ready" | "exiting">("entering");

  const [themeSettings, setThemeSettings] = useState<ThemeSettings>({
    fontFamily: "Inter, system-ui, sans-serif",
    menuBackground: "#0b0b0b",
    menuText: "#f5f5f5",
    menuActive: "#2563eb",
    dropdownBackground: "#ffffff",
    dropdownText: "#1f2937",
    dropdownHeading: "#b91c1c",
    canvasBackground: "#9fb1c4",
    menuItemSpacing: 28,
  });
  const [isPreviewLeftAligned, setIsPreviewLeftAligned] = useState(false);

  const returnToPath = useMemo(() => {
    const search = new URLSearchParams(location.search);
    const value = search.get("returnTo");
    return value && value.startsWith("/") ? value : "/app/mega-menus";
  }, [location.search]);

  const returnToSearch = useMemo(() => {
    const search = new URLSearchParams(location.search);
    search.delete("id");
    search.delete("returnTo");
    search.delete("template");
    const next = search.toString();
    return next ? `?${next}` : "";
  }, [location.search]);

  const [menuItems, setMenuItems] = useState<MenuItem[]>(defaultExpandedMenuItems);
  const [builderSettings, setBuilderSettings] = useState<BuilderSettings>({
    ...DEFAULT_BUILDER_SETTINGS,
    ...normalizedMenuSettings,
  });

  const menuAlignmentMap: Record<BuilderSettings["layoutAlignment"], string> = {
    left: "flex-start",
    right: "flex-end",
    center: "center",
  };
  const isMobilePreview = previewMode === "mobile";
  const visibleMenuItems = useMemo(() => {
    return filterVisibleItemsRecursive(menuItems, isMobilePreview);
  }, [menuItems, isMobilePreview]);

  const isVerticalMenu = isMobilePreview || builderSettings.layoutOrientation === "vertical";

  const dropdownGroups = useMemo(() => {
    const previewMenu = openMenuId ? findItemInTree(visibleMenuItems, openMenuId) : null;
    return previewMenu?.children ?? [];
  }, [visibleMenuItems, openMenuId]);

  const isDropdownMenu = useMemo(() => {
    const previewMenu = openMenuId ? findItemInTree(visibleMenuItems, openMenuId) : null;
    if (!previewMenu) return false;
    return (
      previewMenu.submenuType === "dropdown" ||
      previewMenu.submenuTemplate === "dropdown" ||
      previewMenu.submenuTemplate === "simple-left-tabs" ||
      previewMenu.submenuTemplate === "simple-right-tabs" ||
      previewMenu.submenuTemplate === "two-nested-tabs-right" ||
      previewMenu.submenuTemplate === "three-nested-tabs-right" ||
      previewMenu.submenuTemplate === "two-level-tabs" ||
      previewMenu.submenuTemplate === "three-level-tabs" ||
      previewMenu.submenuTemplate === "custom-normal-dropdown"
    );
  }, [visibleMenuItems, openMenuId]);

  const isHorizontalDropdownMenu = useMemo(() => {
    const previewMenu = openMenuId ? findItemInTree(visibleMenuItems, openMenuId) : null;
    if (!previewMenu) return false;
    return (
      previewMenu.submenuType === "horizontal-dropdown" ||
      previewMenu.submenuTemplate === "horizontal-dropdown" ||
      previewMenu.submenuTemplate === "simple-top-tabs" ||
      previewMenu.submenuTemplate === "two-top-tabs" ||
      previewMenu.submenuTemplate === "three-top-tabs"
    );
  }, [visibleMenuItems, openMenuId]);

  const shouldInlineMobilePanel =
    isMobilePreview && dropdownGroups.length > 0 && !isDropdownMenu && !isHorizontalDropdownMenu;
  const rightTabsMenuItems = useMemo(
    () =>
      visibleMenuItems.filter(
        (item) =>
          item.submenuTemplate === "simple-right-tabs" ||
          item.submenuTemplate === "two-nested-tabs-right" ||
          item.submenuTemplate === "three-nested-tabs-right"
      ),
    [visibleMenuItems]
  );
  const accountLinks = useMemo(() => {
    if (isVerticalMenu || isMobilePreview) return [];
    const links: Array<{
      id: string;
      label: string;
      icon: string;
      iconWidthMode: "auto" | "custom";
      iconWidthValue: number;
      iconWidthUnit: "%" | "px";
    }> = [];
    if (builderSettings.accountShowLogin) {
      const label = builderSettings.accountLoginLabel ?? "";
      const icon = builderSettings.accountLoginIcon ?? "";
      if (label.trim() || icon) {
        links.push({
          id: "account-login",
          label,
          icon,
          iconWidthMode: builderSettings.accountLoginIconWidthMode ?? "auto",
          iconWidthValue: builderSettings.accountLoginIconWidthValue ?? 50,
          iconWidthUnit: builderSettings.accountLoginIconWidthUnit ?? "%",
        });
      }
    }
    if (builderSettings.accountShowRegister) {
      const label = builderSettings.accountRegisterLabel ?? "";
      const icon = builderSettings.accountRegisterIcon ?? "";
      if (label.trim() || icon) {
        links.push({
          id: "account-register",
          label,
          icon,
          iconWidthMode: builderSettings.accountRegisterIconWidthMode ?? "auto",
          iconWidthValue: builderSettings.accountRegisterIconWidthValue ?? 50,
          iconWidthUnit: builderSettings.accountRegisterIconWidthUnit ?? "%",
        });
      }
    }
    if (builderSettings.accountShowAccount) {
      const label = builderSettings.accountAccountLabel ?? "";
      const icon = builderSettings.accountAccountIcon ?? "";
      if (label.trim() || icon) {
        links.push({
          id: "account-account",
          label,
          icon,
          iconWidthMode: builderSettings.accountAccountIconWidthMode ?? "auto",
          iconWidthValue: builderSettings.accountAccountIconWidthValue ?? 50,
          iconWidthUnit: builderSettings.accountAccountIconWidthUnit ?? "%",
        });
      }
    }
    if (builderSettings.accountShowLogout) {
      const label = builderSettings.accountLogoutLabel ?? "";
      const icon = builderSettings.accountLogoutIcon ?? "";
      if (label.trim() || icon) {
        links.push({
          id: "account-logout",
          label,
          icon,
          iconWidthMode: builderSettings.accountLogoutIconWidthMode ?? "auto",
          iconWidthValue: builderSettings.accountLogoutIconWidthValue ?? 50,
          iconWidthUnit: builderSettings.accountLogoutIconWidthUnit ?? "%",
        });
      }
    }
    return links;
  }, [
    builderSettings.accountShowLogin,
    builderSettings.accountLoginLabel,
    builderSettings.accountLoginIcon,
    builderSettings.accountLoginIconWidthMode,
    builderSettings.accountLoginIconWidthValue,
    builderSettings.accountLoginIconWidthUnit,
    builderSettings.accountShowRegister,
    builderSettings.accountRegisterLabel,
    builderSettings.accountRegisterIcon,
    builderSettings.accountRegisterIconWidthMode,
    builderSettings.accountRegisterIconWidthValue,
    builderSettings.accountRegisterIconWidthUnit,
    builderSettings.accountShowAccount,
    builderSettings.accountAccountLabel,
    builderSettings.accountAccountIcon,
    builderSettings.accountAccountIconWidthMode,
    builderSettings.accountAccountIconWidthValue,
    builderSettings.accountAccountIconWidthUnit,
    builderSettings.accountShowLogout,
    builderSettings.accountLogoutLabel,
    builderSettings.accountLogoutIcon,
    builderSettings.accountLogoutIconWidthMode,
    builderSettings.accountLogoutIconWidthValue,
    builderSettings.accountLogoutIconWidthUnit,
    isVerticalMenu,
    isMobilePreview,
  ]);
  const standardMenuItems = useMemo(
    () =>
      visibleMenuItems.filter(
        (item) =>
          item.submenuTemplate !== "simple-right-tabs" &&
          item.submenuTemplate !== "two-nested-tabs-right" &&
          item.submenuTemplate !== "three-nested-tabs-right"
      ),
    [visibleMenuItems]
  );
  const menuItemsForMainRow = isVerticalMenu ? visibleMenuItems : standardMenuItems;
  const rightAlignedMenuItems = isVerticalMenu ? [] : rightTabsMenuItems;
  const hasRightSideItems = rightAlignedMenuItems.length > 0 || accountLinks.length > 0;
  const [requiresExplicitSave, setRequiresExplicitSave] = useState(false);
  const [activeSaveAction, setActiveSaveAction] = useState<"save" | "publish" | "enable" | null>(
    null
  );
  const [fontPickerState, setFontPickerState] = useState<FontPickerState | null>(null);
  const [fontPickerSearch, setFontPickerSearch] = useState("");
  const [fontPickerFont, setFontPickerFont] = useState("");
  const [fontPickerWeight, setFontPickerWeight] = useState("400");
  const [iconPickerState, setIconPickerState] = useState<IconPickerState | null>(null);
  const [iconPickerSearch, setIconPickerSearch] = useState("");
  const iconPickerScrollRef = useRef<HTMLDivElement | null>(null);
  const customItemsScrollRef = useRef<HTMLDivElement | null>(null);
  const [accountIconMenuOpenId, setAccountIconMenuOpenId] = useState<string | null>(null);
  const [editIconMenuOpenId, setEditIconMenuOpenId] = useState<string | null>(null);
  const [submenuImagePickerOpen, setSubmenuImagePickerOpen] = useState(false);
  const [imagePickerOpen, setImagePickerOpen] = useState(false);
  const [imagePickerSelection, setImagePickerSelection] = useState<string | null>(null);
  const [productPickerOpen, setProductPickerOpen] = useState(false);
  const [productPickerSearch, setProductPickerSearch] = useState("");
  const [productPickerSelection, setProductPickerSelection] = useState<Record<string, boolean>>({});
  const [productPickerTargetId, setProductPickerTargetId] = useState<string | null>(null);
  const [collectionPickerOpen, setCollectionPickerOpen] = useState(false);
  const [collectionPickerSearch, setCollectionPickerSearch] = useState("");
  const [collectionPickerSelection, setCollectionPickerSelection] = useState<Record<string, boolean>>({});
  const [collectionPickerTargetId, setCollectionPickerTargetId] = useState<string | null>(null);
  const [productCarouselPageById, setProductCarouselPageById] = useState<Record<string, number>>({});
  const [submenuColorPickerOpen, setSubmenuColorPickerOpen] = useState(false);
  const [submenuColorPickerHsb, setSubmenuColorPickerHsb] = useState<HsbColor | null>(null);
  const [itemColorPickerKey, setItemColorPickerKey] = useState<
    | "customTextColor"
    | "customBackgroundColor"
    | "customTextHoverColor"
    | "customBackgroundHoverColor"
    | null
  >(null);
  const [itemColorPickerHsb, setItemColorPickerHsb] = useState<HsbColor | null>(null);
  const [submenuTemplateTargetId, setSubmenuTemplateTargetId] = useState<string | null>(null);
  const [submenuTemplateHoverId, setSubmenuTemplateHoverId] = useState<SubmenuTemplateId | null>(null);
  const [submenuTemplatePanelHover, setSubmenuTemplatePanelHover] = useState(false);
  const submenuTemplateHoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingSubmenuTemplateIdRef = useRef<SubmenuTemplateId | null>(null);
  const [blockTemplateTargetId, setBlockTemplateTargetId] = useState<string | null>(null);
  const [blockTemplateHoverId, setBlockTemplateHoverId] = useState<BlockTemplateId | null>(null);
  const [blockTemplatePanelHover, setBlockTemplatePanelHover] = useState(false);
  const blockTemplateHoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingBlockTemplateIdRef = useRef<BlockTemplateId | null>(null);
  const previewImageCacheRef = useRef<Set<string>>(new Set());
  const [pendingDeleteItemId, setPendingDeleteItemId] = useState<string | null>(null);
  const [pendingDeleteItemLabel, setPendingDeleteItemLabel] = useState<string>("");
  const [discardChangesModalOpen, setDiscardChangesModalOpen] = useState(false);
  const [pendingExitIntent, setPendingExitIntent] = useState(false);
  const [openColorPicker, setOpenColorPicker] = useState<keyof BuilderSettings | null>(null);
  const [colorPickerHsb, setColorPickerHsb] = useState<HsbColor | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [addItemsTab, setAddItemsTab] = useState<"select" | "custom">("select");
  const [addItemsSearch, setAddItemsSearch] = useState("");
  const [selectedAddItems, setSelectedAddItems] = useState<Record<string, AddableItem>>({});
  const buildCustomItem = (): CustomAddItem => ({
    id: buildId(),
    title: "",
    url: "",
    description: "",
  });
  const [customItems, setCustomItems] = useState<CustomAddItem[]>(() => [buildCustomItem()]);
  const [linkPickerOpenId, setLinkPickerOpenId] = useState<string | null>(null);
  const [linkSearchQuery, setLinkSearchQuery] = useState("");
  const [linkPickerCategory, setLinkPickerCategory] = useState<string | null>(null);
  const [activeDropdownItemId, setActiveDropdownItemId] = useState<string | null>(null);
  const [activeDropdownChildId, setActiveDropdownChildId] = useState<string | null>(null);
  const [activeDropdownGrandchildId, setActiveDropdownGrandchildId] = useState<string | null>(null);
  const [hoveredImageBlockId, setHoveredImageBlockId] = useState<string | null>(null);
  const [activeHorizontalItemId, setActiveHorizontalItemId] = useState<string | null>(null);
  const [activeHorizontalChildId, setActiveHorizontalChildId] = useState<string | null>(null);
  const [activeHorizontalGrandchildId, setActiveHorizontalGrandchildId] = useState<string | null>(null);
  const [dropdownMainPanelMinHeight, setDropdownMainPanelMinHeight] = useState<number | null>(null);
  const [floatingLinkListToolbarId, setFloatingLinkListToolbarId] = useState<string | null>(null);
  const [mobileLinkListExpandedById, setMobileLinkListExpandedById] = useState<Record<string, boolean>>({});
  const [floatingLinkListToolbarPosition, setFloatingLinkListToolbarPosition] = useState<{
    left: number;
    top: number;
  } | null>(null);
  const floatingLinkListToolbarHoverRef = useRef(false);
  const hideFloatingLinkListToolbarTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const previewContainerRef = useRef<HTMLDivElement | null>(null);

  // Carousel Autoplay Logic
  useEffect(() => {
    if (!builderSettings.carouselAutoPlay) return;

    const interval = setInterval(() => {
      setProductCarouselPageById((prev) => {
        const nextState = { ...prev };
        const carouselGroups: MenuItem[] = [];

        // Helper to find carousel groups recursively
        const findCarousels = (items: MenuItem[]) => {
          items.forEach((item) => {
            const isCarousel =
              item.blockTemplate === "product-carousel" ||
              item.multiLayout === "multi-product-carousel" ||
              item.multiLayout === "multi-link-list-product-carousel" ||
              item.multiLayout === "multi-image-product-carousel" ||
              item.multiLayout === "multi-element-group-masonry";

            if (isCarousel) {
              carouselGroups.push(item);
            }
            if (item.children) {
              findCarousels(item.children);
            }
          });
        };

        findCarousels(menuItems);

        carouselGroups.forEach((group) => {
          const currentPage = prev[group.id] ?? 0;

          // Calculate page count logic duplicated from renderProductBlock
          // Ideally this should be a shared helper, but simplified here for now
          // We need to know how many products/pages there are.
          // This requires access to 'products' which is available here.

          let carouselProducts: any[] = [];
          if (group.blockTemplate === "product-carousel") {
            const carouselItems = group.children?.filter((child) => !child.isHeading) ?? [];
            // Filter Logic from renderProductBlock
            const carouselSourceItems = carouselItems.length === 0
              ? Array.from({ length: 8 }, () => null)
              : carouselItems;

            // We just need the count, not fully resolved products for pagination math
            carouselProducts = carouselSourceItems;
          } else {
            // For multi-layout carousels, logic is similar
            const carouselItems = group.children?.filter((child) => !child.isHeading) ?? [];
            const carouselSourceItems = carouselItems.length === 0
              ? Array.from({ length: 8 }, () => null)
              : carouselItems;
            carouselProducts = carouselSourceItems;
          }

          const carouselPageSize = 4;
          const carouselPageCount = Math.max(1, Math.ceil(carouselProducts.length / carouselPageSize));

          if (currentPage < carouselPageCount - 1) {
            nextState[group.id] = currentPage + 1;
          } else if (builderSettings.carouselLoop) {
            nextState[group.id] = 0;
          }
        });

        return nextState;
      });
    }, 4000); // 4 seconds interval

    return () => clearInterval(interval);
  }, [builderSettings.carouselAutoPlay, builderSettings.carouselLoop, menuItems, products]);
  const previewMenuItemRefs = useRef<Map<string, HTMLButtonElement | null>>(new Map());
  const dropdownMainPanelRef = useRef<HTMLDivElement | null>(null);
  const dropdownFlyoutRef = useRef<HTMLDivElement | null>(null);
  const [dropdownAnchor, setDropdownAnchor] = useState<{ left: number; top: number; width: number } | null>(null);
  const [savedFingerprint, setSavedFingerprint] = useState(() =>
    buildMenuFingerprint(
      menu.status === "active" ? "active" : "draft",
      defaultExpandedMenuItems,
      { ...DEFAULT_BUILDER_SETTINGS, ...normalizedMenuSettings }
    )
  );
  const lastSaveIntentRef = useRef<"save" | "publish" | "enable">("save");

  const selectedPath = useMemo(() => findItemPath(menuItems, selectedItemId), [menuItems, selectedItemId]);
  const selectedItem = selectedPath?.[selectedPath.length - 1] ?? null;
  const activeMenu = selectedPath?.[0] ?? null;
  const currentImageUrl = editDraft?.imageUrl ?? selectedItem?.imageUrl ?? null;
  const previewMenu = useMemo(
    () => (openMenuId ? findItemInTree(visibleMenuItems, openMenuId) : null),
    [visibleMenuItems, openMenuId]
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    const preload = () => {
      PREVIEW_IMAGE_SOURCES.forEach((src) => {
        if (previewImageCacheRef.current.has(src)) return;
        const img = new Image();
        img.decoding = "async";
        img.src = src;
        previewImageCacheRef.current.add(src);
      });
    };
    const requestIdle =
      "requestIdleCallback" in window
        ? (window as unknown as { requestIdleCallback: (cb: () => void) => number }).requestIdleCallback
        : (cb: () => void) => window.setTimeout(cb, 200);
    const cancelIdle =
      "cancelIdleCallback" in window
        ? (window as unknown as { cancelIdleCallback: (id: number) => void }).cancelIdleCallback
        : (id: number) => window.clearTimeout(id);
    const idleId = requestIdle(preload);
    return () => cancelIdle(idleId);
  }, []);

  useEffect(() => {
    if (menuView !== "edit") {
      setEditDraft(null);
      setProductPickerOpen(false);
      setProductPickerTargetId(null);
      setCollectionPickerOpen(false);
      setCollectionPickerTargetId(null);
      return;
    }
    if (!selectedItem) {
      setEditDraft(null);
      return;
    }
    setEditDraft((prev) => (prev?.id === selectedItem.id ? prev : { ...selectedItem }));
  }, [menuView, selectedItem?.id]);

  useEffect(() => {
    if (!imagePickerOpen) return;
    setImagePickerSelection(currentImageUrl);
    if (!currentImageUrl) return;
    setBuilderSettings((prev) => {
      const existing = prev.imageLibrary ?? [];
      if (existing.includes(currentImageUrl)) return prev;
      return { ...prev, imageLibrary: [currentImageUrl, ...existing] };
    });
  }, [imagePickerOpen, currentImageUrl]);

  useEffect(() => {
    setActiveDropdownItemId(null);
    setActiveDropdownChildId(null);
    setActiveDropdownGrandchildId(null);
    setActiveHorizontalItemId(null);
    setActiveHorizontalChildId(null);
    setActiveHorizontalGrandchildId(null);
  }, [openMenuId]);

  useEffect(() => {
    setActiveHorizontalChildId(null);
    setActiveHorizontalGrandchildId(null);
  }, [activeHorizontalItemId]);

  useEffect(() => {
    setActiveHorizontalGrandchildId(null);
  }, [activeHorizontalChildId]);

  useEffect(() => {
    if (!openMenuId) {
      setDropdownAnchor(null);
      return;
    }
    const container = previewContainerRef.current;
    const itemNode = previewMenuItemRefs.current.get(openMenuId);
    if (!container || !itemNode) {
      setDropdownAnchor(null);
      return;
    }
    const containerRect = container.getBoundingClientRect();
    const itemRect = itemNode.getBoundingClientRect();
    setDropdownAnchor({
      left: itemRect.left - containerRect.left,
      top: itemRect.bottom - containerRect.top,
      width: itemRect.width,
    });
  }, [
    openMenuId,
    menuItems,
    previewMode,
    builderSettings.layoutOrientation,
    builderSettings.layoutAlignment,
    builderSettings.menuItemSpacing,
    builderSettings.spacingMainRowHeight,
  ]);

  useLayoutEffect(() => {
    const isTabsFlyoutTemplate =
      previewMenu?.submenuTemplate === "two-level-tabs" ||
      previewMenu?.submenuTemplate === "three-level-tabs" ||
      previewMenu?.submenuTemplate === "simple-left-tabs" ||
      previewMenu?.submenuTemplate === "simple-right-tabs" ||
      previewMenu?.submenuTemplate === "two-nested-tabs-right" ||
      previewMenu?.submenuTemplate === "three-nested-tabs-right" ||
      previewMenu?.submenuTemplate === "custom-normal-dropdown";
    if (!isTabsFlyoutTemplate || !activeDropdownItemId) {
      if (dropdownMainPanelMinHeight !== null) {
        setDropdownMainPanelMinHeight(null);
      }
      return;
    }
    const mainPanel = dropdownMainPanelRef.current;
    const flyoutPanel = dropdownFlyoutRef.current;
    if (!mainPanel || !flyoutPanel) {
      if (dropdownMainPanelMinHeight !== null) {
        setDropdownMainPanelMinHeight(null);
      }
      return;
    }
    const flyoutHeight = flyoutPanel.offsetHeight;
    if (!flyoutHeight) return;
    if (dropdownMainPanelMinHeight !== flyoutHeight) {
      setDropdownMainPanelMinHeight(flyoutHeight);
    }
  }, [
    activeDropdownItemId,
    activeDropdownChildId,
    activeDropdownGrandchildId,
    dropdownMainPanelMinHeight,
    openMenuId,
    previewMenu,
  ]);

  useLayoutEffect(() => {
    if (!floatingLinkListToolbarId) {
      setFloatingLinkListToolbarPosition(null);
      return;
    }
    const updatePosition = () => {
      const node = previewRowRefs.current.get(floatingLinkListToolbarId);
      if (!node) return;
      const rect = node.getBoundingClientRect();
      setFloatingLinkListToolbarPosition({
        left: rect.left + rect.width / 2,
        top: rect.bottom + 12,
      });
    };
    updatePosition();
    window.addEventListener("resize", updatePosition);
    document.addEventListener("scroll", updatePosition, true);
    return () => {
      window.removeEventListener("resize", updatePosition);
      document.removeEventListener("scroll", updatePosition, true);
    };
  }, [floatingLinkListToolbarId]);

  const registerPreviewMenuItem = (id: string) => (node: HTMLButtonElement | null) => {
    if (node) {
      previewMenuItemRefs.current.set(id, node);
    } else {
      previewMenuItemRefs.current.delete(id);
    }
  };

  const updateBuilderSetting = <K extends keyof BuilderSettings>(
    key: K,
    value: BuilderSettings[K]
  ) => {
    setBuilderSettings((prev) => ({ ...prev, [key]: value }));
  };

  const openFontPickerFor = (
    id: string,
    fontKey: keyof BuilderSettings,
    weightKey: keyof BuilderSettings
  ) => {
    const currentFont = builderSettings[fontKey] as string;
    const currentWeight = builderSettings[weightKey] as number;
    setFontPickerState({ id, fontKey, weightKey });
    setFontPickerSearch("");
    setFontPickerFont(currentFont || FONT_OPTIONS[0]?.value || "");
    setFontPickerWeight(String(currentWeight || 400));
  };

  const closeFontPicker = () => {
    setFontPickerState(null);
  };

  const handlePreviewHoverStart = (id: string) => {
    if (hoverClearTimeoutRef.current) {
      clearTimeout(hoverClearTimeoutRef.current);
      hoverClearTimeoutRef.current = null;
    }
    setHoveredMenuId(id);
  };

  const handlePreviewHoverEnd = () => {
    if (hoverClearTimeoutRef.current) {
      clearTimeout(hoverClearTimeoutRef.current);
    }
    hoverClearTimeoutRef.current = setTimeout(() => {
      setHoveredMenuId(null);
      hoverClearTimeoutRef.current = null;
    }, 120);
  };

  const handleSubmenuBackgroundUpload = (file?: File | null) => {
    if (!selectedItemId || !file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : "";
      if (!result) return;
      if (menuView === "edit") {
        updateEditDraft("submenuBackgroundImage", result);
      } else {
        handleUpdateSelected("submenuBackgroundImage", result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleImageUpload = (file?: File | null) => {
    if (!selectedItemId || !file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : "";
      if (!result) return;
      setBuilderSettings((prev) => {
        const existing = prev.imageLibrary ?? [];
        if (existing.includes(result)) {
          return prev;
        }
        return { ...prev, imageLibrary: [result, ...existing] };
      });
      setImagePickerSelection(result);
    };
    reader.readAsDataURL(file);
  };

  const closeProductPicker = () => {
    setProductPickerOpen(false);
    setProductPickerTargetId(null);
  };

  const openProductPicker = (targetId?: string | null) => {
    const activeItem = targetId ? findEditableItemById(targetId) : editDraft ?? selectedItem;
    const activeIds = activeItem?.productIds ?? [];
    const selection = activeIds.reduce<Record<string, boolean>>((acc, id) => {
      acc[id] = true;
      return acc;
    }, {});
    setProductPickerSelection(selection);
    setProductPickerSearch("");
    setProductPickerTargetId(targetId ?? null);
    setProductPickerOpen(true);
    setLinkPickerOpenId(null);
  };

  const toggleProductSelection = (id: string) => {
    setProductPickerSelection((prev) => {
      if (productPickerTargetId) {
        return prev[id] ? {} : { [id]: true };
      }
      const next = { ...prev };
      if (next[id]) {
        delete next[id];
      } else {
        next[id] = true;
      }
      return next;
    });
  };

  const applyProductSelection = () => {
    const selectedIds = Object.keys(productPickerSelection);
    const selectedProduct = selectedIds.length
      ? products.find((product) => product.id === selectedIds[0])
      : null;
    const nextUrl = selectedProduct?.handle ? `/products/${selectedProduct.handle}` : "";
    if (productPickerTargetId) {
      updateEditDraftItemById(productPickerTargetId, (item) => ({
        ...item,
        productIds: selectedIds.slice(0, 1),
        url: nextUrl,
      }));
    } else {
      updateEditDraft("productIds", selectedIds);
      if (selectedIds.length <= 1) {
        updateEditDraft("url", nextUrl);
      } else if (!selectedIds.length) {
        updateEditDraft("url", "");
      }
    }
    closeProductPicker();
  };

  const closeCollectionPicker = () => {
    setCollectionPickerOpen(false);
    setCollectionPickerTargetId(null);
  };

  const openCollectionPicker = (targetId?: string | null) => {
    const activeItem = targetId ? findEditableItemById(targetId) : editDraft ?? selectedItem;
    const activeIds = activeItem?.collectionIds ?? [];
    const selection = activeIds.reduce<Record<string, boolean>>((acc, id) => {
      acc[id] = true;
      return acc;
    }, {});
    setCollectionPickerSelection(selection);
    setCollectionPickerSearch("");
    setCollectionPickerTargetId(targetId ?? null);
    setCollectionPickerOpen(true);
    setLinkPickerOpenId(null);
  };

  const toggleCollectionSelection = (id: string) => {
    setCollectionPickerSelection((prev) => {
      if (collectionPickerTargetId) {
        return prev[id] ? {} : { [id]: true };
      }
      const next = { ...prev };
      if (next[id]) {
        delete next[id];
      } else {
        next[id] = true;
      }
      return next;
    });
  };

  const applyCollectionSelection = () => {
    const selectedIds = Object.keys(collectionPickerSelection);
    const selectedCollection = selectedIds.length
      ? collections.find((collection) => collection.id === selectedIds[0])
      : null;
    const nextUrl = selectedCollection?.handle ? `/collections/${selectedCollection.handle}` : "";
    if (collectionPickerTargetId) {
      updateEditDraftItemById(collectionPickerTargetId, (item) => ({
        ...item,
        collectionIds: selectedIds.slice(0, 1),
        url: nextUrl,
      }));
    } else {
      updateEditDraft("collectionIds", selectedIds);
      if (selectedIds.length <= 1) {
        updateEditDraft("url", nextUrl);
      } else if (!selectedIds.length) {
        updateEditDraft("url", "");
      }
    }
    closeCollectionPicker();
  };

  const clearSubmenuTemplateHoverTimeout = () => {
    if (submenuTemplateHoverTimeoutRef.current) {
      clearTimeout(submenuTemplateHoverTimeoutRef.current);
      submenuTemplateHoverTimeoutRef.current = null;
    }
    pendingSubmenuTemplateIdRef.current = null;
  };

  const scheduleSubmenuTemplateHover = (templateId: SubmenuTemplateId) => {
    if (pendingSubmenuTemplateIdRef.current === templateId) return;
    const isAlreadyOpen = submenuTemplateHoverId === templateId;
    if (isAlreadyOpen) {
      clearSubmenuTemplateHoverTimeout();
      return;
    }
    clearSubmenuTemplateHoverTimeout();
    pendingSubmenuTemplateIdRef.current = templateId;
    submenuTemplateHoverTimeoutRef.current = setTimeout(() => {
      setSubmenuTemplateHoverId(templateId);
      pendingSubmenuTemplateIdRef.current = null;
    }, HOVER_PREVIEW_DELAY_MS);
  };

  const scheduleSubmenuTemplateHoverClear = () => {
    clearSubmenuTemplateHoverTimeout();
    submenuTemplateHoverTimeoutRef.current = setTimeout(() => {
      if (!submenuTemplatePanelHover) {
        setSubmenuTemplateHoverId(null);
      }
    }, HOVER_PREVIEW_CLEAR_DELAY_MS);
  };

  const clearBlockTemplateHoverTimeout = () => {
    if (blockTemplateHoverTimeoutRef.current) {
      clearTimeout(blockTemplateHoverTimeoutRef.current);
      blockTemplateHoverTimeoutRef.current = null;
    }
    pendingBlockTemplateIdRef.current = null;
  };

  const scheduleBlockTemplateHover = (templateId: BlockTemplateId) => {
    if (pendingBlockTemplateIdRef.current === templateId) return;
    const isAlreadyOpen = blockTemplateHoverId === templateId;
    if (isAlreadyOpen) {
      clearBlockTemplateHoverTimeout();
      return;
    }
    clearBlockTemplateHoverTimeout();
    pendingBlockTemplateIdRef.current = templateId;
    blockTemplateHoverTimeoutRef.current = setTimeout(() => {
      setBlockTemplateHoverId(templateId);
      pendingBlockTemplateIdRef.current = null;
    }, HOVER_PREVIEW_DELAY_MS);
  };

  const scheduleBlockTemplateHoverClear = () => {
    clearBlockTemplateHoverTimeout();
    blockTemplateHoverTimeoutRef.current = setTimeout(() => {
      if (!blockTemplatePanelHover) {
        setBlockTemplateHoverId(null);
      }
    }, HOVER_PREVIEW_CLEAR_DELAY_MS);
  };

  const openIconPicker = (
    target: IconPickerState["target"],
    itemId: string,
    mode: IconPickerState["mode"]
  ) => {
    if (target === "settings") {
      settingsScrollTopRef.current = settingsScrollRef.current?.scrollTop ?? 0;
    }
    lastIconPickerTargetRef.current = target;
    setIconPickerState({ itemId, mode, target });
    setIconPickerSearch("");
    setLinkPickerOpenId(null);
  };

  const closeIconPicker = () => {
    setIconPickerState(null);
    if (lastIconPickerTargetRef.current === "settings") {
      requestAnimationFrame(() => {
        if (settingsScrollRef.current) {
          settingsScrollRef.current.scrollTop = settingsScrollTopRef.current;
        }
      });
    }
    lastIconPickerTargetRef.current = null;
  };

  const accountIconKeyMap: Record<string, keyof BuilderSettings> = {
    "account-login": "accountLoginIcon",
    "account-register": "accountRegisterIcon",
    "account-account": "accountAccountIcon",
    "account-logout": "accountLogoutIcon",
  };

  const resolveSettingsIcon = (id: string) => {
    const key = accountIconKeyMap[id];
    if (!key) return undefined;
    return builderSettings[key] as string;
  };

  const resolveCustomIconPreview = (icon?: string) => {
    if (!icon) return null;
    if (icon.startsWith("data:")) {
      return <img src={icon} alt="" className="h-10 w-10 rounded-md object-cover" />;
    }
    if (icon.startsWith(ICON_PREFIX)) {
      const iconId = icon.slice(ICON_PREFIX.length);
      const option = ICON_LIBRARY_BY_ID[iconId];
      if (option) {
        return <option.Icon size={22} strokeWidth={1.6} className="text-gray-700" />;
      }
    }
    return null;
  };

  const renderLinkPickerContent = (onSelect: (url: string, label: string) => void) => (
    <LinkPickerContent
      onSelect={onSelect}
      linkSearchQuery={linkSearchQuery}
      setLinkSearchQuery={setLinkSearchQuery}
      linkPickerCategory={linkPickerCategory}
      setLinkPickerCategory={setLinkPickerCategory}
      setLinkPickerOpenId={setLinkPickerOpenId}
      products={products}
      collections={collections}
      pages={pages}
      blogs={blogs}
    />
  );

  const handleIconUploadFile = (
    itemId: string,
    file: File | null | undefined,
    target: IconPickerState["target"]
  ) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : "";
      if (!result) return;
      if (target === "custom") {
        updateCustomItem(itemId, { icon: result });
      } else if (target === "settings") {
        const key = accountIconKeyMap[itemId];
        if (key) {
          updateBuilderSetting(key, result as never);
        }
      } else {
        updateEditDraftItemById(itemId, (item) => ({ ...item, icon: result }));
      }
      closeIconPicker();
    };
    reader.readAsDataURL(file);
  };

  const renderIconLibraryPanel = () => (
    <IconLibraryPanel
      iconPickerState={iconPickerState}
      iconPickerSearch={iconPickerSearch}
      setIconPickerSearch={setIconPickerSearch}
      iconPickerScrollRef={iconPickerScrollRef}
      closeIconPicker={closeIconPicker}
      menuItems={menuItems}
      customItems={customItems}
      findEditableItemById={findEditableItemById}
      resolveSettingsIcon={resolveSettingsIcon}
      accountIconKeyMap={accountIconKeyMap}
      updateBuilderSetting={updateBuilderSetting}
      updateCustomItem={updateCustomItem}
      updateEditDraftItemById={updateEditDraftItemById}
    />
  );

  const renderIconUploadPanel = () => (
    <IconUploadPanel
      iconPickerState={iconPickerState}
      closeIconPicker={closeIconPicker}
      handleIconUploadFile={handleIconUploadFile}
    />
  );





  const handleLinkPickerClickOutside = () => {
    setLinkPickerOpenId(null);
  };

  useEffect(() => {
    setSubmenuColorPickerOpen(false);
    setSubmenuColorPickerHsb(null);
  }, [selectedItemId]);

  const toggleColorPicker = (key: keyof BuilderSettings) => {
    setOpenColorPicker((prev) => {
      if (prev === key) {
        setColorPickerHsb(null);
        return null;
      }
      const current = builderSettings[key];
      if (typeof current === "string") {
        setColorPickerHsb(hexToHsb(current));
      } else {
        setColorPickerHsb(null);
      }
      return key;
    });
  };

  const registerSidebarRow = (id: string) => (node: HTMLDivElement | null) => {
    if (node) sidebarRowRefs.current.set(id, node);
    else sidebarRowRefs.current.delete(id);
  };

  const registerPreviewRow = (id: string) => (node: HTMLDivElement | null) => {
    if (node) previewRowRefs.current.set(id, node);
    else previewRowRefs.current.delete(id);
  };

  useLayoutEffect(() => {
    const animateMap = (
      rowRefs: React.MutableRefObject<Map<string, HTMLDivElement>>,
      prevPositionsRef: React.MutableRefObject<Map<string, DOMRect>>
    ) => {
      const prevPositions = prevPositionsRef.current;
      const nextPositions = new Map<string, DOMRect>();

      rowRefs.current.forEach((node, id) => {
        if (node) nextPositions.set(id, node.getBoundingClientRect());
      });

      nextPositions.forEach((nextBox, id) => {
        const prevBox = prevPositions.get(id);
        if (!prevBox) return;
        const deltaY = prevBox.top - nextBox.top;
        const deltaX = prevBox.left - nextBox.left;
        if (deltaY === 0 && deltaX === 0) return;
        const node = rowRefs.current.get(id);
        if (!node) return;

        // Reset previous animations instantly
        node.style.transition = "none";
        node.style.transform = `translate3d(${deltaX}px, ${deltaY}px, 0)`;

        // Force a reflow
        void node.offsetHeight;

        // Play the animation
        requestAnimationFrame(() => {
          node.style.transition = "transform 250ms cubic-bezier(0.2, 0, 0, 1)";
          node.style.transform = "translate3d(0, 0, 0)";
        });
      });

      prevPositionsRef.current = nextPositions;
    };

    animateMap(sidebarRowRefs, prevSidebarPositionsRef);
    animateMap(previewRowRefs, prevPreviewPositionsRef);
  }, [menuItems]);

  const handleSelectItem = (
    id: string,
    openEdit = false,
    options?: { keepPanel?: boolean }
  ) => {
    setSelectedItemId(id);
    if (options?.keepPanel && activePanel !== "menu") return;
    setActivePanel("menu");
    setMenuView(openEdit ? "edit" : "list");
    setLinkPickerOpenId(null);
  };

  const handleToggleExpand = (id: string) => {
    setMenuItems((items) => updateItemById(items, id, (item) => ({ ...item, expanded: !item.expanded })));
  };

  const handleUpdateSelected = <K extends keyof MenuItem>(key: K, value: MenuItem[K]) => {
    if (!selectedItemId) return;
    setMenuItems((items) => updateItemById(items, selectedItemId, (item) => ({ ...item, [key]: value })));
  };

  const updateEditDraft = <K extends keyof MenuItem>(key: K, value: MenuItem[K]) => {
    setEditDraft((prev) => {
      if (prev) {
        return { ...prev, [key]: value };
      }
      if (!selectedItem) return prev;
      return { ...selectedItem, [key]: value };
    });
  };

  const findEditableItemById = (id: string) => {
    const base = editDraft ?? selectedItem;
    if (!base) return null;
    return findItemPath([base], id)?.slice(-1)[0] ?? null;
  };

  const updateEditDraftItemById = (id: string, updater: (item: MenuItem) => MenuItem) => {
    setEditDraft((prev) => {
      const base = prev ?? selectedItem;
      if (!base) return prev;
      if (base.id === id) {
        return updater(base);
      }
      if (!base.children?.length) {
        return base;
      }
      const nextChildren = updateItemById(base.children, id, updater);
      if (nextChildren === base.children) {
        return base;
      }
      return { ...base, children: nextChildren };
    });
  };

  const handleSubmenuTypeChange = (value: string) => {
    setEditDraft((prev) => {
      const base = prev ?? selectedItem;
      if (!base) return prev;
      if (value === "none") {
        return {
          ...base,
          submenuType: undefined,
          submenuTemplate: undefined,
          children: [],
          expanded: false,
        };
      }
      const hasChildren = Boolean(base.children?.length);
      const spaceBlock: MenuItem = {
        id: buildId(),
        label: "Space",
        url: "",
        role: "group",
        expanded: true,
        children: [],
        blockTemplate: "space",
      };
      return {
        ...base,
        submenuType: "mega",
        submenuTemplate: "mega",
        submenuWidth: "full",
        submenuContentAlign: "center",
        expanded: true,
        children: hasChildren ? base.children : [spaceBlock],
      };
    });
  };

  const handleFlyoutTypeChange = (value: string) => {
    setEditDraft((prev) => {
      const base = prev ?? selectedItem;
      if (!base) return prev;
      if (value === "none") {
        return {
          ...base,
          submenuType: undefined,
          submenuTemplate: undefined,
          children: [],
          expanded: false,
        };
      }
      const nextType = value === "horizontal" ? "horizontal-dropdown" : "dropdown";
      const hasChildren = Boolean(base.children?.length);
      const dropdownItems = hasChildren ? base.children : buildDropdownMenuItems();
      return {
        ...base,
        submenuType: nextType,
        submenuTemplate: nextType === "horizontal-dropdown" ? "horizontal-dropdown" : "dropdown",
        submenuWidth: base.submenuWidth ?? "content",
        submenuContentAlign:
          base.submenuContentAlign ??
          (nextType === "horizontal-dropdown" ? "center" : "left"),
        expanded: true,
        children: dropdownItems,
      };
    });
  };

  const handleFlyoutAlignmentChange = (value: string) => {
    updateEditDraft("submenuWidth", "content");
    updateEditDraft("submenuContentAlign", value as MenuItem["submenuContentAlign"]);
  };

  const resolveSubmenuWidthAlignment = (item: MenuItem) => {
    if (item.submenuWidth === "full") return "full";
    if (item.submenuWidth === "content") {
      return item.submenuContentAlign || "center";
    }
    // For mega menus, the default should be full width if not specified
    if (item.submenuType === "mega") return "full";
    // For others (dropdowns), default to alignment logic
    if (item.submenuContentAlign === "left") return "left";
    if (item.submenuContentAlign === "right") return "right";
    return "center";
  };

  const handleSubmenuWidthAlignmentChange = (value: string) => {
    if (value === "full") {
      updateEditDraft("submenuWidth", "full");
      return;
    }
    updateEditDraft("submenuWidth", "content");
    updateEditDraft("submenuContentAlign", value as MenuItem["submenuContentAlign"]);
  };

  const getBlockSpan = (item: MenuItem): number => {
    if (item.blockTemplate === "links") {
      return Math.max(1, Math.min(12, item.linkWidth ?? 3));
    }
    if (item.blockTemplate === "image" || item.blockTemplate === "image2") {
      return Math.max(1, Math.min(12, item.imageWidth ?? 3));
    }
    if (item.blockTemplate === "html") {
      return Math.max(1, Math.min(12, item.imageWidth ?? 3));
    }
    if (
      item.blockTemplate === "product" ||
      item.blockTemplate === "product-horizontal" ||
      item.blockTemplate === "product-grid" ||
      item.blockTemplate === "product-carousel" ||
      item.blockTemplate === "product-grid-horizontal"
    ) {
      return Math.max(1, Math.min(12, item.productWidth ?? 3));
    }
    if (item.blockTemplate === "collection" || item.blockTemplate === "collection-horizontal") {
      return Math.max(1, Math.min(12, item.imageWidth ?? 3));
    }
    if (item.blockTemplate === "blogs" || item.blockTemplate === "blogs-latest") {
      return Math.max(1, Math.min(12, item.imageWidth ?? 3));
    }
    if (item.blockTemplate === "contact") {
      return Math.max(1, Math.min(12, item.imageWidth ?? 3));
    }
    return 3; // Default
  };

  const removeEditDraftItemById = (id: string) => {
    setEditDraft((prev) => {
      const base = prev ?? selectedItem;
      if (!base || base.id === id || !base.children?.length) {
        return prev ?? base;
      }
      const nextChildren = removeItemById(base.children, id);
      if (nextChildren === base.children) {
        return base;
      }
      return { ...base, children: nextChildren };
    });
  };

  const handleAddRoot = (openEdit = false) => {
    const newItem: MenuItem = {
      id: buildId(),
      label: "New menu",
      url: "/",
      role: "menu",
      expanded: true,
    };
    setMenuItems((items) => [...items, newItem]);
    setSelectedItemId(newItem.id);
    setActivePanel("menu");
    setMenuView(openEdit ? "edit" : "list");
  };

  const handleAddChild = (parentId: string, role: "group" | "item") => {
    const parentItem = findItemPath(menuItems, parentId)?.slice(-1)[0] ?? null;
    const isFirstSubmenu =
      role === "group" &&
      parentItem?.role === "menu" &&
      !parentItem.children?.length &&
      !parentItem.submenuTemplate;
    if (isFirstSubmenu) {
      setOpenMenuId(parentId);
      setSubmenuTemplateTargetId(parentId);
      setBlockTemplateTargetId(null);
      return;
    }
    const isProductListParent =
      role === "item" &&
      (parentItem?.blockTemplate === "product" ||
        parentItem?.blockTemplate === "product-grid" ||
        parentItem?.blockTemplate === "product-carousel" ||
        parentItem?.blockTemplate === "product-grid-horizontal") &&
      Boolean(parentItem.children?.length);
    const isCollectionListParent = role === "item" && parentItem?.blockTemplate === "collection";
    const useTopProductLayout =
      parentItem?.blockTemplate === "product-grid" || parentItem?.blockTemplate === "product-carousel";
    const newItem: MenuItem = isProductListParent
      ? {
        id: buildId(),
        label: "Example Product Title",
        url: "",
        role: "item",
        blockTemplate: "product",
        productLayout: useTopProductLayout ? "image-top" : "image-left",
        productIds: [],
        icon: `${ICON_PREFIX}tag`,
      }
      : isCollectionListParent
        ? {
          id: buildId(),
          label: "Collection title",
          url: "",
          role: "item",
          blockTemplate: "collection",
          collectionIds: [],
        }
        : {
          id: buildId(),
          label: role === "group" ? "New group" : "New item",
          url: role === "group" ? "" : "/",
          role,
          expanded: role === "group" ? true : undefined,
          children: role === "group" ? [] : undefined,
        };
    setMenuItems((items) => addChildById(items, parentId, newItem));
  };

  const handleOpenBlockTemplatePicker = (menuId: string) => {
    const path = findItemPath(menuItems, menuId);
    const rootMenuId = path?.[0]?.id ?? menuId;
    setOpenMenuId(rootMenuId);
    setBlockTemplateTargetId(menuId);
    setSubmenuTemplateTargetId(null);
  };

  const handleApplyBlockTemplate = (templateId: BlockTemplateId) => {
    if (!blockTemplateTargetId) return;
    const isLinkListTemplate =
      templateId === "links" ||
      templateId === "links-3" ||
      templateId === "links-easy" ||
      templateId === "links-icons";
    const isMultiBlockTemplate =
      templateId === "multi" ||
      templateId === "multi-3-photo" ||
      templateId === "multi-2-photos" ||
      templateId === "multi-1-3-photos" ||
      templateId === "multi-4-images" ||
      templateId === "multi-4-products" ||
      templateId === "multi-map-contact-address" ||
      templateId === "multi-4-product-list" ||
      templateId === "multi-1-column-3-product-list" ||
      templateId === "multi-product-carousel" ||
      templateId === "multi-link-list-product-carousel" ||
      templateId === "multi-image-product-carousel" ||
      templateId === "multi-element-group-masonry";
    const isProductGridTemplate = templateId === "product-grid";
    const isProductCarouselTemplate = templateId === "product-carousel";
    const isProductListTemplate = templateId === "product-list";
    const isProductGridHorizontalTemplate = templateId === "product-grid-horizontal";
    const isCollectionListTemplate = templateId === "collection" || templateId === "collection-horizontal";
    if (isMultiBlockTemplate) {
      const newBlocks = buildMultiBlockPreset(templateId);
      setMenuItems((items) =>
        updateItemById(items, blockTemplateTargetId, (item) => ({
          ...item,
          expanded: true,
          children: item.children ? [...item.children, ...newBlocks] : newBlocks,
        }))
      );
      setBlockTemplateTargetId(null);
      return;
    }
    const resolvedBlockTemplate: BlockTemplateId =
      templateId === "links-3" || templateId === "links-easy" || templateId === "links-icons"
        ? "links"
        : templateId === "product-list"
          ? "product"
          : templateId === "collection-horizontal"
            ? "collection"
            : templateId === "html-special"
              ? "html"
              : templateId;
    const linkColumnCount =
      templateId === "links-3" ? 3 : templateId === "links-easy" || templateId === "links-icons" ? 1 : 2;
    const linkWidthDefault =
      templateId === "links-3" ? 4 : templateId === "links-easy" || templateId === "links-icons" ? 3 : 6;
    const labelMap: Record<BlockTemplateId, string> = {
      space: "Space",
      multi: "Multi block",
      "multi-3-photo": "3 columns + 1 photo",
      "multi-2-photos": "2 columns + 2 photos",
      "multi-1-3-photos": "1 column + 3 photos",
      "multi-4-images": "4 images",
      "multi-4-products": "4 products",
      "multi-map-contact-address": "Map + contact + address",
      "multi-4-product-list": "4 product list",
      "multi-1-column-3-product-list": "1 link list + 3 product list",
      "multi-product-carousel": "Product carousel",
      "multi-link-list-product-carousel": "1 link list + product carousel",
      "multi-image-product-carousel": "Image + product carousel",
      "multi-element-group-masonry": "Element Group (Mansory Order)",
      tabs: "Tabs",
      image: "Image 1",
      image2: "Image 2",
      links: "Link list",
      "links-easy": "Easy column",
      "links-3": "Link list (3 columns)",
      "links-icons": "Columns with icons",
      product: "Product",
      "product-horizontal": "Product horizontal",
      "product-grid": "Product grid",
      "product-carousel": "Product carousel",
      "product-list": "Product list",
      "product-grid-horizontal": "Horizontal product grid",
      collection: "Collection list",
      "collection-horizontal": "Horizontal collection list",
      blogs: "Articles",
      "blogs-latest": "Latest blog",
      "html-special": "Special HTML",
      contact: "Contact form",
      html: "Custom HTML",
    };
    const iconMap: Partial<Record<BlockTemplateId, string>> = {
      image: `${ICON_PREFIX}image`,
      image2: `${ICON_PREFIX}image`,
      contact: `${ICON_PREFIX}mail`,
      product: `${ICON_PREFIX}tag`,
      "product-horizontal": `${ICON_PREFIX}tag`,
      "product-grid": `${ICON_PREFIX}tag`,
      "product-carousel": `${ICON_PREFIX}tag`,
      "product-list": `${ICON_PREFIX}tag`,
      "product-grid-horizontal": `${ICON_PREFIX}tag`,
      html: `${ICON_PREFIX}code`,
      "html-special": `${ICON_PREFIX}code`,
    };
    const descriptionMap: Partial<Record<BlockTemplateId, string>> = {
      image: "Sample description",
      image2: "Sample description",
    };
    const imageDefaults =
      templateId === "image" || templateId === "image2"
        ? { imageWidth: 3, imageNoFill: false }
        : {};
    const htmlSpecialContent =
      '<div style="display:flex;gap:12px;align-items:center;">' +
      '<div style="flex:0 0 120px;border:1px solid #e5e7eb;background:#f3f4f4;aspect-ratio:1/1;display:flex;align-items:center;justify-content:center;color:#9ca3af;font-size:12px;">' +
      "Media" +
      "</div>" +
      '<div style="flex:1;min-width:0;">' +
      '<div style="font-weight:600;color:#111827;margin-bottom:4px;">Featured HTML</div>' +
      '<div style="font-size:12px;color:#6b7280;line-height:1.4;">Replace this with your own HTML content.</div>' +
      "</div>" +
      "</div>";
    const htmlDefaults =
      templateId === "html"
        ? {
          htmlContent: "Add your custom HTML here.",
          imageWidth: 3,
        }
        : templateId === "html-special"
          ? {
            htmlContent: htmlSpecialContent,
            imageWidth: 3,
          }
          : {};
    const contactDefaults =
      templateId === "contact"
        ? {
          contactTitle: "Contact",
          contactDescription: "",
          contactNameLabel: "Name",
          contactEmailLabel: "Email",
          contactPhoneLabel: "Phone number",
          contactMessageLabel: "Message",
          contactSubmitLabel: "Send",
          contactSuccessMessage: "Thanks for contacting us. We'll get back to you soon.",
          imageWidth: 6,
        }
        : {};
    const productDefaults =
      templateId === "product" ||
        templateId === "product-horizontal" ||
        templateId === "product-grid" ||
        templateId === "product-carousel" ||
        templateId === "product-list" ||
        templateId === "product-grid-horizontal"
        ? {
          productLayout:
            templateId === "product-horizontal" || templateId === "product-grid-horizontal"
              ? "image-left"
              : "image-top",
          productWidth:
            templateId === "product-grid" || templateId === "product-grid-horizontal"
              ? 4
              : templateId === "product-carousel"
                ? 12
                : 3,
          productIds: [],
        }
        : {};
    const collectionDefaults =
      templateId === "collection" || templateId === "collection-horizontal"
        ? {
          imageWidth: 6,
          collectionLayout: templateId === "collection-horizontal" ? "image-left" : "image-top",
        }
        : {};
    const blogDefaults =
      templateId === "blogs" || templateId === "blogs-latest"
        ? {
          imageWidth: 6,
          blogIds: [],
        }
        : {};
    let newBlockChildren: MenuItem[] = [];
    if (isLinkListTemplate) {
      newBlockChildren =
        templateId === "links-3"
          ? buildThreeColumnLinkItems()
          : templateId === "links-easy"
            ? buildEasyColumnLinkItems()
            : templateId === "links-icons"
              ? buildEasyColumnWithIcons()
              : buildTwoColumnLinkItems();
    } else if (isMultiBlockTemplate) {
      newBlockChildren = buildMultiBlockLinkGroups();
    } else if (isProductGridTemplate) {
      newBlockChildren = buildProductGridItems();
    } else if (isProductCarouselTemplate) {
      newBlockChildren = buildProductCarouselItems();
    } else if (isProductListTemplate) {
      newBlockChildren = buildProductListItems();
    } else if (isProductGridHorizontalTemplate) {
      newBlockChildren = buildHorizontalProductGridItems();
    } else if (isCollectionListTemplate) {
      newBlockChildren = buildCollectionListItems();
    }
    const newBlock: MenuItem = {
      id: buildId(),
      label: labelMap[templateId],
      url: "",
      role: "group",
      expanded: false,
      children: newBlockChildren,
      blockTemplate: resolvedBlockTemplate,
      icon: iconMap[templateId],
      description: descriptionMap[templateId],
      ...imageDefaults,
      ...htmlDefaults,
      ...contactDefaults,
      ...productDefaults,
      ...collectionDefaults,
      ...blogDefaults,
      ...(isLinkListTemplate
        ? { linkColumns: linkColumnCount, linkWidth: linkWidthDefault, linkTextAlign: "left" }
        : {}),
    };
    setMenuItems((items) =>
      updateItemById(items, blockTemplateTargetId, (item) => ({
        ...item,
        expanded: item.expanded ?? false,
        children: item.children ? [...item.children, newBlock] : [newBlock],
      }))
    );
    setBlockTemplateTargetId(null);
  };

  const extractBlockItemsFromTemplate = (items: MenuItem[]): MenuItem[] => {
    for (const item of items) {
      const children = item.children ?? [];
      if (children.some((child) => child.blockTemplate)) {
        return children.filter((child) => child.blockTemplate);
      }
      if (children.length) {
        const nested = extractBlockItemsFromTemplate(children);
        if (nested.length) return nested;
      }
    }
    return [];
  };

  const buildTabsBlockItems = (templateId: SubmenuTemplateId): MenuItem[] => {
    const items =
      templateId === "simple-left-tabs"
        ? buildSimpleLeftTabsItems()
        : templateId === "simple-right-tabs"
          ? buildSimpleRightTabsItems()
          : templateId === "simple-top-tabs"
            ? buildSimpleTopTabsItems()
            : templateId === "two-top-tabs"
              ? buildTwoTopTabsItems()
              : templateId === "three-top-tabs"
                ? buildThreeTopTabsItems()
                : templateId === "two-level-tabs"
                  ? buildTwoLevelTabsItems()
                  : templateId === "three-level-tabs"
                    ? buildThreeLevelTabsItems()
                    : templateId === "two-nested-tabs-right"
                      ? buildTwoNestedTabsRightItems()
                      : templateId === "three-nested-tabs-right"
                        ? buildThreeNestedTabsRightItems()
                        : [];
    return extractBlockItemsFromTemplate(items);
  };

  const buildTabsTemplateItems = (templateId: SubmenuTemplateId): MenuItem[] => {
    if (templateId === "simple-left-tabs") return buildSimpleLeftTabsItems();
    if (templateId === "simple-right-tabs") return buildSimpleRightTabsItems();
    if (templateId === "simple-top-tabs") return buildSimpleTopTabsItems();
    if (templateId === "two-top-tabs") return buildTwoTopTabsItems();
    if (templateId === "three-top-tabs") return buildThreeTopTabsItems();
    if (templateId === "two-level-tabs") return buildTwoLevelTabsItems();
    if (templateId === "three-level-tabs") return buildThreeLevelTabsItems();
    if (templateId === "two-nested-tabs-right") return buildTwoNestedTabsRightItems();
    if (templateId === "three-nested-tabs-right") return buildThreeNestedTabsRightItems();
    return [];
  };

  const handleApplyTabsBlockTemplate = (templateId: SubmenuTemplateId) => {
    if (!blockTemplateTargetId) return;
    const path = findItemPath(menuItems, blockTemplateTargetId);
    const targetItem = path?.[path.length - 1];
    if (!targetItem) return;
    if (targetItem.role === "menu") {
      const isDropdownTemplate =
        templateId === "dropdown" ||
        templateId === "simple-left-tabs" ||
        templateId === "simple-right-tabs" ||
        templateId === "two-nested-tabs-right" ||
        templateId === "three-nested-tabs-right" ||
        templateId === "two-level-tabs" ||
        templateId === "three-level-tabs";
      const isHorizontalDropdownTemplate =
        templateId === "horizontal-dropdown" ||
        templateId === "simple-top-tabs" ||
        templateId === "two-top-tabs" ||
        templateId === "three-top-tabs";
      const dropdownItems = buildTabsTemplateItems(templateId);
      if (!dropdownItems.length) return;
      setMenuItems((items) =>
        updateItemById(items, blockTemplateTargetId, (item) => ({
          ...item,
          expanded: true,
          submenuTemplate: templateId,
          submenuType: isDropdownTemplate
            ? "dropdown"
            : isHorizontalDropdownTemplate
              ? "horizontal-dropdown"
              : item.submenuType,
          submenuWidth:
            isDropdownTemplate || isHorizontalDropdownTemplate
              ? item.submenuWidth ?? "content"
              : "full",
          submenuContentAlign:
            isDropdownTemplate
              ? item.submenuContentAlign ?? "left"
              : isHorizontalDropdownTemplate
                ? item.submenuContentAlign ?? "center"
                : "center",
          children: dropdownItems,
        }))
      );
      setBlockTemplateTargetId(null);
      return;
    }
    const newBlocks = buildTabsBlockItems(templateId);
    if (!newBlocks.length) return;
    setMenuItems((items) =>
      updateItemById(items, blockTemplateTargetId, (item) => ({
        ...item,
        expanded: true,
        children: item.children ? [...item.children, ...newBlocks] : newBlocks,
      }))
    );
    setBlockTemplateTargetId(null);
  };

  const handleApplyMegaMenuPreset = (templateId: BlockTemplateId) => {
    if (!submenuTemplateTargetId) return;
    const newBlocks = buildMultiBlockPreset(templateId);
    setMenuItems((items) =>
      updateItemById(items, submenuTemplateTargetId, (item) => {
        const hasChildren = Boolean(item.children?.length);
        return {
          ...item,
          expanded: true,
          submenuTemplate: "mega",
          submenuType: "mega",
          submenuWidth: "full",
          submenuContentAlign: "center",
          children: hasChildren ? item.children : newBlocks,
        };
      })
    );
    setSubmenuTemplateTargetId(null);
  };

  const handleApplySubmenuTemplate = (templateId: SubmenuTemplateId) => {
    if (!submenuTemplateTargetId) return;
    if (
      !isPlusPlan &&
      (templateId === "tabs" ||
        templateId === "simple-left-tabs" ||
        templateId === "simple-right-tabs" ||
        templateId === "two-nested-tabs-right" ||
        templateId === "three-nested-tabs-right" ||
        templateId === "simple-top-tabs" ||
        templateId === "two-top-tabs" ||
        templateId === "three-top-tabs" ||
        templateId === "two-level-tabs" ||
        templateId === "three-level-tabs")
    ) {
      return;
    }
    const isDropdownTemplate =
      templateId === "dropdown" ||
      templateId === "simple-left-tabs" ||
      templateId === "simple-right-tabs" ||
      templateId === "two-nested-tabs-right" ||
      templateId === "three-nested-tabs-right" ||
      templateId === "custom-normal-dropdown" ||
      templateId === "two-level-tabs" ||
      templateId === "three-level-tabs";
    const isHorizontalDropdownTemplate =
      templateId === "horizontal-dropdown" ||
      templateId === "simple-top-tabs" ||
      templateId === "two-top-tabs" ||
      templateId === "three-top-tabs";
    const newGroup: MenuItem = {
      id: buildId(),
      label: templateId === "tabs" ? "New tab" : "New group",
      url: "",
      role: "group",
      expanded: true,
      children: [],
    };
    const spaceBlock: MenuItem = {
      id: buildId(),
      label: "Space",
      url: "",
      role: "group",
      expanded: true,
      children: [],
      blockTemplate: "space",
    };
    const dropdownItems =
      templateId === "simple-left-tabs"
        ? buildSimpleLeftTabsItems()
        : templateId === "simple-right-tabs"
          ? buildSimpleRightTabsItems()
          : templateId === "two-nested-tabs-right"
            ? buildTwoNestedTabsRightItems()
            : templateId === "three-nested-tabs-right"
              ? buildThreeNestedTabsRightItems()
              : templateId === "custom-normal-dropdown"
                ? buildCustomNormalDropdownItems()
                : templateId === "simple-top-tabs"
                  ? buildSimpleTopTabsItems()
                  : templateId === "two-top-tabs"
                    ? buildTwoTopTabsItems()
                    : templateId === "three-top-tabs"
                      ? buildThreeTopTabsItems()
                      : templateId === "two-level-tabs"
                        ? buildTwoLevelTabsItems()
                        : templateId === "three-level-tabs"
                          ? buildThreeLevelTabsItems()
                          : buildDropdownMenuItems();
    setMenuItems((items) =>
      updateItemById(items, submenuTemplateTargetId, (item) => {
        const hasChildren = Boolean(item.children?.length);
        return {
          ...item,
          expanded: true,
          submenuTemplate: templateId,
          submenuType: isDropdownTemplate ? "dropdown" : isHorizontalDropdownTemplate ? "horizontal-dropdown" : "mega",
          submenuWidth: isDropdownTemplate || isHorizontalDropdownTemplate ? item.submenuWidth ?? "content" : "full",
          submenuContentAlign:
            isDropdownTemplate
              ? item.submenuContentAlign ?? "left"
              : isHorizontalDropdownTemplate
                ? item.submenuContentAlign ?? "center"
                : "center",
          children:
            hasChildren
              ? item.children
              : templateId === "mega"
                ? [spaceBlock]
                : isDropdownTemplate || isHorizontalDropdownTemplate
                  ? dropdownItems
                  : [newGroup],
        };
      })
    );
    setSubmenuTemplateTargetId(null);
  };

  const resetAddItemsState = () => {
    setAddItemsTab("select");
    setAddItemsSearch("");
    setSelectedAddItems({});
    setCustomItems([buildCustomItem()]);
    setLinkPickerOpenId(null);
    setIconPickerState(null);
    setIconPickerSearch("");
    setAddItemAfterId(undefined);
  };

  const handleOpenAddRoot = (targetId?: string | null) => {
    setActivePanel("menu");
    setMenuView("add-root");
    setAddItemsTargetId(targetId ?? null);
    resetAddItemsState();
  };

  const handleCloseAddRoot = () => {
    setMenuView("list");
    setAddItemsTargetId(null);
    resetAddItemsState();
  };

  const updateSelectableItem = (item: AddableItem, checked: boolean) => {
    setSelectedAddItems((prev) => {
      if (checked) {
        return { ...prev, [item.id]: item };
      }
      if (!prev[item.id]) return prev;
      const next = { ...prev };
      delete next[item.id];
      return next;
    });
  };

  const handleAddSelectedItems = () => {
    const items = Object.values(selectedAddItems);
    if (!items.length) return;
    const itemRole: MenuItem["role"] = addItemsTargetId ? "item" : "menu";
    const nextItems = items.map((item) => ({
      id: buildId(),
      label: item.label,
      url: item.url,
      role: itemRole,
      children: [], // Ensure children is initialized
    }));

    if (addItemsTargetId) {
      setMenuItems((prev) =>
        updateItemById(prev, addItemsTargetId, (item) => {
          const children = [...(item.children || [])];
          if (addItemAfterId !== undefined) {
            const index = children.findIndex((c) => c.id === addItemAfterId);
            if (index !== -1) {
              children.splice(index + 1, 0, ...nextItems);
            } else {
              children.push(...nextItems);
            }
          } else if (addItemAfterId === undefined && children.length > 0 && item.children) {
            // If we were adding at start (afterId undefined in handleAddItemAt)
            // we need to distinguish between "add at bottom" and "add at top"
            // But for now, let's just append if not specifically positioned
            children.push(...nextItems);
          } else {
            children.push(...nextItems);
          }
          return {
            ...item,
            expanded: true,
            children,
          };
        })
      );
    } else {
      setMenuItems((prev) => {
        const next = [...prev];
        if (addItemAfterId !== undefined) {
          const index = next.findIndex((i) => i.id === addItemAfterId);
          if (index !== -1) {
            next.splice(index + 1, 0, ...nextItems);
          } else {
            next.push(...nextItems);
          }
        } else {
          next.push(...nextItems);
        }
        return next;
      });
    }
    setMenuView("list");
    setAddItemsTargetId(null);
    resetAddItemsState();
  };

  const updateCustomItem = (id: string, updates: Partial<CustomAddItem>) => {
    setCustomItems((prev) => prev.map((item) => (item.id === id ? { ...item, ...updates } : item)));
  };

  const addCustomItemRow = () => {
    setCustomItems((prev) => [...prev, buildCustomItem()]);
  };

  const handleAddCustomItems = () => {
    const itemRole: MenuItem["role"] = addItemsTargetId ? "item" : "menu";
    const nextItems = customItems
      .map((item) => ({
        title: item.title.trim(),
        url: item.url.trim(),
        description: item.description.trim(),
        icon: item.icon,
      }))
      .filter((item) => item.title.length > 0)
      .map((item) => ({
        id: buildId(),
        label: item.title,
        url: item.url || "/",
        role: itemRole,
        description: item.description || undefined,
        icon: item.icon || undefined,
        children: [],
      }));

    if (!nextItems.length) {
      return;
    }

    if (addItemsTargetId) {
      setMenuItems((prev) =>
        updateItemById(prev, addItemsTargetId, (item) => {
          const children = [...(item.children || [])];
          if (addItemAfterId !== undefined) {
            const index = children.findIndex((c) => c.id === addItemAfterId);
            if (index !== -1) {
              children.splice(index + 1, 0, ...nextItems);
            } else {
              children.push(...nextItems);
            }
          } else {
            children.push(...nextItems);
          }
          return {
            ...item,
            expanded: true,
            children,
          };
        })
      );
    } else {
      setMenuItems((prev) => {
        const next = [...prev];
        if (addItemAfterId !== undefined) {
          const index = next.findIndex((i) => i.id === addItemAfterId);
          if (index !== -1) {
            next.splice(index + 1, 0, ...nextItems);
          } else {
            next.push(...nextItems);
          }
        } else {
          next.push(...nextItems);
        }
        return next;
      });
    }
    setMenuView("list");
    setAddItemsTargetId(null);
    resetAddItemsState();
  };

  const handleDuplicateItem = (id: string) => {
    setMenuItems((items) => {
      const result = duplicateItemById(items, id);
      if (result.duplicatedId) {
        setSelectedItemId(result.duplicatedId);
        setMenuView("list");
      }
      return result.items;
    });
  };

  const handleDeleteItem = (id: string) => {
    setMenuItems((items) => {
      if (selectedItemId) {
        const selectedPath = findItemPath(items, selectedItemId);
        if (selectedPath?.some((entry) => entry.id === id)) {
          const parentId = findParentId(items, id);
          setSelectedItemId(parentId ?? null);
          setMenuView("list");
        }
      }
      if (openMenuId) {
        const openPath = findItemPath(items, openMenuId);
        if (openPath?.some((entry) => entry.id === id)) {
          setOpenMenuId(null);
        }
      }
      return removeItemById(items, id);
    });
  };

  const openDeleteItemDialog = (id: string) => {
    const item = findItemPath(menuItems, id)?.slice(-1)[0];
    setPendingDeleteItemId(id);
    setPendingDeleteItemLabel(item?.label ?? "");
  };

  const confirmDeleteItem = () => {
    if (!pendingDeleteItemId) return;
    handleDeleteItem(pendingDeleteItemId);
    setPendingDeleteItemId(null);
    setPendingDeleteItemLabel("");
  };

  const findParentId = (items: MenuItem[], id: string, parentId: string | null = null): string | null | undefined => {
    for (const item of items) {
      if (item.id === id) return parentId;
      if (item.children?.length) {
        const found = findParentId(item.children, id, item.id);
        if (found !== undefined) return found;
      }
    }
    return undefined;
  };

  const reorderItems = (items: MenuItem[], draggedId: string, targetId: string) => {
    const fromIndex = items.findIndex((entry) => entry.id === draggedId);
    const toIndex = items.findIndex((entry) => entry.id === targetId);
    if (fromIndex < 0 || toIndex < 0 || fromIndex === toIndex) return items;
    const next = [...items];
    const [moved] = next.splice(fromIndex, 1);
    next.splice(toIndex, 0, moved);
    return next;
  };

  const moveItem = (items: MenuItem[], draggedId: string, targetId: string) => {
    const dragParent = findParentId(items, draggedId);
    const targetParent = findParentId(items, targetId);
    if (dragParent === undefined || targetParent === undefined) return items;
    if (dragParent !== targetParent) return items;
    if (dragParent === null) {
      return reorderItems(items, draggedId, targetId);
    }
    return updateItemById(items, dragParent, (item) => ({
      ...item,
      children: item.children ? reorderItems(item.children, draggedId, targetId) : item.children,
    }));
  };

  const handleAddItemAt = (parentId: string | null, afterId: string | undefined) => {
    setAddItemsTargetId(parentId);
    setAddItemAfterId(afterId);
    setAddItemsSearch("");
    setActivePanel("menu");
    setMenuView("add-root");
  };

  const menuTreeDeps: MenuTreeDeps = {
    menuItems,
    setMenuItems,
    selectedItemId,
    draggedItemId,
    draggedParentId,
    setDraggedItemId,
    setDraggedParentId,
    lastDragOverIdRef,
    sidebarRowRefs,
    registerSidebarRow,
    findParentId,
    moveItem,
    handleSelectItem,
    handleToggleExpand,
    handleAddChild,
    handleDuplicateItem,
    openDeleteItemDialog,
    handleOpenAddRoot,
    handleOpenBlockTemplatePicker,
    setSubmenuTemplateTargetId,
  };
  const renderAddBetween = (parentId: string | null, afterId: string | undefined, depth: number) =>
    renderAddBetweenImpl(menuTreeDeps, parentId, afterId, depth);

  const renderMenuTree = (item: MenuItem, depth: number = 0, parentItem?: MenuItem) =>
    renderMenuTreeImpl(menuTreeDeps, item, depth, parentItem);

  const menuPanelDeps: MenuPanelDeps = {
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
  };
  const renderMenuPanel = () => renderMenuPanelImpl(menuPanelDeps);

  const renderLinkListToolbarButtons = (group: MenuItem) =>
    renderLinkListToolbarButtonsImpl(previewBlockDeps, group);

  const renderLinkListBlock = (
    group: MenuItem,
    options: {
      flex?: string;
      wrapperStyle?: CSSProperties;
      toolbarPlacement?: "inline" | "floating";
    } = {}
  ) =>
    renderLinkListBlockImpl(previewBlockDeps, group, options);

  const renderFloatingLinkListToolbar = () =>
    renderFloatingLinkListToolbarImpl(previewBlockDeps, floatingLinkListToolbarPosition);

  const renderImageBlock = (
    group: MenuItem,
    options: {
      flex?: string;
      wrapperStyle?: CSSProperties;
      imagePreviewHeight?: number;
      imageScale?: string;
    } = {}
  ) =>
    renderImageBlockImpl(previewBlockDeps, group, options);

  const renderContactBlock = (
    group: MenuItem,
    options: { flex?: string; wrapperStyle?: CSSProperties } = {}
  ) =>
    renderContactBlockImpl(previewBlockDeps, group, options);

  const renderHtmlBlock = (
    group: MenuItem,
    options: { flex?: string; wrapperStyle?: CSSProperties } = {}
  ) =>
    renderHtmlBlockImpl(previewBlockDeps, group, options);

  const renderProductBlock = (
    group: MenuItem,
    options: { flex?: string; wrapperStyle?: CSSProperties } = {}
  ) =>
    renderProductBlockImpl(previewBlockDeps, group, options);

  const renderCollectionBlock = (
    group: MenuItem,
    options: { flex?: string; wrapperStyle?: CSSProperties } = {}
  ) =>
    renderCollectionBlockImpl(previewBlockDeps, group, options);

  const renderBlogBlock = (
    group: MenuItem,
    options: { flex?: string; wrapperStyle?: CSSProperties } = {}
  ) =>
    renderBlogBlockImpl(previewBlockDeps, group, options);

  const renderElementGroupMasonry = (groups: MenuItem[]) =>
    renderElementGroupMasonryImpl(previewBlockDeps, groups);


  const isTopTabsTemplate =
    previewMenu?.submenuTemplate === "simple-top-tabs" ||
    previewMenu?.submenuTemplate === "two-top-tabs" ||
    previewMenu?.submenuTemplate === "three-top-tabs";
  const isTwoTopTabsTemplate = previewMenu?.submenuTemplate === "two-top-tabs";
  const isThreeTopTabsTemplate = previewMenu?.submenuTemplate === "three-top-tabs";
  const dropdownItems = isDropdownMenu ? dropdownGroups : [];
  const horizontalDropdownItems = isHorizontalDropdownMenu ? dropdownGroups : [];
  const previewMenuIndex = previewMenu ? menuItems.findIndex((item) => item.id === previewMenu.id) : -1;
  const useSimpleLeftTabsCompactLayout = previewMenuIndex > -1 && previewMenuIndex < 3;
  const imageBlockCount = dropdownGroups.filter(
    (group) =>
      group.blockTemplate === "image" ||
      group.blockTemplate === "image2" ||
      group.blockTemplate === "links" ||
      group.blockTemplate === "multi" ||
      group.blockTemplate === "html" ||
      group.blockTemplate === "contact" ||
      group.blockTemplate === "product" ||
      group.blockTemplate === "product-horizontal" ||
      group.blockTemplate === "product-grid" ||
      group.blockTemplate === "product-carousel" ||
      group.blockTemplate === "product-grid-horizontal" ||
      group.blockTemplate === "collection" ||
      group.blockTemplate === "blogs" ||
      group.blockTemplate === "blogs-latest"
  ).length;

  const selectedItemPath = useMemo(() => findItemPath(menuItems, selectedItemId), [menuItems, selectedItemId]);
  const activeHorizontalItem = useMemo(() => {
    if (isTopTabsTemplate) {
      if (!activeHorizontalItemId) return null;
      return horizontalDropdownItems.find((item) => item.id === activeHorizontalItemId) ?? null;
    }
    return (
      horizontalDropdownItems.find((item) => selectedItemPath?.some((p) => p.id === item.id)) ?? null
    );
  }, [activeHorizontalItemId, horizontalDropdownItems, isTopTabsTemplate, selectedItemPath]);
  const activeHorizontalChildren = activeHorizontalItem?.children ?? [];
  const activeHorizontalHasBlocks = activeHorizontalChildren.some((child) => child.blockTemplate);
  const activeHorizontalChild = isTwoTopTabsTemplate
    ? activeHorizontalChildren.find((child) => child.id === activeHorizontalChildId) ?? null
    : isThreeTopTabsTemplate
      ? activeHorizontalChildren.find((child) => child.id === activeHorizontalChildId) ?? null
      : null;
  const activeHorizontalChildChildren = activeHorizontalChild?.children ?? [];
  const activeHorizontalChildBlocks = activeHorizontalChildChildren;
  const activeHorizontalChildHasBlocks = activeHorizontalChildChildren.some((child) => child.blockTemplate);
  const activeHorizontalGrandchild = isThreeTopTabsTemplate
    ? activeHorizontalChildChildren.find((child) => child.id === activeHorizontalGrandchildId) ?? null
    : null;
  const activeHorizontalGrandchildBlocks = activeHorizontalGrandchild?.children ?? [];
  const activeHorizontalGrandchildHasBlocks = activeHorizontalGrandchildBlocks.some((child) => child.blockTemplate);
  const linkBlockCount = dropdownGroups.filter(
    (group) => group.blockTemplate === "links" || group.blockTemplate === "multi"
  ).length;
  const hasSpaceBlock = dropdownGroups.some((group) => group.blockTemplate === "space");
  const useImageSpaceLayout =
    imageBlockCount > 0 &&
    hasSpaceBlock &&
    dropdownGroups.every(
      (group) =>
        group.blockTemplate === "image" ||
        group.blockTemplate === "image2" ||
        group.blockTemplate === "links" ||
        group.blockTemplate === "multi" ||
        group.blockTemplate === "html" ||
        group.blockTemplate === "contact" ||
        group.blockTemplate === "product" ||
        group.blockTemplate === "product-horizontal" ||
        group.blockTemplate === "product-grid" ||
        group.blockTemplate === "product-carousel" ||
        group.blockTemplate === "product-grid-horizontal" ||
        group.blockTemplate === "collection" ||
        group.blockTemplate === "blogs" ||
        group.blockTemplate === "blogs-latest" ||
        group.blockTemplate === "space"
    );
  const useBlockFlexLayout =
    useImageSpaceLayout ||
    dropdownGroups.some(
      (group) =>
        group.blockTemplate === "links" ||
        group.blockTemplate === "multi" ||
        group.blockTemplate === "collection" ||
        group.blockTemplate === "blogs" ||
        group.blockTemplate === "blogs-latest" ||
        group.blockTemplate === "product" ||
        group.blockTemplate === "product-grid" ||
        group.blockTemplate === "product-carousel" ||
        group.blockTemplate === "product-grid-horizontal" ||
        group.blockTemplate === "product-horizontal" ||
        group.blockTemplate === "html" ||
        group.blockTemplate === "contact"
    );

  const menuRowHeight = isMobilePreview
    ? Math.max(builderSettings.spacingMainRowHeight, 52)
    : builderSettings.spacingMainRowHeight;
  const dropdownTop = dropdownAnchor?.top ?? menuRowHeight;
  const showDividers =
    previewMode === "mobile"
      ? builderSettings.elementsShowMobileDivider
      : builderSettings.elementsShowDesktopDivider;
  const menuMaxWidthValue = builderSettings.layoutMaxWidth.trim();
  const menuMaxWidth = menuMaxWidthValue
    ? Number.isFinite(Number(menuMaxWidthValue))
      ? Number(menuMaxWidthValue)
      : null
    : null;
  const submenuMaxWidthValue = builderSettings.submenuMaxWidth.trim();
  const submenuMaxWidth = submenuMaxWidthValue
    ? Number.isFinite(Number(submenuMaxWidthValue))
      ? Number(submenuMaxWidthValue)
      : null
    : null;

  const resolveTypographyStyle = (
    useCustom: boolean,
    fontFamily: string,
    fontWeight: number,
    fontSize: number
  ) => ({
    fontFamily: useCustom ? fontFamily : themeSettings.fontFamily,
    fontWeight,
    fontSize,
  });

  const mainTypography = resolveTypographyStyle(
    builderSettings.typographyMainUseCustom,
    builderSettings.typographyMainFont,
    builderSettings.typographyMainWeight,
    builderSettings.typographyMainSize
  );
  const tabTypography = resolveTypographyStyle(
    builderSettings.typographyTabUseCustom,
    builderSettings.typographyTabFont,
    builderSettings.typographyTabWeight,
    builderSettings.typographyTabSize
  );
  const subheadingTypography = resolveTypographyStyle(
    builderSettings.typographySubheadingUseCustom,
    builderSettings.typographySubheadingFont,
    builderSettings.typographySubheadingWeight,
    builderSettings.typographySubheadingSize
  );
  const subtextTypography = resolveTypographyStyle(
    builderSettings.typographySubtextUseCustom,
    builderSettings.typographySubtextFont,
    builderSettings.typographySubtextWeight,
    builderSettings.typographySubtextSize
  );
  const descriptionTypography = resolveTypographyStyle(
    builderSettings.typographyDescriptionUseCustom,
    builderSettings.typographyDescriptionFont,
    builderSettings.typographyDescriptionWeight,
    builderSettings.typographyDescriptionSize
  );
  const previewColors = {
    mainBackground: builderSettings.colorMainBackground,
    mainBackgroundHover: builderSettings.colorMainBackgroundHover,
    mainDivider: builderSettings.colorMainDivider,
    mainText: builderSettings.colorMainText,
    mainTextHover: builderSettings.colorMainTextHover,
    tabHeading: builderSettings.colorTabHeading,
    tabHeadingActive: builderSettings.colorTabHeadingActive,
    tabBackgroundActive: builderSettings.colorTabBackgroundActive,
    submenuBackground: builderSettings.colorSubmenuBackground,
    submenuBorder: builderSettings.colorSubmenuBorder,
    submenuHeading: builderSettings.colorSubmenuHeading,
    submenuText: builderSettings.colorSubmenuText,
    submenuTextHover: builderSettings.colorSubmenuTextHover,
    submenuDescription: builderSettings.colorSubmenuDescription,
    submenuDescriptionHover: builderSettings.colorSubmenuDescriptionHover,
    buttonText: builderSettings.colorButtonText,
    buttonBackground: builderSettings.colorButtonBackground,
    buttonBackgroundHover: builderSettings.colorButtonBackgroundHover,
    buttonTextHover: builderSettings.colorButtonTextHover,
  };

  const previewBlockDeps: PreviewBlockDeps = {
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
    handleOpenBlockTemplatePicker,
    registerPreviewRow,
    builderSettings,
    themeSettings,
    previewColors,
    subheadingTypography,
    descriptionTypography,
    isMobilePreview,
    useImageSpaceLayout,
    useBlockFlexLayout,
    hoveredImageBlockId,
    setHoveredImageBlockId,
    productCarouselPageById,
    setProductCarouselPageById,
    previewMenu,
    menu,
    products,
    collections,
    blogs,
    latestArticles,
    contactFetcher,
    subtextTypography,
    floatingLinkListToolbarId,
    setFloatingLinkListToolbarId,
    floatingLinkListToolbarHoverRef,
    hideFloatingLinkListToolbarTimeoutRef,
    mobileLinkListExpandedById,
    setMobileLinkListExpandedById,
    handleOpenAddRoot,
  };
  const megaPanelDeps: MegaPanelDeps = {
    ...previewBlockDeps,
    dropdownGroups,
    linkBlockCount,
    submenuMaxWidth,
    isDropdownMenu,
    isHorizontalDropdownMenu,
    getBlockSpan,
  };
  const dropdownOverflowY =
    previewMode === "mobile"
      ? builderSettings.submenuEnableMobileScroll
      : builderSettings.submenuEnableDesktopScroll;
  const enableDropdownScroll = dropdownOverflowY && linkBlockCount === 0;
  const dropdownContentAlign = isDropdownMenu
    ? previewMenu?.submenuContentAlign ?? "left"
    : previewMenu?.submenuContentAlign ?? "center";
  const getSubmenuJustify = (align?: MenuItem["submenuContentAlign"]) => {
    if (align === "left") return "flex-start";
    if (align === "right") return "flex-end";
    if (align === "space-between") return "space-between";
    if (align === "space-around") return "space-around";
    if (align === "space-evenly") return "space-evenly";
    return "center";
  };
  const dropdownAlignJustify = getSubmenuJustify(dropdownContentAlign);
  const dropdownPanelWidth =
    isMobilePreview
      ? "100%"
      : (previewMenu?.submenuTemplate === "dropdown" ||
        previewMenu?.submenuTemplate === "custom-normal-dropdown" ||
        previewMenu?.submenuTemplate === "simple-left-tabs" ||
        previewMenu?.submenuTemplate === "simple-right-tabs" ||
        previewMenu?.submenuTemplate === "two-level-tabs" ||
        previewMenu?.submenuTemplate === "three-level-tabs" ||
        previewMenu?.submenuTemplate === "two-nested-tabs-right" ||
        previewMenu?.submenuTemplate === "three-nested-tabs-right")
        ? 240
        : (previewMenu?.submenuWidth !== "content")
          ? "100%"
          : (previewMenu?.submenuCustomWidth ?? 600);
  const previewContainerWidth =
    previewContainerRef.current?.getBoundingClientRect().width ?? menuMaxWidth ?? 1260;
  const useFixedVerticalMenuWidth =
    !isMobilePreview && builderSettings.layoutOrientation === "vertical";
  const verticalMenuWidth = Math.min(360, previewContainerWidth);
  const dropdownPanelPixelWidth =
    dropdownPanelWidth === "100%"
      ? previewContainerWidth
      : typeof dropdownPanelWidth === "number"
        ? dropdownPanelWidth
        : parseInt(dropdownPanelWidth as string);

  let dropdownLeft = 0;
  if (dropdownAnchor && (previewMenu?.submenuWidth === "content" || previewMenu?.submenuTemplate === "dropdown" || previewMenu?.submenuTemplate === "custom-normal-dropdown" || previewMenu?.submenuTemplate === "simple-left-tabs" || previewMenu?.submenuTemplate === "simple-right-tabs" || previewMenu?.submenuTemplate === "two-nested-tabs-right" || previewMenu?.submenuTemplate === "three-nested-tabs-right") && !isMobilePreview) {
    // For standard dropdowns, always position left aligned to anchor, but allow content alignment to vary.
    const effectiveAlign = (previewMenu?.submenuTemplate === "dropdown" || previewMenu?.submenuTemplate === "custom-normal-dropdown" || previewMenu?.submenuTemplate === "simple-left-tabs")
      ? "left"
      : (previewMenu?.submenuTemplate === "simple-right-tabs" || previewMenu?.submenuTemplate === "two-nested-tabs-right" || previewMenu?.submenuTemplate === "three-nested-tabs-right")
        ? "right"
        : dropdownContentAlign;

    if (effectiveAlign === "center") {
      dropdownLeft = dropdownAnchor.left + dropdownAnchor.width / 2 - dropdownPanelPixelWidth / 2;
    } else if (effectiveAlign === "right") {
      if (previewMenu?.submenuTemplate === "simple-right-tabs" || previewMenu?.submenuTemplate === "two-nested-tabs-right" || previewMenu?.submenuTemplate === "three-nested-tabs-right") {
        dropdownLeft = previewContainerWidth - dropdownPanelPixelWidth;
      } else {
        dropdownLeft = dropdownAnchor.left + dropdownAnchor.width - dropdownPanelPixelWidth;
      }
    } else {
      dropdownLeft = dropdownAnchor.left;
    }
  } else if (isMobilePreview && !isDropdownMenu && !isHorizontalDropdownMenu) {
    dropdownLeft = 0;
  }
  const shouldInlineMobileDropdownPanel = isMobilePreview && isDropdownMenu;
  const shouldInlineMobileHorizontalDropdownPanel =
    isMobilePreview && previewMenu?.submenuType === "horizontal-dropdown";

  const mobilePanelDeps: MobilePanelDeps = {
    ...previewBlockDeps,
    dropdownItems,
    horizontalDropdownItems,
    dropdownContentAlign,
    dropdownAlignJustify,
    shouldInlineMobileDropdownPanel,
    shouldInlineMobileHorizontalDropdownPanel,
    activeDropdownItemId,
    setActiveDropdownItemId,
    activeDropdownChildId,
    setActiveDropdownChildId,
    activeDropdownGrandchildId,
    setActiveDropdownGrandchildId,
    activeHorizontalItemId,
    setActiveHorizontalItemId,
    activeHorizontalChildId,
    setActiveHorizontalChildId,
    activeHorizontalGrandchildId,
    setActiveHorizontalGrandchildId,
  };
  const mainRowDeps: MainRowDeps = {
    ...previewBlockDeps,
    isVerticalMenu,
    showDividers,
    menuRowHeight,
    mainTypography,
    tabTypography,
    openMenuId,
    setOpenMenuId,
    hoveredMenuId,
    isSearchOpen,
    setIsSearchOpen,
    dropdownGroups,
    registerPreviewMenuItem,
    handlePreviewHoverStart,
    handlePreviewHoverEnd,
    setSubmenuTemplateTargetId,
  };
  const renderMobileBlockGroup = (group: MenuItem) =>
    renderMobileBlockGroupImpl(mobilePanelDeps, group);

  const renderMobileDropdownPanel = () =>
    renderMobileDropdownPanelImpl(mobilePanelDeps);

  const renderMobileHorizontalDropdownPanel = () =>
    renderMobileHorizontalDropdownPanelImpl(mobilePanelDeps);

  const handleSaveMenu = (
    nextStatus?: "active" | "draft",
    intent: "save" | "publish" | "enable" = "save"
  ) => {
    lastSaveIntentRef.current = intent;
    if (intent !== "save") {
      setRequiresExplicitSave(true);
    }
    setActiveSaveAction(intent);
    const status = nextStatus ?? menuStatus;
    setMenuStatus(status);
    saveFetcher.submit(
      {
        intent: "save",
        menuId: String(menu.id),
        status,
        items: JSON.stringify(menuItems),
        settings: JSON.stringify(builderSettings),
      },
      { method: "post" }
    );
  };

  const isSaving = saveFetcher.state !== "idle";
  const currentFingerprint = useMemo(
    () => buildMenuFingerprint(menuStatus, menuItems, builderSettings),
    [menuStatus, menuItems, builderSettings]
  );
  const isDirty = currentFingerprint !== savedFingerprint;
  const backDisabled = isSaving;

  const discardUnsavedChanges = () => {
    try {
      const snapshot = savedSnapshotRef.current;
      const nextStatus = snapshot.status ?? menu.status ?? "draft";
      const nextItems = snapshot.items ?? normalizedMenuItems;
      const nextSettings =
        snapshot.settings ?? { ...DEFAULT_BUILDER_SETTINGS, ...normalizedMenuSettings };
      setMenuStatus(nextStatus === "active" ? "active" : "draft");
      setMenuItems(nextItems);
      setSelectedItemId(nextItems[0]?.id ?? null);
      setBuilderSettings(nextSettings);
      setRequiresExplicitSave(false);
      setActiveSaveAction(null);
      setSubmenuTemplateTargetId(null);
      setBlockTemplateTargetId(null);
    } catch (error) {
      console.error("Failed to discard changes:", error);
    }
  };

  useEffect(() => {
    if (saveFetcher.state === "idle" && saveFetcher.data?.ok) {
      setActiveSaveAction(null);
      if (lastSaveIntentRef.current === "save") {
        setSavedFingerprint(currentFingerprint);
        savedSnapshotRef.current = {
          status: menuStatus,
          items: menuItems,
          settings: builderSettings,
        };
        setRequiresExplicitSave(false);
      }
    }
  }, [
    saveFetcher.state,
    saveFetcher.data,
    currentFingerprint,
    menuStatus,
    menuItems,
    builderSettings,
  ]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!isDirty && !requiresExplicitSave) return;
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty, requiresExplicitSave]);

  useEffect(() => {
    exitGuardRef.current = { isDirty, requiresExplicitSave, isSaving };
  }, [isDirty, requiresExplicitSave, isSaving]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const host = new URLSearchParams(location.search).get("host");
    if (!apiKey || !host) return;
    if (!appBridgeRef.current) {
      appBridgeRef.current = createApp({ apiKey, host, forceRedirect: true });
    }
    setFullscreenPhase("entering");
    fullscreenExitRequestedRef.current = false;
    fullscreenExitArmedRef.current = false;
    if (fullscreenExitArmTimeoutRef.current) {
      clearTimeout(fullscreenExitArmTimeoutRef.current);
      fullscreenExitArmTimeoutRef.current = null;
    }
    if (fullscreenExitNavigateTimeoutRef.current) {
      clearTimeout(fullscreenExitNavigateTimeoutRef.current);
      fullscreenExitNavigateTimeoutRef.current = null;
    }
    const appBridge = appBridgeRef.current;
    const unsubscribe = appBridge.subscribe(Fullscreen.Action.EXIT, () => {
      if (fullscreenExitRequestedRef.current || !fullscreenExitArmedRef.current) return;
      const { isDirty: hasUnsaved, requiresExplicitSave: needsExplicitSave, isSaving: saving } =
        exitGuardRef.current;
      if (hasUnsaved || needsExplicitSave || saving) {
        setPendingExitIntent(true);
        setDiscardChangesModalOpen(true);
        appBridge.dispatch(Fullscreen.enter());
        return;
      }
      fullscreenExitRequestedRef.current = true;
      setFullscreenPhase("exiting");
      fullscreenExitNavigateTimeoutRef.current = setTimeout(() => {
        fullscreenExitNavigateTimeoutRef.current = null;
        navigate({ pathname: returnToPath, search: returnToSearch });
      }, 120);
    });
    appBridge.dispatch(Fullscreen.enter());
    fullscreenExitArmTimeoutRef.current = setTimeout(() => {
      fullscreenExitArmedRef.current = true;
      setFullscreenPhase("ready");
      fullscreenExitArmTimeoutRef.current = null;
    }, 300);
    return () => {
      if (fullscreenExitArmTimeoutRef.current) {
        clearTimeout(fullscreenExitArmTimeoutRef.current);
        fullscreenExitArmTimeoutRef.current = null;
      }
      if (fullscreenExitNavigateTimeoutRef.current) {
        clearTimeout(fullscreenExitNavigateTimeoutRef.current);
        fullscreenExitNavigateTimeoutRef.current = null;
      }
      fullscreenExitRequestedRef.current = true;
      unsubscribe();
      appBridge.dispatch(Fullscreen.exit());
    };
  }, [apiKey, location.search, navigate, returnToPath, returnToSearch]);

  useEffect(() => {
    if (prevMenuIdRef.current === menu.id) {
      return;
    }
    prevMenuIdRef.current = menu.id;
    setMenuStatus(menu.status === "active" ? "active" : "draft");
    setMenuItems(defaultExpandedMenuItems);
    setSelectedItemId(normalizedMenuItems[0]?.id ?? null);
    setBuilderSettings({ ...DEFAULT_BUILDER_SETTINGS, ...normalizedMenuSettings });
    setRequiresExplicitSave(false);
    setActiveSaveAction(null);
    setSubmenuTemplateTargetId(null);
    setBlockTemplateTargetId(null);
    savedSnapshotRef.current = {
      status: menu.status === "active" ? "active" : "draft",
      items: defaultExpandedMenuItems,
      settings: { ...DEFAULT_BUILDER_SETTINGS, ...normalizedMenuSettings },
    };
    setSavedFingerprint(
      buildMenuFingerprint(
        menu.status === "active" ? "active" : "draft",
        defaultExpandedMenuItems,
        { ...DEFAULT_BUILDER_SETTINGS, ...normalizedMenuSettings }
      )
    );
  }, [menu.id, normalizedMenuSettings, normalizedMenuItems, defaultExpandedMenuItems]);

  useEffect(() => {
    if (submenuTemplateTargetId) return;
    if (submenuTemplateHoverTimeoutRef.current) {
      clearTimeout(submenuTemplateHoverTimeoutRef.current);
      submenuTemplateHoverTimeoutRef.current = null;
    }
    setSubmenuTemplateHoverId(null);
    setSubmenuTemplatePanelHover(false);
  }, [submenuTemplateTargetId]);

  useEffect(() => {
    if (blockTemplateTargetId) return;
    if (blockTemplateHoverTimeoutRef.current) {
      clearTimeout(blockTemplateHoverTimeoutRef.current);
      blockTemplateHoverTimeoutRef.current = null;
    }
    setBlockTemplateHoverId(null);
    setBlockTemplatePanelHover(false);
  }, [blockTemplateTargetId]);

  useEffect(() => {
    if (!iconPickerState || iconPickerState.mode !== "library") return;
    const resetScroll = () => {
      if (iconPickerScrollRef.current) {
        iconPickerScrollRef.current.scrollTop = 0;
      }
    };
    resetScroll();
    requestAnimationFrame(resetScroll);
    const timer = setTimeout(resetScroll, 120);
    return () => clearTimeout(timer);
  }, [iconPickerState]);

  const isTemplatePickerOpen = Boolean(submenuTemplateTargetId || blockTemplateTargetId);
  const renderMenuItemButton = (item: MenuItem) =>
    renderMenuItemButtonImpl(mainRowDeps, item);
  const renderAccountLinkButton = (link: {
    id: string;
    label: string;
    icon: string;
    iconWidthMode: "auto" | "custom";
    iconWidthValue: number;
    iconWidthUnit: "%" | "px";
  }) =>
    renderAccountLinkButtonImpl(mainRowDeps, link);
  const renderSearchControl = (marginLeft?: string | number) =>
    renderSearchControlImpl(mainRowDeps, marginLeft);

  const renderSpaceBlock = (
    group: MenuItem,
    options?: { isSelected?: boolean; wrapperStyle?: CSSProperties }
  ) =>
    renderSpaceBlockImpl(previewBlockDeps, group, options);

  const renderMegaPanel = (inline: boolean) =>
    renderMegaPanelImpl(megaPanelDeps, inline);

  return (
    <div className="menucraft-builder h-screen flex flex-col bg-gray-100">
      <style>{`
        .menu-builder-hide-scrollbar::-webkit-scrollbar { display: none; }
        .menu-builder-hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
      {fullscreenPhase !== "ready" ? (
        <div className="fixed inset-0 z-50 bg-gray-100" />
      ) : null}
      <Modal
        open={Boolean(pendingDeleteItemId)}
        onClose={() => {
          setPendingDeleteItemId(null);
          setPendingDeleteItemLabel("");
        }}
        title="Remove this menu item and its submenus"
        primaryAction={{
          content: "Delete",
          destructive: true,
          onAction: confirmDeleteItem,
        }}
        secondaryActions={[
          {
            content: "Cancel",
            onAction: () => {
              setPendingDeleteItemId(null);
              setPendingDeleteItemLabel("");
            },
          },
        ]}
      >
        <Modal.Section>
          <Text as="p" variant="bodySm">
            {pendingDeleteItemLabel
              ? `Are you sure you want to remove "${pendingDeleteItemLabel}" and all of its submenus?`
              : "Are you sure you want to remove this menu item and all of its submenus?"}
          </Text>
        </Modal.Section>
      </Modal>
      <Modal
        open={discardChangesModalOpen}
        onClose={() => {
          setDiscardChangesModalOpen(false);
          setPendingExitIntent(false);
          appBridgeRef.current?.dispatch(Fullscreen.enter());
        }}
        title="Discard unsaved changes"
        primaryAction={{
          content: "Discard changes",
          destructive: true,
          onAction: () => {
            discardUnsavedChanges();
            setDiscardChangesModalOpen(false);
            if (pendingExitIntent) {
              setPendingExitIntent(false);
              navigate({ pathname: returnToPath, search: returnToSearch });
              return;
            }
          },
        }}
        secondaryActions={[
          {
            content: "Keep editing",
            onAction: () => {
              setDiscardChangesModalOpen(false);
              setPendingExitIntent(false);
              appBridgeRef.current?.dispatch(Fullscreen.enter());
            },
          },
        ]}
      >
        <Modal.Section>
          <Text as="p" variant="bodySm">
            If you discard changes, you will lose all edits made since your last save.
          </Text>
        </Modal.Section>
      </Modal>
      <style>
        {`
          @keyframes menucraftCarouselFade {
            from {
              opacity: 0;
              transform: translateX(8px);
            }
            to {
              opacity: 1;
              transform: translateX(0);
            }
          }
        `}
      </style>
      <div className="bg-white border-b border-gray-200 px-4 py-3 relative z-[35]">
        <InlineStack align="space-between" blockAlign="center" gap="400">
          <InlineStack gap="300" blockAlign="center">
            <Button
              variant="tertiary"
              icon={ArrowLeftIcon}
              disabled={backDisabled}
              onClick={() => {
                if (isDirty || requiresExplicitSave) {
                  setDiscardChangesModalOpen(true);
                  return;
                }
                navigate({ pathname: returnToPath, search: returnToSearch });
              }}
            >
              Back
            </Button>
            <InlineStack gap="300" blockAlign="center">
              <Text as="h1" variant="headingMd">
                {menu.name}
              </Text>
              {isDirty || requiresExplicitSave ? (
                <Text as="span" variant="bodySm" tone="critical">
                  Save before leaving
                </Text>
              ) : menuEnabled ? (
                <Badge tone="success">Live</Badge>
              ) : (
                <Badge tone="read-only">Draft</Badge>
              )}
            </InlineStack>
          </InlineStack>

          <InlineStack gap="200" blockAlign="center">
            <Button
              variant="secondary"
              disabled={!menuEnabled || isSaving}
              onClick={() => handleSaveMenu("draft", "enable")}
              loading={isSaving && activeSaveAction === "enable"}
            >
              Disable
            </Button>
            <Button
              variant="secondary"
              onClick={() => handleSaveMenu(undefined, "save")}
              loading={isSaving && activeSaveAction === "save"}
            >
              Save
            </Button>
            <Button
              variant="primary"
              onClick={() => handleSaveMenu("active", "publish")}
              loading={isSaving && activeSaveAction === "publish"}
            >
              Publish
            </Button>
          </InlineStack>
        </InlineStack>
      </div>

      <div className="flex flex-1 overflow-hidden relative">
        <aside
          className={`w-16 bg-white border-r border-gray-200 flex flex-col items-center py-4 gap-2 transition-opacity ${isTemplatePickerOpen ? "pointer-events-none opacity-50" : ""}`}
        >
          {[
            { id: "menu", icon: MenuIcon, label: "Menu" },
            { id: "settings", icon: SettingsIcon, label: "Settings" },
            { id: "typography", icon: TextFontListIcon, label: "Typography" },
            { id: "colors", icon: PaintBrushRoundIcon, label: "Colors" },
            { id: "code", icon: CodeIcon, label: "Code" },
          ].map((panel) => (
            <div key={panel.id} className="group relative flex items-center justify-center">
              <button
                type="button"
                onClick={() => {
                  setActivePanel(panel.id as RailPanel);
                  if (panel.id !== "menu") {
                    setMenuView("list");
                  }
                }}
                aria-label={panel.label}
                className={`flex h-11 w-11 items-center justify-center rounded-lg transition-colors ${activePanel === panel.id
                  ? "bg-indigo-50 text-indigo-600"
                  : "text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                  }`}
              >
                <Icon source={panel.icon} tone={activePanel === panel.id ? "primary" : "subdued"} />
              </button>
              <span className="pointer-events-none absolute left-0 top-full z-20 mt-2 translate-x-0 whitespace-nowrap rounded-md border border-gray-200 bg-white px-3 py-1 text-left text-xs font-medium text-gray-700 opacity-0 shadow-sm transition-opacity group-hover:opacity-100">
                <span className="absolute -top-1 left-3 h-2 w-2 -translate-x-1/2 rotate-45 border-l border-t border-gray-200 bg-white" />
                {panel.label}
              </span>
            </div>
          ))}
        </aside>

        <aside
          className={`w-80 bg-white border-r border-gray-200 flex flex-col transition-opacity ${isTemplatePickerOpen ? "pointer-events-none opacity-50" : ""}`}
        >
          <div className="flex-1 overflow-y-auto" ref={settingsScrollRef}>
            <BlockStack gap="400" className="flex min-h-0 h-full flex-col">
              {activePanel === "menu" && renderMenuPanel()}
              {activePanel === "settings" && (
                <SettingsPanel
                  builderSettings={builderSettings}
                  updateBuilderSetting={updateBuilderSetting}
                  menus={menus}
                  accountIconMenuOpenId={accountIconMenuOpenId}
                  setAccountIconMenuOpenId={setAccountIconMenuOpenId}
                  iconPickerState={iconPickerState}
                  openIconPicker={openIconPicker}
                  resolveCustomIconPreview={resolveCustomIconPreview}
                  renderIconLibraryPanel={renderIconLibraryPanel}
                  renderIconUploadPanel={renderIconUploadPanel}
                />
              )}
              {activePanel === "typography" && (
                <TypographyPanel
                  builderSettings={builderSettings}
                  updateBuilderSetting={updateBuilderSetting}
                  fontPickerState={fontPickerState}
                  fontPickerSearch={fontPickerSearch}
                  setFontPickerSearch={setFontPickerSearch}
                  fontPickerFont={fontPickerFont}
                  setFontPickerFont={setFontPickerFont}
                  fontPickerWeight={fontPickerWeight}
                  setFontPickerWeight={setFontPickerWeight}
                  openFontPickerFor={openFontPickerFor}
                  closeFontPicker={closeFontPicker}
                />
              )}
              {activePanel === "colors" && (
                <ColorsPanel
                  builderSettings={builderSettings}
                  updateBuilderSetting={updateBuilderSetting}
                  openColorPicker={openColorPicker}
                  toggleColorPicker={toggleColorPicker}
                  colorPickerHsb={colorPickerHsb}
                  setColorPickerHsb={setColorPickerHsb}
                />
              )}
              {activePanel === "code" && (
                <CodePanel
                  builderSettings={builderSettings}
                  updateBuilderSetting={updateBuilderSetting}
                />
              )}
            </BlockStack>
          </div>
        </aside>

        <main className="flex-1 overflow-auto relative" style={{ background: themeSettings.canvasBackground }}>
          <Box padding="600">
            <div
              ref={previewContainerRef}
              className="menucraft-preview"
              style={{
                maxWidth: previewMode === "mobile" ? 520 : menuMaxWidth ?? 1260,
                margin: "36px auto 0",
                fontFamily: themeSettings.fontFamily,
                position: "relative",
              }}
            >
              {builderSettings.customCss ? (
                <style
                  // Intentionally raw to allow advanced selectors in preview.
                  dangerouslySetInnerHTML={{ __html: builderSettings.customCss }}
                />
              ) : null}
              <div style={{ position: "relative", width: "100%" }}>
                {builderSettings.elementsShowSearch && isMobilePreview ? (
                  <div
                    style={{
                      background: "#ffffff",
                      color: "#1f2937",
                      display: "flex",
                      alignItems: "center",
                      padding: "14px 20px",
                      borderRadius: 0,
                    }}
                  >
                    <span style={{ color: "#6b7280", fontSize: 18 }}>Search for...</span>
                    <span style={{ marginLeft: "auto", display: "inline-flex", color: "#111827" }}>
                      <SearchIcon width="18" height="18" fill="#111827" />
                    </span>
                  </div>
                ) : null}
                <div
                  style={{
                    background: previewColors.mainBackground,
                    borderRadius: 0,
                    overflow: "visible",
                    position: "relative",
                    width: useFixedVerticalMenuWidth ? verticalMenuWidth : "100%",
                    marginRight: useFixedVerticalMenuWidth ? "auto" : undefined,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      flexDirection: isVerticalMenu ? "column" : "row",
                      alignItems: "stretch",
                      justifyContent: "flex-start",
                      gap: 0,
                      height: isVerticalMenu ? "auto" : menuRowHeight,
                      color: previewColors.mainText,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        flex: isVerticalMenu ? "0 0 auto" : 1,
                        flexDirection: isVerticalMenu ? "column" : "row",
                        alignItems: "stretch",
                        justifyContent: isVerticalMenu
                          ? "flex-start"
                          : menuAlignmentMap[builderSettings.layoutAlignment],
                        gap: 0,
                      }}
                    >
                      {menuItemsForMainRow.map((item) => (
                        <div
                          key={`menu-row-${item.id}`}
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            justifyContent: "center",
                            minHeight: builderSettings.spacingMainRowHeight,
                            width: isVerticalMenu ? "100%" : "auto",
                            height: isVerticalMenu ? "auto" : "100%",
                          }}
                        >
                          {renderMenuItemButton(item)}
                          {shouldInlineMobilePanel && openMenuId === item.id
                            ? renderMegaPanel(true)
                            : null}
                          {shouldInlineMobileDropdownPanel && openMenuId === item.id
                            ? renderMobileDropdownPanel()
                            : null}
                          {shouldInlineMobileHorizontalDropdownPanel && openMenuId === item.id
                            ? renderMobileHorizontalDropdownPanel()
                            : null}
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => handleOpenAddRoot()}
                        style={{
                          color: previewColors.mainText,
                          height: isVerticalMenu ? menuRowHeight : "100%",
                          minWidth: isVerticalMenu ? "100%" : 50,
                          padding: isVerticalMenu ? "0 12px" : "0 18px",
                          borderRight:
                            showDividers && !isVerticalMenu
                              ? `1px solid ${previewColors.mainDivider}`
                              : "none",
                          borderBottom:
                            showDividers && isVerticalMenu
                              ? `1px solid ${previewColors.mainDivider}`
                              : "none",
                          borderRadius: 0,
                          background: previewColors.mainBackground,
                          transition: "background 150ms ease",
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: isVerticalMenu ? "center" : "flex-start",
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
                        +
                      </button>
                    </div>
                    {hasRightSideItems ? (
                      <div
                        style={{
                          marginLeft: isVerticalMenu ? 0 : "auto",
                          display: isVerticalMenu ? "block" : "flex",
                          alignItems: "stretch",
                          height: isVerticalMenu ? "auto" : "100%",
                        }}
                      >
                        {rightAlignedMenuItems.map((item) => renderMenuItemButton(item))}
                        {accountLinks.map((link) => renderAccountLinkButton(link))}
                        {renderSearchControl(0)}
                      </div>
                    ) : (
                      <>
                        {rightAlignedMenuItems.map((item) => renderMenuItemButton(item))}
                        {accountLinks.map((link) => renderAccountLinkButton(link))}
                        {renderSearchControl("auto")}
                      </>
                    )}
                  </div>
                </div>

                {isDropdownMenu && previewMenu && !shouldInlineMobileDropdownPanel ? (
                  <div
                    style={{
                      background: "transparent",
                      border: "none",
                      marginTop: 0,
                      padding: 0,
                      position: "absolute",
                      top: dropdownTop,
                      left: dropdownLeft,
                      zIndex: 20,
                    }}
                  >
                    <div
                      className="relative"
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 0,
                        justifyContent: dropdownAlignJustify,
                        alignItems: "flex-start",
                        color: previewColors.submenuText,
                      }}
                    >
                      {(() => {
                        const activeDropdownItem =
                          dropdownItems.find((child) => child.id === activeDropdownItemId) ?? null;
                        const isSimpleLeftTabsTemplate =
                          previewMenu?.submenuTemplate === "simple-left-tabs";
                        const isSimpleRightTabsTemplate =
                          previewMenu?.submenuTemplate === "simple-right-tabs";
                        const isTwoNestedRightTabsTemplate =
                          previewMenu?.submenuTemplate === "two-nested-tabs-right";
                        const isThreeNestedRightTabsTemplate =
                          previewMenu?.submenuTemplate === "three-nested-tabs-right";
                        const isCustomNormalDropdownTemplate =
                          previewMenu?.submenuTemplate === "custom-normal-dropdown";
                        const isLeftTabsStyleTemplate =
                          isSimpleLeftTabsTemplate || isCustomNormalDropdownTemplate;
                        const isRightTabsTemplate =
                          isSimpleRightTabsTemplate ||
                          isTwoNestedRightTabsTemplate ||
                          isThreeNestedRightTabsTemplate;
                        const isTwoLevelTabsTemplate =
                          previewMenu?.submenuTemplate === "two-level-tabs";
                        const isThreeLevelTabsTemplate =
                          previewMenu?.submenuTemplate === "three-level-tabs";
                        const isTwoLevelTabsVariant =
                          isTwoLevelTabsTemplate || isTwoNestedRightTabsTemplate;
                        const isThreeLevelTabsVariant =
                          isThreeLevelTabsTemplate || isThreeNestedRightTabsTemplate;
                        const activeDropdownChildren = activeDropdownItem?.children ?? [];
                        const activeDropdownHasBlocks =
                          (isLeftTabsStyleTemplate || isRightTabsTemplate) &&
                          (activeDropdownChildren.some((child) => child.blockTemplate) || activeDropdownChildren.length === 0);
                        const activeSecondLevelItem =
                          isTwoLevelTabsVariant || isThreeLevelTabsVariant
                            ? activeDropdownChildren.find((child) => child.id === activeDropdownChildId) ?? null
                            : null;
                        const secondLevelChildren = activeSecondLevelItem?.children ?? [];
                        const secondLevelHasBlocks =
                          isTwoLevelTabsVariant &&
                          secondLevelChildren.some((child) => child.blockTemplate);
                        const activeThirdLevelItem = isThreeLevelTabsVariant
                          ? secondLevelChildren.find((child) => child.id === activeDropdownGrandchildId) ?? null
                          : null;
                        const thirdLevelChildren = activeThirdLevelItem?.children ?? [];
                        const thirdLevelHasBlocks =
                          isThreeLevelTabsVariant &&
                          thirdLevelChildren.some((child) => child.blockTemplate);
                        const isSoloImagePanel =
                          thirdLevelChildren.length === 1 &&
                          (thirdLevelChildren[0]?.blockTemplate === "image" ||
                            thirdLevelChildren[0]?.blockTemplate === "image2");
                        const useCustomNormalDropdownLayout = isCustomNormalDropdownTemplate;
                        const dropdownItemHeight = builderSettings.spacingLinkListRowHeight;
                        const hasBlockPanel =
                          activeDropdownHasBlocks || secondLevelHasBlocks || thirdLevelHasBlocks;
                        const allowDropdownScroll =
                          dropdownOverflowY &&
                          !isTwoLevelTabsVariant &&
                          !isThreeLevelTabsVariant &&
                          !hasBlockPanel;
                        const dropdownPanelStyle: CSSProperties = {
                          background: previewMenu?.submenuBackgroundColor || previewColors.submenuBackground,
                          backgroundImage: previewMenu?.submenuBackgroundImage ? `url(${previewMenu.submenuBackgroundImage})` : "none",
                          backgroundSize: "cover",
                          backgroundPosition: "center",
                          backgroundRepeat: "no-repeat",
                          border: builderSettings.submenuShowBorder
                            ? `1px solid ${previewColors.submenuBorder}`
                            : "none",
                          borderRadius: 0,
                          boxShadow: "0 10px 30px rgba(15, 23, 42, 0.15)",
                          width: dropdownPanelWidth,
                          maxWidth: submenuMaxWidth ?? undefined,
                          overflowY: allowDropdownScroll ? "auto" : "visible",
                          maxHeight: allowDropdownScroll ? 420 : "none",
                        };
                        const availableRight = dropdownAnchor
                          ? previewContainerWidth - (dropdownAnchor.left + dropdownPanelPixelWidth)
                          : null;
                        const simpleLeftTabsPanelWidth = submenuMaxWidth ?? 720;
                        const resolvedSimpleLeftTabsPanelWidth =
                          availableRight && availableRight > 0
                            ? Math.floor(availableRight)
                            : simpleLeftTabsPanelWidth;
                        const availableLeft = dropdownAnchor?.left ?? dropdownLeft;
                        const resolvedRightTabsPanelWidth = Math.max(
                          0,
                          Math.min(availableLeft, dropdownLeft)
                        );
                        const resolvedTabsPanelWidth = isRightTabsTemplate
                          ? resolvedRightTabsPanelWidth
                          : resolvedSimpleLeftTabsPanelWidth;
                        const { background, border, borderRadius, boxShadow } = dropdownPanelStyle;
                        const blockPanelChildren = secondLevelHasBlocks
                          ? secondLevelChildren
                          : thirdLevelHasBlocks
                            ? thirdLevelChildren
                            : [];
                        const blockPanelCount = blockPanelChildren.filter((child) => child.blockTemplate).length;
                        const baseBlockPanelWidth = Math.min(
                          resolvedSimpleLeftTabsPanelWidth,
                          Math.max(360, blockPanelCount * 240 || 480)
                        );
                        const blockPanelWidth = isSoloImagePanel
                          ? Math.max(280, Math.round(baseBlockPanelWidth * 0.7))
                          : baseBlockPanelWidth;
                        const rightNestedListPanels = isThreeNestedRightTabsTemplate
                          ? activeSecondLevelItem
                            ? 2
                            : 1
                          : 1;
                        const rightNestedBlockWidth = isThreeNestedRightTabsTemplate
                          ? thirdLevelHasBlocks
                            ? blockPanelWidth
                            : 0
                          : secondLevelHasBlocks
                            ? blockPanelWidth
                            : 0;
                        const rightNestedFlyoutWidth =
                          dropdownPanelPixelWidth * rightNestedListPanels + rightNestedBlockWidth;
                        const dropdownFlyoutStyle: CSSProperties =
                          isTwoLevelTabsVariant || isThreeLevelTabsVariant
                            ? {
                              background: "transparent",
                              border: "none",
                              borderRadius: 0,
                              boxShadow: "none",
                              width: "auto",
                              maxWidth: "none",
                              height: "auto",
                              maxHeight: "none",
                              overflow: "visible",
                              display: "flex",
                              flexDirection:
                                isTwoNestedRightTabsTemplate || isThreeNestedRightTabsTemplate
                                  ? "row-reverse"
                                  : "row",
                              gap: 0,
                            }
                            : activeDropdownHasBlocks
                              ? {
                                background,
                                border,
                                borderRadius,
                                boxShadow,
                                width: resolvedTabsPanelWidth,
                                maxWidth: resolvedTabsPanelWidth,
                                height: "auto",
                                maxHeight: "none",
                                overflow: "visible",
                              }
                              : dropdownPanelStyle;
                        const openFlyoutToLeft = isPreviewLeftAligned || isRightTabsTemplate;
                        const flyoutOffset = activeDropdownHasBlocks
                          ? resolvedTabsPanelWidth
                          : dropdownPanelPixelWidth;
                        const menuBarLeftOffset = dropdownAnchor?.left ?? 0;
                        const flyoutLeft = openFlyoutToLeft
                          ? isTwoNestedRightTabsTemplate || isThreeNestedRightTabsTemplate
                            ? -rightNestedFlyoutWidth
                            : isRightTabsTemplate
                              ? -resolvedRightTabsPanelWidth
                              : -flyoutOffset
                          : dropdownPanelPixelWidth;

                        // Seçili item'ın top pozisyonunu bul
                        let activeItemOffsetTop = 0;
                        if (activeDropdownItem) {
                          const mainPanel = document.querySelector('[data-dropdown-main-panel]');
                          const activeItemElement = mainPanel?.querySelector(`[data-dropdown-item-id="${activeDropdownItem.id}"]`);
                          if (activeItemElement) {
                            activeItemOffsetTop = (activeItemElement as HTMLElement).offsetTop + dropdownItemHeight;
                          }
                        }
                        const mainPanelStyle: CSSProperties = dropdownMainPanelMinHeight
                          ? { ...dropdownPanelStyle, minHeight: dropdownMainPanelMinHeight }
                          : dropdownPanelStyle;
                        return (
                          <>
                            <div style={{ display: "flex", gap: 0, position: "relative" }}>
                              <div
                                className="relative"
                                style={{ ...mainPanelStyle, display: "flex", flexDirection: "column" }}
                                data-dropdown-main-panel
                                ref={dropdownMainPanelRef}
                              >
                                <div
                                  style={{
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: 0,
                                    padding: 12,
                                    flex: 1,
                                  }}
                                >
                                  {dropdownItems.map((child) => {
                                    const hasChildren = Boolean(child.children?.length);
                                    const isActiveChild = activeDropdownItem?.id === child.id;
                                    const showLeftChevron = isRightTabsTemplate && hasChildren;
                                    const needsNestedReset =
                                      isTwoLevelTabsVariant || isThreeLevelTabsVariant;
                                    return (
                                      <div
                                        key={child.id}
                                        className={`group/item relative ${draggedItemId === child.id ? "opacity-50" : ""}`}
                                        ref={registerPreviewRow(child.id)}
                                        style={{ willChange: "transform" }}
                                        data-dropdown-item-id={child.id}
                                        draggable
                                        onDragStart={(event) => {
                                          event.dataTransfer.effectAllowed = "move";
                                          event.dataTransfer.setData("text/plain", child.id);
                                          setDraggedItemId(child.id);
                                          const parentId = findParentId(menuItems, child.id);
                                          setDraggedParentId(parentId ?? null);
                                          lastDragOverIdRef.current = null;
                                        }}
                                        onDragEnd={() => {
                                          setDraggedItemId(null);
                                          setDraggedParentId(null);
                                          lastDragOverIdRef.current = null;
                                        }}
                                        onDragOver={(event) => {
                                          if (!draggedItemId || draggedItemId === child.id) return;
                                          const targetParentId = findParentId(menuItems, child.id);
                                          if (draggedParentId !== targetParentId) return;
                                          event.preventDefault();
                                          if (lastDragOverIdRef.current === child.id) return;
                                          lastDragOverIdRef.current = child.id;
                                          setMenuItems((items) => moveItem(items, draggedItemId, child.id));
                                        }}
                                        onDrop={(event) => {
                                          event.preventDefault();
                                          setDraggedItemId(null);
                                          setDraggedParentId(null);
                                          lastDragOverIdRef.current = null;
                                        }}
                                      >
                                        <button
                                          type="button"
                                          className="cursor-grab active:cursor-grabbing"
                                          onClick={() => {
                                            handleSelectItem(child.id);
                                            if (hasChildren) {
                                              setActiveDropdownItemId((prev) =>
                                                prev === child.id ? null : child.id
                                              );
                                              if (needsNestedReset) {
                                                setActiveDropdownChildId(null);
                                                setActiveDropdownGrandchildId(null);
                                              }
                                            } else {
                                              setActiveDropdownItemId(null);
                                              if (needsNestedReset) {
                                                setActiveDropdownChildId(null);
                                                setActiveDropdownGrandchildId(null);
                                              }
                                            }
                                          }}
                                          onMouseEnter={(event) => {
                                            event.currentTarget.style.color = previewColors.submenuTextHover;
                                          }}
                                          onMouseLeave={(event) => {
                                            event.currentTarget.style.color = previewColors.submenuText;
                                          }}
                                          style={{
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: showLeftChevron ? "flex-start" : "space-between",
                                            gap: 10,
                                            minHeight: dropdownItemHeight,
                                            padding: "8px 10px",
                                            borderRadius: 0,
                                            border: "1px solid transparent",
                                            background: isActiveChild ? "rgba(59, 130, 246, 0.08)" : "transparent",
                                            color: previewColors.submenuText,
                                            width: "100%",
                                            textAlign: dropdownContentAlign,
                                            ...subtextTypography,
                                            lineHeight: 1.2,
                                          }}
                                        >
                                          {showLeftChevron ? (
                                            <ChevronLeftIcon width="14" height="14" fill={previewColors.submenuText} />
                                          ) : null}
                                          <div
                                            style={{
                                              display: "flex",
                                              alignItems: "center",
                                              gap: 8,
                                              justifyContent: dropdownAlignJustify,
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
                                                  width: child.iconWidthMode === "custom"
                                                    ? `${child.iconWidthValue ?? 50}${child.iconWidthUnit ?? "%"}`
                                                    : undefined,
                                                }}
                                              >
                                                {renderMenuIcon(child.icon, {
                                                  size: 16,
                                                  className: "text-gray-500",
                                                  color: previewColors.submenuText,
                                                })}
                                              </span>
                                            ) : null}
                                            <span>{child.label}</span>
                                          </div>
                                          {!showLeftChevron && hasChildren ? (
                                            <ChevronRightIcon width="14" height="14" fill={previewColors.submenuText} />
                                          ) : null}
                                        </button>
                                        <div className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 opacity-0 transition-opacity group-hover/item:pointer-events-auto group-hover/item:opacity-100">
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
                                    );
                                  })}

                                </div>
                                <div
                                  className="flex items-center gap-0"
                                  style={{
                                    background: "rgb(17, 24, 39)",
                                    padding: "4px",
                                    borderRadius: "0",
                                    width: "100%",
                                    justifyContent: "center",
                                  }}
                                >
                                  <button
                                    type="button"
                                    aria-label="Align left"
                                    className="flex flex-1 h-6 items-center justify-center text-white hover:bg-gray-700"
                                    onClick={() =>
                                      setMenuItems((items) =>
                                        updateItemById(items, previewMenu.id, () => ({
                                          ...previewMenu,
                                          submenuContentAlign: "left",
                                        }))
                                      )
                                    }
                                  >
                                    <Icon source={TextAlignLeftIcon} />
                                  </button>
                                  <button
                                    type="button"
                                    aria-label="Align center"
                                    className="flex flex-1 h-6 items-center justify-center text-white hover:bg-gray-700"
                                    onClick={() =>
                                      setMenuItems((items) =>
                                        updateItemById(items, previewMenu.id, () => ({
                                          ...previewMenu,
                                          submenuContentAlign: "center",
                                        }))
                                      )
                                    }
                                  >
                                    <Icon source={TextAlignCenterIcon} />
                                  </button>
                                  <button
                                    type="button"
                                    aria-label="Align right"
                                    className="flex flex-1 h-6 items-center justify-center text-white hover:bg-gray-700"
                                    onClick={() =>
                                      setMenuItems((items) =>
                                        updateItemById(items, previewMenu.id, () => ({
                                          ...previewMenu,
                                          submenuContentAlign: "right",
                                        }))
                                      )
                                    }
                                  >
                                    <Icon source={TextAlignRightIcon} />
                                  </button>
                                </div>
                              </div>
                              {activeDropdownItem ? (
                                <div
                                  style={{
                                    ...dropdownFlyoutStyle,
                                    position: "absolute",
                                    left: flyoutLeft,
                                    top:
                                      isTwoLevelTabsVariant ||
                                        isThreeLevelTabsVariant ||
                                        isLeftTabsStyleTemplate ||
                                        isRightTabsTemplate
                                        ? 0
                                        : activeItemOffsetTop,
                                  }}
                                  data-submenu-panel
                                  ref={dropdownFlyoutRef}
                                >
                                  {isTwoLevelTabsVariant ? (
                                    <>
                                      <div style={dropdownPanelStyle}>
                                        <div style={{ display: "flex", flexDirection: "column", padding: 12 }}>
                                          {activeDropdownChildren.map((child) => {
                                            const hasBlocks = Boolean(
                                              child.children?.some((grandChild) => grandChild.blockTemplate)
                                            );
                                            const isActiveChild = activeDropdownChildId === child.id;
                                            const showNestedLeftChevron =
                                              isTwoNestedRightTabsTemplate && hasBlocks;
                                            return (
                                              <div
                                                key={child.id}
                                                className={`group/item relative ${draggedItemId === child.id ? "opacity-50" : ""}`}
                                                ref={registerPreviewRow(child.id)}
                                                style={{ willChange: "transform" }}
                                                draggable
                                                onDragStart={(event) => {
                                                  event.dataTransfer.effectAllowed = "move";
                                                  event.dataTransfer.setData("text/plain", child.id);
                                                  setDraggedItemId(child.id);
                                                  const parentId = findParentId(menuItems, child.id);
                                                  setDraggedParentId(parentId ?? null);
                                                  lastDragOverIdRef.current = null;
                                                }}
                                                onDragEnd={() => {
                                                  setDraggedItemId(null);
                                                  setDraggedParentId(null);
                                                  lastDragOverIdRef.current = null;
                                                }}
                                                onDragOver={(event) => {
                                                  if (!draggedItemId || draggedItemId === child.id) return;
                                                  const targetParentId = findParentId(menuItems, child.id);
                                                  if (draggedParentId !== targetParentId) return;
                                                  event.preventDefault();
                                                  if (lastDragOverIdRef.current === child.id) return;
                                                  lastDragOverIdRef.current = child.id;
                                                  setMenuItems((items) => moveItem(items, draggedItemId, child.id));
                                                }}
                                                onDrop={(event) => {
                                                  event.preventDefault();
                                                  setDraggedItemId(null);
                                                  setDraggedParentId(null);
                                                  lastDragOverIdRef.current = null;
                                                }}
                                              >
                                                <button
                                                  type="button"
                                                  className="cursor-grab active:cursor-grabbing"
                                                  onClick={() => {
                                                    handleSelectItem(child.id);
                                                    if (hasBlocks) {
                                                      setActiveDropdownChildId((prev) =>
                                                        prev === child.id ? null : child.id
                                                      );
                                                    } else {
                                                      setActiveDropdownChildId(null);
                                                    }
                                                  }}
                                                  onMouseEnter={(event) => {
                                                    event.currentTarget.style.color = previewColors.submenuTextHover;
                                                  }}
                                                  onMouseLeave={(event) => {
                                                    event.currentTarget.style.color = previewColors.submenuText;
                                                  }}
                                                  style={{
                                                    display: "flex",
                                                    alignItems: "center",
                                                    justifyContent: showNestedLeftChevron ? "flex-start" : "space-between",
                                                    gap: 10,
                                                    minHeight: dropdownItemHeight,
                                                    padding: "8px 10px",
                                                    borderRadius: 0,
                                                    border: "1px solid transparent",
                                                    background: isActiveChild ? "rgba(59, 130, 246, 0.08)" : "transparent",
                                                    color: previewColors.submenuText,
                                                    width: "100%",
                                                    textAlign: dropdownContentAlign,
                                                    ...subtextTypography,
                                                    lineHeight: 1.2,
                                                  }}
                                                >
                                                  {showNestedLeftChevron ? (
                                                    <ChevronLeftIcon
                                                      width="14"
                                                      height="14"
                                                      fill={previewColors.submenuText}
                                                    />
                                                  ) : null}
                                                  <div
                                                    style={{
                                                      display: "flex",
                                                      alignItems: "center",
                                                      gap: 8,
                                                      justifyContent: dropdownAlignJustify,
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
                                                          width: child.iconWidthMode === "custom"
                                                            ? `${child.iconWidthValue ?? 50}${child.iconWidthUnit ?? "%"}`
                                                            : undefined,
                                                        }}
                                                      >
                                                        {renderMenuIcon(child.icon, {
                                                          size: 16,
                                                          className: "text-gray-500",
                                                          color: previewColors.submenuText,
                                                        })}
                                                      </span>
                                                    ) : null}
                                                    <span>{child.label}</span>
                                                  </div>
                                                  {!showNestedLeftChevron && hasBlocks ? (
                                                    <ChevronRightIcon
                                                      width="14"
                                                      height="14"
                                                      fill={previewColors.submenuText}
                                                    />
                                                  ) : null}
                                                </button>
                                                <div className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 opacity-0 transition-opacity group-hover/item:pointer-events-auto group-hover/item:opacity-100">
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
                                            );
                                          })}

                                        </div>
                                      </div>
                                      {secondLevelHasBlocks ? (
                                        <div
                                          style={{
                                            ...dropdownPanelStyle,
                                            width: blockPanelWidth,
                                            maxWidth: blockPanelWidth,
                                            overflow: "visible",
                                          }}
                                        >
                                          <div
                                            style={{
                                              display: "flex",
                                              flexDirection: "column",
                                              gap: isSoloImagePanel ? 8 : 12,
                                              padding: isSoloImagePanel ? 8 : 12,
                                            }}
                                          >
                                            <div
                                              className="menu-builder-hide-scrollbar"
                                              style={{
                                                overflowX: "auto",
                                                overflowY: "hidden",
                                                scrollbarWidth: "none",
                                                msOverflowStyle: "none",
                                              }}
                                            >
                                              <div
                                                style={{
                                                  display: "flex",
                                                  flexWrap: "nowrap",
                                                  gap: 24,
                                                  alignItems: "flex-start",
                                                  justifyContent: "flex-start",
                                                  minWidth: 0,
                                                }}
                                              >
                                                {secondLevelChildren.map((child) => {
                                                  if (child.blockTemplate === "links") {
                                                    const columnCount = Math.max(1, child.linkColumns ?? 2);
                                                    const linkWidth = Math.max(1, Math.min(12, child.linkWidth ?? 3));
                                                    const linkFlexBasis =
                                                      columnCount === 3 ? "70%" : `${Math.round((linkWidth / 12) * 100)}%`;
                                                    return renderLinkListBlock(child, {
                                                      flex: `0 0 ${linkFlexBasis}`,
                                                      wrapperStyle: { minWidth: 0 },
                                                      toolbarPlacement: "floating",
                                                    });
                                                  }
                                                  if (child.blockTemplate === "image" || child.blockTemplate === "image2") {
                                                    const isSoloImagePanel = thirdLevelChildren.length === 1;
                                                    const imageWidth = Math.max(1, Math.min(12, child.imageWidth ?? 3));
                                                    const imageFlexBasis = Math.max(
                                                      40,
                                                      Math.round((imageWidth / 12) * 100)
                                                    );
                                                    return renderImageBlock(child, {
                                                      flex: isSoloImagePanel
                                                        ? "0 0 70%"
                                                        : `0 0 ${imageFlexBasis}%`,
                                                      wrapperStyle: { minWidth: 0 },
                                                      imagePreviewHeight: isSoloImagePanel ? 220 : undefined,
                                                      imageScale: isSoloImagePanel ? "100%" : undefined,
                                                    });
                                                  }
                                                  if (child.blockTemplate === "html") {
                                                    const htmlWidth = Math.max(1, Math.min(12, child.imageWidth ?? 3));
                                                    const htmlFlexBasis = `${Math.round((htmlWidth / 12) * 100)}%`;
                                                    return renderHtmlBlock(child, {
                                                      flex: `0 0 ${htmlFlexBasis}`,
                                                      wrapperStyle: { minWidth: 0 },
                                                    });
                                                  }
                                                  if (
                                                    child.blockTemplate === "product" ||
                                                    child.blockTemplate === "product-horizontal" ||
                                                    child.blockTemplate === "product-grid" ||
                                                    child.blockTemplate === "product-carousel" ||
                                                    child.blockTemplate === "product-grid-horizontal"
                                                  ) {
                                                    const productWidth = Math.max(1, Math.min(12, child.productWidth ?? 3));
                                                    const productFlexBasis = `${Math.round((productWidth / 12) * 100)}%`;
                                                    return renderProductBlock(child, {
                                                      flex: `0 0 ${productFlexBasis}`,
                                                      wrapperStyle: { minWidth: 0 },
                                                    });
                                                  }
                                                  if (
                                                    child.blockTemplate === "collection" ||
                                                    child.blockTemplate === "collection-horizontal"
                                                  ) {
                                                    const collectionWidth = Math.max(1, Math.min(12, child.imageWidth ?? 3));
                                                    const collectionFlexBasis = `${Math.round((collectionWidth / 12) * 100)}%`;
                                                    return renderCollectionBlock(child, {
                                                      flex: `0 0 ${collectionFlexBasis}`,
                                                      wrapperStyle: { minWidth: 0 },
                                                    });
                                                  }
                                                  if (
                                                    child.blockTemplate === "blogs" ||
                                                    child.blockTemplate === "blogs-latest"
                                                  ) {
                                                    const blogWidth = Math.max(1, Math.min(12, child.imageWidth ?? 3));
                                                    const blogFlexBasis = `${Math.round((blogWidth / 12) * 100)}%`;
                                                    return renderBlogBlock(child, {
                                                      flex: `0 0 ${blogFlexBasis}`,
                                                      wrapperStyle: { minWidth: 0 },
                                                    });
                                                  }
                                                  return null;
                                                })}
                                              </div>
                                            </div>
                                          </div>
                                        </div>
                                      ) : null}
                                    </>
                                  ) : isThreeLevelTabsVariant ? (
                                    <>
                                      <div style={dropdownPanelStyle}>
                                        <div style={{ display: "flex", flexDirection: "column", padding: 12 }}>
                                          {activeDropdownChildren.map((child) => {
                                            const hasChildren = Boolean(child.children?.length);
                                            const isActiveChild = activeDropdownChildId === child.id;
                                            const showNestedLeftChevron =
                                              isThreeNestedRightTabsTemplate && hasChildren;
                                            return (
                                              <div
                                                key={child.id}
                                                className={`group/item relative ${draggedItemId === child.id ? "opacity-50" : ""}`}
                                                ref={registerPreviewRow(child.id)}
                                                style={{ willChange: "transform" }}
                                                draggable
                                                onDragStart={(event) => {
                                                  event.dataTransfer.effectAllowed = "move";
                                                  event.dataTransfer.setData("text/plain", child.id);
                                                  setDraggedItemId(child.id);
                                                  const parentId = findParentId(menuItems, child.id);
                                                  setDraggedParentId(parentId ?? null);
                                                  lastDragOverIdRef.current = null;
                                                }}
                                                onDragEnd={() => {
                                                  setDraggedItemId(null);
                                                  setDraggedParentId(null);
                                                  lastDragOverIdRef.current = null;
                                                }}
                                                onDragOver={(event) => {
                                                  if (!draggedItemId || draggedItemId === child.id) return;
                                                  const targetParentId = findParentId(menuItems, child.id);
                                                  if (draggedParentId !== targetParentId) return;
                                                  event.preventDefault();
                                                  if (lastDragOverIdRef.current === child.id) return;
                                                  lastDragOverIdRef.current = child.id;
                                                  setMenuItems((items) => moveItem(items, draggedItemId, child.id));
                                                }}
                                                onDrop={(event) => {
                                                  event.preventDefault();
                                                  setDraggedItemId(null);
                                                  setDraggedParentId(null);
                                                  lastDragOverIdRef.current = null;
                                                }}
                                              >
                                                <button
                                                  type="button"
                                                  className="cursor-grab active:cursor-grabbing"
                                                  onClick={() => {
                                                    handleSelectItem(child.id);
                                                    if (hasChildren) {
                                                      setActiveDropdownChildId((prev) =>
                                                        prev === child.id ? null : child.id
                                                      );
                                                      setActiveDropdownGrandchildId(null);
                                                    } else {
                                                      setActiveDropdownChildId(null);
                                                      setActiveDropdownGrandchildId(null);
                                                    }
                                                  }}
                                                  onMouseEnter={(event) => {
                                                    event.currentTarget.style.color = previewColors.submenuTextHover;
                                                  }}
                                                  onMouseLeave={(event) => {
                                                    event.currentTarget.style.color = previewColors.submenuText;
                                                  }}
                                                  style={{
                                                    display: "flex",
                                                    alignItems: "center",
                                                    justifyContent: showNestedLeftChevron
                                                      ? "flex-start"
                                                      : "space-between",
                                                    gap: 10,
                                                    minHeight: dropdownItemHeight,
                                                    padding: "8px 10px",
                                                    borderRadius: 0,
                                                    border: "1px solid transparent",
                                                    background: isActiveChild ? "rgba(59, 130, 246, 0.08)" : "transparent",
                                                    color: previewColors.submenuText,
                                                    width: "100%",
                                                    textAlign: dropdownContentAlign,
                                                    ...subtextTypography,
                                                    lineHeight: 1.2,
                                                  }}
                                                >
                                                  {showNestedLeftChevron ? (
                                                    <ChevronLeftIcon
                                                      width="14"
                                                      height="14"
                                                      fill={previewColors.submenuText}
                                                    />
                                                  ) : null}
                                                  <div
                                                    style={{
                                                      display: "flex",
                                                      alignItems: "center",
                                                      gap: 8,
                                                      justifyContent: dropdownAlignJustify,
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
                                                          width: child.iconWidthMode === "custom"
                                                            ? `${child.iconWidthValue ?? 50}${child.iconWidthUnit ?? "%"}`
                                                            : undefined,
                                                        }}
                                                      >
                                                        {renderMenuIcon(child.icon, {
                                                          size: 16,
                                                          className: "text-gray-500",
                                                          color: previewColors.submenuText,
                                                        })}
                                                      </span>
                                                    ) : null}
                                                    <span>{child.label}</span>
                                                  </div>
                                                  {!showNestedLeftChevron && hasChildren ? (
                                                    <ChevronRightIcon
                                                      width="14"
                                                      height="14"
                                                      fill={previewColors.submenuText}
                                                    />
                                                  ) : null}
                                                </button>
                                                <div className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 opacity-0 transition-opacity group-hover/item:pointer-events-auto group-hover/item:opacity-100">
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
                                            );
                                          })}

                                        </div>
                                      </div>
                                      {activeSecondLevelItem ? (
                                        <div style={dropdownPanelStyle}>
                                          <div style={{ display: "flex", flexDirection: "column", padding: 12 }}>
                                            {secondLevelChildren.map((child) => {
                                              const hasBlocks = Boolean(
                                                child.children?.some((grandChild) => grandChild.blockTemplate)
                                              );
                                              const isActiveChild = activeDropdownGrandchildId === child.id;
                                              const showNestedLeftChevron =
                                                isThreeNestedRightTabsTemplate && hasBlocks;
                                              return (
                                                <div
                                                  key={child.id}
                                                  className={`group/item relative ${draggedItemId === child.id ? "opacity-50" : ""}`}
                                                  ref={registerPreviewRow(child.id)}
                                                  style={{ willChange: "transform" }}
                                                  draggable
                                                  onDragStart={(event) => {
                                                    event.dataTransfer.effectAllowed = "move";
                                                    event.dataTransfer.setData("text/plain", child.id);
                                                    setDraggedItemId(child.id);
                                                    const parentId = findParentId(menuItems, child.id);
                                                    setDraggedParentId(parentId ?? null);
                                                    lastDragOverIdRef.current = null;
                                                  }}
                                                  onDragEnd={() => {
                                                    setDraggedItemId(null);
                                                    setDraggedParentId(null);
                                                    lastDragOverIdRef.current = null;
                                                  }}
                                                  onDragOver={(event) => {
                                                    if (!draggedItemId || draggedItemId === child.id) return;
                                                    const targetParentId = findParentId(menuItems, child.id);
                                                    if (draggedParentId !== targetParentId) return;
                                                    event.preventDefault();
                                                    if (lastDragOverIdRef.current === child.id) return;
                                                    lastDragOverIdRef.current = child.id;
                                                    setMenuItems((items) => moveItem(items, draggedItemId, child.id));
                                                  }}
                                                  onDrop={(event) => {
                                                    event.preventDefault();
                                                    setDraggedItemId(null);
                                                    setDraggedParentId(null);
                                                    lastDragOverIdRef.current = null;
                                                  }}
                                                >
                                                  <button
                                                    type="button"
                                                    className="cursor-grab active:cursor-grabbing"
                                                    onClick={() => {
                                                      handleSelectItem(child.id);
                                                      if (hasBlocks) {
                                                        setActiveDropdownGrandchildId((prev) =>
                                                          prev === child.id ? null : child.id
                                                        );
                                                      } else {
                                                        setActiveDropdownGrandchildId(null);
                                                      }
                                                    }}
                                                    onMouseEnter={(event) => {
                                                      event.currentTarget.style.color = previewColors.submenuTextHover;
                                                    }}
                                                    onMouseLeave={(event) => {
                                                      event.currentTarget.style.color = previewColors.submenuText;
                                                    }}
                                                    style={{
                                                      display: "flex",
                                                      alignItems: "center",
                                                      justifyContent: showNestedLeftChevron
                                                        ? "flex-start"
                                                        : "space-between",
                                                      gap: 10,
                                                      minHeight: dropdownItemHeight,
                                                      padding: "8px 10px",
                                                      borderRadius: 0,
                                                      border: "1px solid transparent",
                                                      background: isActiveChild
                                                        ? "rgba(59, 130, 246, 0.08)"
                                                        : "transparent",
                                                      color: previewColors.submenuText,
                                                      width: "100%",
                                                      textAlign: dropdownContentAlign,
                                                      ...subtextTypography,
                                                      lineHeight: 1.2,
                                                    }}
                                                  >
                                                    {showNestedLeftChevron ? (
                                                      <ChevronLeftIcon
                                                        width="14"
                                                        height="14"
                                                        fill={previewColors.submenuText}
                                                      />
                                                    ) : null}
                                                    <span style={{ flex: 1, textAlign: dropdownContentAlign }}>
                                                      {child.label}
                                                    </span>
                                                    {!showNestedLeftChevron && hasBlocks ? (
                                                      <ChevronRightIcon
                                                        width="14"
                                                        height="14"
                                                        fill={previewColors.submenuText}
                                                      />
                                                    ) : null}
                                                  </button>
                                                  <div className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 opacity-0 transition-opacity group-hover/item:pointer-events-auto group-hover/item:opacity-100">
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
                                              );
                                            })}

                                          </div>
                                        </div>
                                      ) : null}
                                      {thirdLevelHasBlocks ? (
                                        <div
                                          style={{
                                            ...dropdownPanelStyle,
                                            width: blockPanelWidth,
                                            maxWidth: blockPanelWidth,
                                            overflow: "visible",
                                          }}
                                        >
                                          <div style={{ display: "flex", flexDirection: "column", gap: 12, padding: 12 }}>
                                            <div
                                              className="menu-builder-hide-scrollbar"
                                              style={{
                                                overflowX: "auto",
                                                overflowY: "hidden",
                                                scrollbarWidth: "none",
                                                msOverflowStyle: "none",
                                              }}
                                            >
                                              <div
                                                style={{
                                                  display: "flex",
                                                  flexWrap: "nowrap",
                                                  gap: 24,
                                                  alignItems: "flex-start",
                                                  justifyContent: "flex-start",
                                                  minWidth: 0,
                                                }}
                                              >
                                                {thirdLevelChildren.map((child) => {
                                                  if (child.blockTemplate === "links") {
                                                    const columnCount = Math.max(1, child.linkColumns ?? 2);
                                                    const linkWidth = Math.max(1, Math.min(12, child.linkWidth ?? 3));
                                                    const linkFlexBasis =
                                                      columnCount === 3 ? "70%" : `${Math.round((linkWidth / 12) * 100)}%`;
                                                    return renderLinkListBlock(child, {
                                                      flex: `0 0 ${linkFlexBasis}`,
                                                      wrapperStyle: { minWidth: 0 },
                                                      toolbarPlacement: "floating",
                                                    });
                                                  }
                                                  if (child.blockTemplate === "image" || child.blockTemplate === "image2") {
                                                    const imageWidth = Math.max(1, Math.min(12, child.imageWidth ?? 3));
                                                    const imageFlexBasis = Math.max(
                                                      40,
                                                      Math.round((imageWidth / 12) * 100)
                                                    );
                                                    return renderImageBlock(child, {
                                                      flex: isSoloImagePanel
                                                        ? "0 0 100%"
                                                        : `0 0 ${imageFlexBasis}%`,
                                                      wrapperStyle: { minWidth: 0 },
                                                      imagePreviewHeight: isSoloImagePanel ? 220 : undefined,
                                                      imageScale: isSoloImagePanel ? "100%" : undefined,
                                                    });
                                                  }
                                                  if (child.blockTemplate === "html") {
                                                    const htmlWidth = Math.max(1, Math.min(12, child.imageWidth ?? 3));
                                                    const htmlFlexBasis = `${Math.round((htmlWidth / 12) * 100)}%`;
                                                    return renderHtmlBlock(child, {
                                                      flex: `0 0 ${htmlFlexBasis}`,
                                                      wrapperStyle: { minWidth: 0 },
                                                    });
                                                  }
                                                  if (
                                                    child.blockTemplate === "product" ||
                                                    child.blockTemplate === "product-horizontal" ||
                                                    child.blockTemplate === "product-grid" ||
                                                    child.blockTemplate === "product-carousel" ||
                                                    child.blockTemplate === "product-grid-horizontal"
                                                  ) {
                                                    const productWidth = Math.max(1, Math.min(12, child.productWidth ?? 3));
                                                    const productFlexBasis = `${Math.round((productWidth / 12) * 100)}%`;
                                                    return renderProductBlock(child, {
                                                      flex: `0 0 ${productFlexBasis}`,
                                                      wrapperStyle: { minWidth: 0 },
                                                    });
                                                  }
                                                  if (
                                                    child.blockTemplate === "collection" ||
                                                    child.blockTemplate === "collection-horizontal"
                                                  ) {
                                                    const collectionWidth = Math.max(1, Math.min(12, child.imageWidth ?? 3));
                                                    const collectionFlexBasis = `${Math.round((collectionWidth / 12) * 100)}%`;
                                                    return renderCollectionBlock(child, {
                                                      flex: `0 0 ${collectionFlexBasis}`,
                                                      wrapperStyle: { minWidth: 0 },
                                                    });
                                                  }
                                                  if (
                                                    child.blockTemplate === "blogs" ||
                                                    child.blockTemplate === "blogs-latest"
                                                  ) {
                                                    const blogWidth = Math.max(1, Math.min(12, child.imageWidth ?? 3));
                                                    const blogFlexBasis = `${Math.round((blogWidth / 12) * 100)}%`;
                                                    return renderBlogBlock(child, {
                                                      flex: `0 0 ${blogFlexBasis}`,
                                                      wrapperStyle: { minWidth: 0 },
                                                    });
                                                  }
                                                  return null;
                                                })}
                                              </div>
                                            </div>
                                          </div>
                                        </div>
                                      ) : null}
                                    </>
                                  ) : activeDropdownHasBlocks ? (
                                    <div style={{ display: "flex", flexDirection: "column", gap: 12, padding: 12 }}>
                                      <div
                                        className="menu-builder-hide-scrollbar"
                                        style={{
                                          overflowX: useCustomNormalDropdownLayout ? "hidden" : "auto",
                                          overflowY: "hidden",
                                          scrollbarWidth: "none",
                                          msOverflowStyle: "none",
                                        }}
                                      >
                                        <div
                                          style={{
                                            display: useCustomNormalDropdownLayout ? "grid" : "flex",
                                            gridTemplateColumns: useCustomNormalDropdownLayout
                                              ? "repeat(4, minmax(0, 1fr))"
                                              : undefined,
                                            columnGap: useCustomNormalDropdownLayout ? 0 : undefined,
                                            rowGap: useCustomNormalDropdownLayout ? 0 : undefined,
                                            flexWrap: "wrap",
                                            gap: useCustomNormalDropdownLayout ? undefined : 24,
                                            alignItems: "flex-start",
                                            justifyContent: useCustomNormalDropdownLayout
                                              ? undefined
                                              : useSimpleLeftTabsCompactLayout
                                                ? "space-between"
                                                : undefined,
                                            minWidth: useCustomNormalDropdownLayout
                                              ? undefined
                                              : useSimpleLeftTabsCompactLayout
                                                ? undefined
                                                : 960,
                                            width: "100%",
                                          }}
                                        >
                                          {activeDropdownChildren.length === 0 ? (
                                            <div
                                              style={{
                                                flex: "1 1 100%",
                                                padding: "24px",
                                                display: "flex",
                                                flexDirection: "column",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                gap: 12,
                                                border: "1px dashed #cbd5e1",
                                                borderRadius: 12,
                                                margin: "12px",
                                                background: "rgba(240, 242, 245, 0.5)",
                                              }}
                                            >
                                              <Text as="p" variant="bodyMd" tone="subdued">
                                                No blocks added to this tab yet
                                              </Text>
                                              <Button
                                                variant="secondary"
                                                icon={PlusIcon}
                                                size="slim"
                                                onClick={() => handleOpenBlockTemplatePicker(activeDropdownItem.id)}
                                              >
                                                Add block
                                              </Button>
                                            </div>
                                          ) : (
                                            activeDropdownChildren.map((child) => {
                                              if (child.blockTemplate === "links") {
                                                const columnCount = Math.max(1, child.linkColumns ?? 2);
                                                const linkWidth = Math.max(1, Math.min(12, child.linkWidth ?? 3));
                                                const linkFlexBasis =
                                                  columnCount === 3 ? "70%" : `${Math.round((linkWidth / 12) * 100)}%`;
                                                return renderLinkListBlock(child, {
                                                  ...(useCustomNormalDropdownLayout
                                                    ? { wrapperStyle: { minWidth: 0, width: "100%", flex: "1 1 auto" } }
                                                    : { flex: `0 0 ${linkFlexBasis}`, wrapperStyle: { minWidth: 0, width: linkFlexBasis } }),
                                                  toolbarPlacement: "floating",
                                                });
                                              }
                                              if (child.blockTemplate === "image" || child.blockTemplate === "image2") {
                                                const imageWidth = Math.max(1, Math.min(12, child.imageWidth ?? 3));
                                                const imageFlexBasis = `${Math.round((imageWidth / 12) * 100)}%`;
                                                return renderImageBlock(child, {
                                                  ...(useCustomNormalDropdownLayout
                                                    ? { wrapperStyle: { minWidth: 0, width: "100%", flex: "1 1 auto" } }
                                                    : { flex: `0 0 ${imageFlexBasis}`, wrapperStyle: { minWidth: 0, width: imageFlexBasis } }),
                                                });
                                              }
                                              if (child.blockTemplate === "html") {
                                                const htmlWidth = Math.max(1, Math.min(12, child.imageWidth ?? 3));
                                                const htmlFlexBasis = `${Math.round((htmlWidth / 12) * 100)}%`;
                                                return renderHtmlBlock(child, {
                                                  flex: `0 0 ${htmlFlexBasis}`,
                                                  wrapperStyle: { minWidth: 0, width: htmlFlexBasis },
                                                });
                                              }
                                              if (
                                                child.blockTemplate === "product" ||
                                                child.blockTemplate === "product-horizontal" ||
                                                child.blockTemplate === "product-grid" ||
                                                child.blockTemplate === "product-carousel" ||
                                                child.blockTemplate === "product-grid-horizontal"
                                              ) {
                                                const productWidth = Math.max(1, Math.min(12, child.productWidth ?? 3));
                                                const productFlexBasis = `${Math.round((productWidth / 12) * 100)}%`;
                                                return renderProductBlock(child, {
                                                  flex: `0 0 ${productFlexBasis}`,
                                                  wrapperStyle: { minWidth: 0, width: productFlexBasis },
                                                });
                                              }
                                              if (
                                                child.blockTemplate === "collection" ||
                                                child.blockTemplate === "collection-horizontal"
                                              ) {
                                                const collectionWidth = Math.max(1, Math.min(12, child.imageWidth ?? 3));
                                                const collectionFlexBasis = `${Math.round((collectionWidth / 12) * 100)}%`;
                                                return renderCollectionBlock(child, {
                                                  flex: `0 0 ${collectionFlexBasis}`,
                                                  wrapperStyle: { minWidth: 0, width: collectionFlexBasis },
                                                });
                                              }
                                              if (
                                                child.blockTemplate === "blogs" ||
                                                child.blockTemplate === "blogs-latest"
                                              ) {
                                                const blogWidth = Math.max(1, Math.min(12, child.imageWidth ?? 3));
                                                const blogFlexBasis = `${Math.round((blogWidth / 12) * 100)}%`;
                                                return renderBlogBlock(child, {
                                                  flex: `0 0 ${blogFlexBasis}`,
                                                  wrapperStyle: { minWidth: 0, width: blogFlexBasis },
                                                });
                                              }
                                              return null;
                                            })
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  ) : (
                                    <div style={{ display: "flex", flexDirection: "column", gap: 6, padding: 12 }}>
                                      {activeDropdownChildren.map((child) => (
                                        <div
                                          key={child.id}
                                          className={`group/item relative ${draggedItemId === child.id ? "opacity-50" : ""}`}
                                          ref={registerPreviewRow(child.id)}
                                          style={{ willChange: "transform" }}
                                          draggable
                                          onDragStart={(event) => {
                                            event.dataTransfer.effectAllowed = "move";
                                            event.dataTransfer.setData("text/plain", child.id);
                                            setDraggedItemId(child.id);
                                            const parentId = findParentId(menuItems, child.id);
                                            setDraggedParentId(parentId ?? null);
                                            lastDragOverIdRef.current = null;
                                          }}
                                          onDragEnd={() => {
                                            setDraggedItemId(null);
                                            setDraggedParentId(null);
                                            lastDragOverIdRef.current = null;
                                          }}
                                          onDragOver={(event) => {
                                            if (!draggedItemId || draggedItemId === child.id) return;
                                            const targetParentId = findParentId(menuItems, child.id);
                                            if (draggedParentId !== targetParentId) return;
                                            event.preventDefault();
                                            if (lastDragOverIdRef.current === child.id) return;
                                            lastDragOverIdRef.current = child.id;
                                            setMenuItems((items) => moveItem(items, draggedItemId, child.id));
                                          }}
                                          onDrop={(event) => {
                                            event.preventDefault();
                                            setDraggedItemId(null);
                                            setDraggedParentId(null);
                                            lastDragOverIdRef.current = null;
                                          }}
                                        >
                                          <button
                                            type="button"
                                            className="cursor-grab active:cursor-grabbing"
                                            onClick={() => handleSelectItem(child.id)}
                                            onMouseEnter={(event) => {
                                              event.currentTarget.style.color = previewColors.submenuTextHover;
                                            }}
                                            onMouseLeave={(event) => {
                                              event.currentTarget.style.color = previewColors.submenuText;
                                            }}
                                            style={{
                                              display: "flex",
                                              alignItems: "center",
                                              justifyContent: "space-between",
                                              gap: 10,
                                              minHeight: dropdownItemHeight,
                                              padding: "8px 10px",
                                              borderRadius: 0,
                                              border: "1px solid transparent",
                                              background: "transparent",
                                              color: previewColors.submenuText,
                                              width: "100%",
                                              textAlign: dropdownContentAlign,
                                              ...subtextTypography,
                                              lineHeight: 1.2,
                                            }}
                                          >
                                            <div
                                              style={{
                                                display: "flex",
                                                alignItems: "center",
                                                gap: 8,
                                                justifyContent: dropdownAlignJustify,
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
                                                    width: child.iconWidthMode === "custom"
                                                      ? `${child.iconWidthValue ?? 50}${child.iconWidthUnit ?? "%"}`
                                                      : undefined,
                                                  }}
                                                >
                                                  {renderMenuIcon(child.icon, {
                                                    size: 16,
                                                    className: "text-gray-500",
                                                    color: previewColors.submenuText,
                                                  })}
                                                </span>
                                              ) : null}
                                              <span>{child.label}</span>
                                            </div>
                                          </button>
                                          <div className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 opacity-0 transition-opacity group-hover/item:pointer-events-auto group-hover/item:opacity-100">
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
                                      ))}
                                      <button
                                        type="button"
                                        onClick={() => handleOpenAddRoot(activeDropdownItem.id)}
                                        className="text-sm font-medium"
                                        style={{
                                          alignSelf: "stretch",
                                          minHeight: dropdownItemHeight,
                                          textAlign: dropdownContentAlign,
                                          display: "flex",
                                          alignItems: "center",
                                          justifyContent: dropdownAlignJustify,
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
                                  )}
                                </div>
                              ) : null}
                            </div>
                          </>
                        );
                      })()}
                    </div>
                  </div>
                ) : null}

                {/* Horizontal Dropdown */}
                {isHorizontalDropdownMenu &&
                  horizontalDropdownItems.length > 0 &&
                  !shouldInlineMobileHorizontalDropdownPanel ? (
                  <div
                    style={{
                      position: "absolute",
                      top: "100%",
                      left: 0,
                      right: 0,
                      zIndex: 40,
                      width: "100%",
                    }}
                  >
                    <div
                      className="group relative"
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 0,
                        color: previewColors.submenuText,
                        width: "100%",
                      }}
                    >
                      <div style={{ display: "flex", gap: 0, position: "relative", width: "100%" }}>
                        <div
                          className="relative"
                          style={{
                            background: previewMenu?.submenuBackgroundColor || previewColors.submenuBackground,
                            backgroundImage: previewMenu?.submenuBackgroundImage ? `url(${previewMenu.submenuBackgroundImage})` : "none",
                            backgroundSize: "cover",
                            backgroundPosition: "center",
                            backgroundRepeat: "no-repeat",
                            border: builderSettings.submenuShowBorder
                              ? `1px solid ${previewColors.submenuBorder}`
                              : "none",
                            borderRadius: 0,
                            boxShadow: "0 10px 30px rgba(15, 23, 42, 0.15)",
                            width: "100%",
                          }}
                        >
                          <div style={{ display: "flex", flexDirection: "row", alignItems: "center", width: "100%" }}>
                            <div style={{ display: "flex", flexDirection: "row", gap: 0, flexWrap: "nowrap", alignItems: "center", justifyContent: getSubmenuJustify(previewMenu.submenuContentAlign), flex: 1, padding: "0 12px" }}>
                              {horizontalDropdownItems.map((child) => {
                                const isActive = activeHorizontalItem?.id === child.id;
                                return (
                                  <div
                                    key={child.id}
                                    className={`group/item relative ${draggedItemId === child.id ? "opacity-50" : ""}`}
                                    ref={registerPreviewRow(child.id)}
                                    style={{ willChange: "transform" }}
                                    draggable
                                    onDragStart={(event) => {
                                      event.dataTransfer.effectAllowed = "move";
                                      event.dataTransfer.setData("text/plain", child.id);
                                      setDraggedItemId(child.id);
                                      const parentId = findParentId(menuItems, child.id);
                                      setDraggedParentId(parentId ?? null);
                                      lastDragOverIdRef.current = null;
                                    }}
                                    onDragEnd={() => {
                                      setDraggedItemId(null);
                                      setDraggedParentId(null);
                                      lastDragOverIdRef.current = null;
                                    }}
                                    onDragOver={(event) => {
                                      if (!draggedItemId || draggedItemId === child.id) return;
                                      const targetParentId = findParentId(menuItems, child.id);
                                      if (draggedParentId !== targetParentId) return;
                                      event.preventDefault();
                                      if (lastDragOverIdRef.current === child.id) return;
                                      lastDragOverIdRef.current = child.id;
                                      setMenuItems((items) => moveItem(items, draggedItemId, child.id));
                                    }}
                                    onDrop={(event) => {
                                      event.preventDefault();
                                      setDraggedItemId(null);
                                      setDraggedParentId(null);
                                      lastDragOverIdRef.current = null;
                                    }}
                                  >
                                    <button
                                      type="button"
                                      onClick={() => {
                                        handleSelectItem(child.id);
                                        if (isTopTabsTemplate) {
                                          setActiveHorizontalItemId((prev) =>
                                            prev === child.id ? null : child.children?.length ? child.id : null
                                          );
                                          setActiveHorizontalChildId(null);
                                          setActiveHorizontalGrandchildId(null);
                                        }
                                      }}
                                      onMouseEnter={(event) => {
                                        event.currentTarget.style.color = previewColors.submenuTextHover;
                                      }}
                                      onMouseLeave={(event) => {
                                        event.currentTarget.style.color = isActive ? previewColors.submenuTextHover : previewColors.submenuText;
                                      }}
                                      className="cursor-grab active:cursor-grabbing"
                                      style={{
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        gap: 10,
                                        minHeight: builderSettings.spacingLinkListRowHeight,
                                        padding: "16px",
                                        borderRadius: 0,
                                        border: "1px solid transparent",
                                        background: "transparent",
                                        color: isActive ? previewColors.submenuTextHover : previewColors.submenuText,
                                        textAlign: "center",
                                        ...subtextTypography,
                                        lineHeight: 1.2,
                                        whiteSpace: "nowrap",
                                      }}
                                    >
                                      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                                        {child.icon ? (
                                          <span
                                            aria-hidden="true"
                                            style={{
                                              display: "inline-flex",
                                              alignItems: "center",
                                              justifyContent: "center",
                                              width: child.iconWidthMode === "custom"
                                                ? `${child.iconWidthValue ?? 50}${child.iconWidthUnit ?? "%"}`
                                                : undefined,
                                            }}
                                          >
                                            {renderMenuIcon(child.icon, {
                                              size: 16,
                                              className: "text-gray-500",
                                              color: isActive ? previewColors.submenuTextHover : previewColors.submenuText,
                                            })}
                                          </span>
                                        ) : null}
                                        <span>{child.label}</span>
                                        {Boolean(child.children?.length) && (
                                          <Icon source={ChevronDownIcon} tone="subdued" />
                                        )}
                                      </div>
                                    </button>
                                    <div className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 opacity-0 transition-opacity group-hover/item:pointer-events-auto group-hover/item:opacity-100">
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
                                          aria-label="Copy item"
                                          className="flex h-5 w-5 items-center justify-center rounded-md text-white hover:bg-gray-800"
                                        >
                                          <Icon source={DuplicateIcon} />
                                        </button>
                                        <button
                                          type="button"
                                          onClick={(event) => {
                                            event.stopPropagation();
                                            handleDeleteItem(child.id);
                                          }}
                                          aria-label="Delete item"
                                          className="flex h-5 w-5 items-center justify-center rounded-md text-white hover:bg-gray-800"
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
                                onClick={() => handleAddChild(previewMenu.id, "item")}
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  gap: 8,
                                  padding: "16px",
                                  borderRadius: 0,
                                  border: "none",
                                  background: "transparent",
                                  color: "#3b82f6",
                                  fontSize: 14,
                                  fontWeight: 500,
                                  whiteSpace: "nowrap",
                                }}
                              >
                                Add item
                              </button>
                            </div>

                            {/* Alignment Buttons for Row 1 */}
                            <div style={{ background: "rgb(17, 24, 39)", padding: "4px", borderRadius: "4px", marginRight: "12px", display: "flex", gap: 0 }}>
                              <button
                                type="button"
                                className={`flex h-6 w-6 items-center justify-center rounded text-white ${previewMenu.submenuContentAlign === "left" ? "bg-gray-700" : "hover:bg-gray-800"}`}
                                onClick={() => setMenuItems((items) => updateItemById(items, previewMenu.id, (item) => ({ ...item, submenuContentAlign: "left" })))}
                              >
                                <Icon source={TextAlignLeftIcon} />
                              </button>
                              <button
                                type="button"
                                className={`flex h-6 w-6 items-center justify-center rounded text-white ${previewMenu.submenuContentAlign === "center" ? "bg-gray-700" : "hover:bg-gray-800"}`}
                                onClick={() => setMenuItems((items) => updateItemById(items, previewMenu.id, (item) => ({ ...item, submenuContentAlign: "center" })))}
                              >
                                <Icon source={TextAlignCenterIcon} />
                              </button>
                              <button
                                type="button"
                                className={`flex h-6 w-6 items-center justify-center rounded text-white ${previewMenu.submenuContentAlign === "right" ? "bg-gray-700" : "hover:bg-gray-800"}`}
                                onClick={() => setMenuItems((items) => updateItemById(items, previewMenu.id, (item) => ({ ...item, submenuContentAlign: "right" })))}
                              >
                                <Icon source={TextAlignRightIcon} />
                              </button>
                            </div>
                          </div>

                          {/* Second level horizontal dropdown */}
                          {activeHorizontalItem && !activeHorizontalHasBlocks ? (
                            <div
                              style={{
                                borderTop: `1px solid ${previewColors.submenuBorder}`,
                                display: "flex",
                                flexDirection: "row",
                                alignItems: "center",
                                width: "100%",
                              }}
                            >
                              <div
                                style={{
                                  display: "flex",
                                  flexDirection: "row",
                                  gap: 0,
                                  flexWrap: "nowrap",
                                  alignItems: "center",
                                  justifyContent: getSubmenuJustify(activeHorizontalItem.submenuContentAlign),
                                  flex: 1,
                                  padding: "0 12px",
                                }}
                              >
                                {activeHorizontalChildren.map((child) => {
                                  const isActive =
                                    selectedItemId === child.id || selectedItemPath?.some((p) => p.id === child.id);
                                  const hasBlockChildren = Boolean(
                                    child.children?.some((grandChild) => grandChild.blockTemplate)
                                  );
                                  return (
                                    <div
                                      key={child.id}
                                      className={`group/item relative ${draggedItemId === child.id ? "opacity-50" : ""}`}
                                      ref={registerPreviewRow(child.id)}
                                      style={{ willChange: "transform" }}
                                      draggable
                                      onDragStart={(event) => {
                                        event.dataTransfer.effectAllowed = "move";
                                        event.dataTransfer.setData("text/plain", child.id);
                                        setDraggedItemId(child.id);
                                        const parentId = findParentId(menuItems, child.id);
                                        setDraggedParentId(parentId ?? null);
                                        lastDragOverIdRef.current = null;
                                      }}
                                      onDragEnd={() => {
                                        setDraggedItemId(null);
                                        setDraggedParentId(null);
                                        lastDragOverIdRef.current = null;
                                      }}
                                      onDragOver={(event) => {
                                        if (!draggedItemId || draggedItemId === child.id) return;
                                        const targetParentId = findParentId(menuItems, child.id);
                                        if (draggedParentId !== targetParentId) return;
                                        event.preventDefault();
                                        if (lastDragOverIdRef.current === child.id) return;
                                        lastDragOverIdRef.current = child.id;
                                        setMenuItems((items) => moveItem(items, draggedItemId, child.id));
                                      }}
                                      onDrop={(event) => {
                                        event.preventDefault();
                                        setDraggedItemId(null);
                                        setDraggedParentId(null);
                                        lastDragOverIdRef.current = null;
                                      }}
                                    >
                                      <button
                                        type="button"
                                        onClick={() => {
                                          handleSelectItem(child.id);
                                          if (isTwoTopTabsTemplate) {
                                            setActiveHorizontalChildId((prev) =>
                                              prev === child.id ? null : hasBlockChildren ? child.id : null
                                            );
                                            setActiveHorizontalGrandchildId(null);
                                          }
                                          if (isThreeTopTabsTemplate) {
                                            const hasNestedChildren = Boolean(child.children?.length);
                                            setActiveHorizontalChildId((prev) =>
                                              prev === child.id ? null : hasNestedChildren ? child.id : null
                                            );
                                            setActiveHorizontalGrandchildId(null);
                                          }
                                        }}
                                        onMouseEnter={(event) => {
                                          event.currentTarget.style.color = previewColors.submenuTextHover;
                                        }}
                                        onMouseLeave={(event) => {
                                          event.currentTarget.style.color = isActive
                                            ? previewColors.submenuTextHover
                                            : previewColors.submenuText;
                                        }}
                                        className="cursor-grab active:cursor-grabbing"
                                        style={{
                                          display: "flex",
                                          alignItems: "center",
                                          justifyContent: "center",
                                          gap: 10,
                                          minHeight: builderSettings.spacingLinkListRowHeight,
                                          padding: "16px",
                                          borderRadius: 0,
                                          border: "1px solid transparent",
                                          background: "transparent",
                                          color: isActive ? previewColors.submenuTextHover : previewColors.submenuText,
                                          textAlign: "center",
                                          ...subtextTypography,
                                          lineHeight: 1.2,
                                          whiteSpace: "nowrap",
                                        }}
                                      >
                                        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                                          {child.icon ? (
                                            <span
                                              aria-hidden="true"
                                              style={{
                                                display: "inline-flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                width: child.iconWidthMode === "custom"
                                                  ? `${child.iconWidthValue ?? 50}${child.iconWidthUnit ?? "%"}`
                                                  : undefined,
                                              }}
                                            >
                                              {renderMenuIcon(child.icon, {
                                                size: 16,
                                                className: "text-gray-500",
                                                color: isActive ? previewColors.submenuTextHover : previewColors.submenuText,
                                              })}
                                            </span>
                                          ) : null}
                                          <span>{child.label}</span>
                                          {Boolean(child.children?.length) && (
                                            <Icon source={ChevronDownIcon} tone="subdued" />
                                          )}
                                        </div>
                                      </button>
                                      <div className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 opacity-0 transition-opacity group-hover/item:pointer-events-auto group-hover/item:opacity-100">
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
                                            aria-label="Copy item"
                                            className="flex h-5 w-5 items-center justify-center rounded-md text-white hover:bg-gray-800"
                                          >
                                            <Icon source={DuplicateIcon} />
                                          </button>
                                          <button
                                            type="button"
                                            onClick={(event) => {
                                              event.stopPropagation();
                                              handleDeleteItem(child.id);
                                            }}
                                            aria-label="Delete item"
                                            className="flex h-5 w-5 items-center justify-center rounded-md text-white hover:bg-gray-800"
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
                                  onClick={() => handleAddChild(activeHorizontalItem.id, "item")}
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    gap: 8,
                                    padding: "16px",
                                    borderRadius: 0,
                                    border: "none",
                                    background: "transparent",
                                    color: "#3b82f6",
                                    fontSize: 14,
                                    fontWeight: 500,
                                    whiteSpace: "nowrap",
                                  }}
                                >
                                  Add item
                                </button>
                              </div>

                              {/* Alignment Buttons for Row 2 */}
                              <div
                                style={{
                                  background: "rgb(17, 24, 39)",
                                  padding: "4px",
                                  borderRadius: "4px",
                                  marginRight: "12px",
                                  display: "flex",
                                  gap: 0,
                                }}
                              >
                                <button
                                  type="button"
                                  className={`flex h-6 w-6 items-center justify-center rounded text-white ${activeHorizontalItem.submenuContentAlign === "left" ? "bg-gray-700" : "hover:bg-gray-800"}`}
                                  onClick={() =>
                                    setMenuItems((items) =>
                                      updateItemById(items, activeHorizontalItem.id, (item) => ({
                                        ...item,
                                        submenuContentAlign: "left",
                                      }))
                                    )
                                  }
                                >
                                  <Icon source={TextAlignLeftIcon} />
                                </button>
                                <button
                                  type="button"
                                  className={`flex h-6 w-6 items-center justify-center rounded text-white ${activeHorizontalItem.submenuContentAlign === "center" ? "bg-gray-700" : "hover:bg-gray-800"}`}
                                  onClick={() =>
                                    setMenuItems((items) =>
                                      updateItemById(items, activeHorizontalItem.id, (item) => ({
                                        ...item,
                                        submenuContentAlign: "center",
                                      }))
                                    )
                                  }
                                >
                                  <Icon source={TextAlignCenterIcon} />
                                </button>
                                <button
                                  type="button"
                                  className={`flex h-6 w-6 items-center justify-center rounded text-white ${activeHorizontalItem.submenuContentAlign === "right" ? "bg-gray-700" : "hover:bg-gray-800"}`}
                                  onClick={() =>
                                    setMenuItems((items) =>
                                      updateItemById(items, activeHorizontalItem.id, (item) => ({
                                        ...item,
                                        submenuContentAlign: "right",
                                      }))
                                    )
                                  }
                                >
                                  <Icon source={TextAlignRightIcon} />
                                </button>
                              </div>
                            </div>
                          ) : null}
                          {isThreeTopTabsTemplate && activeHorizontalChild && !activeHorizontalChildHasBlocks ? (
                            <div
                              style={{
                                borderTop: `1px solid ${previewColors.submenuBorder}`,
                                display: "flex",
                                flexDirection: "row",
                                alignItems: "center",
                                width: "100%",
                              }}
                            >
                              <div
                                style={{
                                  display: "flex",
                                  flexDirection: "row",
                                  gap: 0,
                                  flexWrap: "nowrap",
                                  alignItems: "center",
                                  justifyContent: getSubmenuJustify(activeHorizontalChild.submenuContentAlign),
                                  flex: 1,
                                  padding: "0 12px",
                                }}
                              >
                                {activeHorizontalChildChildren.map((child) => {
                                  const isActive =
                                    selectedItemId === child.id || selectedItemPath?.some((p) => p.id === child.id);
                                  const hasBlockChildren = Boolean(
                                    child.children?.some((grandChild) => grandChild.blockTemplate)
                                  );
                                  return (
                                    <div
                                      key={child.id}
                                      className={`group/item relative ${draggedItemId === child.id ? "opacity-50" : ""}`}
                                      ref={registerPreviewRow(child.id)}
                                      style={{ willChange: "transform" }}
                                      draggable
                                      onDragStart={(event) => {
                                        event.dataTransfer.effectAllowed = "move";
                                        event.dataTransfer.setData("text/plain", child.id);
                                        setDraggedItemId(child.id);
                                        const parentId = findParentId(menuItems, child.id);
                                        setDraggedParentId(parentId ?? null);
                                        lastDragOverIdRef.current = null;
                                      }}
                                      onDragEnd={() => {
                                        setDraggedItemId(null);
                                        setDraggedParentId(null);
                                        lastDragOverIdRef.current = null;
                                      }}
                                      onDragOver={(event) => {
                                        if (!draggedItemId || draggedItemId === child.id) return;
                                        const targetParentId = findParentId(menuItems, child.id);
                                        if (draggedParentId !== targetParentId) return;
                                        event.preventDefault();
                                        if (lastDragOverIdRef.current === child.id) return;
                                        lastDragOverIdRef.current = child.id;
                                        setMenuItems((items) => moveItem(items, draggedItemId, child.id));
                                      }}
                                      onDrop={(event) => {
                                        event.preventDefault();
                                        setDraggedItemId(null);
                                        setDraggedParentId(null);
                                        lastDragOverIdRef.current = null;
                                      }}
                                    >
                                      <button
                                        type="button"
                                        onClick={() => {
                                          handleSelectItem(child.id);
                                          setActiveHorizontalGrandchildId((prev) =>
                                            prev === child.id ? null : hasBlockChildren ? child.id : null
                                          );
                                        }}
                                        onMouseEnter={(event) => {
                                          event.currentTarget.style.color = previewColors.submenuTextHover;
                                        }}
                                        onMouseLeave={(event) => {
                                          event.currentTarget.style.color = isActive
                                            ? previewColors.submenuTextHover
                                            : previewColors.submenuText;
                                        }}
                                        className="cursor-grab active:cursor-grabbing"
                                        style={{
                                          display: "flex",
                                          alignItems: "center",
                                          justifyContent: "center",
                                          gap: 10,
                                          minHeight: builderSettings.spacingLinkListRowHeight,
                                          padding: "16px",
                                          borderRadius: 0,
                                          border: "1px solid transparent",
                                          background: "transparent",
                                          color: isActive ? previewColors.submenuTextHover : previewColors.submenuText,
                                          textAlign: "center",
                                          ...subtextTypography,
                                          lineHeight: 1.2,
                                          whiteSpace: "nowrap",
                                        }}
                                      >
                                        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                                          <span>{child.label}</span>
                                          {Boolean(child.children?.length) && (
                                            <Icon source={ChevronDownIcon} tone="subdued" />
                                          )}
                                        </div>
                                      </button>
                                      <div className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 opacity-0 transition-opacity group-hover/item:pointer-events-auto group-hover/item:opacity-100">
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
                                            aria-label="Copy item"
                                            className="flex h-5 w-5 items-center justify-center rounded-md text-white hover:bg-gray-800"
                                          >
                                            <Icon source={DuplicateIcon} />
                                          </button>
                                          <button
                                            type="button"
                                            onClick={(event) => {
                                              event.stopPropagation();
                                              handleDeleteItem(child.id);
                                            }}
                                            aria-label="Delete item"
                                            className="flex h-5 w-5 items-center justify-center rounded-md text-white hover:bg-gray-800"
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
                                  onClick={() => handleAddChild(activeHorizontalChild.id, "item")}
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    gap: 8,
                                    padding: "16px",
                                    borderRadius: 0,
                                    border: "none",
                                    background: "transparent",
                                    color: "#3b82f6",
                                    fontSize: 14,
                                    fontWeight: 500,
                                    whiteSpace: "nowrap",
                                  }}
                                >
                                  Add item
                                </button>
                              </div>
                              <div
                                style={{
                                  background: "rgb(17, 24, 39)",
                                  padding: "4px",
                                  borderRadius: "4px",
                                  marginRight: "12px",
                                  display: "flex",
                                  gap: 0,
                                }}
                              >
                                <button
                                  type="button"
                                  className={`flex h-6 w-6 items-center justify-center rounded text-white ${activeHorizontalChild.submenuContentAlign === "left" ? "bg-gray-700" : "hover:bg-gray-800"}`}
                                  onClick={() =>
                                    setMenuItems((items) =>
                                      updateItemById(items, activeHorizontalChild.id, (item) => ({
                                        ...item,
                                        submenuContentAlign: "left",
                                      }))
                                    )
                                  }
                                >
                                  <Icon source={TextAlignLeftIcon} />
                                </button>
                                <button
                                  type="button"
                                  className={`flex h-6 w-6 items-center justify-center rounded text-white ${activeHorizontalChild.submenuContentAlign === "center" ? "bg-gray-700" : "hover:bg-gray-800"}`}
                                  onClick={() =>
                                    setMenuItems((items) =>
                                      updateItemById(items, activeHorizontalChild.id, (item) => ({
                                        ...item,
                                        submenuContentAlign: "center",
                                      }))
                                    )
                                  }
                                >
                                  <Icon source={TextAlignCenterIcon} />
                                </button>
                                <button
                                  type="button"
                                  className={`flex h-6 w-6 items-center justify-center rounded text-white ${activeHorizontalChild.submenuContentAlign === "right" ? "bg-gray-700" : "hover:bg-gray-800"}`}
                                  onClick={() =>
                                    setMenuItems((items) =>
                                      updateItemById(items, activeHorizontalChild.id, (item) => ({
                                        ...item,
                                        submenuContentAlign: "right",
                                      }))
                                    )
                                  }
                                >
                                  <Icon source={TextAlignRightIcon} />
                                </button>
                              </div>
                            </div>
                          ) : null}
                          {isTwoTopTabsTemplate && activeHorizontalChildHasBlocks ? (
                            <div
                              style={{
                                borderTop: `1px solid ${previewColors.submenuBorder}`,
                                width: "100%",
                              }}
                            >
                              <div style={{ display: "flex", flexDirection: "column", gap: 12, padding: 12 }}>
                                <div
                                  className="menu-builder-hide-scrollbar"
                                  style={{
                                    overflowX: "auto",
                                    overflowY: "hidden",
                                    scrollbarWidth: "none",
                                    msOverflowStyle: "none",
                                  }}
                                >
                                  <div
                                    style={{
                                      display: "flex",
                                      flexWrap: "nowrap",
                                      gap: 24,
                                      alignItems: "flex-start",
                                      justifyContent: "space-between",
                                      minWidth: 0,
                                    }}
                                  >
                                    {activeHorizontalChildBlocks.map((child) => {
                                      if (child.blockTemplate === "links") {
                                        const columnCount = Math.max(1, child.linkColumns ?? 2);
                                        const rawLinkWidth = child.linkWidth ?? 3;
                                        const linkWidth = Math.max(1, Math.min(12, rawLinkWidth));
                                        const resolvedLinkWidth =
                                          isTwoTopTabsTemplate && rawLinkWidth === 6 ? 4 : linkWidth;
                                        const linkFlexBasis =
                                          columnCount === 3
                                            ? "70%"
                                            : `${Math.round((resolvedLinkWidth / 12) * 100)}%`;
                                        return renderLinkListBlock(child, {
                                          flex: `0 0 ${linkFlexBasis}`,
                                          wrapperStyle: { minWidth: 0 },
                                          toolbarPlacement: "floating",
                                        });
                                      }
                                      if (child.blockTemplate === "image" || child.blockTemplate === "image2") {
                                        return renderImageBlock(child, {
                                          flex: "0 0 20%",
                                          wrapperStyle: { minWidth: 0 },
                                        });
                                      }
                                      return null;
                                    })}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ) : null}
                          {isThreeTopTabsTemplate && activeHorizontalGrandchildHasBlocks ? (
                            <div
                              style={{
                                borderTop: `1px solid ${previewColors.submenuBorder}`,
                                width: "100%",
                              }}
                            >
                              <div style={{ display: "flex", flexDirection: "column", gap: 12, padding: 12 }}>
                                <div
                                  className="menu-builder-hide-scrollbar"
                                  style={{
                                    overflowX: "auto",
                                    overflowY: "hidden",
                                    scrollbarWidth: "none",
                                    msOverflowStyle: "none",
                                  }}
                                >
                                  <div
                                    style={{
                                      display: "flex",
                                      flexWrap: "nowrap",
                                      gap: 24,
                                      alignItems: "flex-start",
                                      justifyContent: "space-between",
                                      minWidth: 0,
                                    }}
                                  >
                                    {activeHorizontalGrandchildBlocks.map((child) => {
                                      if (child.blockTemplate === "image" || child.blockTemplate === "image2") {
                                        return renderImageBlock(child, {
                                          flex: "0 0 20%",
                                          wrapperStyle: { minWidth: 0 },
                                        });
                                      }
                                      return null;
                                    })}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ) : null}
                          {activeHorizontalItem && activeHorizontalHasBlocks ? (
                            <div
                              style={{
                                borderTop: `1px solid ${previewColors.submenuBorder}`,
                                width: "100%",
                              }}
                            >
                              <div style={{ display: "flex", flexDirection: "column", gap: 12, padding: 12 }}>
                                <div
                                  className="menu-builder-hide-scrollbar"
                                  style={{
                                    overflowX: "auto",
                                    overflowY: "hidden",
                                    scrollbarWidth: "none",
                                    msOverflowStyle: "none",
                                  }}
                                >
                                  <div
                                    style={{
                                      display: "flex",
                                      flexWrap: "nowrap",
                                      gap: 24,
                                      alignItems: "flex-start",
                                      justifyContent: "space-between",
                                      minWidth: 0,
                                    }}
                                  >
                                    {activeHorizontalChildren.map((child) => {
                                      if (child.blockTemplate === "links") {
                                        const columnCount = Math.max(1, child.linkColumns ?? 2);
                                        const linkWidth = Math.max(1, Math.min(12, child.linkWidth ?? 3));
                                        const linkFlexBasis =
                                          columnCount === 3 ? "70%" : `${Math.round((linkWidth / 12) * 100)}%`;
                                        return renderLinkListBlock(child, {
                                          flex: `0 0 ${linkFlexBasis}`,
                                          wrapperStyle: { minWidth: 0 },
                                          toolbarPlacement: "floating",
                                        });
                                      }
                                      if (child.blockTemplate === "image" || child.blockTemplate === "image2") {
                                        return renderImageBlock(child, {
                                          flex: "0 0 20%",
                                          wrapperStyle: { minWidth: 0 },
                                        });
                                      }
                                      return null;
                                    })}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>

              {!shouldInlineMobilePanel &&
                dropdownGroups.length > 0 &&
                !isDropdownMenu &&
                !isHorizontalDropdownMenu && (
                  <div
                    className="menu-builder-hide-scrollbar"
                    style={{
                      background: previewMenu?.submenuBackgroundColor || previewColors.submenuBackground,
                      backgroundImage: previewMenu?.submenuBackgroundImage ? `url(${previewMenu.submenuBackgroundImage})` : "none",
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                      backgroundRepeat: "no-repeat",
                      border: builderSettings.submenuShowBorder
                        ? `1px solid ${previewColors.submenuBorder}`
                        : "none",
                      borderRadius: 0,
                      marginTop: 0,
                      padding: "10px",
                      boxShadow: "0 10px 30px rgba(15, 23, 42, 0.15)",
                      maxWidth: submenuMaxWidth ?? "none",
                      position: "absolute",
                      top: dropdownTop,
                      left: dropdownLeft,
                      width: dropdownPanelWidth,
                      zIndex: 20,
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
                    }}
                  >
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
                            display: useBlockFlexLayout ? "flex" : "grid",
                            gridTemplateColumns: useBlockFlexLayout
                              ? undefined
                              : dropdownGroups.some(
                                (g) =>
                                  g.multiLayout === "multi-4-images" ||
                                  g.multiLayout === "multi-4-products"
                              )
                                ? "repeat(4, minmax(0, 1fr))"
                                : `repeat(${dropdownGroups.length}, minmax(0, 1fr))`,
                            flexDirection: undefined,
                            gap: useImageSpaceLayout ? 0 : 24,
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
                                  flex: spaceFlex,
                                  order: spaceOrder,
                                },
                              });
                            }
                            if (group.blockTemplate === "image" || group.blockTemplate === "image2") {
                              const span = getBlockSpan(group);
                              return renderImageBlock(group, {
                                wrapperStyle: {
                                  minWidth: 0,
                                  flex: useBlockFlexLayout ? `0 0 calc(${(span / 12) * 100}% - ${(useImageSpaceLayout ? 0 : 24) * (1 - span / 12)}px)` : undefined
                                }
                              });
                            }
                            if (group.blockTemplate === "multi") {
                              const multiColumns = (group.children ?? []).filter(
                                (child) => child.role === "group" && child.blockTemplate === "links"
                              );
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
                                    flex: useBlockFlexLayout ? "0 0 100%" : undefined,
                                    border: isGroupSelected ? `1px dashed ${themeSettings.menuActive}` : undefined,
                                    padding: "0",
                                    borderRadius: 0,
                                  }}
                                >
                                  <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
                                    {multiColumns.map((child) =>
                                      renderLinkListBlock(child, {
                                        flex: "1 1 0",
                                        wrapperStyle: { minWidth: 0 },
                                        toolbarPlacement: "floating",
                                      })
                                    )}
                                  </div>
                                </div>
                              );
                            }
                            if (group.blockTemplate === "links") {
                              const span = getBlockSpan(group);
                              return renderLinkListBlock(group, {
                                wrapperStyle: {
                                  minWidth: 0,
                                  flex: useBlockFlexLayout ? `0 0 calc(${(span / 12) * 100}% - ${(useImageSpaceLayout ? 0 : 24) * (1 - span / 12)}px)` : undefined
                                },
                                toolbarPlacement: "floating",
                              });
                            }
                            if (group.blockTemplate === "html") {
                              const span = getBlockSpan(group);
                              return renderHtmlBlock(group, {
                                wrapperStyle: {
                                  minWidth: 0,
                                  flex: useBlockFlexLayout ? `0 0 calc(${(span / 12) * 100}% - ${(useImageSpaceLayout ? 0 : 24) * (1 - span / 12)}px)` : undefined
                                }
                              });
                            }
                            if (group.blockTemplate === "contact") {
                              const span = getBlockSpan(group);
                              return renderContactBlock(group, {
                                wrapperStyle: {
                                  minWidth: 0,
                                  flex: useBlockFlexLayout ? `0 0 calc(${(span / 12) * 100}% - ${(useImageSpaceLayout ? 0 : 24) * (1 - span / 12)}px)` : undefined
                                }
                              });
                            }
                            if (
                              group.blockTemplate === "product" ||
                              group.blockTemplate === "product-horizontal" ||
                              group.blockTemplate === "product-grid" ||
                              group.blockTemplate === "product-carousel" ||
                              group.blockTemplate === "product-grid-horizontal"
                            ) {
                              const span = getBlockSpan(group);
                              return renderProductBlock(group, {
                                wrapperStyle: {
                                  minWidth: 0,
                                  flex: useBlockFlexLayout ? `0 0 calc(${(span / 12) * 100}% - ${(useImageSpaceLayout ? 0 : 24) * (1 - span / 12)}px)` : undefined
                                }
                              });
                            }
                            if (group.blockTemplate === "collection") {
                              const span = getBlockSpan(group);
                              return renderCollectionBlock(group, {
                                wrapperStyle: {
                                  minWidth: 0,
                                  flex: useBlockFlexLayout ? `0 0 calc(${(span / 12) * 100}% - ${(useImageSpaceLayout ? 0 : 24) * (1 - span / 12)}px)` : undefined
                                }
                              });
                            }
                            if (group.blockTemplate === "blogs" || group.blockTemplate === "blogs-latest") {
                              const span = getBlockSpan(group);
                              return renderBlogBlock(group, {
                                wrapperStyle: {
                                  minWidth: 0,
                                  flex: useBlockFlexLayout ? `0 0 calc(${(span / 12) * 100}% - ${(useImageSpaceLayout ? 0 : 24) * (1 - span / 12)}px)` : undefined
                                }
                              });
                            }
                            return (
                              <div
                                key={group.id}
                                style={{
                                  border: isGroupSelected ? `1px dashed ${themeSettings.menuActive}` : "1px solid transparent",
                                  borderRadius: 10,
                                  padding: "10px 12px",
                                }}
                              >
                                <div
                                  style={{
                                    minHeight: builderSettings.spacingTabRowHeight,
                                    display: "flex",
                                    alignItems: "center",
                                  }}
                                >
                                  <Text as="h3" variant="headingSm" fontWeight="semibold">
                                    <span
                                      style={{
                                        color: previewColors.submenuHeading,
                                        ...subheadingTypography,
                                        lineHeight: 1.2,
                                      }}
                                    >
                                      {group.label}
                                    </span>
                                  </Text>
                                </div>
                                <Divider />
                                <BlockStack gap="200">
                                  {group.children?.map((child) => {
                                    const isChildSelected = selectedItemId === child.id;
                                    return (
                                      <button
                                        key={child.id}
                                        type="button"
                                        onClick={() => handleSelectItem(child.id)}
                                        onMouseEnter={(event) => {
                                          event.currentTarget.style.color = previewColors.submenuTextHover;
                                        }}
                                        onMouseLeave={(event) => {
                                          event.currentTarget.style.color = previewColors.submenuText;
                                        }}
                                        style={{
                                          textAlign: "left",
                                          border: isChildSelected
                                            ? `1px dashed ${themeSettings.menuActive}`
                                            : "1px solid transparent",
                                          borderRadius: 8,
                                          padding: "6px 8px",
                                          minHeight: builderSettings.spacingLinkListRowHeight,
                                          background: "transparent",
                                          color: previewColors.submenuText,
                                          ...subtextTypography,
                                          lineHeight: 1.2,
                                        }}
                                      >
                                        {child.label}
                                      </button>
                                    );
                                  })}
                                  <Button
                                    variant="plain"
                                    icon={PlusIcon}
                                    size="slim"
                                    onClick={() => handleAddChild(group.id, "item")}
                                    style={{
                                      minHeight: builderSettings.spacingLinkListRowHeight,
                                      color: previewColors.submenuDescription,
                                      ...descriptionTypography,
                                    }}
                                    onMouseEnter={(event) => {
                                      event.currentTarget.style.color = previewColors.submenuDescriptionHover;
                                    }}
                                    onMouseLeave={(event) => {
                                      event.currentTarget.style.color = previewColors.submenuDescription;
                                    }}
                                  >
                                    Add item
                                  </Button>
                                </BlockStack>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })()}
                  </div>
                )}
            </div>
          </Box>

        </main>

        <div className="absolute bottom-6" style={{ left: "calc(4rem + 20rem + 24px)" }}>
          <Card padding="200">
            <InlineStack gap="100">
              <Button
                variant={previewMode === "desktop" ? "primary" : "tertiary"}
                icon={DesktopIcon}
                onClick={() => setPreviewMode("desktop")}
                accessibilityLabel="Desktop"
              />
              <Button
                variant={previewMode === "mobile" ? "primary" : "tertiary"}
                icon={MobileIcon}
                onClick={() => setPreviewMode("mobile")}
                accessibilityLabel="Mobile"
              />
            </InlineStack>
          </Card>
        </div>
        <BlockTemplatePreviewPanel
          blockTemplateTargetId={blockTemplateTargetId}
          blockTemplateHoverId={blockTemplateHoverId}
          setBlockTemplateHoverId={setBlockTemplateHoverId}
          blockTemplatePanelHover={blockTemplatePanelHover}
          setBlockTemplatePanelHover={setBlockTemplatePanelHover}
          clearBlockTemplateHoverTimeout={clearBlockTemplateHoverTimeout}
          handleApplyBlockTemplate={handleApplyBlockTemplate}
          handleApplyTabsBlockTemplate={handleApplyTabsBlockTemplate}
          isPlusPlan={isPlusPlan}
          isProPlan={isProPlan}
          navigate={navigate}
        />
        <BlockTemplatePicker
          blockTemplateTargetId={blockTemplateTargetId}
          setBlockTemplateTargetId={setBlockTemplateTargetId}
          blockTemplateHoverId={blockTemplateHoverId}
          setBlockTemplateHoverId={setBlockTemplateHoverId}
          clearBlockTemplateHoverTimeout={clearBlockTemplateHoverTimeout}
          scheduleBlockTemplateHover={scheduleBlockTemplateHover}
          scheduleBlockTemplateHoverClear={scheduleBlockTemplateHoverClear}
        />
        <SubmenuTemplatePreviewPanel
          submenuTemplateTargetId={submenuTemplateTargetId}
          submenuTemplateHoverId={submenuTemplateHoverId}
          setSubmenuTemplateHoverId={setSubmenuTemplateHoverId}
          submenuTemplatePanelHover={submenuTemplatePanelHover}
          setSubmenuTemplatePanelHover={setSubmenuTemplatePanelHover}
          clearSubmenuTemplateHoverTimeout={clearSubmenuTemplateHoverTimeout}
          handleApplySubmenuTemplate={handleApplySubmenuTemplate}
          handleApplyMegaMenuPreset={handleApplyMegaMenuPreset}
          isPlusPlan={isPlusPlan}
          isProPlan={isProPlan}
          navigate={navigate}
        />
        <SubmenuTemplatePicker
          submenuTemplateTargetId={submenuTemplateTargetId}
          setSubmenuTemplateTargetId={setSubmenuTemplateTargetId}
          submenuTemplateHoverId={submenuTemplateHoverId}
          setSubmenuTemplatePanelHover={setSubmenuTemplatePanelHover}
          clearSubmenuTemplateHoverTimeout={clearSubmenuTemplateHoverTimeout}
          scheduleSubmenuTemplateHover={scheduleSubmenuTemplateHover}
          scheduleSubmenuTemplateHoverClear={scheduleSubmenuTemplateHoverClear}
          handleApplySubmenuTemplate={handleApplySubmenuTemplate}
        />
        <div
          className={`fixed inset-0 z-30 bg-gray-900/40 transition-opacity duration-200 ${isTemplatePickerOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
            }`}
          aria-hidden="true"
          onClick={() => {
            setBlockTemplateTargetId(null);
            setSubmenuTemplateTargetId(null);
          }}
        />
        {renderFloatingLinkListToolbar()}
      </div>
    </div>
  );
}
