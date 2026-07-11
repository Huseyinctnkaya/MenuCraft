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

  const renderAddBetween = (parentId: string | null, afterId: string | undefined, depth: number) => {
    return null;
  };

  const renderMenuTree = (item: MenuItem, depth: number = 0, parentItem?: MenuItem) => {
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
  };

  const renderMenuPanel = () => {
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
  };

  const renderLinkListToolbarButtons = (group: MenuItem) => (
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

  const renderLinkListBlock = (
    group: MenuItem,
    options: {
      flex?: string;
      wrapperStyle?: CSSProperties;
      toolbarPlacement?: "inline" | "floating";
    } = {}
  ) => {
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
  };

  const renderFloatingLinkListToolbar = () => {
    if (!floatingLinkListToolbarId || !floatingLinkListToolbarPosition) return null;
    const group = findItemPath(menuItems, floatingLinkListToolbarId)?.slice(-1)[0];
    if (!group) return null;
    return createPortal(
      <div
        className="pointer-events-auto fixed z-50 -translate-x-1/2"
        style={{
          left: floatingLinkListToolbarPosition.left,
          top: floatingLinkListToolbarPosition.top,
        }}
        onMouseEnter={() => {
          floatingLinkListToolbarHoverRef.current = true;
          if (hideFloatingLinkListToolbarTimeoutRef.current) {
            clearTimeout(hideFloatingLinkListToolbarTimeoutRef.current);
          }
        }}
        onMouseLeave={() => {
          floatingLinkListToolbarHoverRef.current = false;
          if (hideFloatingLinkListToolbarTimeoutRef.current) {
            clearTimeout(hideFloatingLinkListToolbarTimeoutRef.current);
          }
          hideFloatingLinkListToolbarTimeoutRef.current = setTimeout(() => {
            if (!floatingLinkListToolbarHoverRef.current) {
              setFloatingLinkListToolbarId(null);
            }
          }, 100);
        }}
      >
        <div className="flex items-center gap-1 rounded-full bg-gray-900 px-2 py-1 shadow-md">
          {renderLinkListToolbarButtons(group)}
        </div>
      </div>,
      document.body
    );
  };

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

  const renderElementGroupMasonry = (groups: MenuItem[]) => {
    if (!groups.length) return null;
    const productGroup = groups.find((group) => group.blockTemplate === "product");
    const htmlGroup = groups.find((group) => group.blockTemplate === "html");
    const linkGroups = groups.filter((group) => group.blockTemplate === "links");
    const leftWidthUnits = Math.max(
      1,
      Math.min(11, productGroup?.productWidth ?? htmlGroup?.imageWidth ?? 3)
    );
    const rightWidthUnits = Math.max(1, 12 - leftWidthUnits);
    const leftBasis = `${Math.round((leftWidthUnits / 12) * 100)}%`;
    const rightBasis = `${Math.round((rightWidthUnits / 12) * 100)}%`;
    const linkWeights = linkGroups.map((group) =>
      Math.max(1, Math.min(12, group.linkWidth ?? 3))
    );
    const linkTotal = linkWeights.reduce((sum, value) => sum + value, 0) || 1;

    const isMobileMasonry = isMobilePreview;

    return (
      <div
        key="multi-element-group-masonry"
        style={{
          display: "flex",
          gap: isMobileMasonry ? 12 : 24,
          flexWrap: "nowrap",
          flexDirection: isMobileMasonry ? "column" : "row",
          alignItems: "flex-start",
          width: "100%",
          flex: useBlockFlexLayout ? "0 0 100%" : undefined,
        }}
      >
        <div
          style={{
            flex: isMobileMasonry ? "1 1 100%" : `0 1 ${leftBasis}`,
            minWidth: 0,
            display: "flex",
            flexDirection: "column",
            gap: 6,
            width: isMobileMasonry ? "100%" : undefined,
          }}
        >
          {productGroup
            ? renderProductBlock(productGroup, {
              flex: "0 0 auto",
              wrapperStyle: { minWidth: 0, padding: 0, width: "100%" },
            })
            : null}
          {htmlGroup
            ? renderHtmlBlock(htmlGroup, {
              flex: "0 0 auto",
              wrapperStyle: { minWidth: 0, padding: 0, width: "100%" },
            })
            : null}
        </div>
        <div
          style={{
            flex: isMobileMasonry ? "1 1 100%" : `0 1 ${rightBasis}`,
            minWidth: 0,
            display: "flex",
            gap: isMobileMasonry ? 12 : 16,
            flexWrap: "nowrap",
            flexDirection: isMobileMasonry ? "column" : "row",
            width: isMobileMasonry ? "100%" : undefined,
          }}
        >
          {linkGroups.map((child, index) => {
            const linkShare = linkWeights[index] / linkTotal;
            const linkBasis = `${Math.round(linkShare * 100)}%`;
            return renderLinkListBlock(child, {
              flex: isMobileMasonry ? "1 1 100%" : `0 1 ${linkBasis}`,
              wrapperStyle: { minWidth: 0, width: isMobileMasonry ? "100%" : undefined },
              toolbarPlacement: "floating",
            });
          })}
        </div>
      </div>
    );
  };


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
  const renderMobileBlockGroup = (group: MenuItem) => {
    if (group.blockTemplate === "links") {
      return renderLinkListBlock(group, {
        flex: "1 1 100%",
        wrapperStyle: { minWidth: 0, width: "100%" },
        toolbarPlacement: "floating",
      });
    }
    if (group.blockTemplate === "image" || group.blockTemplate === "image2") {
      return renderImageBlock(group, {
        flex: "1 1 100%",
        wrapperStyle: { minWidth: 0, width: "100%" },
      });
    }
    if (group.blockTemplate === "contact") {
      return renderContactBlock(group, {
        flex: "1 1 100%",
        wrapperStyle: { width: "100%" },
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
        flex: "1 1 100%",
        wrapperStyle: { width: "100%" },
      });
    }
    if (group.blockTemplate === "collection") {
      return renderCollectionBlock(group, {
        flex: "1 1 100%",
        wrapperStyle: { width: "100%" },
      });
    }
    if (group.blockTemplate === "blogs" || group.blockTemplate === "blogs-latest") {
      return renderBlogBlock(group, {
        flex: "1 1 100%",
        wrapperStyle: { width: "100%" },
      });
    }
    if (group.blockTemplate === "html") {
      return renderHtmlBlock(group, {
        flex: "1 1 100%",
        wrapperStyle: { width: "100%" },
      });
    }
    if (group.blockTemplate === "space") {
      return renderSpaceBlock(group, {
        wrapperStyle: { width: "100%" },
      });
    }
    if (group.blockTemplate === "multi") {
      return (
        <div key={group.id} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {group.children?.map((child) => renderMobileBlockGroup(child))}
        </div>
      );
    }
    return null;
  };

  const renderMobileDropdownPanel = () => {
    if (!previewMenu || !shouldInlineMobileDropdownPanel) return null;
    const dropdownItemHeight = builderSettings.spacingLinkListRowHeight;
    const activeDropdownItem =
      dropdownItems.find((child) => child.id === activeDropdownItemId) ?? null;
    const applyMobileDropdownAlign = (align: MenuItem["submenuContentAlign"]) => {
      setMenuItems((items) =>
        updateItemById(items, previewMenu.id, (item) => ({
          ...item,
          submenuContentAlign: align ?? "left",
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
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 0,
            padding: 0,
          }}
        >
          {dropdownItems.map((child) => {
            const hasChildren = Boolean(child.children?.length);
            const isActiveChild = activeDropdownItem?.id === child.id;
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
              ? (child.children ?? []).find((entry) => entry.id === activeDropdownChildId) ?? null
              : null;
            const activeNestedBlocks = (activeNestedItem?.children ?? []).filter(
              (entry) => entry.blockTemplate
            );
            const activeNestedHasBlocks = activeNestedBlocks.length > 0;
            const activeDeepParent = hasDeepNestedBlocks
              ? (child.children ?? []).find((entry) => entry.id === activeDropdownChildId) ?? null
              : null;
            const deepChildren = activeDeepParent?.children ?? [];
            const activeDeepChild = deepChildren.find(
              (entry) => entry.id === activeDropdownGrandchildId
            );
            const activeDeepBlocks = (activeDeepChild?.children ?? []).filter(
              (entry) => entry.blockTemplate
            );
            const activeDeepHasBlocks = activeDeepBlocks.length > 0;
            return (
              <div
                key={child.id}
                style={{ display: "flex", flexDirection: "column" }}
              >
                <div className="group/item relative">
                  <button
                    type="button"
                    onClick={() => {
                      handleSelectItem(child.id);
                      if (hasChildren) {
                        setActiveDropdownItemId((prev) => (prev === child.id ? null : child.id));
                      } else {
                        setActiveDropdownItemId(null);
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
                    {hasChildren ? (
                      <span
                        aria-hidden="true"
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          transform: isActiveChild ? "rotate(180deg)" : "rotate(0deg)",
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
                {isActiveChild && hasChildren ? (
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
                          const isSubItemActive = activeDropdownChildId === subItem.id;
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
                                    setActiveDropdownChildId((prev) =>
                                      prev === subItem.id ? null : subItem.id
                                    );
                                  } else {
                                    setActiveDropdownChildId(null);
                                  }
                                  setActiveDropdownGrandchildId(null);
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
                          const isSubItemActive = activeDropdownChildId === subItem.id;
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
                                    setActiveDropdownChildId((prev) =>
                                      prev === subItem.id ? null : subItem.id
                                    );
                                  } else {
                                    setActiveDropdownChildId(null);
                                  }
                                  setActiveDropdownGrandchildId(null);
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
                              const isDeepActive = activeDropdownGrandchildId === deepItem.id;
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
                                        setActiveDropdownGrandchildId((prev) =>
                                          prev === deepItem.id ? null : deepItem.id
                                        );
                                      } else {
                                        setActiveDropdownGrandchildId(null);
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
                onClick={() => applyMobileDropdownAlign("left")}
                className="flex h-8 w-8 items-center justify-center rounded-md text-white hover:bg-gray-700"
              >
                <Icon source={TextAlignLeftIcon} />
              </button>
              <button
                type="button"
                aria-label="Align center"
                onClick={() => applyMobileDropdownAlign("center")}
                className="flex h-8 w-8 items-center justify-center rounded-md text-white hover:bg-gray-700"
              >
                <Icon source={TextAlignCenterIcon} />
              </button>
              <button
                type="button"
                aria-label="Align right"
                onClick={() => applyMobileDropdownAlign("right")}
                className="flex h-8 w-8 items-center justify-center rounded-md text-white hover:bg-gray-700"
              >
                <Icon source={TextAlignRightIcon} />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderMobileHorizontalDropdownPanel = () => {
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
  };

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
  const renderMenuItemButton = (item: MenuItem) => {
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
  };
  const renderAccountLinkButton = (link: {
    id: string;
    label: string;
    icon: string;
    iconWidthMode: "auto" | "custom";
    iconWidthValue: number;
    iconWidthUnit: "%" | "px";
  }) => {
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
  };
  const renderSearchControl = (marginLeft?: string | number) => {
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
  };

  const renderSpaceBlock = (
    group: MenuItem,
    options?: { isSelected?: boolean; wrapperStyle?: CSSProperties }
  ) =>
    renderSpaceBlockImpl(previewBlockDeps, group, options);

  const renderMegaPanel = (inline: boolean) => {
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
  };

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
