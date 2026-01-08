import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import type { ActionFunctionArgs, LoaderFunctionArgs, LinksFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useFetcher, useLocation, useNavigate, useLoaderData, useRouteLoaderData } from "@remix-run/react";
import { createPortal } from "react-dom";
import type { LucideIcon } from "lucide-react";
import * as LucideIcons from "lucide-react";
import createApp from "@shopify/app-bridge";
import { Fullscreen } from "@shopify/app-bridge/actions";
import {
  Badge,
  BlockStack,
  Box,
  Button,
  ButtonGroup,
  Card,
  ColorPicker,
  Checkbox,
  ChoiceList,
  Divider,
  InlineStack,
  Modal,
  RangeSlider,
  Select,
  Text,
  TextField,
  Icon,
} from "@shopify/polaris";
import type { IconSource } from "@shopify/polaris";
import {
  ArrowLeftIcon,
  BlogIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  CodeIcon,
  CollectionIcon,
  CollectionListIcon,
  DesktopIcon,
  EmailIcon,
  FormsIcon,
  DragHandleIcon,
  DuplicateIcon,
  EditIcon,
  DeleteIcon,
  HomeIcon,
  ImageIcon,
  LayoutBlockIcon,
  ListBulletedIcon,
  MenuIcon,
  MobileIcon,
  PaintBrushRoundIcon,
  PlusIcon,
  ProductIcon,
  ProductListIcon,
  PageIcon,
  SearchIcon,
  SettingsIcon,
  TextAlignCenterIcon,
  TextAlignLeftIcon,
  TextAlignRightIcon,
  TextFontListIcon,
  TextIcon,
} from "@shopify/polaris-icons";
import polarisStyles from "@shopify/polaris/build/esm/styles.css?url";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";
import { sendContactEmail } from "../email.server";
import type { loader as appLoader } from "./app";

export const links: LinksFunction = () => [
  { rel: "stylesheet", href: polarisStyles },
];

const DEFAULT_MENU_ITEMS: MenuItem[] = [
  { id: "home", label: "Home", url: "/", role: "menu" },
  {
    id: "catalogs",
    label: "Catalogs",
    url: "/collections",
    role: "menu",
    expanded: true,
    children: [
      {
        id: "catalogs-list-1",
        label: "Pet Food",
        url: "",
        role: "group",
        expanded: true,
        children: [
          { id: "pet-food", label: "Wet Foods", url: "/collections/wet-foods", role: "item" },
          { id: "dry-foods", label: "Dry Foods", url: "/collections/dry-foods", role: "item" },
          { id: "raw-foods", label: "Raw Foods", url: "/collections/raw-foods", role: "item" },
        ],
      },
      {
        id: "catalogs-list-2",
        label: "Pet Beds",
        url: "",
        role: "group",
        expanded: true,
        children: [
          { id: "pet-beds", label: "Bolster Beds", url: "/collections/bolster-beds", role: "item" },
          { id: "pillow-beds", label: "Pillow Beds", url: "/collections/pillow-beds", role: "item" },
          { id: "tent-beds", label: "Tent Beds", url: "/collections/tent-beds", role: "item" },
        ],
      },
      {
        id: "catalogs-list-3",
        label: "Pet Accessories",
        url: "",
        role: "group",
        expanded: true,
        children: [
          { id: "pet-blanket", label: "Pet Blanket", url: "/collections/pet-blanket", role: "item" },
          { id: "pet-belts", label: "Pet Belts", url: "/collections/pet-belts", role: "item" },
          { id: "pet-clothes", label: "Pet Clothes", url: "/collections/pet-clothes", role: "item" },
        ],
      },
      {
        id: "catalogs-list-4",
        label: "Pet Toys",
        url: "",
        role: "group",
        expanded: true,
        children: [
          { id: "stuffed-toys", label: "Stuffed Toys", url: "/collections/stuffed-toys", role: "item" },
          { id: "puzzle-toys", label: "Puzzle Toys", url: "/collections/puzzle-toys", role: "item" },
          { id: "rope-toys", label: "Rope Toys", url: "/collections/rope-toys", role: "item" },
        ],
      },
    ],
  },
  { id: "sale", label: "Sale", url: "/collections/sale", role: "menu" },
  { id: "blog", label: "Blog", url: "/blogs/news", role: "menu" },
  { id: "about", label: "About", url: "/pages/about", role: "menu" },
];

const buildDefaultMenuItems = (): MenuItem[] => [
  structuredClone(DEFAULT_MENU_ITEMS[0]),
];

const LINK_SUGGESTIONS = [
  { label: "Home", url: "/", icon: HomeIcon },
  { label: "Search", url: "/search", icon: SearchIcon },
  { label: "All collections", url: "/collections", icon: CollectionListIcon },
  { label: "All products", url: "/collections/all", icon: ProductListIcon },
  { label: "Collections", url: "/collections", icon: CollectionIcon },
  { label: "Products", url: "/products", icon: ProductIcon },
  { label: "Pages", url: "/pages", icon: PageIcon },
  { label: "Blogs", url: "/blogs", icon: BlogIcon },
  { label: "Blog posts", url: "/blogs/news", icon: BlogIcon },
];

const SUBMENU_TEMPLATES: Array<{ id: SubmenuTemplateId; label: string; icon: IconSource }> = [
  { id: "custom", label: "Custom menu", icon: MenuIcon },
  { id: "tabs", label: "Tabs", icon: CollectionListIcon },
  { id: "mega", label: "Mega menu", icon: ProductListIcon },
  { id: "dropdown", label: "Dropdown (flyout)", icon: ChevronDownIcon },
];

const BLOCK_TEMPLATES: Array<{ id: BlockTemplateId; label: string; icon: IconSource }> = [
  { id: "multi", label: "Multi block", icon: LayoutBlockIcon },
  { id: "tabs", label: "Tabs", icon: CollectionListIcon },
  { id: "image", label: "Image", icon: ImageIcon },
  { id: "links", label: "Link list", icon: ListBulletedIcon },
  { id: "product", label: "Product", icon: ProductIcon },
  { id: "collection", label: "Collection", icon: CollectionIcon },
  { id: "blogs", label: "Blogs", icon: BlogIcon },
  { id: "contact", label: "Contact form", icon: EmailIcon },
  { id: "html", label: "Custom HTML", icon: CodeIcon },
];

const EXCLUDED_LUCIDE_EXPORTS = new Set(["Icon", "LucideIcon"]);

const formatLucideLabel = (name: string) =>
  name.replace(/([a-z0-9])([A-Z])/g, "$1 $2").replace(/([A-Z])([A-Z][a-z])/g, "$1 $2");

const formatLucideId = (name: string) =>
  name.replace(/([a-z0-9])([A-Z])/g, "$1-$2").replace(/([A-Z])([A-Z][a-z])/g, "$1-$2").toLowerCase();

const ICON_LIBRARY: { id: string; label: string; Icon: LucideIcon }[] = Object.entries(LucideIcons)
  .filter(([name, IconComponent]) => {
    if (EXCLUDED_LUCIDE_EXPORTS.has(name)) return false;
    if (!/^[A-Z]/.test(name)) return false;
    return typeof IconComponent === "function" || (typeof IconComponent === "object" && IconComponent);
  })
  .map(([name, IconComponent]) => ({
    id: formatLucideId(name),
    label: formatLucideLabel(name),
    Icon: IconComponent as LucideIcon,
  }))
  .sort((a, b) => a.label.localeCompare(b.label));

const ICON_LIBRARY_BY_ID = Object.fromEntries(ICON_LIBRARY.map((icon) => [icon.id, icon]));
const ICON_PREFIX = "lucide:";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin, session } = await authenticate.admin(request);
  const shop = session.shop;
  const url = new URL(request.url);
  const menuIdParam = url.searchParams.get("id");
  const menuId = menuIdParam ? Number(menuIdParam) : null;

  let menu = menuId
    ? await prisma.menu.findFirst({ where: { id: menuId, shop } })
    : null;

  if (!menu) {
    const created = await prisma.menu.create({
      data: {
        shop,
        name: "Mega menu",
        status: "draft",
        items: buildDefaultMenuItems(),
        settings: DEFAULT_BUILDER_SETTINGS,
      },
    });
    menu = await prisma.menu.update({
      where: { id: created.id },
      data: { name: `Mega menu #${created.id}` },
    });
  }

  let collections: Array<{ id: string; title: string; handle: string }> = [];
  let products: ProductSummary[] = [];

  try {
    const response = await admin.graphql(
      `query MenuItemPicker($collectionsFirst: Int!, $productsFirst: Int!) {
        collections(first: $collectionsFirst, sortKey: TITLE) {
          nodes {
            id
            title
            handle
          }
        }
        products(first: $productsFirst, sortKey: TITLE) {
          nodes {
            id
            title
            handle
            featuredImage {
              url
              altText
            }
            priceRange {
              minVariantPrice {
                amount
                currencyCode
              }
            }
          }
        }
      }`,
      {
        variables: {
          collectionsFirst: 20,
          productsFirst: 20,
        },
      }
    );
    const data = await response.json();
    if (data?.errors?.length) {
      console.error("Collections/products query errors", data.errors);
    }
    collections = data?.data?.collections?.nodes ?? [];
    products = data?.data?.products?.nodes ?? [];
  } catch (error) {
    console.error("Failed to fetch collections/products", error);
    collections = [];
    products = [];
  }

  return json({
    menu: {
      id: menu.id,
      name: menu.name,
      status: menu.status,
    },
    menuItems: menu.items as MenuItem[],
    menuSettings: (menu.settings as BuilderSettings | null) ?? DEFAULT_BUILDER_SETTINGS,
    collections,
    products,
  });
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const shop = session.shop;
  const formData = await request.formData();
  const intent = formData.get("intent");

  if (intent === "contact-submit") {
    const menuIdValue = Number(formData.get("menuId"));
    const menuId = Number.isFinite(menuIdValue) && menuIdValue > 0 ? menuIdValue : null;
    const menuItemId =
      typeof formData.get("menuItemId") === "string" ? String(formData.get("menuItemId")) : null;
    const name = typeof formData.get("name") === "string" ? formData.get("name").trim() : null;
    const email = typeof formData.get("email") === "string" ? formData.get("email").trim() : null;
    const phone = typeof formData.get("phone") === "string" ? formData.get("phone").trim() : null;
    const message =
      typeof formData.get("message") === "string" ? formData.get("message").trim() : null;

    const submission = await prisma.contactSubmission.create({
      data: {
        shop,
        menuId,
        menuItemId,
        name: name || null,
        email: email || null,
        phone: phone || null,
        message: message || null,
      },
    });

    let menuName: string | null = null;
    if (menuId) {
      const menu = await prisma.menu.findFirst({
        where: { id: menuId, shop },
        select: { name: true },
      });
      menuName = menu?.name ?? null;
    }

    try {
      await sendContactEmail({
        shop,
        menuId,
        menuName,
        menuItemId,
        name,
        email,
        phone,
        message,
      });
    } catch (error) {
      console.error("Failed to send contact email", error);
    }

    return json({ ok: true, menuItemId: submission.menuItemId ?? null });
  }

  if (intent !== "save") {
    return json({ ok: false, error: "Unknown intent" }, { status: 400 });
  }

  const menuId = Number(formData.get("menuId"));
  const itemsRaw = formData.get("items");
  const status = String(formData.get("status") || "draft");
  const settingsRaw = formData.get("settings");

  if (!menuId || typeof itemsRaw !== "string") {
    return json({ ok: false, error: "Missing data" }, { status: 400 });
  }

  let items: MenuItem[];
  let settings: BuilderSettings | null = null;
  try {
    items = JSON.parse(itemsRaw) as MenuItem[];
    if (typeof settingsRaw === "string") {
      settings = JSON.parse(settingsRaw) as BuilderSettings;
    }
  } catch {
    return json({ ok: false, error: "Invalid items payload" }, { status: 400 });
  }

  const existing = await prisma.menu.findFirst({ where: { id: menuId, shop } });
  if (!existing) {
    return json({ ok: false, error: "Menu not found" }, { status: 404 });
  }

  await prisma.$transaction(async (tx) => {
    if (status === "active") {
      await tx.menu.updateMany({
        where: {
          shop,
          status: "active",
          id: { not: menuId },
        },
        data: { status: "draft" },
      });
    }

    await tx.menu.update({
      where: { id: menuId },
      data: {
        items,
        status,
      },
    });

    if (settings) {
      await tx.$executeRaw`
        UPDATE Menu
        SET settings = ${JSON.stringify(settings)}
        WHERE id = ${menuId} AND shop = ${shop}
      `;
    }
  });

  return json({ ok: true });
};

type MenuItem = {
  id: string;
  label: string;
  url: string;
  role: "menu" | "group" | "item";
  expanded?: boolean;
  children?: MenuItem[];
  description?: string;
  icon?: string;
  openInNewTab?: boolean;
  hideOnDesktop?: boolean;
  hideOnMobile?: boolean;
  hideWhenLoggedIn?: boolean;
  showWhenLoggedOut?: boolean;
  schedulePublish?: boolean;
  extraClassName?: string;
  badgeEnabled?: boolean;
  badgeText?: string;
  customTextColor?: string;
  customBackgroundColor?: string;
  customTextHoverColor?: string;
  customBackgroundHoverColor?: string;
  blockTemplate?: BlockTemplateId;
  submenuTemplate?: SubmenuTemplateId;
  submenuType?: "mega" | "dropdown";
  submenuWidth?: "full" | "content";
  submenuContentAlign?: "left" | "center" | "right";
  submenuBackgroundColor?: string;
  submenuBackgroundImage?: string;
  imageUrl?: string;
  imageWidth?: number;
  imageNoFill?: boolean;
  imageTextAlign?: "left" | "center" | "right";
  contactTitle?: string;
  contactDescription?: string;
  contactNameLabel?: string;
  contactEmailLabel?: string;
  contactPhoneLabel?: string;
  contactMessageLabel?: string;
  contactSubmitLabel?: string;
  contactSuccessMessage?: string;
  productIds?: string[];
  productLayout?: "image-top" | "image-left";
  productWidth?: number;
  linkColumns?: number;
  linkWidth?: number;
  linkTextAlign?: "left" | "center" | "right";
  isHeading?: boolean;
};

type SubmenuTemplateId = "custom" | "tabs" | "mega" | "dropdown";
type BlockTemplateId =
  | "space"
  | "multi"
  | "tabs"
  | "image"
  | "image2"
  | "links"
  | "product"
  | "product-horizontal"
  | "collection"
  | "blogs"
  | "contact"
  | "html";

type ProductSummary = {
  id: string;
  title: string;
  handle: string;
  featuredImage?: { url: string; altText?: string | null } | null;
  priceRange?: {
    minVariantPrice: { amount: string; currencyCode: string };
  } | null;
};

type AddableItem = {
  id: string;
  label: string;
  url: string;
};

type CustomAddItem = {
  id: string;
  title: string;
  url: string;
  description: string;
  icon?: string;
};

type IconPickerState = {
  itemId: string;
  mode: "library" | "upload";
  target: "custom" | "edit";
};

type RailPanel = "menu" | "settings" | "typography" | "colors" | "code";

type ThemeSettings = {
  fontFamily: string;
  menuBackground: string;
  menuText: string;
  menuActive: string;
  dropdownBackground: string;
  dropdownText: string;
  dropdownHeading: string;
  canvasBackground: string;
  menuItemSpacing: number;
};

type BuilderSettings = {
  animationDesktopTrigger: "hover" | "click";
  animationMobileTrigger: "toggle" | "tap";
  animationEffect: "fade" | "slide" | "scale";
  animationDuration: number;
  animationDelay: number;
  spacingMainPadding: number;
  spacingMainRowHeight: number;
  spacingDropdownRowHeight: number;
  spacingTabRowHeight: number;
  spacingLinkListRowHeight: number;
  carouselAutoPlay: boolean;
  carouselLoop: boolean;
  advancedMobileBreakpoint: number;
  advancedHideLinkListSubmenu: boolean;
  advancedShowAddToCart: boolean;
  advancedEnableLazyLoading: boolean;
  elementsShowSearch: boolean;
  elementsShowDesktopDivider: boolean;
  elementsShowMobileDivider: boolean;
  elementsShowIndicators: boolean;
  layoutLocation: "auto" | "replaceNavigation" | "cssSelector";
  layoutOrientation: "horizontal" | "vertical";
  layoutAlignment: "left" | "right" | "center";
  layoutMaxWidth: string;
  accountShowLogin: boolean;
  accountShowRegister: boolean;
  accountShowAccount: boolean;
  accountShowLogout: boolean;
  submenuShowBorder: boolean;
  submenuEnableDesktopScroll: boolean;
  submenuEnableMobileScroll: boolean;
  submenuMaxWidth: string;
  submenuMobileStyle: "collapse" | "drawer";
  typographyMainUseCustom: boolean;
  typographyMainFont: string;
  typographyMainWeight: number;
  typographyMainSize: number;
  typographySubheadingUseCustom: boolean;
  typographySubheadingFont: string;
  typographySubheadingWeight: number;
  typographySubheadingSize: number;
  typographySubtextUseCustom: boolean;
  typographySubtextFont: string;
  typographySubtextWeight: number;
  typographySubtextSize: number;
  typographyDescriptionUseCustom: boolean;
  typographyDescriptionFont: string;
  typographyDescriptionWeight: number;
  typographyDescriptionSize: number;
  typographyTabUseCustom: boolean;
  typographyTabFont: string;
  typographyTabWeight: number;
  typographyTabSize: number;
  colorMainBackground: string;
  colorMainBackgroundHover: string;
  colorMainDivider: string;
  colorMainText: string;
  colorMainTextHover: string;
  colorTabHeading: string;
  colorTabHeadingActive: string;
  colorTabBackgroundActive: string;
  colorSubmenuBackground: string;
  colorSubmenuBorder: string;
  colorSubmenuHeading: string;
  colorSubmenuText: string;
  colorSubmenuTextHover: string;
  colorSubmenuDescription: string;
  colorSubmenuDescriptionHover: string;
  colorBadgeSaleText: string;
  colorBadgeSaleBackground: string;
  colorBadgeSoldOutText: string;
  colorBadgeSoldOutBackground: string;
  colorButtonText: string;
  colorButtonBackground: string;
  colorButtonBackgroundHover: string;
  colorButtonTextHover: string;
  customCss: string;
  imageLibrary: string[];
};

type FontPickerState = {
  id: string;
  fontKey: keyof BuilderSettings;
  weightKey: keyof BuilderSettings;
};

const DEFAULT_BUILDER_SETTINGS: BuilderSettings = {
  animationDesktopTrigger: "hover",
  animationMobileTrigger: "toggle",
  animationEffect: "fade",
  animationDuration: 300,
  animationDelay: 150,
  spacingMainPadding: 20,
  spacingMainRowHeight: 50,
  spacingDropdownRowHeight: 50,
  spacingTabRowHeight: 50,
  spacingLinkListRowHeight: 30,
  carouselAutoPlay: true,
  carouselLoop: true,
  advancedMobileBreakpoint: 768,
  advancedHideLinkListSubmenu: false,
  advancedShowAddToCart: false,
  advancedEnableLazyLoading: true,
  elementsShowSearch: true,
  elementsShowDesktopDivider: true,
  elementsShowMobileDivider: true,
  elementsShowIndicators: true,
  layoutLocation: "auto",
  layoutOrientation: "horizontal",
  layoutAlignment: "left",
  layoutMaxWidth: "",
  accountShowLogin: false,
  accountShowRegister: false,
  accountShowAccount: false,
  accountShowLogout: false,
  submenuShowBorder: true,
  submenuEnableDesktopScroll: true,
  submenuEnableMobileScroll: true,
  submenuMaxWidth: "",
  submenuMobileStyle: "collapse",
  typographyMainUseCustom: false,
  typographyMainFont: "Work Sans, system-ui, sans-serif",
  typographyMainWeight: 500,
  typographyMainSize: 14,
  typographySubheadingUseCustom: false,
  typographySubheadingFont: "Work Sans, system-ui, sans-serif",
  typographySubheadingWeight: 600,
  typographySubheadingSize: 14,
  typographySubtextUseCustom: false,
  typographySubtextFont: "Work Sans, system-ui, sans-serif",
  typographySubtextWeight: 400,
  typographySubtextSize: 13,
  typographyDescriptionUseCustom: false,
  typographyDescriptionFont: "Work Sans, system-ui, sans-serif",
  typographyDescriptionWeight: 400,
  typographyDescriptionSize: 12,
  typographyTabUseCustom: false,
  typographyTabFont: "Work Sans, system-ui, sans-serif",
  typographyTabWeight: 500,
  typographyTabSize: 14,
  colorMainBackground: "#000000",
  colorMainBackgroundHover: "#1D1D1D",
  colorMainDivider: "#0F0F0F",
  colorMainText: "#FFFFFF",
  colorMainTextHover: "#F6F1F1",
  colorTabHeading: "#202020",
  colorTabHeadingActive: "#000000",
  colorTabBackgroundActive: "#D9D9D9",
  colorSubmenuBackground: "#FFFFFF",
  colorSubmenuBorder: "#D1D1D1",
  colorSubmenuHeading: "#AE2828",
  colorSubmenuText: "#313131",
  colorSubmenuTextHover: "#000000",
  colorSubmenuDescription: "#969696",
  colorSubmenuDescriptionHover: "#4D5BCD",
  colorBadgeSaleText: "#FFFFFF",
  colorBadgeSaleBackground: "#EC523E",
  colorBadgeSoldOutText: "#757575",
  colorBadgeSoldOutBackground: "#D5D5D5",
  colorButtonText: "#FFFFFF",
  colorButtonBackground: "#1F1F1F",
  colorButtonBackgroundHover: "#000000",
  colorButtonTextHover: "#FFFFFF",
  customCss: "",
  imageLibrary: [],
};

const FONT_OPTIONS = [
  { label: "Work Sans", value: "Work Sans, system-ui, sans-serif" },
  { label: "Shopify Sans", value: "Shopify Sans, Inter, system-ui, sans-serif" },
  { label: "Inter", value: "Inter, system-ui, sans-serif" },
  { label: "Helvetica", value: "Helvetica, Arial, sans-serif" },
  { label: "Arial", value: "Arial, sans-serif" },
  { label: "Georgia", value: "Georgia, serif" },
  { label: "Times New Roman", value: "\"Times New Roman\", serif" },
  { label: "Roboto", value: "Roboto, system-ui, sans-serif" },
  { label: "Open Sans", value: "\"Open Sans\", system-ui, sans-serif" },
  { label: "Lato", value: "Lato, system-ui, sans-serif" },
  { label: "Montserrat", value: "Montserrat, system-ui, sans-serif" },
  { label: "Poppins", value: "Poppins, system-ui, sans-serif" },
  { label: "Nunito", value: "Nunito, system-ui, sans-serif" },
  { label: "Source Sans 3", value: "\"Source Sans 3\", system-ui, sans-serif" },
  { label: "Raleway", value: "Raleway, system-ui, sans-serif" },
  { label: "Merriweather", value: "Merriweather, serif" },
  { label: "Playfair Display", value: "\"Playfair Display\", serif" },
  { label: "PT Sans", value: "\"PT Sans\", system-ui, sans-serif" },
  { label: "Fira Sans", value: "\"Fira Sans\", system-ui, sans-serif" },
  { label: "Noto Sans", value: "\"Noto Sans\", system-ui, sans-serif" },
  { label: "Noto Serif", value: "\"Noto Serif\", serif" },
  { label: "IBM Plex Sans", value: "\"IBM Plex Sans\", system-ui, sans-serif" },
  { label: "Ubuntu", value: "Ubuntu, system-ui, sans-serif" },
  { label: "Rubik", value: "Rubik, system-ui, sans-serif" },
  { label: "Cabin", value: "Cabin, system-ui, sans-serif" },
  { label: "Manrope", value: "Manrope, system-ui, sans-serif" },
  { label: "DM Sans", value: "\"DM Sans\", system-ui, sans-serif" },
  { label: "Space Grotesk", value: "\"Space Grotesk\", system-ui, sans-serif" },
  { label: "Quicksand", value: "Quicksand, system-ui, sans-serif" },
  { label: "Inconsolata", value: "Inconsolata, monospace" },
  { label: "JetBrains Mono", value: "\"JetBrains Mono\", monospace" },
];

const buildId = () => Math.random().toString(36).slice(2, 9);

type RgbColor = {
  red: number;
  green: number;
  blue: number;
};

type HsbColor = {
  hue: number;
  saturation: number;
  brightness: number;
  alpha?: number;
};

const clampNumber = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

const hexToRgb = (value: string): RgbColor => {
  const cleaned = value.replace("#", "").trim();
  const normalized =
    cleaned.length === 3
      ? cleaned
          .split("")
          .map((char) => char + char)
          .join("")
      : cleaned;
  if (normalized.length !== 6) {
    return { red: 0, green: 0, blue: 0 };
  }
  const intValue = Number.parseInt(normalized, 16);
  if (Number.isNaN(intValue)) {
    return { red: 0, green: 0, blue: 0 };
  }
  return {
    red: (intValue >> 16) & 255,
    green: (intValue >> 8) & 255,
    blue: intValue & 255,
  };
};

const rgbToHex = ({ red, green, blue }: RgbColor) => {
  const toHex = (channel: number) =>
    clampNumber(Math.round(channel), 0, 255).toString(16).padStart(2, "0").toUpperCase();
  return `#${toHex(red)}${toHex(green)}${toHex(blue)}`;
};

const rgbToHsb = ({ red, green, blue }: RgbColor): HsbColor => {
  const r = red / 255;
  const g = green / 255;
  const b = blue / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;

  let hue = 0;
  if (delta !== 0) {
    if (max === r) {
      hue = ((g - b) / delta) % 6;
    } else if (max === g) {
      hue = (b - r) / delta + 2;
    } else {
      hue = (r - g) / delta + 4;
    }
    hue *= 60;
    if (hue < 0) hue += 360;
  }

  const saturation = max === 0 ? 0 : delta / max;
  const brightness = max;

  return {
    hue,
    saturation,
    brightness,
    alpha: 1,
  };
};

const hsbToRgb = ({ hue, saturation, brightness }: HsbColor): RgbColor => {
  const h = clampNumber(hue, 0, 360);
  const normalizedS =
    saturation > 1 ? clampNumber(saturation, 0, 100) / 100 : clampNumber(saturation, 0, 1);
  const normalizedV =
    brightness > 1 ? clampNumber(brightness, 0, 100) / 100 : clampNumber(brightness, 0, 1);
  const s = normalizedS;
  const v = normalizedV;
  const c = v * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = v - c;
  let r = 0;
  let g = 0;
  let b = 0;

  if (h >= 0 && h < 60) {
    r = c;
    g = x;
  } else if (h >= 60 && h < 120) {
    r = x;
    g = c;
  } else if (h >= 120 && h < 180) {
    g = c;
    b = x;
  } else if (h >= 180 && h < 240) {
    g = x;
    b = c;
  } else if (h >= 240 && h < 300) {
    r = x;
    b = c;
  } else {
    r = c;
    b = x;
  }

  return {
    red: Math.round((r + m) * 255),
    green: Math.round((g + m) * 255),
    blue: Math.round((b + m) * 255),
  };
};

const hexToHsb = (value: string) => rgbToHsb(hexToRgb(value));

const hsbToHex = (color: HsbColor) => rgbToHex(hsbToRgb(color));

const normalizeHexInput = (value: string) => {
  const cleaned = value.replace(/[^0-9a-fA-F]/g, "").slice(0, 6);
  return `#${cleaned.toUpperCase()}`;
};

const findItemPath = (items: MenuItem[], id: string | null, path: MenuItem[] = []): MenuItem[] | null => {
  if (!id) return null;
  for (const item of items) {
    const nextPath = [...path, item];
    if (item.id === id) return nextPath;
    if (item.children?.length) {
      const found = findItemPath(item.children, id, nextPath);
      if (found) return found;
    }
  }
  return null;
};

const updateItemById = (
  items: MenuItem[],
  id: string,
  updater: (item: MenuItem) => MenuItem
): MenuItem[] =>
  items.map((item) => {
    if (item.id === id) return updater(item);
    if (item.children?.length) {
      const nextChildren = updateItemById(item.children, id, updater);
      if (nextChildren !== item.children) {
        return { ...item, children: nextChildren };
      }
    }
    return item;
  });

const addChildById = (items: MenuItem[], parentId: string, newItem: MenuItem): MenuItem[] =>
  items.map((item) => {
    if (item.id === parentId) {
      const nextChildren = item.children ? [...item.children, newItem] : [newItem];
      return { ...item, expanded: true, children: nextChildren };
    }
    if (item.children?.length) {
      return { ...item, children: addChildById(item.children, parentId, newItem) };
    }
    return item;
  });

const buildCopyLabel = (label: string) => (label.trim().endsWith("Copy") ? `${label} 2` : `${label} Copy`);

const cloneMenuItem = (item: MenuItem): MenuItem => ({
  ...item,
  id: buildId(),
  label: buildCopyLabel(item.label),
  children: item.children?.map(cloneMenuItem),
});

const duplicateItemById = (
  items: MenuItem[],
  id: string
): { items: MenuItem[]; duplicatedId: string | null } => {
  const index = items.findIndex((entry) => entry.id === id);
  if (index >= 0) {
    const copy = cloneMenuItem(items[index]);
    const next = [...items];
    next.splice(index + 1, 0, copy);
    return { items: next, duplicatedId: copy.id };
  }

  let duplicatedId: string | null = null;
  const next = items.map((item) => {
    if (!item.children?.length) return item;
    const result = duplicateItemById(item.children, id);
    if (result.items !== item.children) {
      duplicatedId = result.duplicatedId;
      return { ...item, children: result.items };
    }
    return item;
  });

  return duplicatedId ? { items: next, duplicatedId } : { items, duplicatedId: null };
};

const removeItemById = (items: MenuItem[], id: string): MenuItem[] => {
  let changed = false;
  const next = items.reduce<MenuItem[]>((acc, item) => {
    if (item.id === id) {
      changed = true;
      return acc;
    }
    let nextItem = item;
    if (item.children?.length) {
      const nextChildren = removeItemById(item.children, id);
      if (nextChildren !== item.children) {
        changed = true;
        nextItem = { ...item, children: nextChildren };
      }
    }
    acc.push(nextItem);
    return acc;
  }, []);

  return changed ? next : items;
};

export default function MenuBuilder() {
  const { menu, menuItems: initialMenuItems, menuSettings, collections, products } =
    useLoaderData<typeof loader>();
  const appData = useRouteLoaderData<typeof appLoader>("routes/app");
  const apiKey = appData?.apiKey ?? "";
  const navigate = useNavigate();
  const location = useLocation();
  const saveFetcher = useFetcher<typeof action>();
  const contactFetcher = useFetcher<typeof action>();
  const [activePanel, setActivePanel] = useState<RailPanel>("menu");
  const [menuView, setMenuView] = useState<"list" | "edit" | "add-root">("list");
  const [menuStatus, setMenuStatus] = useState<"active" | "draft">(
    menu.status === "active" ? "active" : "draft"
  );
  const menuEnabled = menuStatus === "active";
  const [previewMode, setPreviewMode] = useState<"desktop" | "mobile">("desktop");
  const [selectedItemId, setSelectedItemId] = useState<string | null>(
    initialMenuItems[0]?.id ?? null
  );
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [hoveredMenuId, setHoveredMenuId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<MenuItem | null>(null);
  const hoverClearTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [draggedItemId, setDraggedItemId] = useState<string | null>(null);
  const [draggedParentId, setDraggedParentId] = useState<string | null>(null);
  const itemRowRefs = useRef(new Map<string, HTMLDivElement>());
  const prevPositionsRef = useRef(new Map<string, DOMRect>());
  const lastDragOverIdRef = useRef<string | null>(null);
  const prevMenuIdRef = useRef(menu.id);
  const linkPickerContainerRef = useRef<HTMLDivElement | null>(null);
  const customItemsScrollRef = useRef<HTMLDivElement | null>(null);
  const linkPickerAnchorRefs = useRef<Map<string, HTMLDivElement | null>>(new Map());
  const linkPickerDropdownRef = useRef<HTMLDivElement | null>(null);
  const appBridgeRef = useRef<ReturnType<typeof createApp> | null>(null);
  const fullscreenExitRequestedRef = useRef(false);
  const fullscreenExitArmedRef = useRef(false);
  const fullscreenExitArmTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fullscreenExitNavigateTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
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

  const [menuItems, setMenuItems] = useState<MenuItem[]>(initialMenuItems);
  const [builderSettings, setBuilderSettings] = useState<BuilderSettings>({
    ...DEFAULT_BUILDER_SETTINGS,
    ...menuSettings,
  });
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
  const [submenuImagePickerOpen, setSubmenuImagePickerOpen] = useState(false);
  const [imagePickerOpen, setImagePickerOpen] = useState(false);
  const [imagePickerSelection, setImagePickerSelection] = useState<string | null>(null);
  const [productPickerOpen, setProductPickerOpen] = useState(false);
  const [productPickerSearch, setProductPickerSearch] = useState("");
  const [productPickerSelection, setProductPickerSelection] = useState<Record<string, boolean>>({});
  const [submenuColorPickerOpen, setSubmenuColorPickerOpen] = useState(false);
  const [submenuColorPickerHsb, setSubmenuColorPickerHsb] = useState<HsbColor | null>(null);
  const [submenuTemplateTargetId, setSubmenuTemplateTargetId] = useState<string | null>(null);
  const [submenuTemplateHoverId, setSubmenuTemplateHoverId] = useState<SubmenuTemplateId | null>(null);
  const [submenuTemplatePanelHover, setSubmenuTemplatePanelHover] = useState(false);
  const submenuTemplateHoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [blockTemplateTargetId, setBlockTemplateTargetId] = useState<string | null>(null);
  const [blockTemplateHoverId, setBlockTemplateHoverId] = useState<BlockTemplateId | null>(null);
  const [blockTemplatePanelHover, setBlockTemplatePanelHover] = useState(false);
  const blockTemplateHoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [pendingDeleteItemId, setPendingDeleteItemId] = useState<string | null>(null);
  const [pendingDeleteItemLabel, setPendingDeleteItemLabel] = useState<string>("");
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
  const [linkPickerRect, setLinkPickerRect] = useState<{ left: number; top: number; width: number } | null>(null);
  const [savedFingerprint, setSavedFingerprint] = useState(() =>
    JSON.stringify({
      status: menu.status,
      items: initialMenuItems,
      settings: { ...DEFAULT_BUILDER_SETTINGS, ...menuSettings },
    })
  );
  const lastSaveIntentRef = useRef<"save" | "publish" | "enable">("save");

  const selectedPath = useMemo(() => findItemPath(menuItems, selectedItemId), [menuItems, selectedItemId]);
  const selectedItem = selectedPath?.[selectedPath.length - 1] ?? null;
  const activeMenu = selectedPath?.[0] ?? null;
  const currentImageUrl = editDraft?.imageUrl ?? selectedItem?.imageUrl ?? null;
  const previewMenu = useMemo(
    () => (openMenuId ? menuItems.find((item) => item.id === openMenuId) ?? null : null),
    [menuItems, openMenuId]
  );

  useEffect(() => {
    if (menuView !== "edit") {
      setEditDraft(null);
      setProductPickerOpen(false);
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

  const openLinkPicker = (itemId: string) => {
    if (linkPickerOpenId === itemId) return;
    const scrollTop = customItemsScrollRef.current?.scrollTop ?? null;
    setLinkPickerOpenId(itemId);
    if (scrollTop !== null) {
      requestAnimationFrame(() => {
        if (customItemsScrollRef.current) {
          customItemsScrollRef.current.scrollTop = scrollTop;
        }
      });
    }
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

  const openProductPicker = () => {
    const activeIds = editDraft?.productIds ?? selectedItem?.productIds ?? [];
    const selection = activeIds.reduce<Record<string, boolean>>((acc, id) => {
      acc[id] = true;
      return acc;
    }, {});
    setProductPickerSelection(selection);
    setProductPickerSearch("");
    setProductPickerOpen(true);
  };

  const toggleProductSelection = (id: string) => {
    setProductPickerSelection((prev) => {
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
    updateEditDraft("productIds", selectedIds);
    setProductPickerOpen(false);
  };

  const renderSubmenuImagePickerPanel = () => {
    if (!submenuImagePickerOpen) return null;
    return (
      <div className="flex h-full flex-col border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-200 px-4 py-3">
          <InlineStack gap="200" blockAlign="center">
            <Button
              variant="tertiary"
              icon={ArrowLeftIcon}
              onClick={() => setSubmenuImagePickerOpen(false)}
              accessibilityLabel="Back"
            />
            <Text as="h2" variant="headingSm">
              Images
            </Text>
          </InlineStack>
        </div>
        <div className="flex-1 min-h-0 overflow-y-auto px-4 py-4">
          <label
            className="flex h-40 cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-gray-300 bg-gray-50 text-center"
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => {
              event.preventDefault();
              handleSubmenuBackgroundUpload(event.dataTransfer.files?.[0]);
              setSubmenuImagePickerOpen(false);
            }}
          >
            <Button
              variant="tertiary"
              onClick={(event) => {
                event.preventDefault();
                const input = event.currentTarget
                  .closest("label")
                  ?.querySelector("input[type=file]") as HTMLInputElement | null;
                input?.click();
              }}
            >
              Add image
            </Button>
            <Text as="p" variant="bodySm" tone="subdued">
              Drag and drop your image
            </Text>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(event) => {
                handleSubmenuBackgroundUpload(event.target.files?.[0] ?? null);
                setSubmenuImagePickerOpen(false);
              }}
            />
          </label>
        </div>
      </div>
    );
  };

  const renderProductPickerPanel = () => {
    if (!productPickerOpen) return null;
    const searchValue = productPickerSearch.trim().toLowerCase();
    const filteredProducts = searchValue
      ? products.filter((product) => product.title.toLowerCase().includes(searchValue))
      : products;
    return (
      <div className="flex h-full flex-col border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-200 px-4 py-3">
          <InlineStack gap="200" blockAlign="center">
            <Button
              variant="tertiary"
              icon={ArrowLeftIcon}
              onClick={() => setProductPickerOpen(false)}
              accessibilityLabel="Back"
            />
            <Text as="h2" variant="headingSm">
              Select products
            </Text>
          </InlineStack>
        </div>
        <div className="flex-1 min-h-0 overflow-y-auto px-4 py-4">
          <BlockStack gap="300">
            <TextField
              label="Search"
              labelHidden
              value={productPickerSearch}
              onChange={setProductPickerSearch}
              placeholder="Search"
              autoComplete="off"
              prefix={<Icon source={SearchIcon} tone="subdued" />}
            />
            <BlockStack gap="200">
              {filteredProducts.length ? (
                filteredProducts.map((product) => {
                  const isSelected = Boolean(productPickerSelection[product.id]);
                  return (
                    <label
                      key={product.id}
                      className={`flex items-center gap-3 rounded-lg border px-3 py-2 text-sm transition-colors ${
                        isSelected
                          ? "border-blue-600 bg-blue-50 text-blue-700"
                          : "border-gray-200 text-gray-700 hover:border-gray-300"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleProductSelection(product.id)}
                        className="h-4 w-4"
                      />
                      <div className="h-10 w-10 overflow-hidden rounded-md border border-gray-200 bg-white">
                        <img
                          src={product.featuredImage?.url ?? "/product.png"}
                          alt={product.featuredImage?.altText ?? product.title}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <span className="flex-1">{product.title}</span>
                    </label>
                  );
                })
              ) : (
                <Text as="p" variant="bodySm" tone="subdued">
                  No products found.
                </Text>
              )}
            </BlockStack>
          </BlockStack>
        </div>
        <div className="border-t border-gray-200 bg-white px-4 py-3">
          <InlineStack align="end" gap="200">
            <Button variant="tertiary" onClick={() => setProductPickerOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={applyProductSelection}>
              Apply
            </Button>
          </InlineStack>
        </div>
      </div>
    );
  };

  const renderImagePickerPanel = () => {
    if (!imagePickerOpen) return null;
    const imageLibrary = builderSettings.imageLibrary ?? [];
    const hasSelection = Boolean(imagePickerSelection);
    return (
      <div className="flex h-full flex-col border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-200 px-4 py-3">
          <InlineStack gap="200" blockAlign="center">
            <Button
              variant="tertiary"
              icon={ArrowLeftIcon}
              onClick={() => setImagePickerOpen(false)}
              accessibilityLabel="Back"
            />
            <Text as="h2" variant="headingSm">
              Images
            </Text>
          </InlineStack>
        </div>
        <div className="flex-1 min-h-0 overflow-y-auto px-4 py-4">
          <label
            className="flex h-40 cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-gray-300 bg-gray-50 text-center"
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => {
              event.preventDefault();
              handleImageUpload(event.dataTransfer.files?.[0]);
            }}
          >
            <Button
              variant="tertiary"
              onClick={(event) => {
                event.preventDefault();
                const input = event.currentTarget
                  .closest("label")
                  ?.querySelector("input[type=file]") as HTMLInputElement | null;
                input?.click();
              }}
            >
              Add image
            </Button>
            <Text as="p" variant="bodySm" tone="subdued">
              Drag and drop your image
            </Text>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(event) => {
                handleImageUpload(event.target.files?.[0] ?? null);
              }}
            />
          </label>
          {imageLibrary.length === 0 ? (
            <Text as="p" variant="bodySm" tone="subdued" alignment="center" className="mt-4">
              No images uploaded yet.
            </Text>
          ) : (
            <div className="mt-4 grid grid-cols-2 gap-3">
              {imageLibrary.map((image) => {
                const isSelected = imagePickerSelection === image;
                return (
                  <button
                    key={image}
                    type="button"
                    onClick={() => setImagePickerSelection(image)}
                    className={`relative overflow-hidden rounded-lg border p-2 text-left transition ${
                      isSelected ? "border-gray-300 bg-gray-50" : "border-gray-200"
                    }`}
                  >
                    <span
                      className={`absolute left-2 top-2 flex h-5 w-5 items-center justify-center rounded border text-xs font-semibold ${
                        isSelected ? "border-gray-900 bg-gray-900 text-white" : "border-gray-300 bg-white text-transparent"
                      }`}
                      aria-hidden="true"
                    >
                      ✓
                    </span>
                    <img
                      src={image}
                      alt=""
                      className="aspect-square w-full rounded-md border border-gray-100 object-cover"
                    />
                  </button>
                );
              })}
            </div>
          )}
        </div>
        <div className="mt-auto border-t border-gray-200 bg-white px-4 py-3">
          <InlineStack gap="200" align="end">
            <Button
              variant="tertiary"
              disabled={!hasSelection}
              onClick={() => {
                if (!imagePickerSelection) return;
                const nextSelection = imagePickerSelection;
                setBuilderSettings((prev) => ({
                  ...prev,
                  imageLibrary: (prev.imageLibrary ?? []).filter((image) => image !== nextSelection),
                }));
                if (currentImageUrl === nextSelection) {
                  updateEditDraft("imageUrl", "");
                }
                setImagePickerSelection(null);
              }}
            >
              Delete
            </Button>
            <Button
              variant="primary"
              disabled={!hasSelection}
              onClick={() => {
                if (!imagePickerSelection) return;
                updateEditDraft("imageUrl", imagePickerSelection);
                setImagePickerOpen(false);
              }}
            >
              Select
            </Button>
          </InlineStack>
        </div>
      </div>
    );
  };

  const clearSubmenuTemplateHoverTimeout = () => {
    if (!submenuTemplateHoverTimeoutRef.current) return;
    clearTimeout(submenuTemplateHoverTimeoutRef.current);
    submenuTemplateHoverTimeoutRef.current = null;
  };

  const scheduleSubmenuTemplateHoverClear = () => {
    clearSubmenuTemplateHoverTimeout();
    submenuTemplateHoverTimeoutRef.current = setTimeout(() => {
      if (!submenuTemplatePanelHover) {
        setSubmenuTemplateHoverId(null);
      }
    }, 80);
  };

  const clearBlockTemplateHoverTimeout = () => {
    if (!blockTemplateHoverTimeoutRef.current) return;
    clearTimeout(blockTemplateHoverTimeoutRef.current);
    blockTemplateHoverTimeoutRef.current = null;
  };

  const scheduleBlockTemplateHoverClear = () => {
    clearBlockTemplateHoverTimeout();
    blockTemplateHoverTimeoutRef.current = setTimeout(() => {
      if (!blockTemplatePanelHover) {
        setBlockTemplateHoverId(null);
      }
    }, 80);
  };

  const renderTemplatePreviewCard = ({
    title,
    preview,
    onSelect,
    showSelectButton = true,
    titleHiddenOnHover = false,
    showTitle = true,
    previewHeightClassName = "h-36",
    previewContainerClassName,
  }: {
    title: string;
    preview: ReactNode;
    onSelect: () => void;
    showSelectButton?: boolean;
    titleHiddenOnHover?: boolean;
    showTitle?: boolean;
    previewHeightClassName?: string;
    previewContainerClassName?: string;
  }) => (
    <div className="group relative transition-transform duration-150 ease-out">
      <Card padding="300">
        <BlockStack gap="300">
          <div
            className={
              previewContainerClassName ?? "relative rounded-xl bg-gray-100 p-3"
            }
          >
            <div className={`${previewHeightClassName} w-full`}>{preview}</div>
            {showSelectButton ? (
              <div className="pointer-events-none absolute inset-x-4 bottom-3 opacity-0 transition-opacity group-hover:pointer-events-auto group-hover:opacity-100">
                <Button
                  fullWidth
                  onClick={onSelect}
                  size="slim"
                  variant="primary"
                  style={{ backgroundColor: "#111827", borderColor: "#111827", color: "#ffffff" }}
                >
                  Select
                </Button>
              </div>
            ) : null}
          </div>
          {showTitle ? (
            <div
              className={
                titleHiddenOnHover ? "transition-opacity duration-150 group-hover:opacity-0" : undefined
              }
            >
              <Text as="p" variant="bodySm" alignment="center" fontWeight="semibold">
                {title}
              </Text>
            </div>
          ) : null}
        </BlockStack>
      </Card>
    </div>
  );

  const renderBlockTemplatePreviewCard = ({
    title,
    preview,
    onSelect,
    badge,
    showSelectButton = true,
    titleHiddenOnHover = false,
    showTitle = true,
    previewHeightClassName = "h-40",
    previewContainerClassName,
  }: {
    title: string;
    preview: ReactNode;
    onSelect: () => void;
    badge?: string;
    showSelectButton?: boolean;
    titleHiddenOnHover?: boolean;
    showTitle?: boolean;
    previewHeightClassName?: string;
    previewContainerClassName?: string;
  }) => (
    <div className="group relative transition-transform duration-150 ease-out">
      <Card padding="300">
        <BlockStack gap="300">
          <InlineStack align="space-between" blockAlign="center">
            <span />
            {badge ? <Badge tone="warning">{badge}</Badge> : null}
          </InlineStack>
          <div
            className={
              previewContainerClassName ?? "relative rounded-xl bg-gray-100 p-3"
            }
          >
            <div className={`${previewHeightClassName} w-full`}>{preview}</div>
            {showSelectButton ? (
              <div className="pointer-events-none absolute inset-x-4 bottom-3 opacity-0 transition-opacity group-hover:pointer-events-auto group-hover:opacity-100">
                <Button
                  fullWidth
                  onClick={onSelect}
                  size="slim"
                  variant="primary"
                  style={{ backgroundColor: "#111827", borderColor: "#111827", color: "#ffffff" }}
                >
                  Select
                </Button>
              </div>
            ) : null}
          </div>
          {showTitle ? (
            <Text
              as="p"
              variant="bodySm"
              alignment="center"
              fontWeight="semibold"
              className={
                titleHiddenOnHover ? "transition-opacity duration-150 group-hover:opacity-0" : undefined
              }
            >
              {title}
            </Text>
          ) : null}
        </BlockStack>
      </Card>
    </div>
  );

  const renderSubmenuTemplatePreviewPanel = () => {
    const isOpen = Boolean(submenuTemplateTargetId);
    const activeTemplate = SUBMENU_TEMPLATES.find((template) => template.id === submenuTemplateHoverId);
    const showPanel = isOpen && Boolean(activeTemplate || submenuTemplatePanelHover);
    const previewTitle = activeTemplate?.label ?? "Template preview";

    const renderPreviewForTemplate = () => {
      if (!activeTemplate) return null;
      const selectTemplate = () => handleApplySubmenuTemplate(activeTemplate.id);
      switch (activeTemplate.id) {
        case "dropdown":
          return (
            <div className="flex flex-col gap-1">
              {renderTemplatePreviewCard({
                title: "Vertical flyout menu",
                onSelect: selectTemplate,
                preview: (
                  <div className="flex h-28 gap-2 rounded-lg bg-[#a7b2c0] p-2">
                    <div className="flex w-20 flex-col gap-2 rounded-md bg-white/80 p-2">
                      <div className="h-3 rounded bg-gray-400" />
                      <div className="h-3 rounded bg-gray-400" />
                      <div className="h-3 rounded bg-gray-400" />
                    </div>
                    <div className="flex flex-1 items-center justify-center rounded-md bg-white/70">
                      <div className="h-16 w-20 rounded bg-gray-300" />
                    </div>
                  </div>
                ),
              })}
              {renderTemplatePreviewCard({
                title: "Horizontal flyout menu",
                onSelect: selectTemplate,
                preview: (
                  <div className="flex h-28 flex-col gap-2 rounded-lg bg-[#a7b2c0] p-2">
                    <div className="flex items-center justify-between rounded-md bg-white/80 px-3 py-1 text-[10px] text-gray-500">
                      <span className="h-2 w-10 rounded bg-gray-300" />
                      <span className="h-2 w-10 rounded bg-gray-300" />
                      <span className="h-2 w-10 rounded bg-gray-300" />
                    </div>
                    <div className="flex flex-1 items-center justify-center rounded-md bg-white/70">
                      <div className="h-10 w-32 rounded bg-gray-300" />
                    </div>
                  </div>
                ),
              })}
            </div>
          );
        case "tabs":
          return renderTemplatePreviewCard({
            title: "Tabs",
            onSelect: selectTemplate,
            preview: (
              <div className="h-28 rounded-lg bg-[#a7b2c0] p-2">
                <div className="flex gap-2 rounded-md bg-white/80 px-2 py-1">
                  <div className="h-2 w-10 rounded-full bg-gray-400" />
                  <div className="h-2 w-10 rounded-full bg-gray-300" />
                  <div className="h-2 w-10 rounded-full bg-gray-300" />
                </div>
                <div className="mt-3 h-14 rounded-md bg-white/70" />
              </div>
            ),
          });
        case "mega":
          return (
            <BlockStack gap="400">
              {renderTemplatePreviewCard({
                title: "Space",
                onSelect: selectTemplate,
                showSelectButton: false,
                showTitle: false,
                previewHeightClassName: "h-44",
                previewContainerClassName: "bg-transparent p-0",
                preview: (
                  <div className="relative flex h-full w-full items-center justify-center rounded-xl bg-gray-200 p-2 transition-colors group-hover:bg-gray-300">
                    <img
                      src="/Space.png"
                      alt="Space template"
                      className="h-full w-full object-contain"
                    />
                    <div className="pointer-events-none absolute bottom-2 left-1/2 -translate-x-1/2 text-sm font-semibold text-gray-700 transition-opacity group-hover:opacity-0">
                      Space
                    </div>
                    <div className="pointer-events-none absolute inset-x-4 bottom-3 opacity-0 transition-opacity group-hover:pointer-events-auto group-hover:opacity-100">
                      <Button
                        fullWidth
                        onClick={selectTemplate}
                        size="slim"
                        variant="primary"
                        style={{ backgroundColor: "#111827", borderColor: "#111827", color: "#ffffff" }}
                      >
                        Select
                      </Button>
                    </div>
                  </div>
                ),
              })}
            </BlockStack>
          );
        case "custom":
        default:
          return renderTemplatePreviewCard({
            title: "Custom menu",
            onSelect: selectTemplate,
            preview: (
              <div className="h-28 rounded-lg bg-[#a7b2c0] p-2">
                <div className="h-6 rounded-md bg-white/80" />
                <div className="mt-2 h-4 w-2/3 rounded-md bg-white/70" />
                <div className="mt-2 h-4 w-1/2 rounded-md bg-white/70" />
              </div>
            ),
          });
      }
    };

    return (
      <div
        className={`absolute right-80 top-0 z-20 flex h-full w-80 flex-col border-l border-gray-200 bg-white shadow-xl transition-all duration-200 ease-out ${
          showPanel ? "translate-x-0 opacity-100" : "translate-x-full opacity-0 pointer-events-none"
        }`}
        aria-hidden={!showPanel}
        onMouseEnter={() => {
          clearSubmenuTemplateHoverTimeout();
          setSubmenuTemplatePanelHover(true);
        }}
        onMouseLeave={() => {
          setSubmenuTemplatePanelHover(false);
          setSubmenuTemplateHoverId(null);
        }}
      >
        <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
          <Text as="h2" variant="headingSm">
            {previewTitle}
          </Text>
          <button
            type="button"
            aria-label="Close template preview"
            onClick={() => {
              setSubmenuTemplateHoverId(null);
              setSubmenuTemplatePanelHover(false);
            }}
            className="text-xl text-gray-400 hover:text-gray-600"
          >
            ×
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">{renderPreviewForTemplate()}</div>
      </div>
    );
  };

  const renderBlockTemplatePreviewPanel = () => {
    const isOpen = Boolean(blockTemplateTargetId);
    const activeTemplate = BLOCK_TEMPLATES.find((template) => template.id === blockTemplateHoverId);
    const showPanel = isOpen && Boolean(activeTemplate || blockTemplatePanelHover);
    const previewTitle = activeTemplate?.label ?? "Block preview";

    const renderPreviewForTemplate = () => {
      if (!activeTemplate) return null;
      const selectTemplate = () => handleApplyBlockTemplate(activeTemplate.id);
      switch (activeTemplate.id) {
        case "space":
          return renderBlockTemplatePreviewCard({
            title: "Space",
            onSelect: selectTemplate,
            showSelectButton: false,
            showTitle: false,
            previewHeightClassName: "h-44",
            previewContainerClassName: "bg-transparent p-0",
            preview: (
              <div className="relative flex h-full w-full items-center justify-center rounded-xl bg-gray-200 p-2 transition-colors group-hover:bg-gray-300">
                <img
                  src="/Space.png"
                  alt="Space template"
                  className="h-full w-full object-contain"
                />
                <div className="pointer-events-none absolute bottom-2 left-1/2 -translate-x-1/2 text-sm font-semibold text-gray-700 transition-opacity group-hover:opacity-0">
                  Space
                </div>
                <div className="pointer-events-none absolute inset-x-4 bottom-3 opacity-0 transition-opacity group-hover:pointer-events-auto group-hover:opacity-100">
                  <Button
                    fullWidth
                    onClick={selectTemplate}
                    size="slim"
                    variant="primary"
                    style={{ backgroundColor: "#111827", borderColor: "#111827", color: "#ffffff" }}
                  >
                    Select
                  </Button>
                </div>
              </div>
            ),
          });
        case "multi":
          return renderBlockTemplatePreviewCard({
            title: "2 columns",
            onSelect: selectTemplate,
            preview: (
              <div className="h-28 rounded-lg bg-white p-3">
                <div className="text-[11px] font-semibold text-red-600">Brands</div>
                <div className="mt-2 h-px bg-gray-200" />
                <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-[10px] text-gray-700">
                  <span>Nike</span>
                  <span>Adidas</span>
                  <span>ASCII</span>
                  <span>Vans</span>
                  <span>MLB</span>
                  <span>Gucci</span>
                  <span>Mira</span>
                  <span>Puma</span>
                  <span>Reebok</span>
                  <span>Promax</span>
                </div>
              </div>
            ),
          });
        case "tabs":
          return renderBlockTemplatePreviewCard({
            title: "Tabs",
            onSelect: selectTemplate,
            preview: (
              <div className="h-28 rounded-lg bg-[#f3f4f6] p-2">
                <div className="flex gap-2 rounded-md bg-white px-2 py-1">
                  <div className="h-2 w-10 rounded-full bg-gray-300" />
                  <div className="h-2 w-10 rounded-full bg-gray-200" />
                  <div className="h-2 w-10 rounded-full bg-gray-200" />
                </div>
                <div className="mt-3 h-14 rounded-md bg-white" />
              </div>
            ),
          });
        case "image":
          return (
            <div className="flex flex-col gap-0">
              {renderBlockTemplatePreviewCard({
                title: "Image 1",
                onSelect: () => handleApplyBlockTemplate("image"),
                showSelectButton: false,
                showTitle: false,
                previewHeightClassName: "h-44",
                previewContainerClassName: "bg-transparent p-0",
                preview: (
                  <div className="relative flex h-full w-full items-center justify-center rounded-xl bg-gray-200 p-2 transition-colors group-hover:bg-gray-300">
                    <img
                      src="/image%201.png"
                      alt="Image 1 template"
                      className="h-full w-full object-contain"
                    />
                    <div className="pointer-events-none absolute bottom-2 left-1/2 -translate-x-1/2 text-sm font-semibold text-gray-700 transition-opacity group-hover:opacity-0">
                      Image 1
                    </div>
                    <div className="pointer-events-none absolute inset-x-4 bottom-3 opacity-0 transition-opacity group-hover:pointer-events-auto group-hover:opacity-100">
                      <Button
                        fullWidth
                        onClick={() => handleApplyBlockTemplate("image")}
                        size="slim"
                        variant="primary"
                        style={{ backgroundColor: "#111827", borderColor: "#111827", color: "#ffffff" }}
                      >
                        Select
                      </Button>
                    </div>
                  </div>
                ),
              })}
              {renderBlockTemplatePreviewCard({
                title: "Image 2",
                onSelect: () => handleApplyBlockTemplate("image2"),
                showSelectButton: false,
                showTitle: false,
                previewHeightClassName: "h-44",
                previewContainerClassName: "bg-transparent p-0",
                preview: (
                  <div className="relative flex h-full w-full items-center justify-center rounded-xl bg-gray-200 p-2 transition-colors group-hover:bg-gray-300">
                    <img
                      src="/I%CC%87mage%202.png"
                      alt="Image 2 template"
                      className="h-full w-full object-contain"
                    />
                    <div className="pointer-events-none absolute bottom-2 left-1/2 -translate-x-1/2 text-sm font-semibold text-gray-700 transition-opacity group-hover:opacity-0">
                      Image 2
                    </div>
                    <div className="pointer-events-none absolute inset-x-4 bottom-3 opacity-0 transition-opacity group-hover:pointer-events-auto group-hover:opacity-100">
                      <Button
                        fullWidth
                        onClick={() => handleApplyBlockTemplate("image2")}
                        size="slim"
                        variant="primary"
                        style={{ backgroundColor: "#111827", borderColor: "#111827", color: "#ffffff" }}
                      >
                        Select
                      </Button>
                    </div>
                  </div>
                ),
              })}
            </div>
          );
        case "links":
          return renderBlockTemplatePreviewCard({
            title: "Link list (2 columns)",
            onSelect: selectTemplate,
            showSelectButton: false,
            showTitle: false,
            previewHeightClassName: "h-44",
            previewContainerClassName: "bg-transparent p-0",
            preview: (
              <div className="relative flex h-full w-full items-center justify-center rounded-xl bg-gray-200 p-2 transition-colors group-hover:bg-gray-300">
                <img
                  src="/two-columns.png"
                  alt="Link list (2 columns) template"
                  className="h-full w-full object-contain"
                />
                <div className="pointer-events-none absolute bottom-2 left-1/2 -translate-x-1/2 text-sm font-semibold text-gray-700 transition-opacity group-hover:opacity-0">
                  Link list (2 columns)
                </div>
                <div className="pointer-events-none absolute inset-x-4 bottom-3 opacity-0 transition-opacity group-hover:pointer-events-auto group-hover:opacity-100">
                  <Button
                    fullWidth
                    onClick={selectTemplate}
                    size="slim"
                    variant="primary"
                    style={{ backgroundColor: "#111827", borderColor: "#111827", color: "#ffffff" }}
                  >
                    Select
                  </Button>
                </div>
              </div>
            ),
          });
        case "product":
          return (
            <div className="flex flex-col gap-0">
              {renderBlockTemplatePreviewCard({
                title: "Product",
                onSelect: () => handleApplyBlockTemplate("product"),
                showSelectButton: false,
                showTitle: false,
                previewHeightClassName: "h-44",
                previewContainerClassName: "bg-transparent p-0",
                preview: (
                  <div className="relative flex h-full w-full items-center justify-center rounded-xl bg-gray-200 p-2 transition-colors group-hover:bg-gray-300">
                    <img
                      src="/product.png"
                      alt="Product template"
                      className="h-full w-full object-contain"
                    />
                    <div className="pointer-events-none absolute bottom-2 left-1/2 -translate-x-1/2 text-sm font-semibold text-gray-700 transition-opacity group-hover:opacity-0">
                      Product
                    </div>
                    <div className="pointer-events-none absolute inset-x-4 bottom-3 opacity-0 transition-opacity group-hover:pointer-events-auto group-hover:opacity-100">
                      <Button
                        fullWidth
                        onClick={() => handleApplyBlockTemplate("product")}
                        size="slim"
                        variant="primary"
                        style={{ backgroundColor: "#111827", borderColor: "#111827", color: "#ffffff" }}
                      >
                        Select
                      </Button>
                    </div>
                  </div>
                ),
              })}
              {renderBlockTemplatePreviewCard({
                title: "Product (Horizontal)",
                onSelect: () => handleApplyBlockTemplate("product-horizontal"),
                showSelectButton: false,
                showTitle: false,
                previewHeightClassName: "h-44",
                previewContainerClassName: "bg-transparent p-0",
                preview: (
                  <div className="relative flex h-full w-full items-center justify-center rounded-xl bg-gray-200 p-2 transition-colors group-hover:bg-gray-300">
                    <img
                      src="/product-yatay.png"
                      alt="Product horizontal template"
                      className="h-full w-full object-contain"
                    />
                    <div className="pointer-events-none absolute bottom-2 left-1/2 -translate-x-1/2 text-sm font-semibold text-gray-700 transition-opacity group-hover:opacity-0">
                      Product horizontal
                    </div>
                    <div className="pointer-events-none absolute inset-x-4 bottom-3 opacity-0 transition-opacity group-hover:pointer-events-auto group-hover:opacity-100">
                      <Button
                        fullWidth
                        onClick={() => handleApplyBlockTemplate("product-horizontal")}
                        size="slim"
                        variant="primary"
                        style={{ backgroundColor: "#111827", borderColor: "#111827", color: "#ffffff" }}
                      >
                        Select
                      </Button>
                    </div>
                  </div>
                ),
              })}
            </div>
          );
        case "collection":
          return renderBlockTemplatePreviewCard({
            title: "Collection",
            onSelect: selectTemplate,
            preview: (
              <div className="flex h-28 flex-col gap-2 rounded-lg bg-[#f3f4f6] p-2">
                <div className="h-14 rounded-md bg-white" />
                <div className="h-2 w-20 rounded bg-gray-300" />
              </div>
            ),
          });
        case "blogs":
          return renderBlockTemplatePreviewCard({
            title: "Blogs",
            onSelect: selectTemplate,
            preview: (
              <div className="h-28 rounded-lg bg-[#f3f4f6] p-2">
                <div className="h-2 w-20 rounded bg-gray-300" />
                <div className="mt-2 h-2 w-24 rounded bg-gray-200" />
                <div className="mt-2 h-2 w-16 rounded bg-gray-200" />
              </div>
            ),
          });
        case "contact":
          return renderBlockTemplatePreviewCard({
            title: "Contact form",
            onSelect: selectTemplate,
            showSelectButton: false,
            showTitle: false,
            previewHeightClassName: "h-44",
            previewContainerClassName: "bg-transparent p-0",
            preview: (
              <div className="relative flex h-full w-full items-center justify-center rounded-xl bg-gray-200 p-2 transition-colors group-hover:bg-gray-300">
                <img
                  src="/contact%20form.png"
                  alt="Contact form template"
                  className="h-full w-full object-contain"
                />
                <div className="pointer-events-none absolute bottom-2 left-1/2 -translate-x-1/2 text-sm font-semibold text-gray-700 transition-opacity group-hover:opacity-0">
                  Contact form
                </div>
                <div className="pointer-events-none absolute inset-x-4 bottom-3 opacity-0 transition-opacity group-hover:pointer-events-auto group-hover:opacity-100">
                  <Button
                    fullWidth
                    onClick={selectTemplate}
                    size="slim"
                    variant="primary"
                    style={{ backgroundColor: "#111827", borderColor: "#111827", color: "#ffffff" }}
                  >
                    Select
                  </Button>
                </div>
              </div>
            ),
          });
        case "html":
        default:
          return renderBlockTemplatePreviewCard({
            title: "Custom HTML",
            onSelect: selectTemplate,
            badge: "Professional",
            preview: (
              <div className="h-28 rounded-lg bg-[#f3f4f6] p-2 font-mono text-[10px] text-gray-500">
                <div className="h-2 w-20 rounded bg-gray-300" />
                <div className="mt-2 h-2 w-24 rounded bg-gray-200" />
                <div className="mt-2 h-2 w-28 rounded bg-gray-200" />
              </div>
            ),
          });
      }
    };

    return (
      <div
        className={`absolute right-80 top-0 z-20 flex h-full w-80 flex-col border-l border-gray-200 bg-white shadow-xl transition-all duration-200 ease-out ${
          showPanel ? "translate-x-0 opacity-100" : "translate-x-full opacity-0 pointer-events-none"
        }`}
        aria-hidden={!showPanel}
        onMouseEnter={() => {
          clearBlockTemplateHoverTimeout();
          setBlockTemplatePanelHover(true);
        }}
        onMouseLeave={() => {
          setBlockTemplatePanelHover(false);
          setBlockTemplateHoverId(null);
        }}
      >
        <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
          <Text as="h2" variant="headingSm">
            {previewTitle}
          </Text>
          <button
            type="button"
            aria-label="Close block preview"
            onClick={() => {
              setBlockTemplateHoverId(null);
              setBlockTemplatePanelHover(false);
            }}
            className="text-xl text-gray-400 hover:text-gray-600"
          >
            ×
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">{renderPreviewForTemplate()}</div>
      </div>
    );
  };

  const renderBlockTemplatePicker = () => {
    const isOpen = Boolean(blockTemplateTargetId);
    return (
      <div
        className={`absolute right-0 top-0 z-40 flex h-full w-80 min-h-0 flex-col border-l border-gray-200 bg-white shadow-xl transition-all duration-200 ease-out ${
          isOpen ? "translate-x-0 opacity-100" : "translate-x-full opacity-0 pointer-events-none"
        }`}
        aria-hidden={!isOpen}
      >
        <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
          <Text as="h2" variant="headingSm">
            Select block
          </Text>
          <button
            type="button"
            aria-label="Close block picker"
            onClick={() => setBlockTemplateTargetId(null)}
            className="text-xl text-gray-400 hover:text-gray-600"
          >
            ×
          </button>
        </div>
        <div
          className="flex-1 min-h-0 overflow-y-auto px-3 py-3"
          onMouseEnter={() => clearBlockTemplateHoverTimeout()}
          onMouseLeave={() => scheduleBlockTemplateHoverClear()}
        >
          <BlockStack gap="200">
            {BLOCK_TEMPLATES.map((template) => {
              const isHovered = blockTemplateHoverId === template.id;
              return (
                <button
                  key={template.id}
                  type="button"
                  onClick={() => handleApplyBlockTemplate(template.id)}
                  onMouseEnter={() => {
                    clearBlockTemplateHoverTimeout();
                    setBlockTemplateHoverId(template.id);
                  }}
                  onMouseLeave={() => scheduleBlockTemplateHoverClear()}
                  className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm text-gray-700 transition-colors ${
                    isHovered ? "bg-gray-100" : "hover:bg-gray-100"
                  }`}
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-md bg-gray-50 text-gray-600">
                    <Icon source={template.icon} tone="subdued" />
                  </span>
                  <span className="font-medium text-gray-800">{template.label}</span>
                </button>
              );
            })}
          </BlockStack>
        </div>
      </div>
    );
  };

  const renderSubmenuTemplatePicker = () => {
    const isOpen = Boolean(submenuTemplateTargetId);
    return (
      <div
        className={`absolute right-0 top-0 z-30 flex h-full w-80 min-h-0 flex-col border-l border-gray-200 bg-white shadow-xl transition-all duration-200 ease-out ${
          isOpen ? "translate-x-0 opacity-100" : "translate-x-full opacity-0 pointer-events-none"
        }`}
        aria-hidden={!isOpen}
      >
        <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
          <Text as="h2" variant="headingSm">
            Select template
          </Text>
          <button
            type="button"
            aria-label="Close template picker"
            onClick={() => setSubmenuTemplateTargetId(null)}
            className="text-xl text-gray-400 hover:text-gray-600"
          >
            ×
          </button>
        </div>
        <div
          className="flex-1 min-h-0 overflow-y-auto px-3 py-3"
          onMouseEnter={() => clearSubmenuTemplateHoverTimeout()}
          onMouseLeave={() => scheduleSubmenuTemplateHoverClear()}
        >
          <BlockStack gap="200">
            {SUBMENU_TEMPLATES.map((template) => {
              const isHovered = submenuTemplateHoverId === template.id;
              return (
                <button
                  key={template.id}
                  type="button"
                  onClick={() => handleApplySubmenuTemplate(template.id)}
                  onMouseEnter={() => {
                    clearSubmenuTemplateHoverTimeout();
                    setSubmenuTemplateHoverId(template.id);
                  }}
                  onMouseLeave={() => scheduleSubmenuTemplateHoverClear()}
                  className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm text-gray-700 transition-colors ${
                    isHovered ? "bg-gray-100" : "hover:bg-gray-100"
                  }`}
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-md bg-gray-50 text-gray-600">
                    <Icon source={template.icon} tone="subdued" />
                  </span>
                  <span className="font-medium text-gray-800">{template.label}</span>
                </button>
              );
            })}
          </BlockStack>
        </div>
      </div>
    );
  };

  const openIconPicker = (
    target: IconPickerState["target"],
    itemId: string,
    mode: IconPickerState["mode"]
  ) => {
    setIconPickerState({ itemId, mode, target });
    setIconPickerSearch("");
    setLinkPickerOpenId(null);
  };

  const closeIconPicker = () => {
    setIconPickerState(null);
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

  const renderMenuIcon = (
    icon?: string,
    options?: { size?: number; className?: string; color?: string }
  ) => {
    if (!icon) return null;
    const size = options?.size ?? 16;
    const className = options?.className ?? "";
    const color = options?.color;
    if (icon.startsWith("data:")) {
      return (
        <img
          src={icon}
          alt=""
          className={`object-contain ${className}`}
          style={{ width: size, height: size }}
        />
      );
    }
    if (icon.startsWith(ICON_PREFIX)) {
      const iconId = icon.slice(ICON_PREFIX.length);
      const option = ICON_LIBRARY_BY_ID[iconId];
      if (option) {
        return (
          <option.Icon
            size={size}
            strokeWidth={1.6}
            className={className}
            style={color ? { color } : undefined}
          />
        );
      }
    }
    return null;
  };

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
      } else {
        updateEditDraftItemById(itemId, (item) => ({ ...item, icon: result }));
      }
      closeIconPicker();
    };
    reader.readAsDataURL(file);
  };

  const renderIconLibraryPanel = () => {
    if (!iconPickerState || iconPickerState.mode !== "library") return null;
    const editableItem =
      iconPickerState.target === "custom" ? null : findEditableItemById(iconPickerState.itemId);
    const selectedItemIcon =
      iconPickerState.target === "custom"
        ? customItems.find((entry) => entry.id === iconPickerState.itemId)?.icon
        : editableItem?.icon ?? findItemPath(menuItems, iconPickerState.itemId)?.slice(-1)[0]?.icon;
    const selectedIconId = selectedItemIcon?.startsWith(ICON_PREFIX)
      ? selectedItemIcon.slice(ICON_PREFIX.length)
      : null;
    const filteredIcons = ICON_LIBRARY.filter((option) =>
      option.label.toLowerCase().includes(iconPickerSearch.trim().toLowerCase())
    );

    const applyIconSelection = (iconValue: string) => {
      if (iconPickerState.target === "custom") {
        updateCustomItem(iconPickerState.itemId, { icon: iconValue });
      } else {
        updateEditDraftItemById(iconPickerState.itemId, (item) => ({ ...item, icon: iconValue }));
      }
    };

    return (
      <div className="flex min-h-[560px] flex-col">
        <div className="border-b border-gray-200 px-4 py-3">
          <InlineStack gap="200" blockAlign="center">
            <Button
              variant="tertiary"
              icon={ArrowLeftIcon}
              onClick={closeIconPicker}
              accessibilityLabel="Back"
            />
            <Text as="h2" variant="headingSm">
              Select icon
            </Text>
          </InlineStack>
        </div>
        <div className="px-4 py-3">
          <TextField
            label="Search"
            labelHidden
            value={iconPickerSearch}
            onChange={setIconPickerSearch}
            autoComplete="off"
            placeholder="Search"
            prefix={<Icon source={SearchIcon} tone="subdued" />}
          />
        </div>
        <div className="flex-1 overflow-auto px-4 pb-4">
          <div className="grid grid-cols-6 gap-2">
            {filteredIcons.map((option) => {
              const isSelected = option.id === selectedIconId;
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => {
                    applyIconSelection(`${ICON_PREFIX}${option.id}`);
                    closeIconPicker();
                  }}
                  className={`flex h-10 w-10 items-center justify-center rounded-md border ${
                    isSelected ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  <option.Icon size={18} strokeWidth={1.6} className="text-gray-700" />
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  const renderIconUploadPanel = () => {
    if (!iconPickerState || iconPickerState.mode !== "upload") return null;

    return (
      <div className="flex min-h-[560px] flex-col">
        <div className="border-b border-gray-200 px-4 py-3">
          <InlineStack gap="200" blockAlign="center">
            <Button
              variant="tertiary"
              icon={ArrowLeftIcon}
              onClick={closeIconPicker}
              accessibilityLabel="Back"
            />
            <Text as="h2" variant="headingSm">
              Images
            </Text>
          </InlineStack>
        </div>
        <div className="flex-1 px-4 py-4">
          <label
            className="flex h-40 cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-gray-300 bg-gray-50 text-center"
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => {
              event.preventDefault();
              const file = event.dataTransfer.files?.[0];
              handleIconUploadFile(iconPickerState.itemId, file, iconPickerState.target);
            }}
          >
            <Button
              variant="tertiary"
              onClick={(event) => {
                event.preventDefault();
                const input = event.currentTarget
                  .closest("label")
                  ?.querySelector("input[type=file]") as HTMLInputElement | null;
                input?.click();
              }}
            >
              Add image
            </Button>
            <Text as="p" variant="bodySm" tone="subdued">
              Drag and drop your image
            </Text>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(event) =>
                handleIconUploadFile(
                  iconPickerState.itemId,
                  event.target.files?.[0] ?? null,
                  iconPickerState.target
                )
              }
            />
          </label>
        </div>
      </div>
    );
  };

  const applyLinkSelection = (itemId: string, url: string) => {
    if (customItems.some((item) => item.id === itemId)) {
      updateCustomItem(itemId, { url });
      return;
    }
    updateEditDraftItemById(itemId, (item) => ({ ...item, url }));
  };

  const renderLinkPickerDropdown = () => {
    if (!linkPickerOpenId || !linkPickerRect || typeof document === "undefined") {
      return null;
    }
    return createPortal(
      <div
        ref={linkPickerDropdownRef}
        className="fixed z-[9999] rounded-lg border border-gray-200 bg-white py-1 shadow-lg"
        style={{
          left: linkPickerRect.left,
          top: linkPickerRect.top + 8,
          width: linkPickerRect.width,
          maxHeight: "240px",
          overflowY: "auto",
        }}
      >
        {LINK_SUGGESTIONS.map((option) => (
          <button
            key={option.label}
            type="button"
            className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
            onClick={() => {
              applyLinkSelection(linkPickerOpenId, option.url);
              setLinkPickerOpenId(null);
            }}
          >
            <span className="flex h-5 w-5 items-center justify-center text-gray-500">
              <Icon source={option.icon} />
            </span>
            <span className="text-left">{option.label}</span>
          </button>
        ))}
      </div>,
      document.body
    );
  };

  useEffect(() => {
    if (!linkPickerOpenId) return;
    const handleMouseDown = (event: MouseEvent) => {
      const target = event.target as Node;
      const anchor = linkPickerAnchorRefs.current.get(linkPickerOpenId);
      const dropdown = linkPickerDropdownRef.current;
      if (anchor && anchor.contains(target)) return;
      if (dropdown && dropdown.contains(target)) return;
      setLinkPickerOpenId(null);
    };
    document.addEventListener("mousedown", handleMouseDown);
    return () => document.removeEventListener("mousedown", handleMouseDown);
  }, [linkPickerOpenId]);

  useLayoutEffect(() => {
    if (!linkPickerOpenId) {
      setLinkPickerRect(null);
      return;
    }
    const anchor = linkPickerAnchorRefs.current.get(linkPickerOpenId);
    if (!anchor) return;
    const updateRect = () => {
      const rect = anchor.getBoundingClientRect();
      setLinkPickerRect({ left: rect.left, top: rect.bottom, width: rect.width });
    };
    updateRect();
    const scrollContainer = customItemsScrollRef.current;
    scrollContainer?.addEventListener("scroll", updateRect);
    window.addEventListener("resize", updateRect);
    document.addEventListener("scroll", updateRect, true);
    return () => {
      scrollContainer?.removeEventListener("scroll", updateRect);
      window.removeEventListener("resize", updateRect);
      document.removeEventListener("scroll", updateRect, true);
    };
  }, [linkPickerOpenId]);

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

  const registerItemRow = (id: string) => (node: HTMLDivElement | null) => {
    if (node) {
      itemRowRefs.current.set(id, node);
    } else {
      itemRowRefs.current.delete(id);
    }
  };

  useLayoutEffect(() => {
    const prevPositions = prevPositionsRef.current;
    const nextPositions = new Map<string, DOMRect>();

    itemRowRefs.current.forEach((node, id) => {
      nextPositions.set(id, node.getBoundingClientRect());
    });

    nextPositions.forEach((nextBox, id) => {
      const prevBox = prevPositions.get(id);
      if (!prevBox) return;
      const deltaX = prevBox.left - nextBox.left;
      const deltaY = prevBox.top - nextBox.top;
      if (deltaX === 0 && deltaY === 0) return;
      const node = itemRowRefs.current.get(id);
      if (!node) return;
      node.style.transition = "transform 0s";
      node.style.transform = `translate(${deltaX}px, ${deltaY}px)`;
      requestAnimationFrame(() => {
        node.style.transition = "transform 180ms ease";
        node.style.transform = "";
      });
    });

    prevPositionsRef.current = nextPositions;
  }, [menuItems]);

  const handleSelectItem = (id: string, openEdit = false) => {
    setSelectedItemId(id);
    setActivePanel("menu");
    setMenuView(openEdit ? "edit" : "list");
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
    const newItem: MenuItem = {
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
    setOpenMenuId(menuId);
    setBlockTemplateTargetId(menuId);
    setSubmenuTemplateTargetId(null);
  };

  const buildTwoColumnLinkItems = () => {
    const defaultItemLabels = [
      "Menu item 1",
      "Menu item 2",
      "Menu item 3",
      "Menu item 4",
      "Menu item 5",
      "Menu item 6",
    ];
    return [
      {
        id: buildId(),
        label: "Heading",
        url: "",
        role: "item",
        isHeading: true,
        description: "",
      },
      ...defaultItemLabels.map((label) => ({
        id: buildId(),
        label,
        url: "/",
        role: "item",
        description: "Description",
      })),
    ];
  };

  const handleApplyBlockTemplate = (templateId: BlockTemplateId) => {
    if (!blockTemplateTargetId) return;
    const labelMap: Record<BlockTemplateId, string> = {
      space: "Space",
      multi: "Multi block",
      tabs: "Tabs",
      image: "Image 1",
      image2: "Image 2",
      links: "Link list",
      product: "Product",
      "product-horizontal": "Product horizontal",
      collection: "Collection",
      blogs: "Blogs",
      contact: "Contact form",
      html: "Custom HTML",
    };
    const iconMap: Partial<Record<BlockTemplateId, string>> = {
      image: `${ICON_PREFIX}image`,
      image2: `${ICON_PREFIX}image`,
      contact: `${ICON_PREFIX}mail`,
      product: `${ICON_PREFIX}tag`,
      "product-horizontal": `${ICON_PREFIX}tag`,
    };
    const descriptionMap: Partial<Record<BlockTemplateId, string>> = {
      image: "Sample description",
      image2: "Sample description",
    };
    const imageDefaults =
      templateId === "image" || templateId === "image2"
        ? { imageWidth: 3, imageNoFill: false }
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
      templateId === "product" || templateId === "product-horizontal"
        ? {
            productLayout: templateId === "product-horizontal" ? "image-left" : "image-top",
            productWidth: 3,
            productIds: [],
          }
        : {};
    const newBlock: MenuItem = {
      id: buildId(),
      label: labelMap[templateId],
      url: "",
      role: "group",
      expanded: true,
      children: templateId === "links" ? buildTwoColumnLinkItems() : [],
      blockTemplate: templateId,
      icon: iconMap[templateId],
      description: descriptionMap[templateId],
      ...imageDefaults,
      ...contactDefaults,
      ...productDefaults,
      ...(templateId === "links" ? { linkColumns: 2, linkWidth: 6, linkTextAlign: "left" } : {}),
    };
    setMenuItems((items) =>
      updateItemById(items, blockTemplateTargetId, (item) => ({
        ...item,
        expanded: true,
        children: item.children ? [...item.children, newBlock] : [newBlock],
      }))
    );
    setBlockTemplateTargetId(null);
  };

  const handleApplySubmenuTemplate = (templateId: SubmenuTemplateId) => {
    if (!submenuTemplateTargetId) return;
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
    setMenuItems((items) =>
      updateItemById(items, submenuTemplateTargetId, (item) => {
        const hasChildren = Boolean(item.children?.length);
        return {
          ...item,
          expanded: true,
          submenuTemplate: templateId,
          submenuType: templateId === "dropdown" ? "dropdown" : "mega",
          children:
            hasChildren ? item.children : templateId === "mega" ? [spaceBlock] : [newGroup],
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
  };

  const handleOpenAddRoot = () => {
    setActivePanel("menu");
    setMenuView("add-root");
    resetAddItemsState();
  };

  const handleCloseAddRoot = () => {
    setMenuView("list");
    resetAddItemsState();
  };

  const toggleSelectableItem = (item: AddableItem) => {
    setSelectedAddItems((prev) => {
      const next = { ...prev };
      if (next[item.id]) {
        delete next[item.id];
      } else {
        next[item.id] = item;
      }
      return next;
    });
  };

  const handleAddSelectedItems = () => {
    const items = Object.values(selectedAddItems);
    if (!items.length) return;
    const nextItems = items.map((item) => ({
      id: buildId(),
      label: item.label,
      url: item.url,
      role: "menu" as const,
    }));
    setMenuItems((prev) => [...prev, ...nextItems]);
    setMenuView("list");
    resetAddItemsState();
  };

  const updateCustomItem = (id: string, updates: Partial<CustomAddItem>) => {
    setCustomItems((prev) => prev.map((item) => (item.id === id ? { ...item, ...updates } : item)));
  };

  const addCustomItemRow = () => {
    setCustomItems((prev) => [...prev, buildCustomItem()]);
  };

  const handleAddCustomItems = () => {
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
        role: "menu" as const,
        description: item.description || undefined,
        icon: item.icon || undefined,
      }));

    if (!nextItems.length) {
      return;
    }

    setMenuItems((prev) => [...prev, ...nextItems]);
    setMenuView("list");
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

  const renderMenuTree = (item: MenuItem, depth: number = 0) => {
    if (item.blockTemplate === "space") {
      return null;
    }
    const isSelected = selectedItemId === item.id;
    const hasChildren = Boolean(item.children?.length);
    const isImageBlock =
      item.role === "group" && (item.blockTemplate === "image" || item.blockTemplate === "image2");
    const isContactBlock = item.role === "group" && item.blockTemplate === "contact";
    const isProductBlock =
      item.role === "group" &&
      (item.blockTemplate === "product" || item.blockTemplate === "product-horizontal");
    const isVisualBlock = isImageBlock || isContactBlock || isProductBlock;
    const isExpanded = item.expanded ?? item.role !== "item";
    const showToggle = item.role !== "item" && !isVisualBlock;
    const resolvedIcon =
      item.icon ??
      (isContactBlock
        ? `${ICON_PREFIX}mail`
        : isProductBlock
          ? `${ICON_PREFIX}tag`
          : undefined);
    const itemIcon =
      item.role === "group"
        ? item.blockTemplate === "contact"
          ? FormsIcon
          : TextFontListIcon
        : TextIcon;

    const dragHandle = (
      <span
        className={`absolute inset-0 flex items-center justify-center opacity-0 transition-opacity group-hover:opacity-100 ${
          draggedItemId === item.id ? "cursor-grabbing" : "cursor-grab"
        }`}
        role="button"
        tabIndex={0}
        draggable
        onDragStart={(event) => {
          event.dataTransfer.effectAllowed = "move";
          event.dataTransfer.setData("text/plain", item.id);
          const row = itemRowRefs.current.get(item.id);
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
        <Box paddingInlineStart={depth === 0 ? "0" : "200"}>
          <div>
            <div
              className={`group flex items-center gap-2 rounded-lg px-0 py-1 transition-colors ${
                isSelected ? "bg-gray-50" : "hover:bg-gray-50"
              }`}
              ref={registerItemRow(item.id)}
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
            <span className="relative flex h-5 w-5 items-center justify-center text-gray-500">
              {showToggle ? (
                <button
                  type="button"
                  onClick={() => handleToggleExpand(item.id)}
                  aria-label={isExpanded ? "Collapse" : "Expand"}
                  className="flex h-5 w-5 items-center justify-center text-gray-500 hover:text-gray-700"
                >
                  <Icon source={isExpanded ? ChevronDownIcon : ChevronRightIcon} tone="subdued" />
                </button>
              ) : null}
            </span>
            <div className="flex min-w-0 flex-1 items-center gap-2 text-left text-sm text-gray-700">
              <span className="relative flex h-5 w-5 items-center justify-center text-gray-500">
                <span className="pointer-events-none transition-opacity group-hover:opacity-0">
                  {resolvedIcon
                    ? renderMenuIcon(resolvedIcon, { size: 16, className: "text-gray-500" })
                    : <Icon source={itemIcon} tone="subdued" />}
                </span>
                {dragHandle}
              </span>
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
                overflow: "hidden",
                transition: "max-height 140ms ease, opacity 140ms ease",
              }}
            >
              <Box>
                <div className="ml-1 border-l border-dashed border-gray-300/70">
                  <BlockStack>
                    {hasChildren
                      ? item.children?.map((child) => renderMenuTree(child, depth + 1))
                      : null}
                  {item.role === "menu" ? (
                    <button
                      type="button"
                      onClick={() => {
                        if (hasChildren) {
                          handleOpenBlockTemplatePicker(item.id);
                        } else {
                          handleAddChild(item.id, "group");
                        }
                      }}
                      className="mt-2 flex items-center gap-2 rounded-lg px-2 py-1 text-sm font-medium text-blue-600 hover:bg-gray-100 hover:text-blue-700"
                    >
                      <span className="h-5 w-5" />
                      <span className="flex h-5 w-5 items-center justify-center rounded-full border-2 border-blue-600 text-blue-600 text-xs leading-none">
                        +
                      </span>
                      {hasChildren ? "Add block" : "Add submenu"}
                    </button>
                  ) : null}
                  {item.role === "group" && !isVisualBlock ? (
                    <button
                      type="button"
                      onClick={() => handleAddChild(item.id, "item")}
                      className="mt-2 flex items-center gap-2 rounded-lg px-2 py-1 text-sm font-medium text-blue-600 hover:bg-gray-100 hover:text-blue-700"
                    >
                      <span className="h-5 w-5" />
                      <span className="flex h-5 w-5 items-center justify-center rounded-full border-2 border-blue-600 text-blue-600 text-xs leading-none">
                        +
                      </span>
                      Add item
                    </button>
                  ) : null}
                  </BlockStack>
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
      const isImageBlock =
        editingItem.blockTemplate === "image" || editingItem.blockTemplate === "image2";
      const isContactBlock = editingItem.blockTemplate === "contact";
      const isLinkListBlock = editingItem.blockTemplate === "links";
      const isProductBlock =
        editingItem.blockTemplate === "product" || editingItem.blockTemplate === "product-horizontal";
      const isVisualBlock = isImageBlock || isContactBlock || isProductBlock;
      const linkListItems = isLinkListBlock ? editingItem.children ?? [] : [];
      if (iconPickerState?.target === "edit") {
        return (
          <Card padding="0">
            {iconPickerState.mode === "library" ? renderIconLibraryPanel() : renderIconUploadPanel()}
          </Card>
        );
      }
      if (imagePickerOpen) {
        return renderImagePickerPanel();
      }
      if (submenuImagePickerOpen) {
        return renderSubmenuImagePickerPanel();
      }
      if (productPickerOpen) {
        return renderProductPickerPanel();
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

          <div className="flex-1 min-h-0 overflow-y-auto px-4 py-4">
            <BlockStack gap="400">
              <BlockStack gap="300">
                <Text as="h3" variant="headingSm">
                  General
                </Text>
                {!isVisualBlock && !isLinkListBlock ? (
                  <BlockStack gap="200">
                    <Text as="h4" variant="headingSm">
                      Icon
                    </Text>
                    <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 px-3 py-4 text-center">
                      <div className="flex flex-col items-center gap-3">
                        {editingItem.icon ? (
                          <div className="flex h-12 w-12 items-center justify-center rounded-md bg-white shadow-sm">
                            {resolveCustomIconPreview(editingItem.icon)}
                          </div>
                        ) : null}
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
                      </div>
                    </div>
                  </BlockStack>
                ) : null}
                {isLinkListBlock ? (
                  <>
                    <InlineStack gap="200" blockAlign="center">
                      <div style={{ flex: 1 }}>
                        <RangeSlider
                          label="Width"
                          value={editingItem.linkWidth ?? 6}
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
                          value={String(editingItem.linkWidth ?? 6)}
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
                          min={2}
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
                            const clamped = Math.max(2, Math.min(4, next));
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
                          value={editingItem.imageWidth ?? 6}
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
                          value={String(editingItem.imageWidth ?? 6)}
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
                          className={`rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                            (editingItem.productLayout ?? "image-top") === "image-top"
                              ? "border-blue-600 bg-blue-50 text-blue-700"
                              : "border-gray-300 text-gray-600 hover:border-gray-400"
                          }`}
                        >
                          Image on top
                        </button>
                        <button
                          type="button"
                          onClick={() => updateEditDraft("productLayout", "image-left")}
                          className={`rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                            editingItem.productLayout === "image-left"
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
                      autoComplete="off"
                    />
                    <div dir="ltr" className="flex items-end gap-2">
                      <div className="flex-1">
                        <TextField
                          label="Link"
                          value={editingItem.url}
                          onChange={(value) => updateEditDraft("url", value)}
                          autoComplete="off"
                          placeholder="Search or paste a link"
                        />
                      </div>
                      <button
                        type="button"
                        aria-label="Clear link"
                        onClick={() => updateEditDraft("url", "")}
                        className="mb-[2px] flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] border border-gray-300 bg-gray-100 text-gray-500 hover:bg-gray-200"
                      >
                        <span className="text-base leading-none">×</span>
                      </button>
                    </div>
                    <Checkbox
                      label="Open in new tab"
                      checked={Boolean(editingItem.openInNewTab)}
                      onChange={(value) => updateEditDraft("openInNewTab", value)}
                    />
                    <TextField
                      label="Description"
                      value={editingItem.description ?? ""}
                      onChange={(value) => updateEditDraft("description", value)}
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
                                setEditDraft((prev) => {
                                  const base = prev ?? selectedItem;
                                  if (!base || !base.children?.length) return prev ?? base;
                                  const nextChildren = base.children.map((item) => ({
                                    ...item,
                                    isHeading: value ? item.id === child.id : false,
                                  }));
                                  return { ...base, children: nextChildren };
                                });
                              }}
                            />
                            <Text as="p" variant="bodySm" tone="subdued">
                              Icon
                            </Text>
                            <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 px-3 py-4 text-center">
                              <div className="flex flex-col items-center gap-3">
                                {child.icon ? (
                                  <div className="flex h-12 w-12 items-center justify-center rounded-md bg-white shadow-sm">
                                    {resolveCustomIconPreview(child.icon)}
                                  </div>
                                ) : null}
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
                              </div>
                            </div>
                            <TextField
                              label="Title"
                              value={child.label}
                              onChange={(value) =>
                                updateEditDraftItemById(child.id, (item) => ({ ...item, label: value }))
                              }
                              autoComplete="off"
                            />
                            <div dir="ltr" className="flex items-end gap-2">
                              <div
                                className="flex-1"
                                ref={(node) => {
                                  if (node) {
                                    linkPickerAnchorRefs.current.set(child.id, node);
                                  } else {
                                    linkPickerAnchorRefs.current.delete(child.id);
                                  }
                                }}
                              >
                                <TextField
                                  label="Link"
                                  value={child.url}
                                  onChange={(value) =>
                                    updateEditDraftItemById(child.id, (item) => ({ ...item, url: value }))
                                  }
                                  autoComplete="off"
                                  placeholder="Search or paste a link"
                                  onFocus={() => openLinkPicker(child.id)}
                                  onClick={() => openLinkPicker(child.id)}
                                />
                              </div>
                              <button
                                type="button"
                                aria-label="Clear link"
                                onClick={() =>
                                  updateEditDraftItemById(child.id, (item) => ({ ...item, url: "" }))
                                }
                                className="mb-[2px] flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] border border-gray-300 bg-gray-100 text-gray-500 hover:bg-gray-200"
                              >
                                <span className="text-base leading-none">×</span>
                              </button>
                            </div>
                            <TextField
                              label="Description"
                              value={child.description ?? ""}
                              onChange={(value) =>
                                updateEditDraftItemById(child.id, (item) => ({ ...item, description: value }))
                              }
                              autoComplete="off"
                            />
                            <InlineStack align="space-between" blockAlign="center">
                              <Text as="p" variant="bodySm">
                                Badge
                              </Text>
                              <div className="flex h-6 w-10 items-center rounded-full bg-gray-200 px-0.5">
                                <span className="h-5 w-5 rounded-full bg-white shadow-sm" />
                              </div>
                            </InlineStack>
                            <Text as="p" variant="bodySm" tone="subdued">
                              This option is available on the{" "}
                              <span className="text-blue-600">Pro plan</span>
                            </Text>
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

              {isProductBlock ? (
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
                            onClick={() => updateEditDraft("productIds", [])}
                            className="flex h-7 w-7 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                            aria-label="Remove selection"
                          >
                            <span className="text-base leading-none">×</span>
                          </button>
                        </div>
                        <div className="mt-3">
                          <button
                            type="button"
                            onClick={openProductPicker}
                            className="w-full rounded-lg border border-gray-200 bg-white py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
                          >
                            Change
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={openProductPicker}
                        className="w-full rounded-lg border border-gray-200 bg-white py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
                      >
                        Select products
                      </button>
                    )}
                  </BlockStack>
                </>
              ) : null}

              {!isVisualBlock && !isLinkListBlock ? (
                <>
                  <Divider />
                  <BlockStack gap="300">
                    <InlineStack align="space-between" blockAlign="center">
                      <Text as="h3" variant="headingSm">
                        Colors
                      </Text>
                      <button
                        type="button"
                        className="text-sm text-gray-400"
                        disabled
                      >
                        Clear settings
                      </button>
                    </InlineStack>
                    <div className="relative rounded-lg border border-gray-200 p-3">
                      <div className="pointer-events-none opacity-50">
                        {[
                          "Text color",
                          "Background color",
                          "Hover text color",
                          "Hover background color",
                        ].map((label) => (
                          <div key={label} className="flex items-center justify-between py-2">
                            <div className="flex items-center gap-3">
                              <span className="h-6 w-6 rounded-full border border-gray-300 bg-white" />
                              <Text as="span" variant="bodySm">
                                {label}
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
                  </BlockStack>

                  <Divider />

                  <BlockStack gap="300">
                    <InlineStack align="space-between" blockAlign="center">
                      <Text as="h3" variant="headingSm">
                        Badge
                      </Text>
                      <div className="flex h-6 w-10 items-center rounded-full bg-gray-200 px-0.5">
                        <span className="h-5 w-5 rounded-full bg-white shadow-sm" />
                      </div>
                    </InlineStack>
                    <Text as="p" variant="bodySm" tone="subdued">
                      Available on the Pro plan
                    </Text>
                  </BlockStack>

                  {editingItem.role === "menu" && editingItem.children?.length ? (
                    <>
                      <Divider />
                      <BlockStack gap="300">
                        <Text as="h3" variant="headingSm">
                          Submenu
                        </Text>
                        <Select
                          label="Type"
                          options={[
                            { label: "Mega", value: "mega" },
                            { label: "Dropdown", value: "dropdown" },
                          ]}
                          value={editingItem.submenuType ?? "mega"}
                          onChange={(value) => updateEditDraft("submenuType", value as MenuItem["submenuType"])}
                        />
                        <Select
                          label="Width + alignment"
                          options={[
                            { label: "Full width", value: "full" },
                            { label: "Content width", value: "content" },
                          ]}
                          value={editingItem.submenuWidth ?? "full"}
                          onChange={(value) =>
                            updateEditDraft("submenuWidth", value as MenuItem["submenuWidth"])
                          }
                        />
                        <Select
                          label="Content alignment"
                          options={[
                            { label: "Left", value: "left" },
                            { label: "Center", value: "center" },
                            { label: "Right", value: "right" },
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
                              className={`h-10 w-10 rounded-full border-2 shadow-sm ${
                                submenuColorPickerOpen
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
                          <Text as="p" variant="bodySm" tone="subdued">
                            Background image
                          </Text>
                          <button
                            type="button"
                            onClick={() => setSubmenuImagePickerOpen(true)}
                            className="mt-2 flex h-28 w-full items-center justify-center rounded-lg border border-dashed border-gray-300 bg-gray-50"
                          >
                            <span className="rounded-full border border-gray-900 bg-gray-900 px-4 py-1 text-sm font-medium text-white shadow-sm">
                              Select photo
                            </span>
                          </button>
                          {editingItem.submenuBackgroundImage ? (
                            <div className="mt-2">
                              <img
                                src={editingItem.submenuBackgroundImage}
                                alt=""
                                className="h-20 w-full rounded-md object-cover"
                              />
                            </div>
                          ) : null}
                        </div>
                      </BlockStack>
                    </>
                  ) : null}
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
                        <button
                          type="button"
                          onClick={() => setImagePickerOpen(true)}
                          className="mt-2 flex h-28 w-full items-center justify-center rounded-lg border border-dashed border-gray-300 bg-gray-50"
                        >
                          <span className="rounded-full border border-gray-900 bg-gray-900 px-4 py-1 text-sm font-medium text-white shadow-sm">
                            Select photo
                          </span>
                        </button>
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

      const renderCheckboxItem = (item: AddableItem) => (
        <Checkbox
          key={item.id}
          label={item.label}
          checked={Boolean(selectedAddItems[item.id])}
          onChange={() => toggleSelectableItem(item)}
        />
      );

      return (
        <Card padding="0">
          <BlockStack gap="0">
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
                  className={`rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                    addItemsTab === "select"
                      ? "border-blue-600 bg-blue-50 text-blue-700"
                      : "border-gray-300 text-gray-600 hover:border-gray-400"
                  }`}
                >
                  Select items
                </button>
                <button
                  type="button"
                  onClick={() => setAddItemsTab("custom")}
                  className={`rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                    addItemsTab === "custom"
                      ? "border-blue-600 bg-blue-50 text-blue-700"
                      : "border-gray-300 text-gray-600 hover:border-gray-400"
                  }`}
                >
                  Add item
                </button>
              </div>
            </Box>
            <Divider />
            {addItemsTab === "select" ? (
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
                <div className="max-h-[420px] overflow-auto px-4 py-4">
                  <BlockStack gap="300">
                    <BlockStack gap="200">{filterItems(staticItems).map(renderCheckboxItem)}</BlockStack>
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
                        Products
                      </Text>
                      <BlockStack gap="200">
                        {filterItems(productItems).map(renderCheckboxItem)}
                      </BlockStack>
                    </BlockStack>
                  </BlockStack>
                </div>
                <Divider />
                <Box padding="300">
                  <InlineStack align="end" gap="200">
                    <Button variant="tertiary" onClick={handleCloseAddRoot}>
                      Cancel
                    </Button>
                    <Button variant="primary" disabled={selectedCount === 0} onClick={handleAddSelectedItems}>
                      Add
                    </Button>
                  </InlineStack>
                </Box>
              </>
            ) : iconPickerState ? (
              iconPickerState.mode === "library" ? renderIconLibraryPanel() : renderIconUploadPanel()
            ) : (
              <>
                <div className="flex h-[calc(100vh-220px)] min-h-[500px] max-h-[780px] flex-col">
                  <div ref={customItemsScrollRef} className="flex-1 overflow-auto px-4 py-4 pb-2">
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
                                </div>
                              </div>
                            </BlockStack>
                            <TextField
                              label="Title"
                              value={item.title}
                              onChange={(value) => updateCustomItem(item.id, { title: value })}
                              autoComplete="off"
                            />
                            <div className={linkPickerOpenId === item.id ? "relative z-[120]" : "relative"}>
                              <div dir="ltr" className="flex items-end gap-2">
                                <div
                                  className="relative flex-1"
                                  ref={(node) => {
                                    if (node) {
                                      linkPickerAnchorRefs.current.set(item.id, node);
                                    } else {
                                      linkPickerAnchorRefs.current.delete(item.id);
                                    }
                                  }}
                                >
                                  <TextField
                                    label="Link"
                                    value={item.url}
                                    onChange={(value) => updateCustomItem(item.id, { url: value })}
                                    autoComplete="off"
                                    placeholder="Search or paste a link"
                                    onFocus={() => openLinkPicker(item.id)}
                                    onClick={() => openLinkPicker(item.id)}
                                  />
                                </div>
                                <button
                                  type="button"
                                  aria-label="Clear link"
                                  onClick={() => updateCustomItem(item.id, { url: "" })}
                                  className="mb-[2px] flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] border border-gray-300 bg-gray-100 text-gray-500 hover:bg-gray-200"
                                >
                                  <span className="text-base leading-none">×</span>
                                </button>
                              </div>
                            </div>
                            <TextField
                              label="Description"
                              value={item.description}
                              onChange={(value) => updateCustomItem(item.id, { description: value })}
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
                  <div className="border-t border-gray-200 px-4 py-1">
                    <InlineStack align="end" gap="200">
                      <Button variant="tertiary" onClick={handleCloseAddRoot}>
                        Cancel
                      </Button>
                      <Button variant="primary" onClick={handleAddCustomItems} disabled={!hasCustomItems}>
                        Add
                      </Button>
                    </InlineStack>
                  </div>
                </div>
              </>
            )}
          </BlockStack>
          {addItemsTab === "custom" ? renderLinkPickerDropdown() : null}
        </Card>
      );
    }

    return (
      <Card padding="400">
        <BlockStack gap="300">
          <InlineStack align="space-between" blockAlign="center">
            <Text as="h2" variant="headingMd">
              Menu items
            </Text>
          </InlineStack>
          <Text as="p" variant="bodySm" tone="subdued">
            Drag to reorder items.
          </Text>
          <Divider />
          <div
            className={`rounded-lg border-2 border-dotted transition-all duration-150 ${
              draggedItemId ? "border-blue-500 bg-blue-50/40 p-2" : "border-transparent"
            }`}
          >
            <BlockStack gap="100">
              {menuItems.map((item) => renderMenuTree(item))}
            </BlockStack>
          </div>
          <Box>
            <button
              type="button"
              onClick={handleOpenAddRoot}
              className="flex w-full items-center gap-2 rounded-lg px-2 py-1 text-sm font-medium text-blue-600 hover:bg-gray-100"
            >
              <span className="flex h-5 w-5 items-center justify-center rounded-full border-2 border-blue-600 text-blue-600 text-xs leading-none">
                +
              </span>
              Add item
            </button>
          </Box>
        </BlockStack>
      </Card>
    );
  };

  const renderTypographyPanel = () => {
    const weightOptions = [
      { label: "Regular", value: "400" },
      { label: "Medium", value: "500" },
      { label: "Semi Bold", value: "600" },
      { label: "Bold", value: "700" },
    ];

    const renderFontPickerPanel = () => {
      if (!fontPickerState) {
        return null;
      }

      const filteredFonts = FONT_OPTIONS.filter((option) =>
        option.label.toLowerCase().includes(fontPickerSearch.trim().toLowerCase())
      );
      const selectedFont =
        FONT_OPTIONS.find((option) => option.value === fontPickerFont) ?? FONT_OPTIONS[0];

      return (
        <div className="flex min-h-full flex-col">
          <div className="border-b border-gray-200 px-4 py-3">
            <InlineStack gap="200" blockAlign="center">
              <Button
                variant="tertiary"
                icon={ArrowLeftIcon}
                onClick={closeFontPicker}
                accessibilityLabel="Back"
              />
              <Text as="h2" variant="headingSm">
                Select font
              </Text>
            </InlineStack>
          </div>
          <div className="px-4 py-3">
            <TextField
              label="Search"
              labelHidden
              value={fontPickerSearch}
              onChange={setFontPickerSearch}
              autoComplete="off"
              placeholder="Search"
              prefix={<Icon source={SearchIcon} tone="subdued" />}
            />
          </div>
          <div className="flex-1 overflow-auto px-3 pb-3">
            <BlockStack gap="100">
              {filteredFonts.map((option) => {
                const isSelected = option.value === fontPickerFont;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setFontPickerFont(option.value)}
                    className={`w-full rounded-md px-3 py-2 text-left text-sm ${
                      isSelected ? "bg-gray-100" : "hover:bg-gray-100"
                    }`}
                    style={{ fontFamily: option.value }}
                  >
                    {option.label}
                  </button>
                );
              })}
            </BlockStack>
          </div>
          <div className="border-t border-gray-200 px-4 py-3">
            <BlockStack gap="200">
              <Text as="p" variant="bodySm" tone="subdued">
                {selectedFont?.label || "Work Sans"}
              </Text>
              <Select
                label="Weight"
                labelHidden
                options={weightOptions}
                value={fontPickerWeight}
                onChange={setFontPickerWeight}
              />
              <InlineStack align="end" gap="200">
                <Button variant="tertiary" onClick={closeFontPicker}>
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={() => {
                    if (!fontPickerState) return;
                    const nextFont = fontPickerFont || selectedFont?.value || "";
                    updateBuilderSetting(fontPickerState.fontKey, nextFont as never);
                    updateBuilderSetting(fontPickerState.weightKey, Number(fontPickerWeight) as never);
                    closeFontPicker();
                  }}
                >
                  Select
                </Button>
              </InlineStack>
            </BlockStack>
          </div>
        </div>
      );
    };

    if (fontPickerState) {
      return renderFontPickerPanel();
    }

    const renderTypographySection = (
      id: string,
      title: string,
      useCustomKey: keyof BuilderSettings,
      fontKey: keyof BuilderSettings,
      weightKey: keyof BuilderSettings,
      sizeKey: keyof BuilderSettings
    ) => {
      const fontValue = builderSettings[fontKey] as string;
      const weightValue = Number(builderSettings[weightKey]);
      const isCustom = builderSettings[useCustomKey] as boolean;
      const weightLabel =
        weightOptions.find((option) => Number(option.value) === weightValue)?.label ?? "Regular";
      const fontLabel =
        FONT_OPTIONS.find((option) => option.value === fontValue)?.label ??
        fontValue.split(",")[0] ??
        "Work Sans";

      const fontCard = (
        <button
          type="button"
          onClick={() => openFontPickerFor(id, fontKey, weightKey)}
          className="w-full overflow-hidden rounded-lg border border-gray-300 bg-white text-left"
        >
          <div className="px-4 py-3">
            <Text as="p" variant="headingMd" fontWeight="medium" style={{ fontFamily: fontValue }}>
              {fontValue.split(",")[0]}
            </Text>
            <Text as="p" variant="bodySm" tone="subdued">
              {weightLabel}
            </Text>
          </div>
          <div className="border-t border-gray-200 px-4 py-2 text-center text-sm text-gray-700">
            Change
          </div>
        </button>
      );

      return (
        <BlockStack gap="300">
          <Text as="h3" variant="headingSm">
            {title}
          </Text>
          <Checkbox
            label="Use custom font"
            checked={builderSettings[useCustomKey] as boolean}
            onChange={(value) => updateBuilderSetting(useCustomKey, value as never)}
          />
          <Text as="p" variant="bodySm" tone="subdued">
            Font
          </Text>
          {isCustom ? (
            <InlineStack gap="200" blockAlign="center">
              <div style={{ flex: 1 }}>
                <TextField
                  label="Font"
                  labelHidden
                  value={fontLabel}
                  readOnly
                  autoComplete="off"
                  onFocus={() => openFontPickerFor(id, fontKey, weightKey)}
                  onClick={() => openFontPickerFor(id, fontKey, weightKey)}
                />
              </div>
              <div style={{ width: 120 }}>
                <Select
                  label="Weight"
                  labelHidden
                  options={weightOptions}
                  value={String(builderSettings[weightKey])}
                  onChange={(value) => updateBuilderSetting(weightKey, Number(value) as never)}
                />
              </div>
            </InlineStack>
          ) : (
            fontCard
          )}
          <InlineStack gap="200" blockAlign="center">
            <div style={{ flex: 1 }}>
              <RangeSlider
                label="Size"
                value={builderSettings[sizeKey] as number}
                min={10}
                max={24}
                onChange={(value) => updateBuilderSetting(sizeKey, value as never)}
              />
            </div>
            <div style={{ width: 90 }}>
              <TextField
                type="number"
                value={String(builderSettings[sizeKey])}
                onChange={(value) => updateBuilderSetting(sizeKey, Number(value) as never)}
                suffix="px"
                autoComplete="off"
              />
            </div>
          </InlineStack>
        </BlockStack>
      );
    };

    return (
      <Card padding="400">
        <BlockStack gap="400">
          <Text as="h2" variant="headingMd">
            Typography settings
          </Text>
          <Divider />
          {renderTypographySection(
            "main",
            "Main menu",
            "typographyMainUseCustom",
            "typographyMainFont",
            "typographyMainWeight",
            "typographyMainSize"
          )}
          <Divider />
          {renderTypographySection(
            "tab",
            "Tab",
            "typographyTabUseCustom",
            "typographyTabFont",
            "typographyTabWeight",
            "typographyTabSize"
          )}
          <Divider />
          {renderTypographySection(
            "subheading",
            "Submenu heading",
            "typographySubheadingUseCustom",
            "typographySubheadingFont",
            "typographySubheadingWeight",
            "typographySubheadingSize"
          )}
          <Divider />
          {renderTypographySection(
            "subtext",
            "Submenu text",
            "typographySubtextUseCustom",
            "typographySubtextFont",
            "typographySubtextWeight",
            "typographySubtextSize"
          )}
          <Divider />
          {renderTypographySection(
            "description",
            "Submenu description",
            "typographyDescriptionUseCustom",
            "typographyDescriptionFont",
            "typographyDescriptionWeight",
            "typographyDescriptionSize"
          )}
        </BlockStack>
      </Card>
    );
  };

  const renderColorsPanel = () => {
    const renderColorRow = (label: string, key: keyof BuilderSettings) => {
      const value = builderSettings[key] as string;
      const isOpen = openColorPicker === key;
      const displayColor = isOpen && colorPickerHsb ? hsbToHex(colorPickerHsb) : value;

      return (
        <div className="relative">
          <InlineStack gap="400" blockAlign="center">
            <button
              type="button"
              onClick={() => toggleColorPicker(key)}
              className={`h-10 w-10 rounded-full border-2 shadow-sm ${
                isOpen ? "border-blue-500 ring-2 ring-blue-500/30" : "border-gray-300"
              }`}
              style={{ backgroundColor: displayColor }}
              aria-label={label}
            />
            <BlockStack gap="100">
              <Text as="p" variant="bodyMd">
                {label}
              </Text>
              <Text as="p" variant="bodySm" tone="subdued">
                {displayColor.toUpperCase()}
              </Text>
            </BlockStack>
          </InlineStack>
          {isOpen && (
            <div
              className="absolute left-0 top-full z-20 mt-2 w-64 rounded-lg border border-gray-200 bg-white p-3 shadow-lg"
              onMouseDown={(event) => event.stopPropagation()}
            >
              <BlockStack gap="200">
                <ColorPicker
                  color={colorPickerHsb ?? hexToHsb(value)}
                  onChange={(color) => {
                    setColorPickerHsb({ ...color });
                    updateBuilderSetting(key, hsbToHex(color) as never);
                  }}
                />
                <TextField
                  label="Hex"
                  labelHidden
                  value={displayColor}
                  onChange={(next) => {
                    const normalized = normalizeHexInput(next);
                    updateBuilderSetting(key, normalized as never);
                    setColorPickerHsb(hexToHsb(normalized));
                  }}
                  autoComplete="off"
                />
              </BlockStack>
            </div>
          )}
        </div>
      );
    };

    const sections: Array<{ title: string; items: Array<{ label: string; key: keyof BuilderSettings }> }> = [
      {
        title: "Main menu",
        items: [
          { label: "Main menu background", key: "colorMainBackground" },
          { label: "Main menu hover background", key: "colorMainBackgroundHover" },
          { label: "Main menu divider", key: "colorMainDivider" },
          { label: "Main menu text", key: "colorMainText" },
          { label: "Main menu hover text", key: "colorMainTextHover" },
        ],
      },
      {
        title: "Tab menu",
        items: [
          { label: "Tab heading color", key: "colorTabHeading" },
          { label: "Tab active heading color", key: "colorTabHeadingActive" },
          { label: "Tab active background", key: "colorTabBackgroundActive" },
        ],
      },
      {
        title: "Submenu",
        items: [
          { label: "Submenu background", key: "colorSubmenuBackground" },
          { label: "Submenu border", key: "colorSubmenuBorder" },
          { label: "Submenu heading", key: "colorSubmenuHeading" },
          { label: "Submenu text", key: "colorSubmenuText" },
          { label: "Submenu hover text", key: "colorSubmenuTextHover" },
          { label: "Submenu description", key: "colorSubmenuDescription" },
          { label: "Submenu hover description", key: "colorSubmenuDescriptionHover" },
        ],
      },
      {
        title: "Badge",
        items: [
          { label: "Sale badge text", key: "colorBadgeSaleText" },
          { label: "Sale badge background", key: "colorBadgeSaleBackground" },
          { label: "Sold out badge text", key: "colorBadgeSoldOutText" },
          { label: "Sold out badge background", key: "colorBadgeSoldOutBackground" },
        ],
      },
      {
        title: "Add to cart button",
        items: [
          { label: "Button text", key: "colorButtonText" },
          { label: "Button background", key: "colorButtonBackground" },
          { label: "Button hover background", key: "colorButtonBackgroundHover" },
          { label: "Button hover text", key: "colorButtonTextHover" },
        ],
      },
    ];

    return (
      <Card padding="400">
        <BlockStack gap="400">
          <Text as="h2" variant="headingMd">
            Color settings
          </Text>
          <Divider />
          {sections.map((section, index) => (
            <BlockStack key={section.title} gap="300">
              <Text as="h3" variant="headingSm">
                {section.title}
              </Text>
              <BlockStack gap="300">
                {section.items.map((item) => renderColorRow(item.label, item.key))}
              </BlockStack>
              {index < sections.length - 1 ? <Divider /> : null}
            </BlockStack>
          ))}
        </BlockStack>
      </Card>
    );
  };

  const renderSettingsPanel = () => {
    const toNumber = (value: string) => {
      const next = Number(value);
      return Number.isFinite(next) ? next : 0;
    };

    const renderSpacingControl = (
      label: string,
      value: number,
      onChange: (next: number) => void,
      min: number,
      max: number
    ) => (
      <InlineStack gap="200" blockAlign="center">
        <div style={{ flex: 1 }}>
          <RangeSlider
            label={label}
            value={value}
            min={min}
            max={max}
            onChange={onChange}
          />
        </div>
        <div style={{ width: 90 }}>
          <TextField
            type="number"
            value={String(value)}
            onChange={(next) => onChange(toNumber(next))}
            suffix="px"
            autoComplete="off"
          />
        </div>
      </InlineStack>
    );

    return (
      <Card padding="400">
        <BlockStack gap="400">
          <Text as="h2" variant="headingMd">
            General settings
          </Text>
          <Divider />

          <BlockStack gap="300">
            <Text as="h3" variant="headingSm">
              Location
            </Text>
            <ChoiceList
              choices={[
                { label: "Automatic", value: "auto" },
                { label: "Replace navigation", value: "replaceNavigation" },
                {
                  label: "Show menu in this CSS selector",
                  value: "cssSelector",
                  helpText:
                    "Use this option only if you're a developer or the options above don't work.",
                },
              ]}
              selected={[builderSettings.layoutLocation]}
              onChange={(value) =>
                updateBuilderSetting("layoutLocation", value[0] as BuilderSettings["layoutLocation"])
              }
            />
          </BlockStack>

          <Divider />

          <BlockStack gap="300">
            <Text as="h3" variant="headingSm">
              Layout
            </Text>
            <ChoiceList
              title="Orientation"
              choices={[
                { label: "Horizontal", value: "horizontal" },
                { label: "Vertical", value: "vertical" },
              ]}
              selected={[builderSettings.layoutOrientation]}
              onChange={(value) =>
                updateBuilderSetting(
                  "layoutOrientation",
                  value[0] as BuilderSettings["layoutOrientation"]
                )
              }
            />
            <ChoiceList
              title="Alignment"
              choices={[
                { label: "Left", value: "left" },
                { label: "Right", value: "right" },
                { label: "Center", value: "center" },
              ]}
              selected={[builderSettings.layoutAlignment]}
              onChange={(value) =>
                updateBuilderSetting(
                  "layoutAlignment",
                  value[0] as BuilderSettings["layoutAlignment"]
                )
              }
            />
            <TextField
              label="Menu max width"
              value={builderSettings.layoutMaxWidth}
              onChange={(value) => updateBuilderSetting("layoutMaxWidth", value)}
              suffix="px"
              autoComplete="off"
            />
          </BlockStack>

          <Divider />

          <BlockStack gap="300">
            <Text as="h3" variant="headingSm">
              Animation
            </Text>
            <Select
              label="Trigger - Desktop"
              options={[
                { label: "Hover", value: "hover" },
                { label: "Click", value: "click" },
              ]}
              value={builderSettings.animationDesktopTrigger}
              onChange={(value) =>
                updateBuilderSetting(
                  "animationDesktopTrigger",
                  value as BuilderSettings["animationDesktopTrigger"]
                )
              }
            />
            <Select
              label="Trigger - Mobile"
              options={[
                { label: "Click toggle button", value: "toggle" },
                { label: "Tap", value: "tap" },
              ]}
              value={builderSettings.animationMobileTrigger}
              onChange={(value) =>
                updateBuilderSetting(
                  "animationMobileTrigger",
                  value as BuilderSettings["animationMobileTrigger"]
                )
              }
            />
            <Select
              label="Effect"
              options={[
                { label: "Fade", value: "fade" },
                { label: "Slide", value: "slide" },
                { label: "Scale", value: "scale" },
              ]}
              value={builderSettings.animationEffect}
              onChange={(value) =>
                updateBuilderSetting(
                  "animationEffect",
                  value as BuilderSettings["animationEffect"]
                )
              }
            />
            <InlineStack gap="200" blockAlign="center">
              <TextField
                label="Transition duration"
                type="number"
                value={String(builderSettings.animationDuration)}
                onChange={(value) =>
                  updateBuilderSetting("animationDuration", toNumber(value))
                }
                suffix="ms"
                autoComplete="off"
              />
              <TextField
                label="Transition delay"
                type="number"
                value={String(builderSettings.animationDelay)}
                onChange={(value) =>
                  updateBuilderSetting("animationDelay", toNumber(value))
                }
                suffix="ms"
                autoComplete="off"
              />
            </InlineStack>
          </BlockStack>

          <Divider />

          <BlockStack gap="300">
            <Text as="h3" variant="headingSm">
              Spacing
            </Text>
            {renderSpacingControl(
              "Main menu padding",
              builderSettings.spacingMainPadding,
              (value) => updateBuilderSetting("spacingMainPadding", value),
              0,
              60
            )}
            {renderSpacingControl(
              "Main menu row height",
              builderSettings.spacingMainRowHeight,
              (value) => updateBuilderSetting("spacingMainRowHeight", value),
              30,
              90
            )}
            {renderSpacingControl(
              "Dropdown row height",
              builderSettings.spacingDropdownRowHeight,
              (value) => updateBuilderSetting("spacingDropdownRowHeight", value),
              30,
              90
            )}
            {renderSpacingControl(
              "Tab row height",
              builderSettings.spacingTabRowHeight,
              (value) => updateBuilderSetting("spacingTabRowHeight", value),
              30,
              90
            )}
            {renderSpacingControl(
              "Link list row height",
              builderSettings.spacingLinkListRowHeight,
              (value) => updateBuilderSetting("spacingLinkListRowHeight", value),
              20,
              60
            )}
          </BlockStack>

          <Divider />

          <BlockStack gap="300">
            <Text as="h3" variant="headingSm">
              Carousel
            </Text>
            <Checkbox
              label="Autoplay"
              checked={builderSettings.carouselAutoPlay}
              onChange={(value) => updateBuilderSetting("carouselAutoPlay", value)}
            />
            <Checkbox
              label="Infinite loop"
              checked={builderSettings.carouselLoop}
              onChange={(value) => updateBuilderSetting("carouselLoop", value)}
            />
          </BlockStack>

          <Divider />

          <BlockStack gap="300">
            <Text as="h3" variant="headingSm">
              Advanced
            </Text>
            <TextField
              label="Mobile menu when width is below"
              type="number"
              value={String(builderSettings.advancedMobileBreakpoint)}
              onChange={(value) =>
                updateBuilderSetting("advancedMobileBreakpoint", toNumber(value))
              }
              suffix="px"
              autoComplete="off"
            />
            <Checkbox
              label="Hide link list submenus"
              checked={builderSettings.advancedHideLinkListSubmenu}
              onChange={(value) => updateBuilderSetting("advancedHideLinkListSubmenu", value)}
            />
            <Checkbox
              label="Show Add to cart button"
              checked={builderSettings.advancedShowAddToCart}
              onChange={(value) => updateBuilderSetting("advancedShowAddToCart", value)}
            />
            <Checkbox
              label="Enable lazy loading placeholder"
              checked={builderSettings.advancedEnableLazyLoading}
              onChange={(value) => updateBuilderSetting("advancedEnableLazyLoading", value)}
            />
          </BlockStack>

          <Divider />

          <BlockStack gap="300">
            <Text as="h3" variant="headingSm">
              Elements
            </Text>
            <Checkbox
              label="Show search bar"
              checked={builderSettings.elementsShowSearch}
              onChange={(value) => updateBuilderSetting("elementsShowSearch", value)}
            />
            <Checkbox
              label="Show divider on desktop"
              checked={builderSettings.elementsShowDesktopDivider}
              onChange={(value) => updateBuilderSetting("elementsShowDesktopDivider", value)}
            />
            <Checkbox
              label="Show divider on mobile"
              checked={builderSettings.elementsShowMobileDivider}
              onChange={(value) => updateBuilderSetting("elementsShowMobileDivider", value)}
            />
            <Checkbox
              label="Show indicators (down arrow)"
              checked={builderSettings.elementsShowIndicators}
              onChange={(value) => updateBuilderSetting("elementsShowIndicators", value)}
            />
          </BlockStack>

          <Divider />

          <BlockStack gap="300">
            <Text as="h3" variant="headingSm">
              Account links
            </Text>
            <Checkbox
              label="Show login link"
              checked={builderSettings.accountShowLogin}
              helpText="When logged out"
              onChange={(value) => updateBuilderSetting("accountShowLogin", value)}
            />
            <Checkbox
              label="Show register link"
              checked={builderSettings.accountShowRegister}
              helpText="When logged out"
              onChange={(value) => updateBuilderSetting("accountShowRegister", value)}
            />
            <Checkbox
              label="Show account link"
              checked={builderSettings.accountShowAccount}
              helpText="When logged in"
              onChange={(value) => updateBuilderSetting("accountShowAccount", value)}
            />
            <Checkbox
              label="Show logout link"
              checked={builderSettings.accountShowLogout}
              helpText="When logged in"
              onChange={(value) => updateBuilderSetting("accountShowLogout", value)}
            />
          </BlockStack>

          <Divider />

          <BlockStack gap="300">
            <Text as="h3" variant="headingSm">
              Submenu
            </Text>
            <Checkbox
              label="Show border"
              checked={builderSettings.submenuShowBorder}
              onChange={(value) => updateBuilderSetting("submenuShowBorder", value)}
            />
            <Checkbox
              label="Enable desktop scrollbar"
              checked={builderSettings.submenuEnableDesktopScroll}
              onChange={(value) => updateBuilderSetting("submenuEnableDesktopScroll", value)}
            />
            <Checkbox
              label="Enable mobile scrollbar"
              checked={builderSettings.submenuEnableMobileScroll}
              onChange={(value) => updateBuilderSetting("submenuEnableMobileScroll", value)}
            />
            <TextField
              label="Submenu max width"
              value={builderSettings.submenuMaxWidth}
              onChange={(value) => updateBuilderSetting("submenuMaxWidth", value)}
              suffix="px"
              autoComplete="off"
            />
            <Select
              label="Mobile style"
              options={[
                { label: "Collapse", value: "collapse" },
                { label: "Drawer", value: "drawer" },
              ]}
              value={builderSettings.submenuMobileStyle}
              onChange={(value) =>
                updateBuilderSetting(
                  "submenuMobileStyle",
                  value as BuilderSettings["submenuMobileStyle"]
                )
              }
            />
          </BlockStack>
        </BlockStack>
      </Card>
    );
  };

  const renderCodePanel = () => (
    <Card padding="400">
      <BlockStack gap="300">
        <Text as="h2" variant="headingMd">
          Custom code
        </Text>
        <Divider />
        <BlockStack gap="200">
          <Text as="h3" variant="headingSm">
            Stylesheet / CSS
          </Text>
          <TextField
            label="Custom CSS"
            labelHidden
            value={builderSettings.customCss}
            placeholder="// enter custom CSS here"
            onChange={(value) => updateBuilderSetting("customCss", value)}
            multiline={8}
            autoComplete="off"
            className="rounded-xl bg-white"
          />
        </BlockStack>
      </BlockStack>
    </Card>
  );

  const dropdownGroups = previewMenu?.children ?? [];
  const imageBlockCount = dropdownGroups.filter(
    (group) =>
      group.blockTemplate === "image" ||
      group.blockTemplate === "image2" ||
      group.blockTemplate === "links" ||
      group.blockTemplate === "contact" ||
      group.blockTemplate === "product" ||
      group.blockTemplate === "product-horizontal"
  ).length;
  const linkBlockCount = dropdownGroups.filter((group) => group.blockTemplate === "links").length;
  const hasSpaceBlock = dropdownGroups.some((group) => group.blockTemplate === "space");
  const useImageSpaceLayout =
    imageBlockCount > 0 &&
    hasSpaceBlock &&
    dropdownGroups.every(
      (group) =>
        group.blockTemplate === "image" ||
        group.blockTemplate === "image2" ||
        group.blockTemplate === "links" ||
        group.blockTemplate === "contact" ||
        group.blockTemplate === "product" ||
        group.blockTemplate === "product-horizontal" ||
        group.blockTemplate === "space"
    );
  const useBlockFlexLayout =
    useImageSpaceLayout ||
    dropdownGroups.some((group) => group.blockTemplate === "links");
  const menuAlignmentMap: Record<BuilderSettings["layoutAlignment"], string> = {
    left: "flex-start",
    right: "flex-end",
    center: "center",
  };
  const isMobilePreview = previewMode === "mobile";
  const isVerticalMenu = isMobilePreview || builderSettings.layoutOrientation === "vertical";
  const menuRowHeight = isMobilePreview
    ? Math.max(builderSettings.spacingMainRowHeight, 64)
    : builderSettings.spacingMainRowHeight;
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
  const dropdownOverflowY =
    previewMode === "mobile"
      ? builderSettings.submenuEnableMobileScroll
      : builderSettings.submenuEnableDesktopScroll;
  const enableDropdownScroll = dropdownOverflowY && linkBlockCount === 0;

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
    () => JSON.stringify({ status: menuStatus, items: menuItems, settings: builderSettings }),
    [menuStatus, menuItems, builderSettings]
  );
  const isDirty = currentFingerprint !== savedFingerprint;
  const backDisabled = isDirty || isSaving || requiresExplicitSave;

  useEffect(() => {
    if (saveFetcher.state === "idle" && saveFetcher.data?.ok) {
      setActiveSaveAction(null);
      if (lastSaveIntentRef.current === "save") {
        setSavedFingerprint(currentFingerprint);
        setRequiresExplicitSave(false);
      }
    }
  }, [saveFetcher.state, saveFetcher.data, currentFingerprint]);

  useEffect(() => {
    if (prevMenuIdRef.current === menu.id) {
      return;
    }
    prevMenuIdRef.current = menu.id;
    setMenuStatus(menu.status === "active" ? "active" : "draft");
    setMenuItems(initialMenuItems);
    setBuilderSettings({ ...DEFAULT_BUILDER_SETTINGS, ...menuSettings });
    setRequiresExplicitSave(false);
    setActiveSaveAction(null);
    setSubmenuTemplateTargetId(null);
    setBlockTemplateTargetId(null);
    setSavedFingerprint(
      JSON.stringify({
        status: menu.status,
        items: initialMenuItems,
        settings: { ...DEFAULT_BUILDER_SETTINGS, ...menuSettings },
      })
    );
  }, [menu.id, menuSettings, initialMenuItems]);

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

  const isTemplatePickerOpen = Boolean(submenuTemplateTargetId || blockTemplateTargetId);

  return (
    <div className="menucraft-builder h-screen flex flex-col bg-gray-100">
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
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <InlineStack align="space-between" blockAlign="center" gap="400">
          <InlineStack gap="300" blockAlign="center">
            <Button
              variant="tertiary"
              icon={ArrowLeftIcon}
              disabled={backDisabled}
              onClick={() => navigate({ pathname: returnToPath, search: returnToSearch })}
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
        <div
          className={`pointer-events-none absolute inset-0 z-10 bg-gray-900/40 transition-opacity duration-200 ${
            isTemplatePickerOpen ? "opacity-100" : "opacity-0"
          }`}
          aria-hidden="true"
        />
        <aside className="w-16 bg-white border-r border-gray-200 flex flex-col items-center py-4 gap-2">
          {[
            { id: "menu", icon: MenuIcon, label: "Menu" },
            { id: "settings", icon: SettingsIcon, label: "Settings" },
            { id: "typography", icon: TextIcon, label: "Typography" },
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
                className={`flex h-11 w-11 items-center justify-center rounded-lg transition-colors ${
                  activePanel === panel.id
                    ? "bg-indigo-50 text-indigo-600"
                    : "text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                }`}
              >
                <Icon source={panel.icon} tone={activePanel === panel.id ? "primary" : "subdued"} />
              </button>
              <span className="pointer-events-none absolute left-1/2 top-full z-20 mt-2 -translate-x-1/2 whitespace-nowrap rounded-md border border-gray-200 bg-white px-3 py-1 text-xs font-medium text-gray-700 opacity-0 shadow-sm transition-opacity group-hover:opacity-100">
                <span className="absolute -top-1 left-1/2 h-2 w-2 -translate-x-1/2 rotate-45 border-l border-t border-gray-200 bg-white" />
                {panel.label}
              </span>
            </div>
          ))}
        </aside>

        <aside className="w-80 bg-white border-r border-gray-200 flex flex-col">
          <div className="flex-1 overflow-y-auto">
            <BlockStack gap="400" className="min-h-full h-full">
              {activePanel === "menu" && renderMenuPanel()}
              {activePanel === "settings" && renderSettingsPanel()}
              {activePanel === "typography" && renderTypographyPanel()}
              {activePanel === "colors" && renderColorsPanel()}
              {activePanel === "code" && renderCodePanel()}
            </BlockStack>
          </div>
        </aside>

        <main className="flex-1 overflow-auto relative" style={{ background: themeSettings.canvasBackground }}>
          <Box padding="600">
            <div
              className="menucraft-preview"
              style={{
                maxWidth: previewMode === "mobile" ? 520 : menuMaxWidth ?? 1100,
                margin: "36px auto 0",
                padding: "0 32px",
                fontFamily: themeSettings.fontFamily,
              }}
            >
              {builderSettings.customCss ? (
                <style
                  // Intentionally raw to allow advanced selectors in preview.
                  dangerouslySetInnerHTML={{ __html: builderSettings.customCss }}
                />
              ) : null}
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
              <div style={{ background: previewColors.mainBackground, borderRadius: 0, overflow: "visible" }}>
                <div
                  style={{
                    display: "flex",
                    flexDirection: isVerticalMenu ? "column" : "row",
                    justifyContent: isVerticalMenu ? "flex-start" : menuAlignmentMap[builderSettings.layoutAlignment],
                    gap: 0,
                    height: isVerticalMenu ? "auto" : menuRowHeight,
                    color: previewColors.mainText,
                  }}
                >
                  {menuItems.map((item) => {
                    const isActive = openMenuId === item.id;
                    const isHovered = hoveredMenuId === item.id;
                    const itemBackground = isActive
                      ? previewColors.tabBackgroundActive
                      : isHovered
                        ? previewColors.mainBackgroundHover
                        : previewColors.mainBackground;
                    const itemTextColor = isActive
                      ? previewColors.tabHeadingActive
                      : isHovered
                        ? previewColors.mainTextHover
                        : previewColors.mainText;
                    return (
                      <div
                        key={item.id}
                        className="relative inline-flex"
                        onMouseEnter={() => handlePreviewHoverStart(item.id)}
                        onMouseLeave={handlePreviewHoverEnd}
                      >
                        {hoveredMenuId === item.id && (
                          <div
                            className="absolute z-20 flex items-center gap-1 rounded-lg bg-gray-900 px-2 py-1 shadow-md"
                            style={
                              isMobilePreview
                                ? {
                                    top: "50%",
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
                            handleSelectItem(item.id);
                            setOpenMenuId((prev) => (prev === item.id ? null : item.id));
                          }}
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
                            padding: isVerticalMenu ? (isMobilePreview ? "0 20px" : "0 12px") : "0 18px",
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
                              <span style={{ display: "inline-flex", alignItems: "center" }}>
                                {renderMenuIcon(item.icon, {
                                  size: 14,
                                  color: itemTextColor,
                                  className: "text-current",
                                })}
                              </span>
                            ) : null}
                            <span
                              style={{
                                ...(isActive ? tabTypography : mainTypography),
                                lineHeight: 1.2,
                              }}
                            >
                              {item.label}
                            </span>
                          </span>
                          {builderSettings.elementsShowIndicators && item.children?.length ? (
                            <span style={{ display: "inline-flex", marginLeft: "auto" }}>
                              <ChevronDownIcon width="14" height="14" fill={itemTextColor} />
                            </span>
                          ) : null}
                        </button>
                        {isActive && dropdownGroups.length === 0 && (
                          isVerticalMenu ? (
                            <div style={{ width: "100%" }}>
                              <button
                                type="button"
                                onClick={() => handleAddChild(item.id, "group")}
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  gap: 10,
                                  padding: isMobilePreview ? "16px 18px" : "12px 16px",
                                  width: "100%",
                                  borderRadius: 0,
                                  border: "1px dashed #cbd5e1",
                                  background: "#ffffff",
                                  color: "#111827",
                                  fontSize: 14,
                                  fontWeight: 500,
                                  whiteSpace: "nowrap",
                                }}
                              >
                                <span style={{ fontSize: 16, lineHeight: 1 }}>+</span>
                                Add submenu
                              </button>
                            </div>
                          ) : (
                            <div
                              style={{
                                position: "absolute",
                                left: 0,
                                top: "100%",
                                marginTop: 0,
                                zIndex: 15,
                              }}
                            >
                              <button
                                type="button"
                                onClick={() => handleAddChild(item.id, "group")}
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: 10,
                                  padding: "12px 16px",
                                  minWidth: 180,
                                  borderRadius: 0,
                                  border: "1px dashed #cbd5e1",
                                  background: previewColors.submenuBackground,
                                  color: previewColors.submenuText,
                                  fontSize: 14,
                                  fontWeight: 500,
                                  whiteSpace: "nowrap",
                                }}
                              >
                                <span style={{ fontSize: 16, lineHeight: 1 }}>+</span>
                                Add submenu
                              </button>
                            </div>
                          )
                        )}
                      </div>
                    );
                  })}
                  <button
                    type="button"
                    onClick={handleOpenAddRoot}
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
                  {builderSettings.elementsShowSearch && !isMobilePreview && (
                    <div
                      style={{
                        marginLeft: isVerticalMenu ? 0 : "auto",
                        position: "relative",
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        height: isVerticalMenu ? menuRowHeight : "100%",
                        width: isVerticalMenu ? "100%" : 56,
                        borderLeft:
                          showDividers && !isVerticalMenu
                            ? `1px solid ${previewColors.mainDivider}`
                            : "none",
                        borderTop:
                          showDividers && isVerticalMenu
                            ? `1px solid ${previewColors.mainDivider}`
                            : "none",
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
                          background: isSearchOpen
                            ? previewColors.mainBackgroundHover
                            : previewColors.mainBackground,
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
                  )}
                </div>
              </div>

              {dropdownGroups.length > 0 && (
                <div
                  style={{
                    background: previewColors.submenuBackground,
                    border: builderSettings.submenuShowBorder
                      ? `1px solid ${previewColors.submenuBorder}`
                      : "none",
                    borderRadius: 0,
                    marginTop: 0,
                    padding: "10px",
                    boxShadow: "0 10px 30px rgba(15, 23, 42, 0.15)",
                    maxWidth: submenuMaxWidth ?? "none",
                    overflowY: enableDropdownScroll ? "auto" : "visible",
                    maxHeight: enableDropdownScroll ? 420 : "none",
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
                      ? [...dropdownGroups].sort((a, b) => {
                          const aPriority =
                            a.blockTemplate === "image" ||
                            a.blockTemplate === "image2" ||
                            a.blockTemplate === "contact" ||
                            a.blockTemplate === "product" ||
                            a.blockTemplate === "product-horizontal"
                              ? 0
                              : 1;
                          const bPriority =
                            b.blockTemplate === "image" ||
                            b.blockTemplate === "image2" ||
                            b.blockTemplate === "contact" ||
                            b.blockTemplate === "product" ||
                            b.blockTemplate === "product-horizontal"
                              ? 0
                              : 1;
                          return aPriority - bPriority;
                        })
                      : dropdownGroups;

                    return (
                    <div
                      style={{
                        display: useBlockFlexLayout ? "flex" : "grid",
                        gridTemplateColumns: useBlockFlexLayout
                          ? undefined
                          : `repeat(${dropdownGroups.length}, minmax(0, 1fr))`,
                        gap: useImageSpaceLayout ? 0 : 24,
                        alignItems: useBlockFlexLayout ? "flex-start" : undefined,
                        flexWrap: useBlockFlexLayout ? "wrap" : undefined,
                        color: previewColors.submenuText,
                      }}
                    >
                    {orderedDropdownGroups.map((group) => {
                      const isGroupSelected = selectedItemId === group.id;
                      if (group.blockTemplate === "space") {
                        const spaceGridColumn = useImageSpaceLayout ? undefined : "1 / -1";
                        const spaceMinHeight = useImageSpaceLayout ? 120 : 80;
                        const spaceFlex = useImageSpaceLayout
                          ? linkBlockCount >= 2
                            ? "0 0 100%"
                            : "1 1 auto"
                          : undefined;
                        const spaceOrder = useImageSpaceLayout ? (linkBlockCount >= 2 ? 2 : 1) : undefined;
                        return (
                          <div
                            key={group.id}
                            style={{
                              gridColumn: spaceGridColumn,
                              flex: spaceFlex,
                              order: spaceOrder,
                              border: isGroupSelected
                                ? `2px dashed ${themeSettings.menuActive}`
                                : "1px dashed #cbd5e1",
                              borderRadius: 10,
                              padding: "16px",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              background: previewColors.submenuBackground,
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
                      if (group.blockTemplate === "image" || group.blockTemplate === "image2") {
                        const isOverlayImage = group.blockTemplate === "image2";
                        const imageWidth = Math.max(1, Math.min(12, group.imageWidth ?? 3));
                        const imageScale = `${Math.max(40, Math.round((imageWidth / 12) * 100))}%`;
                        const imageFill = !group.imageNoFill;
                        const imagePreviewHeight = useImageSpaceLayout ? 220 : 150;
                        const imageTextAlign = group.imageTextAlign ?? "left";
                        const imageTextAlignItems =
                          imageTextAlign === "center"
                            ? "center"
                            : imageTextAlign === "right"
                              ? "flex-end"
                              : "flex-start";
                        const imageFlexBasis = `${Math.round((imageWidth / 12) * 100)}%`;
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
                            style={{
                              gridColumn: useImageSpaceLayout ? undefined : undefined,
                              minHeight: useImageSpaceLayout ? 240 : undefined,
                              flex: useImageSpaceLayout ? "0 0 30%" : undefined,
                              order: useImageSpaceLayout ? 0 : undefined,
                              border: isGroupSelected ? `1px dashed ${themeSettings.menuActive}` : undefined,
                              padding: "6px",
                              borderRadius: 0,
                            }}
                          >
                            <div
                              className="pointer-events-none absolute bottom-3 left-1/2 z-10 flex -translate-x-1/2 items-center gap-1 rounded-full bg-gray-900 px-2 py-1 shadow-md opacity-0 transition-opacity group-hover:pointer-events-auto group-hover:opacity-100"
                            >
                              <button
                                type="button"
                                aria-label="Align left"
                                className="flex h-6 w-6 items-center justify-center rounded-md text-white hover:bg-gray-800"
                                onClick={() =>
                                  setMenuItems((items) =>
                                    updateItemById(items, group.id, () => ({
                                      ...group,
                                      imageTextAlign: "left",
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
                                      imageTextAlign: "center",
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
                                      imageTextAlign: "right",
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
                            </div>
                            <div
                              style={{
                                borderRadius: 16,
                                background: "transparent",
                                padding: isOverlayImage ? "0" : "5px",
                                display: "flex",
                                flexDirection: "column",
                                gap: 10,
                              }}
                            >
                              <div
                                style={{
                                  borderRadius: 0,
                                  background: imageFill ? "#ffffff" : "transparent",
                                  border: imageFill && group.imageUrl ? "1px solid #e5e7eb" : "1px solid transparent",
                                  height: imagePreviewHeight,
                                  position: "relative",
                                  overflow: "hidden",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                }}
                              >
                                {group.imageUrl ? (
                                  <img
                                    src={group.imageUrl}
                                    alt={group.label}
                                    style={{ width: imageScale, maxWidth: "100%", maxHeight: "100%" }}
                                  />
                                ) : (
                                  <svg
                                    className="gm-placeholder-svg"
                                    xmlns="http://www.w3.org/2000/svg"
                                    viewBox="0 0 525.5 525.5"
                                    style={{
                                      display: "block",
                                      width: "100%",
                                      height: "100%",
                                      maxWidth: "100%",
                                      maxHeight: "100%",
                                      fill: "rgba(133, 133, 133, 0.35)",
                                      backgroundColor: "rgba(133, 133, 133, 0.1)",
                                      border: "1px solid rgba(133, 133, 133, 0.2)",
                                    }}
                                  >
                                    <path d="M324.5 212.7H203c-1.6 0-2.8 1.3-2.8 2.8V308c0 1.6 1.3 2.8 2.8 2.8h121.6c1.6 0 2.8-1.3 2.8-2.8v-92.5c0-1.6-1.3-2.8-2.9-2.8zm1.1 95.3c0 .6-.5 1.1-1.1 1.1H203c-.6 0-1.1-.5-1.1-1.1v-92.5c0-.6.5-1.1 1.1-1.1h121.6c.6 0 1.1.5 1.1 1.1V308z" />
                                    <path d="M210.4 299.5H240v.1s.1 0 .2-.1h75.2v-76.2h-105v76.2zm1.8-7.2l20-20c1.6-1.6 3.8-2.5 6.1-2.5s4.5.9 6.1 2.5l11.5 11.5 16.8 16.8c-12.9 3.3-20.7 6.3-22.8 7.2h-27.7v-5.5zm101.5-10.1c-20.1 1.7-36.7 4.8-49.1 7.9l-16.9-16.9 26.3-26.3c1.6-1.6 3.8-2.5 6.1-2.5s4.5.9 6.1 2.5l27.5 27.5v7.8zm-68.9 15.5c9.7-3.5 33.9-10.9 68.9-13.8v13.8h-68.9zm68.9-72.7v46.8l-26.2-26.2c-1.9-1.9-4.5-3-7.3-3s-5.4 1.1-7.3 3l-18.8 18.8V225h101.4z" />
                                    <path d="M232.8 254c4.6 0 8.3-3.7 8.3-8.3s-3.7-8.3-8.3-8.3-8.3 3.7-8.3 8.3 3.7 8.3 8.3 8.3zm0-14.9c3.6 0 6.6 2.9 6.6 6.6s-2.9 6.6-6.6 6.6-6.6-2.9-6.6-6.6 3-6.6 6.6-6.6z" />
                                  </svg>
                                )}
                                {isOverlayImage ? (
                                  <div
                                    style={{
                                      position: "absolute",
                                      left: 16,
                                      right: 16,
                                      bottom: 16,
                                      background: "#3f3f3f",
                                      color: "#ffffff",
                                      padding: "10px 12px",
                                      textAlign: imageTextAlign,
                                    }}
                                  >
                                    <div
                                      style={{
                                        fontWeight: 600,
                                        ...subheadingTypography,
                                        lineHeight: 1.2,
                                      }}
                                    >
                                      {group.label}
                                    </div>
                                    <div
                                      style={{
                                        fontSize: 12,
                                        ...descriptionTypography,
                                        lineHeight: 1.2,
                                        color: "#e5e7eb",
                                      }}
                                    >
                                      {group.description || "Sample description"}
                                    </div>
                                  </div>
                                ) : null}
                              </div>
                              {!isOverlayImage ? (
                                <>
                                  <div
                                    style={{
                                      color: previewColors.submenuText,
                                      fontWeight: 600,
                                      ...subheadingTypography,
                                      lineHeight: 1.2,
                                      textAlign: imageTextAlign,
                                      alignSelf: imageTextAlignItems,
                                    }}
                                  >
                                    {group.label}
                                  </div>
                                  <div
                                    style={{
                                      color: previewColors.submenuDescription,
                                      fontSize: 12,
                                      ...descriptionTypography,
                                      lineHeight: 1.2,
                                      textAlign: imageTextAlign,
                                      alignSelf: imageTextAlignItems,
                                    }}
                                  >
                                    {group.description || "Sample description"}
                                  </div>
                                </>
                              ) : null}
                            </div>
                          </div>
                        );
                      }
                      if (group.blockTemplate === "links") {
                        const headingItem = group.children?.find((child) => child.isHeading);
                        const linkItems = (group.children ?? []).filter((child) => !child.isHeading);
                        const columnCount = Math.max(2, group.linkColumns ?? 2);
                        const itemsPerColumn = linkItems.length
                          ? Math.ceil(linkItems.length / columnCount)
                          : 0;
                        const columnsItems = Array.from({ length: columnCount }, (_, columnIndex) =>
                          linkItems.slice(columnIndex * itemsPerColumn, (columnIndex + 1) * itemsPerColumn),
                        );
                        const linkWidth = Math.max(1, Math.min(12, group.linkWidth ?? 6));
                        const linkFlexBasis = `${Math.round((linkWidth / 12) * 100)}%`;
                        const linkTextAlign = group.linkTextAlign ?? "left";
                        const headingLabel = headingItem?.label ?? "Heading";
                        const headingSelected = headingItem ? selectedItemId === headingItem.id : false;
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
                            style={{
                              flex: useBlockFlexLayout ? `0 0 ${linkFlexBasis}` : undefined,
                              order: useImageSpaceLayout ? 0 : undefined,
                              border: isGroupSelected ? `1px dashed ${themeSettings.menuActive}` : undefined,
                              padding: "0",
                              borderRadius: 0,
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
                              <div>
                                <div className="group/heading relative">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (headingItem) {
                                        handleSelectItem(headingItem.id);
                                      }
                                    }}
                                    style={{
                                      width: "100%",
                                      textAlign: linkTextAlign,
                                      border: headingSelected
                                        ? `2px dashed ${themeSettings.menuActive}`
                                        : "2px solid transparent",
                                      borderRadius: 8,
                                      padding: "4px 8px",
                                      paddingRight: 56,
                                      background: "transparent",
                                      color: previewColors.submenuHeading,
                                      fontWeight: 600,
                                      ...subheadingTypography,
                                      lineHeight: 1.2,
                                    }}
                                  >
                                    {headingLabel}
                                  </button>
                                  {headingItem ? (
                                    <div className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 opacity-0 transition-opacity group-hover/heading:pointer-events-auto group-hover/heading:opacity-100">
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
                                  ) : null}
                                </div>
                              </div>
                              <div
                                style={{
                                  borderTop: `1px solid ${previewColors.submenuHeading}`,
                                  opacity: 0.5,
                                }}
                              />
                              <div
                                style={{
                                  display: "flex",
                                  gap: 32,
                                }}
                              >
                                {columnsItems.map((column, columnIndex) => (
                                  <div
                                    key={`column-${columnIndex}`}
                                    style={{ display: "flex", flexDirection: "column", gap: 6, flex: "1 1 0" }}
                                  >
                                    {column.map((child) => {
                                      const isChildSelected = selectedItemId === child.id;
                                      return (
                                        <div key={child.id} className="group/item relative">
                                          <button
                                            type="button"
                                            onClick={() => handleSelectItem(child.id)}
                                            onMouseEnter={(event) => {
                                              event.currentTarget.style.color = previewColors.submenuTextHover;
                                            }}
                                            onMouseLeave={(event) => {
                                              event.currentTarget.style.color = previewColors.submenuText;
                                            }}
                                          style={{
                                            textAlign: linkTextAlign,
                                            border: isChildSelected
                                              ? `2px dashed ${themeSettings.menuActive}`
                                              : "2px solid transparent",
                                            borderRadius: 8,
                                            padding: "6px 8px",
                                              paddingRight: 56,
                                              background: "transparent",
                                              color: previewColors.submenuText,
                                              width: "100%",
                                              ...subtextTypography,
                                              lineHeight: 1.2,
                                            }}
                                          >
                                            <div style={{ fontWeight: 600, ...subheadingTypography, lineHeight: 1.2 }}>
                                              {child.label}
                                            </div>
                                            {child.description ? (
                                              <div
                                                style={{
                                                  fontSize: 12,
                                                  ...descriptionTypography,
                                                  lineHeight: 1.3,
                                                  color: previewColors.submenuDescription,
                                                }}
                                              >
                                                {child.description}
                                              </div>
                                            ) : null}
                                          </button>
                                          <div className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 opacity-0 transition-opacity group-hover/item:pointer-events-auto group-hover/item:opacity-100">
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
                              <button
                                type="button"
                                onClick={() => handleAddChild(group.id, "item")}
                                className="flex items-center gap-2 text-sm font-medium"
                                style={{
                                  alignSelf: "flex-start",
                                  minHeight: builderSettings.spacingLinkListRowHeight,
                                  color: themeSettings.menuActive,
                                  background: "transparent",
                                  border: "none",
                                  padding: 0,
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
                            <div className="pointer-events-none absolute left-1/2 top-full z-10 -translate-x-1/2 pt-4 opacity-0 transition-opacity group-hover:pointer-events-auto group-hover:opacity-100">
                              <div className="flex items-center gap-1 rounded-full bg-gray-900 px-2 py-1 shadow-md">
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
                              </div>
                            </div>
                          </div>
                        );
                      }
                      if (group.blockTemplate === "contact") {
                        const contactWidth = Math.max(1, Math.min(12, group.imageWidth ?? 6));
                        const contactFlexBasis = `${Math.round((contactWidth / 12) * 100)}%`;
                        const contactNamePlaceholder = group.contactNameLabel || "Name";
                        const contactEmailPlaceholder = group.contactEmailLabel || "Email";
                        const contactPhonePlaceholder = group.contactPhoneLabel || "Phone number";
                        const contactMessagePlaceholder = group.contactMessageLabel || "Message";
                        const contactSubmitLabel = group.contactSubmitLabel || "Send";
                        const contactSuccessMessage =
                          group.contactSuccessMessage ||
                          "Thanks for contacting us. We'll get back to you soon.";
                        const activeContactItemId =
                          contactFetcher.submission?.formData.get("menuItemId");
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
                            style={{
                              minHeight: useImageSpaceLayout ? 240 : undefined,
                              flex: useImageSpaceLayout ? `0 0 ${contactFlexBasis}` : undefined,
                              order: useImageSpaceLayout ? 0 : undefined,
                              border: isGroupSelected ? `1px dashed ${themeSettings.menuActive}` : undefined,
                              padding: "6px",
                              borderRadius: 0,
                            }}
                          >
                            <div
                              className="pointer-events-none absolute right-4 top-3 z-10 flex items-center gap-1 rounded-full bg-gray-900 px-2 py-1 shadow-md opacity-0 transition-opacity group-hover:pointer-events-auto group-hover:opacity-100"
                            >
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
                                  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
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
                      if (
                        group.blockTemplate === "product" ||
                        group.blockTemplate === "product-horizontal"
                      ) {
                        const productWidth = Math.max(1, Math.min(12, group.productWidth ?? 3));
                        const productLayout =
                          group.productLayout ??
                          (group.blockTemplate === "product-horizontal" ? "image-left" : "image-top");
                        const productFlexBasis = `${Math.round((productWidth / 12) * 100)}%`;
                        const resolvedProductFlexBasis =
                          group.blockTemplate === "product-horizontal" ? "33%" : productFlexBasis;
                        const productPreviewHeight = useImageSpaceLayout ? 220 : 150;
                        const selectedProductIds = group.productIds ?? [];
                        const selectedProducts = selectedProductIds
                          .map((id) => products.find((product) => product.id === id))
                          .filter((product): product is ProductSummary => Boolean(product));
                        const displayProducts = selectedProducts.length ? selectedProducts : [null];
                        const cardGridStyle =
                          productLayout === "image-top" && displayProducts.length > 1
                            ? {
                                display: "grid",
                                gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                                gap: 16,
                              }
                            : { display: "grid", gap: 16 };
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
                            style={{
                              flex: useImageSpaceLayout ? `0 0 ${resolvedProductFlexBasis}` : undefined,
                              order: useImageSpaceLayout ? 0 : undefined,
                              border: isGroupSelected ? `1px dashed ${themeSettings.menuActive}` : undefined,
                              padding: "6px",
                              borderRadius: 0,
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
                            <div
                              style={{
                                borderRadius: 16,
                                background: "transparent",
                                padding: "5px",
                                display: "flex",
                                flexDirection: "column",
                                gap: 10,
                              }}
                            >
                              <div style={cardGridStyle}>
                                {displayProducts.map((product, index) => {
                                  const title = product?.title ?? "Example Product Title";
                                  const imageSrc = product?.featuredImage?.url;
                                  const imageAlt = product?.featuredImage?.altText ?? title;
                                  const hasImage = Boolean(imageSrc);
                                  const isImageLeft = productLayout === "image-left";
                                  const productImageSize = isImageLeft ? 74 : undefined;
                                  const priceAmount = product?.priceRange?.minVariantPrice?.amount;
                                  const priceCurrency = product?.priceRange?.minVariantPrice?.currencyCode;
                                  const fallbackCurrency = priceCurrency || "USD";
                                  let priceLabel =
                                    fallbackCurrency === "TRY"
                                      ? "₺ 19,99"
                                      : fallbackCurrency === "USD"
                                        ? "$ 19,99"
                                        : "$19.99";
                                  if (priceAmount) {
                                    const rawAmount = priceAmount.trim();
                                    const value = Number(rawAmount.replace(",", "."));
                                    if (Number.isFinite(value)) {
                                      const decimalSeparator = rawAmount.includes(".")
                                        ? "."
                                        : rawAmount.includes(",")
                                          ? ","
                                          : null;
                                      const [wholePartRaw, decimalPartRaw = ""] = decimalSeparator
                                        ? rawAmount.split(decimalSeparator)
                                        : [rawAmount, ""];
                                      const wholePart = (wholePartRaw ?? "").replace(/^0+/, "");
                                      const decimalPart = decimalPartRaw.replace(/\s+/g, "");
                                      const hasOnlyZeros = decimalPart.length > 0 && /^0+$/.test(decimalPart);
                                      const shouldNormalize =
                                        (!decimalSeparator && wholePart.length > 4) || (hasOnlyZeros && wholePart.length > 4);
                                      const normalizedValue = shouldNormalize ? value / 100 : value;
                                      try {
                                        if (fallbackCurrency === "USD") {
                                          priceLabel = `$ ${normalizedValue.toLocaleString("tr-TR", {
                                            minimumFractionDigits: 2,
                                            maximumFractionDigits: 2,
                                          })}`;
                                        } else if (fallbackCurrency === "TRY") {
                                          const locale = "tr-TR";
                                          const parts = new Intl.NumberFormat(locale, {
                                            style: "currency",
                                            currency: fallbackCurrency,
                                            minimumFractionDigits: 2,
                                            maximumFractionDigits: 2,
                                          }).formatToParts(normalizedValue);
                                          const currencyPart = parts.find((part) => part.type === "currency")?.value ?? "₺";
                                          const numberPart = parts
                                            .filter((part) => part.type !== "currency")
                                            .map((part) => part.value)
                                            .join("")
                                            .trim();
                                          priceLabel = `${currencyPart} ${numberPart}`;
                                        } else {
                                          priceLabel = new Intl.NumberFormat("en-US", {
                                            style: "currency",
                                            currency: fallbackCurrency,
                                            minimumFractionDigits: 2,
                                            maximumFractionDigits: 2,
                                          }).format(normalizedValue);
                                        }
                                      } catch {
                                        priceLabel =
                                          fallbackCurrency === "TRY"
                                            ? `₺ ${normalizedValue.toFixed(2).replace(".", ",")}`
                                            : fallbackCurrency === "USD"
                                              ? `$ ${normalizedValue.toFixed(2).replace(".", ",")}`
                                              : `$${normalizedValue.toFixed(2)}`;
                                      }
                                    }
                                  }
                                  return (
                                    <div
                                      key={product?.id ?? `placeholder-${index}`}
                                      style={{
                                        display: "flex",
                                        flexDirection: isImageLeft ? "row" : "column",
                                        gap: 12,
                                        alignItems: isImageLeft ? "center" : undefined,
                                      }}
                                    >
                                    <div
                                      style={{
                                        border: "1px solid #e5e7eb",
                                        background: "#f3f4f4",
                                        width: isImageLeft ? productImageSize : "100%",
                                        height: isImageLeft ? productImageSize : "auto",
                                        maxHeight: isImageLeft ? undefined : productPreviewHeight,
                                        aspectRatio: isImageLeft ? undefined : "1 / 1",
                                        flex: isImageLeft ? `0 0 ${productImageSize}px` : undefined,
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        overflow: "hidden",
                                        boxSizing: "border-box",
                                      }}
                                      >
                                        {hasImage ? (
                                          <img
                                            src={imageSrc}
                                            alt={imageAlt}
                                            style={{
                                              width: "100%",
                                              height: "100%",
                                              maxWidth: "100%",
                                              maxHeight: "100%",
                                              objectFit: "contain",
                                            }}
                                          />
                                        ) : (
                                          <svg
                                            className="gm-placeholder-svg"
                                            xmlns="http://www.w3.org/2000/svg"
                                            viewBox="0 0 525.5 525.5"
                                            style={{
                                              width: "68%",
                                              height: "68%",
                                              fill: "rgba(148, 163, 184, 0.6)",
                                            }}
                                          >
                                            <path d="M375.5 345.2c0-.1 0-.1 0 0 0-.1 0-.1 0 0-1.1-2.9-2.3-5.5-3.4-7.8-1.4-4.7-2.4-13.8-.5-19.8 3.4-10.6 3.6-40.6 1.2-54.5-2.3-14-12.3-29.8-18.5-36.9-5.3-6.2-12.8-14.9-15.4-17.9 8.6-5.6 13.3-13.3 14-23 0-.3 0-.6.1-.8.4-4.1-.6-9.9-3.9-13.5-2.1-2.3-4.8-3.5-8-3.5h-54.9c-.8-7.1-3-13-5.2-17.5-6.8-13.9-12.5-16.5-21.2-16.5h-.7c-8.7 0-14.4 2.5-21.2 16.5-2.2 4.5-4.4 10.4-5.2 17.5h-48.5c-3.2 0-5.9 1.2-8 3.5-3.2 3.6-4.3 9.3-3.9 13.5 0 .2 0 .5.1.8.7 9.8 5.4 17.4 14 23-2.6 3.1-10.1 11.7-15.4 17.9-6.1 7.2-16.1 22.9-18.5 36.9-2.2 13.3-1.2 47.4 1 54.9 1.1 3.8 1.4 14.5-.2 19.4-1.2 2.4-2.3 5-3.4 7.9-4.4 11.6-6.2 26.3-5 32.6 1.8 9.9 16.5 14.4 29.4 14.4h176.8c12.9 0 27.6-4.5 29.4-14.4 1.2-6.5-.5-21.1-5-32.7zm-97.7-178c.3-3.2.8-10.6-.2-18 2.4 4.3 5 10.5 5.9 18h-5.7zm-36.3-17.9c-1 7.4-.5 14.8-.2 18h-5.7c.9-7.5 3.5-13.7 5.9-18zm4.5-6.9c0-.1.1-.2.1-.4 4.4-5.3 8.4-5.8 13.1-5.8h.7c4.7 0 8.7.6 13.1 5.8 0 .1 0 .2.1.4 3.2 8.9 2.2 21.2 1.8 25h-30.7c-.4-3.8-1.3-16.1 1.8-25zm-70.7 42.5c0-.3 0-.6-.1-.9-.3-3.4.5-8.4 3.1-11.3 1-1.1 2.1-1.7 3.4-2.1l-.6.6c-2.8 3.1-3.7 8.1-3.3 11.6 0 .2 0 .5.1.8.3 3.5.9 11.7 10.6 18.8.3.2.8.2 1-.2.2-.3.2-.8-.2-1-9.2-6.7-9.8-14.4-10-17.7 0-.3 0-.6-.1-.8-.3-3.2.5-7.7 3-10.5.8-.8 1.7-1.5 2.6-1.9h155.7c1 .4 1.9 1.1 2.6 1.9 2.5 2.8 3.3 7.3 3 10.5 0 .2 0 .5-.1.8-.3 3.6-1 13.1-13.8 20.1-.3.2-.5.6-.3 1 .1.2.4.4.6.4.1 0 .2 0 .3-.1 13.5-7.5 14.3-17.5 14.6-21.3 0-.3 0-.5.1-.8.4-3.5-.5-8.5-3.3-11.6l-.6-.6c1.3.4 2.5 1.1 3.4 2.1 2.6 2.9 3.5 7.9 3.1 11.3 0 .3 0 .6-.1.9-1.5 20.9-23.6 31.4-65.5 31.4h-43.8c-41.8 0-63.9-10.5-65.4-31.4zm91 89.1h-7c0-1.5 0-3-.1-4.2-.2-12.5-2.2-31.1-2.7-35.1h3.6c.8 0 1.4-.6 1.4-1.4v-14.1h2.4v14.1c0 .8.6 1.4 1.4 1.4h3.7c-.4 3.9-2.4 22.6-2.7 35.1v4.2zm65.3 11.9h-16.8c-.4 0-.7.3-.7.7 0 .4.3.7.7.7h16.8v2.8h-62.2c0-.9-.1-1.9-.1-2.8h33.9c.4 0 .7-.3.7-.7 0-.4-.3-.7-.7-.7h-33.9c-.1-3.2-.1-6.3-.1-9h62.5v9zm-12.5 24.4h-6.3l.2-1.6h5.9l.2 1.6zm-5.8-4.5l1.6-12.3h2l1.6 12.3h-5.2zm-57-19.9h-62.4v-9h62.5c0 2.7 0 5.8-.1 9zm-62.4 1.4h62.4c0 .9-.1 1.8-.1 2.8H194v-2.8zm65.2 0h7.3c0 .9.1 1.8.1 2.8H259c.1-.9.1-1.8.1-2.8zm7.2-1.4h-7.2c.1-3.2.1-6.3.1-9h7c0 2.7 0 5.8.1 9zm-7.7-66.7v6.8h-9v-6.8h9zm-8.9 8.3h9v.7h-9v-.7zm0 2.1h9v2.3h-9v-2.3zm26-1.4h-9v-.7h9v.7zm-9 3.7v-2.3h9v2.3h-9zm9-5.9h-9v-6.8h9v6.8zm-119.3 91.1c-2.1-7.1-3-40.9-.9-53.6 2.2-13.5 11.9-28.6 17.8-35.6 5.6-6.5 13.5-15.7 15.7-18.3 11.4 6.4 28.7 9.6 51.8 9.6h6v14.1c0 .8.6 1.4 1.4 1.4h5.4c.3 3.1 2.4 22.4 2.7 35.1 0 1.2.1 2.6.1 4.2h-63.9c-.8 0-1.4.6-1.4 1.4v16.1c0 .8.6 1.4 1.4 1.4H256c-.8 11.8-2.8 24.7-8 33.3-2.6 4.4-4.9 8.5-6.9 12.2-.4.7-.1 1.6.6 1.9.2.1.4.2.6.2.5 0 1-.3 1.3-.8 1.9-3.7 4.2-7.7 6.8-12.1 5.4-9.1 7.6-22.5 8.4-34.7h7.8c.7 11.2 2.6 23.5 7.1 32.4.2.5.8.8 1.3.8.2 0 .4 0 .6-.2.7-.4 1-1.2.6-1.9-4.3-8.5-6.1-20.3-6.8-31.1H312l-2.4 18.6c-.1.4.1.8.3 1.1.3.3.7.5 1.1.5h9.6c.4 0 .8-.2 1.1-.5.3-.3.4-.7.3-1.1l-2.4-18.6H333c.8 0 1.4-.6 1.4-1.4v-16.1c0-.8-.6-1.4-1.4-1.4h-63.9c0-1.5 0-2.9.1-4.2.2-12.7 2.3-32 2.7-35.1h5.2c.8 0 1.4-.6 1.4-1.4v-14.1h6.2c23.1 0 40.4-3.2 51.8-9.6 2.3 2.6 10.1 11.8 15.7 18.3 5.9 6.9 15.6 22.1 17.8 35.6 2.2 13.4 2 43.2-1.1 53.1-1.2 3.9-1.4 8.7-1 13-1.7-2.8-2.9-4.4-3-4.6-.2-.3-.6-.5-.9-.6h-.5c-.2 0-.4.1-.5.2-.6.5-.8 1.4-.3 2 0 0 .2.3.5.8 1.4 2.1 5.6 8.4 8.9 16.7h-42.9v-43.8c0-.8-.6-1.4-1.4-1.4s-1.4.6-1.4 1.4v44.9c0 .1-.1.2-.1.3 0 .1 0 .2.1.3v9c-1.1 2-3.9 3.7-10.5 3.7h-7.5c-.4 0-.7.3-.7.7 0 .4.3.7.7.7h7.5c5 0 8.5-.9 10.5-2.8-.1 3.1-1.5 6.5-10.5 6.5H210.4c-9 0-10.5-3.4-10.5-6.5 2 1.9 5.5 2.8 10.5 2.8h67.4c.4 0 .7-.3.7-.7 0-.4-.3-.7-.7-.7h-67.4c-6.7 0-9.4-1.7-10.5-3.7v-54.5c0-.8-.6-1.4-1.4-1.4s-1.4.6-1.4 1.4v43.8h-43.6c4.2-10.2 9.4-17.4 9.5-17.5.5-.6.3-1.5-.3-2s-1.5-.3-2 .3c-.1.2-1.4 2-3.2 5 .1-4.9-.4-10.2-1.1-12.8zm221.4 60.2c-1.5 8.3-14.9 12-26.6 12H174.4c-11.8 0-25.1-3.8-26.6-12-1-5.7.6-19.3 4.6-30.2H197v9.8c0 6.4 4.5 9.7 13.4 9.7h105.4c8.9 0 13.4-3.3 13.4-9.7v-9.8h44c4 10.9 5.6 24.5 4.6 30.2z"></path>
                                            <path d="M286.1 359.3c0 .4.3.7.7.7h14.7c.4 0 .7-.3.7-.7 0-.4-.3-.7-.7-.7h-14.7c-.3 0-.7.3-.7.7zm5.3-145.6c13.5-.5 24.7-2.3 33.5-5.3.4-.1.6-.5.4-.9-.1-.4-.5-.6-.9-.4-8.6 3-19.7 4.7-33 5.2-.4 0-.7.3-.7.7 0 .4.3.7.7.7zm-11.3.1c.4 0 .7-.3.7-.7 0-.4-.3-.7-.7-.7H242c-19.9 0-35.3-2.5-45.9-7.4-.4-.2-.8 0-.9.3-.2.4 0 .8.3.9 10.8 5 26.4 7.5 46.5 7.5h38.1zm-7.2 116.9c.4.1.9.1 1.4.1 1.7 0 3.4-.7 4.7-1.9 1.4-1.4 1.9-3.2 1.5-5-.2-.8-.9-1.2-1.7-1.1-.8.2-1.2.9-1.1 1.7.3 1.2-.4 2-.7 2.4-.9.9-2.2 1.3-3.4 1-.8-.2-1.5.3-1.7 1.1s.2 1.5 1 1.7z"></path>
                                            <path d="M275.5 331.6c-.8 0-1.4.6-1.5 1.4 0 .8.6 1.4 1.4 1.5h.3c3.6 0 7-2.8 7.7-6.3.2-.8-.4-1.5-1.1-1.7-.8-.2-1.5.4-1.7 1.1-.4 2.3-2.8 4.2-5.1 4zm5.4 1.6c-.6.5-.6 1.4-.1 2 1.1 1.3 2.5 2.2 4.2 2.8.2.1.3.1.5.1.6 0 1.1-.3 1.3-.9.3-.7-.1-1.6-.8-1.8-1.2-.5-2.2-1.2-3-2.1-.6-.6-1.5-.6-2.1-.1zm-38.2 12.7c.5 0 .9 0 1.4-.1.8-.2 1.3-.9 1.1-1.7-.2-.8-.9-1.3-1.7-1.1-1.2.3-2.5-.1-3.4-1-.4-.4-1-1.2-.8-2.4.2-.8-.3-1.5-1.1-1.7-.8-.2-1.5.3-1.7 1.1-.4 1.8.1 3.7 1.5 5 1.2 1.2 2.9 1.9 4.7 1.9z"></path>
                                            <path d="M241.2 349.6h.3c.8 0 1.4-.7 1.4-1.5s-.7-1.4-1.5-1.4c-2.3.1-4.6-1.7-5.1-4-.2-.8-.9-1.3-1.7-1.1-.8.2-1.3.9-1.1 1.7.7 3.5 4.1 6.3 7.7 6.3zm-9.7 3.6c.2 0 .3 0 .5-.1 1.6-.6 3-1.6 4.2-2.8.5-.6.5-1.5-.1-2s-1.5-.5-2 .1c-.8.9-1.8 1.6-3 2.1-.7.3-1.1 1.1-.8 1.8 0 .6.6.9 1.2.9z"></path>
                                          </svg>
                                        )}
                                      </div>
                                      <div
                                        style={{
                                          display: "flex",
                                          flexDirection: "column",
                                          gap: 6,
                                          justifyContent: "center",
                                        }}
                                      >
                                        <div
                                          style={{
                                            color: previewColors.submenuText,
                                            fontWeight: 600,
                                            ...subheadingTypography,
                                            lineHeight: 1.2,
                                          }}
                                        >
                                          {title}
                                        </div>
                                        <div
                                          style={{
                                            color: previewColors.submenuDescription,
                                            ...descriptionTypography,
                                            lineHeight: 1.2,
                                          }}
                                        >
                                          {priceLabel}
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                        );
                      }
                      return (
                        <div
                          key={group.id}
                          style={{
                            border: isGroupSelected ? `2px dashed ${themeSettings.menuActive}` : "2px solid transparent",
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
                                      ? `2px dashed ${themeSettings.menuActive}`
                                      : "2px solid transparent",
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

          <div className="absolute bottom-6 left-6">
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
        </main>
        {renderBlockTemplatePreviewPanel()}
        {renderBlockTemplatePicker()}
        {renderSubmenuTemplatePreviewPanel()}
        {renderSubmenuTemplatePicker()}
      </div>
    </div>
  );
}
