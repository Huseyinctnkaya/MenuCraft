import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties, ReactNode } from "react";
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
  { id: "collection", label: "Collection list", icon: CollectionIcon },
  { id: "blogs", label: "Blogs", icon: BlogIcon },
  { id: "contact", label: "Contact form", icon: EmailIcon },
  { id: "html", label: "Custom HTML", icon: CodeIcon },
];

const EXCLUDED_LUCIDE_EXPORTS = new Set(["Icon", "LucideIcon"]);

const formatLucideLabel = (name: string) =>
  name.replace(/([a-z0-9])([A-Z])/g, "$1 $2").replace(/([A-Z])([A-Z][a-z])/g, "$1 $2");

const formatLucideId = (name: string) =>
  name.replace(/([a-z0-9])([A-Z])/g, "$1-$2").replace(/([A-Z])([A-Z][a-z])/g, "$1-$2").toLowerCase();

const rawLucideIcons = Object.entries(LucideIcons)
  .filter(([name, IconComponent]) => {
    if (EXCLUDED_LUCIDE_EXPORTS.has(name)) return false;
    if (!/^[A-Z]/.test(name)) return false;
    return typeof IconComponent === "function" || (typeof IconComponent === "object" && IconComponent);
  })
  .map(([name, IconComponent]) => ({
    id: formatLucideId(name),
    label: formatLucideLabel(name),
    Icon: IconComponent as LucideIcon,
  }));

const uniqueLucideIcons = new Map<string, { id: string; label: string; Icon: LucideIcon }>();
for (const icon of rawLucideIcons) {
  if (!uniqueLucideIcons.has(icon.id)) {
    uniqueLucideIcons.set(icon.id, icon);
  }
}

const ICON_LIBRARY = Array.from(uniqueLucideIcons.values()).sort((a, b) =>
  a.label.localeCompare(b.label)
);

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

  let collections: Array<{
    id: string;
    title: string;
    handle: string;
    image?: { url: string; altText?: string | null } | null;
  }> = [];
  let products: ProductSummary[] = [];
  let blogs: BlogSummary[] = [];
  let latestArticles: LatestArticleSummary[] = [];

  try {
    const response = await admin.graphql(
      `query MenuItemPicker($collectionsFirst: Int!, $productsFirst: Int!, $blogsFirst: Int!, $articlesFirst: Int!, $latestArticlesFirst: Int!) {
        collections(first: $collectionsFirst, sortKey: TITLE) {
          nodes {
            id
            title
            handle
            image {
              url
              altText
            }
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
        blogs(first: $blogsFirst, sortKey: TITLE) {
          nodes {
            id
            title
            handle
            articles(first: $articlesFirst) {
              nodes {
                id
                title
                handle
                image {
                  url
                  altText
                }
              }
            }
          }
        }
        articles(first: $latestArticlesFirst, sortKey: PUBLISHED_AT, reverse: true) {
          nodes {
            id
            title
            handle
            image {
              url
              altText
            }
            blog {
              handle
            }
          }
        }
      }`,
      {
        variables: {
          collectionsFirst: 20,
          productsFirst: 20,
          blogsFirst: 20,
          articlesFirst: 4,
          latestArticlesFirst: 4,
        },
      }
    );
    const data = await response.json();
    if (data?.errors?.length) {
      console.error("Collections/products/blogs query errors", data.errors);
    }
    collections = data?.data?.collections?.nodes ?? [];
    products = data?.data?.products?.nodes ?? [];
    blogs = data?.data?.blogs?.nodes ?? [];
    latestArticles = data?.data?.articles?.nodes ?? [];
  } catch (error) {
    console.error("Failed to fetch collections/products/blogs", error);
    collections = [];
    products = [];
    blogs = [];
    latestArticles = [];
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
    blogs,
    latestArticles,
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
  submenuType?: "mega" | "dropdown" | "horizontal-dropdown";
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
  htmlContent?: string;
  productIds?: string[];
  collectionIds?: string[];
  blogIds?: string[];
  productLayout?: "image-top" | "image-left";
  collectionLayout?: "image-top" | "image-left";
  productWidth?: number;
  productListCount?: number;
  linkColumns?: number;
  linkWidth?: number;
  linkTextAlign?: "left" | "center" | "right";
  isHeading?: boolean;
  multiLayout?:
  | "multi-links"
  | "multi-3-photo"
  | "multi-2-photos"
  | "multi-1-3-photos"
  | "multi-4-images"
  | "multi-4-products"
  | "multi-map-contact-address"
  | "multi-4-product-list"
  | "multi-1-column-3-product-list"
  | "multi-product-carousel"
  | "multi-link-list-product-carousel"
  | "multi-image-product-carousel"
  | "multi-element-group-masonry";
};

type SubmenuTemplateId = "custom" | "tabs" | "mega" | "dropdown" | "horizontal-dropdown";
type BlockTemplateId =
  | "space"
  | "multi"
  | "multi-3-photo"
  | "multi-2-photos"
  | "multi-1-3-photos"
  | "multi-4-images"
  | "multi-4-products"
  | "multi-map-contact-address"
  | "multi-4-product-list"
  | "multi-1-column-3-product-list"
  | "multi-product-carousel"
  | "multi-link-list-product-carousel"
  | "multi-image-product-carousel"
  | "multi-element-group-masonry"
  | "multi-4-product-list"
  | "tabs"
  | "image"
  | "image2"
  | "links"
  | "links-easy"
  | "links-3"
  | "links-icons"
  | "product"
  | "product-horizontal"
  | "product-grid"
  | "product-carousel"
  | "product-list"
  | "product-grid-horizontal"
  | "collection"
  | "collection-horizontal"
  | "blogs"
  | "blogs-latest"
  | "html-special"
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

type BlogSummary = {
  id: string;
  title: string;
  handle: string;
  articles?: {
    nodes: Array<{
      id: string;
      title: string;
      handle: string;
      image?: { url: string; altText?: string | null } | null;
    }>;
  } | null;
};

type LatestArticleSummary = {
  id: string;
  title: string;
  handle: string;
  image?: { url: string; altText?: string | null } | null;
  blog?: { handle: string } | null;
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
  layoutAlignment: "center",
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

const normalizeMultiBlocks = (items: MenuItem[]): MenuItem[] => {
  let changed = false;
  const next = items.flatMap((item) => {
    if (item.blockTemplate === "multi") {
      changed = true;
      return normalizeMultiBlocks(item.children ?? []);
    }
    let nextItem = item;
    if (item.children?.length) {
      const nextChildren = normalizeMultiBlocks(item.children);
      if (nextChildren !== item.children) {
        changed = true;
        nextItem = { ...item, children: nextChildren };
      }
    }
    return [nextItem];
  });
  return changed ? next : items;
};

export default function MenuBuilder() {
  const { menu, menuItems: initialMenuItems, menuSettings, collections, products, blogs, latestArticles } =
    useLoaderData<typeof loader>();
  const normalizedMenuItems = useMemo(
    () => normalizeMultiBlocks(initialMenuItems),
    [initialMenuItems]
  );
  const appData = useRouteLoaderData<typeof appLoader>("routes/app");
  const apiKey = appData?.apiKey ?? "";
  const planTier = (appData as { planTier?: string } | null)?.planTier ?? "plus";
  const isPlusPlan = planTier === "plus";
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

  const [menuItems, setMenuItems] = useState<MenuItem[]>(normalizedMenuItems);
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
  const [productPickerTargetId, setProductPickerTargetId] = useState<string | null>(null);
  const [collectionPickerOpen, setCollectionPickerOpen] = useState(false);
  const [collectionPickerSearch, setCollectionPickerSearch] = useState("");
  const [collectionPickerSelection, setCollectionPickerSelection] = useState<Record<string, boolean>>({});
  const [collectionPickerTargetId, setCollectionPickerTargetId] = useState<string | null>(null);
  const [productCarouselPageById, setProductCarouselPageById] = useState<Record<string, number>>({});
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
  const [activeDropdownItemId, setActiveDropdownItemId] = useState<string | null>(null);
  const previewContainerRef = useRef<HTMLDivElement | null>(null);
  const previewMenuItemRefs = useRef<Map<string, HTMLButtonElement | null>>(new Map());
  const [dropdownAnchor, setDropdownAnchor] = useState<{ left: number; top: number; width: number } | null>(null);
  const [savedFingerprint, setSavedFingerprint] = useState(() =>
    JSON.stringify({
      status: menu.status,
      items: normalizedMenuItems,
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
  }, [openMenuId]);

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
              onClick={closeProductPicker}
              accessibilityLabel="Back"
            />
            <Text as="h2" variant="headingSm">
              {productPickerTargetId ? "Select product" : "Select products"}
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
                      className={`flex items-center gap-3 rounded-lg border px-3 py-2 text-sm transition-colors ${isSelected
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
            <Button variant="tertiary" onClick={closeProductPicker}>
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

  const renderCollectionPickerPanel = () => {
    if (!collectionPickerOpen) return null;
    const searchValue = collectionPickerSearch.trim().toLowerCase();
    const filteredCollections = searchValue
      ? collections.filter((collection) => collection.title.toLowerCase().includes(searchValue))
      : collections;
    return (
      <div className="flex h-full flex-col border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-200 px-4 py-3">
          <InlineStack gap="200" blockAlign="center">
            <Button
              variant="tertiary"
              icon={ArrowLeftIcon}
              onClick={closeCollectionPicker}
              accessibilityLabel="Back"
            />
            <Text as="h2" variant="headingSm">
              {collectionPickerTargetId ? "Select collection" : "Select collections"}
            </Text>
          </InlineStack>
        </div>
        <div className="flex-1 min-h-0 overflow-y-auto px-4 py-4">
          <BlockStack gap="300">
            <TextField
              label="Search"
              labelHidden
              value={collectionPickerSearch}
              onChange={setCollectionPickerSearch}
              placeholder="Search"
              autoComplete="off"
              prefix={<Icon source={SearchIcon} tone="subdued" />}
            />
            <BlockStack gap="200">
              {filteredCollections.length ? (
                filteredCollections.map((collection) => {
                  const isSelected = Boolean(collectionPickerSelection[collection.id]);
                  return (
                    <label
                      key={collection.id}
                      className={`flex items-center gap-3 rounded-lg border px-3 py-2 text-sm transition-colors ${isSelected
                        ? "border-blue-600 bg-blue-50 text-blue-700"
                        : "border-gray-200 text-gray-700 hover:border-gray-300"
                        }`}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleCollectionSelection(collection.id)}
                        className="h-4 w-4"
                      />
                      <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-md border border-gray-200 bg-white">
                        {collection.image?.url ? (
                          <img
                            src={collection.image.url}
                            alt={collection.image.altText ?? collection.title}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <Icon source={CollectionIcon} tone="subdued" />
                        )}
                      </div>
                      <span className="flex-1">{collection.title}</span>
                    </label>
                  );
                })
              ) : (
                <Text as="p" variant="bodySm" tone="subdued">
                  No collections found.
                </Text>
              )}
            </BlockStack>
          </BlockStack>
        </div>
        <div className="border-t border-gray-200 bg-white px-4 py-3">
          <InlineStack align="end" gap="200">
            <Button variant="tertiary" onClick={closeCollectionPicker}>
              Cancel
            </Button>
            <Button variant="primary" onClick={applyCollectionSelection}>
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
                    className={`relative overflow-hidden rounded-lg border p-2 text-left transition ${isSelected ? "border-gray-300 bg-gray-50" : "border-gray-200"
                      }`}
                  >
                    <span
                      className={`absolute left-2 top-2 flex h-5 w-5 items-center justify-center rounded border text-xs font-semibold ${isSelected ? "border-gray-900 bg-gray-900 text-white" : "border-gray-300 bg-white text-transparent"
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
    selectLabel = "Select",
    selectDisabled = false,
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
    selectLabel?: string;
    selectDisabled?: boolean;
    showSelectButton?: boolean;
    titleHiddenOnHover?: boolean;
    showTitle?: boolean;
    previewHeightClassName?: string;
    previewContainerClassName?: string;
  }) => (
    <div className="group relative transition-transform duration-150 ease-out">
      <Card padding="300" style={{ borderRadius: 0 }} className="rounded-none">
        <BlockStack gap="300">
          <div
            className={`relative overflow-visible ${previewContainerClassName ?? "bg-gray-100 p-3"}`}
          >
            <div className={`${previewHeightClassName} w-full`}>{preview}</div>
            {badge ? (
              <div
                className="absolute right-3 top-3 z-10"
                style={{ transform: "scale(1.12)", transformOrigin: "top right" }}
              >
                <Badge tone="warning">{badge}</Badge>
              </div>
            ) : null}
            {showSelectButton ? (
              <div className="pointer-events-none absolute inset-x-4 bottom-3 opacity-0 transition-opacity group-hover:pointer-events-auto group-hover:opacity-100">
                <Button
                  fullWidth
                  onClick={selectDisabled ? undefined : onSelect}
                  disabled={selectDisabled}
                  size="slim"
                  variant="primary"
                  style={{ backgroundColor: "#111827", borderColor: "#111827", color: "#ffffff" }}
                >
                  {selectLabel}
                </Button>
              </div>
            ) : null}
          </div>
          {showTitle ? (
            <div
              className={`w-full overflow-hidden text-ellipsis whitespace-nowrap ${titleHiddenOnHover ? "transition-opacity duration-150 group-hover:opacity-0" : ""
                }`}
            >
              <Text
                as="p"
                variant="bodySm"
                alignment="center"
                fontWeight="semibold"
                className="whitespace-nowrap"
              >
                {title}
              </Text>
            </div>
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
            <div className="flex flex-col gap-0">
              {renderTemplatePreviewCard({
                title: "Vertical Dropdown",
                onSelect: () => handleApplySubmenuTemplate("dropdown"),
                showSelectButton: false,
                showTitle: false,
                previewHeightClassName: "h-44",
                previewContainerClassName: "bg-transparent p-0",
                preview: (
                  <div className="relative flex h-full w-full items-center justify-center rounded-none bg-gray-200 p-2 transition-colors group-hover:bg-gray-300">
                    <img
                      src="/vertical-dropdown.png"
                      alt="Vertical Dropdown template"
                      className="h-full w-full object-contain pb-6"
                    />
                    <div className="pointer-events-none absolute bottom-2 left-1/2 -translate-x-1/2 max-w-[90%] overflow-hidden text-ellipsis whitespace-nowrap text-sm font-semibold text-gray-700 transition-opacity group-hover:opacity-0">
                      Vertical Dropdown
                    </div>
                    <div className="pointer-events-none absolute inset-x-4 bottom-3 opacity-0 transition-opacity group-hover:pointer-events-auto group-hover:opacity-100">
                      <Button
                        fullWidth
                        onClick={() => handleApplySubmenuTemplate("dropdown")}
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
              {renderTemplatePreviewCard({
                title: "Horizontal Dropdown",
                onSelect: () => handleApplySubmenuTemplate("horizontal-dropdown"),
                showSelectButton: false,
                showTitle: false,
                previewHeightClassName: "h-44",
                previewContainerClassName: "bg-transparent p-0",
                preview: (
                  <div className="relative flex h-full w-full items-center justify-center rounded-none bg-gray-200 p-2 transition-colors group-hover:bg-gray-300">
                    <img
                      src="/horizantal-dropdown.png"
                      alt="Horizontal Dropdown template"
                      className="h-full w-full object-contain pb-6"
                    />
                    <div className="pointer-events-none absolute bottom-2 left-1/2 -translate-x-1/2 max-w-[90%] overflow-hidden text-ellipsis whitespace-nowrap text-sm font-semibold text-gray-700 transition-opacity group-hover:opacity-0">
                      Horizontal Dropdown
                    </div>
                    <div className="pointer-events-none absolute inset-x-4 bottom-3 opacity-0 transition-opacity group-hover:pointer-events-auto group-hover:opacity-100">
                      <Button
                        fullWidth
                        onClick={() => handleApplySubmenuTemplate("horizontal-dropdown")}
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
            <div className="flex flex-col gap-0">
              {renderTemplatePreviewCard({
                title: "Space",
                onSelect: selectTemplate,
                showSelectButton: false,
                showTitle: false,
                previewHeightClassName: "h-44",
                previewContainerClassName: "bg-transparent p-0",
                preview: (
                  <div className="relative flex h-full w-full items-center justify-center rounded-none bg-gray-200 p-2 transition-colors group-hover:bg-gray-300">
                    <img
                      src="/Space.png"
                      alt="Space template"
                      className="h-full w-full object-contain"
                    />
                    <div className="pointer-events-none absolute bottom-2 left-1/2 -translate-x-1/2 max-w-[90%] overflow-hidden text-ellipsis whitespace-nowrap text-sm font-semibold text-gray-700 transition-opacity group-hover:opacity-0">
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
              <div className="flex flex-col gap-0">
                {(
                  [
                    {
                      id: "multi-4-product-list",
                      label: "4 product list",
                      image: "/4-product-list.png",
                      plan: "pro",
                    },
                    { id: "multi", label: "4 link list", image: "/link-list-multiblock.png" },
                    {
                      id: "multi-1-column-3-product-list",
                      label: "1 link list + 3 product list",
                      image: "/1link-list+3product-columns.png",
                      plan: "pro",
                    },
                    { id: "multi-3-photo", label: "3 link list + 1 image", image: "/3columns+1photo.png" },
                    {
                      id: "multi-product-carousel",
                      label: "Product carousel",
                      image: "/product-carousel.png",
                      plan: "pro",
                    },
                    { id: "multi-2-photos", label: "2 link + 2 image", image: "/2columns+2photos.png" },
                    {
                      id: "multi-link-list-product-carousel",
                      label: "1 link list + product carousel",
                      image: "/1link-list+product-carousel.png",
                      plan: "pro",
                    },
                    { id: "multi-1-3-photos", label: "1 link + 3 image", image: "/1column%20+%203photos.png" },
                    {
                      id: "multi-image-product-carousel",
                      label: "Image + product carousel",
                      image: "/image+product-carousel.png",
                      plan: "pro",
                    },
                    { id: "multi-4-images", label: "4 images", image: "/4images.png" },
                    { id: "multi-4-products", label: "4 product", image: "/4products.png" },
                    {
                      id: "multi-map-contact-address",
                      label: "Map + contact + address",
                      image: "/map-contact-adres.png",
                    },
                  ] as Array<{
                    id: BlockTemplateId;
                    label: string;
                    image: string;
                    plan?: "pro" | "plus";
                  }>
                ).map((preset) => {
                  const isAllowed =
                    preset.plan === "pro"
                      ? isProPlan
                      : preset.plan === "plus"
                        ? isPlusPlan
                        : true;
                  return renderBlockTemplatePreviewCard({
                    title: preset.label,
                    onSelect: isAllowed ? () => handleApplyMegaMenuPreset(preset.id) : () => { },
                    badge: preset.plan ? (preset.plan === "plus" ? "Plus" : "Pro") : undefined,
                    selectLabel: isAllowed ? "Select" : "Upgrade to use",
                    selectDisabled: !isAllowed,
                    showTitle: false,
                    previewHeightClassName: "h-44",
                    previewContainerClassName: "bg-transparent p-0",
                    preview: (
                      <div className="relative flex h-full w-full items-center justify-center rounded-none bg-gray-200 p-2 transition-colors group-hover:bg-gray-300">
                        <img
                          src={preset.image}
                          alt={`${preset.label} template`}
                          className="h-full w-full object-contain"
                        />
                        <div className="pointer-events-none absolute bottom-2 left-1/2 -translate-x-1/2 max-w-[90%] overflow-hidden text-ellipsis whitespace-nowrap text-sm font-semibold text-gray-700 transition-opacity group-hover:opacity-0">
                          {preset.label}
                        </div>
                      </div>
                    ),
                  });
                })}
              </div>
            </div>
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
        className={`absolute right-80 top-0 z-20 flex h-full w-80 flex-col border-l border-gray-200 bg-white shadow-xl transition-all duration-200 ease-out ${showPanel ? "translate-x-0 opacity-100" : "translate-x-full opacity-0 pointer-events-none"
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
              <div className="relative flex h-full w-full items-center justify-center rounded-none bg-gray-200 p-2 transition-colors group-hover:bg-gray-300">
                <img
                  src="/Space.png"
                  alt="Space template"
                  className="h-full w-full object-contain"
                />
                <div className="pointer-events-none absolute bottom-2 left-1/2 -translate-x-1/2 max-w-[90%] overflow-hidden text-ellipsis whitespace-nowrap text-sm font-semibold text-gray-700 transition-opacity group-hover:opacity-0">
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
          return (
            <div className="flex flex-col gap-0">
              {renderBlockTemplatePreviewCard({
                title: "Element Group (Mansory Order)",
                onSelect: isPlusPlan ? () => handleApplyBlockTemplate("multi-element-group-masonry") : () => { },
                badge: "Plus",
                selectLabel: isPlusPlan ? "Select" : "Upgrade to use",
                showSelectButton: false,
                showTitle: false,
                previewHeightClassName: "h-44",
                previewContainerClassName: "bg-transparent p-0",
                preview: (
                  <div className="relative flex h-full w-full items-center justify-center rounded-none bg-gray-200 p-2 transition-colors group-hover:bg-gray-300">
                    <img
                      src="/product-carousel.png"
                      alt="Element Group (Mansory Order) template"
                      className="h-full w-full object-contain"
                    />
                    <div className="pointer-events-none absolute bottom-2 left-1/2 -translate-x-1/2 max-w-[90%] overflow-hidden text-ellipsis whitespace-nowrap text-sm font-semibold text-gray-700 transition-opacity group-hover:opacity-0">
                      Element Group (Mansory Order)
                    </div>
                    <div className="pointer-events-none absolute inset-x-4 bottom-3 opacity-0 transition-opacity group-hover:pointer-events-auto group-hover:opacity-100">
                      <Button
                        fullWidth
                        onClick={
                          isPlusPlan ? () => handleApplyBlockTemplate("multi-element-group-masonry") : () => { }
                        }
                        size="slim"
                        variant="primary"
                        style={{ backgroundColor: "#111827", borderColor: "#111827", color: "#ffffff" }}
                      >
                        {isPlusPlan ? "Select" : "Upgrade to use"}
                      </Button>
                    </div>
                  </div>
                ),
              })}
              {renderBlockTemplatePreviewCard({
                title: "Link list",
                onSelect: () => handleApplyBlockTemplate("multi"),
                showSelectButton: false,
                showTitle: false,
                previewHeightClassName: "h-44",
                previewContainerClassName: "bg-transparent p-0",
                preview: (
                  <div className="relative flex h-full w-full items-center justify-center rounded-none bg-gray-200 p-2 transition-colors group-hover:bg-gray-300">
                    <img
                      src="/link-list-multiblock.png"
                      alt="Multi block link list template"
                      className="h-full w-full object-contain"
                    />
                    <div className="pointer-events-none absolute bottom-2 left-1/2 -translate-x-1/2 max-w-[90%] overflow-hidden text-ellipsis whitespace-nowrap text-sm font-semibold text-gray-700 transition-opacity group-hover:opacity-0">
                      Link list
                    </div>
                    <div className="pointer-events-none absolute inset-x-4 bottom-3 opacity-0 transition-opacity group-hover:pointer-events-auto group-hover:opacity-100">
                      <Button
                        fullWidth
                        onClick={() => handleApplyBlockTemplate("multi")}
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
                title: "4 product list",
                onSelect: isProPlan ? () => handleApplyBlockTemplate("multi-4-product-list") : () => { },
                badge: "Pro",
                selectLabel: isProPlan ? "Select" : "Upgrade to use",
                showSelectButton: false,
                showTitle: false,
                previewHeightClassName: "h-44",
                previewContainerClassName: "bg-transparent p-0",
                preview: (
                  <div className="relative flex h-full w-full items-center justify-center rounded-none bg-gray-200 p-2 transition-colors group-hover:bg-gray-300">
                    <img
                      src="/4-product-list.png"
                      alt="4 product list template"
                      className="h-full w-full object-contain"
                    />
                    <div className="pointer-events-none absolute bottom-2 left-1/2 -translate-x-1/2 max-w-[90%] overflow-hidden text-ellipsis whitespace-nowrap text-sm font-semibold text-gray-700 transition-opacity group-hover:opacity-0">
                      4 product list
                    </div>
                    <div className="pointer-events-none absolute inset-x-4 bottom-3 opacity-0 transition-opacity group-hover:pointer-events-auto group-hover:opacity-100">
                      <Button
                        fullWidth
                        onClick={isProPlan ? () => handleApplyBlockTemplate("multi-4-product-list") : () => { }}
                        size="slim"
                        variant="primary"
                        style={{ backgroundColor: "#111827", borderColor: "#111827", color: "#ffffff" }}
                      >
                        {isProPlan ? "Select" : "Upgrade to use"}
                      </Button>
                    </div>
                  </div>
                ),
              })}
              {renderBlockTemplatePreviewCard({
                title: "3 columns + 1 photo",
                onSelect: () => handleApplyBlockTemplate("multi-3-photo"),
                showSelectButton: false,
                showTitle: false,
                previewHeightClassName: "h-44",
                previewContainerClassName: "bg-transparent p-0",
                preview: (
                  <div className="relative flex h-full w-full items-center justify-center rounded-none bg-gray-200 p-2 transition-colors group-hover:bg-gray-300">
                    <img
                      src="/3columns+1photo.png"
                      alt="3 columns + 1 photo template"
                      className="h-full w-full object-contain"
                    />
                    <div className="pointer-events-none absolute bottom-2 left-1/2 -translate-x-1/2 max-w-[90%] overflow-hidden text-ellipsis whitespace-nowrap text-sm font-semibold text-gray-700 transition-opacity group-hover:opacity-0">
                      3 columns + 1 photo
                    </div>
                    <div className="pointer-events-none absolute inset-x-4 bottom-3 opacity-0 transition-opacity group-hover:pointer-events-auto group-hover:opacity-100">
                      <Button
                        fullWidth
                        onClick={() => handleApplyBlockTemplate("multi-3-photo")}
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
                title: "1 link list + 3 product list",
                onSelect: isProPlan ? () => handleApplyBlockTemplate("multi-1-column-3-product-list") : () => { },
                badge: "Pro",
                selectLabel: isProPlan ? "Select" : "Upgrade to use",
                showSelectButton: false,
                showTitle: false,
                previewHeightClassName: "h-44",
                previewContainerClassName: "bg-transparent p-0",
                preview: (
                  <div className="relative flex h-full w-full items-center justify-center rounded-none bg-gray-200 p-2 transition-colors group-hover:bg-gray-300">
                    <img
                      src="/1link-list+3product-columns.png"
                      alt="1 link list + 3 product list template"
                      className="h-full w-full object-contain"
                    />
                    <div className="pointer-events-none absolute bottom-2 left-1/2 -translate-x-1/2 max-w-[90%] overflow-hidden text-ellipsis whitespace-nowrap text-sm font-semibold text-gray-700 transition-opacity group-hover:opacity-0">
                      1 link list + 3 product list
                    </div>
                    <div className="pointer-events-none absolute inset-x-4 bottom-3 opacity-0 transition-opacity group-hover:pointer-events-auto group-hover:opacity-100">
                      <Button
                        fullWidth
                        onClick={
                          isProPlan ? () => handleApplyBlockTemplate("multi-1-column-3-product-list") : () => { }
                        }
                        size="slim"
                        variant="primary"
                        style={{ backgroundColor: "#111827", borderColor: "#111827", color: "#ffffff" }}
                      >
                        {isProPlan ? "Select" : "Upgrade to use"}
                      </Button>
                    </div>
                  </div>
                ),
              })}
              {renderBlockTemplatePreviewCard({
                title: "2 columns + 2 photos",
                onSelect: () => handleApplyBlockTemplate("multi-2-photos"),
                showSelectButton: false,
                showTitle: false,
                previewHeightClassName: "h-44",
                previewContainerClassName: "bg-transparent p-0",
                preview: (
                  <div className="relative flex h-full w-full items-center justify-center rounded-none bg-gray-200 p-2 transition-colors group-hover:bg-gray-300">
                    <img
                      src="/2columns+2photos.png"
                      alt="2 columns + 2 photos template"
                      className="h-full w-full object-contain"
                    />
                    <div className="pointer-events-none absolute bottom-2 left-1/2 -translate-x-1/2 max-w-[90%] overflow-hidden text-ellipsis whitespace-nowrap text-sm font-semibold text-gray-700 transition-opacity group-hover:opacity-0">
                      2 columns + 2 photos
                    </div>
                    <div className="pointer-events-none absolute inset-x-4 bottom-3 opacity-0 transition-opacity group-hover:pointer-events-auto group-hover:opacity-100">
                      <Button
                        fullWidth
                        onClick={() => handleApplyBlockTemplate("multi-2-photos")}
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
                title: "Product carousel",
                onSelect: isProPlan ? () => handleApplyBlockTemplate("multi-product-carousel") : () => { },
                badge: "Pro",
                selectLabel: isProPlan ? "Select" : "Upgrade to use",
                showSelectButton: false,
                showTitle: false,
                previewHeightClassName: "h-44",
                previewContainerClassName: "bg-transparent p-0",
                preview: (
                  <div className="relative flex h-full w-full items-center justify-center rounded-none bg-gray-200 p-2 transition-colors group-hover:bg-gray-300">
                    <img
                      src="/product-carousel.png"
                      alt="Product carousel template"
                      className="h-full w-full object-contain"
                    />
                    <div className="pointer-events-none absolute bottom-2 left-1/2 -translate-x-1/2 max-w-[90%] overflow-hidden text-ellipsis whitespace-nowrap text-sm font-semibold text-gray-700 transition-opacity group-hover:opacity-0">
                      Product carousel
                    </div>
                    <div className="pointer-events-none absolute inset-x-4 bottom-3 opacity-0 transition-opacity group-hover:pointer-events-auto group-hover:opacity-100">
                      <Button
                        fullWidth
                        onClick={isProPlan ? () => handleApplyBlockTemplate("multi-product-carousel") : () => { }}
                        size="slim"
                        variant="primary"
                        style={{ backgroundColor: "#111827", borderColor: "#111827", color: "#ffffff" }}
                      >
                        {isProPlan ? "Select" : "Upgrade to use"}
                      </Button>
                    </div>
                  </div>
                ),
              })}
              {renderBlockTemplatePreviewCard({
                title: "1 column + 3 photos",
                onSelect: () => handleApplyBlockTemplate("multi-1-3-photos"),
                showSelectButton: false,
                showTitle: false,
                previewHeightClassName: "h-44",
                previewContainerClassName: "bg-transparent p-0",
                preview: (
                  <div className="relative flex h-full w-full items-center justify-center rounded-none bg-gray-200 p-2 transition-colors group-hover:bg-gray-300">
                    <img
                      src="/1column%20+%203photos.png"
                      alt="1 column + 3 photos template"
                      className="h-full w-full object-contain"
                    />
                    <div className="pointer-events-none absolute bottom-2 left-1/2 -translate-x-1/2 max-w-[90%] overflow-hidden text-ellipsis whitespace-nowrap text-sm font-semibold text-gray-700 transition-opacity group-hover:opacity-0">
                      1 column + 3 photos
                    </div>
                    <div className="pointer-events-none absolute inset-x-4 bottom-3 opacity-0 transition-opacity group-hover:pointer-events-auto group-hover:opacity-100">
                      <Button
                        fullWidth
                        onClick={() => handleApplyBlockTemplate("multi-1-3-photos")}
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
                title: "1 link list + product carousel",
                onSelect: isProPlan ? () => handleApplyBlockTemplate("multi-link-list-product-carousel") : () => { },
                badge: "Pro",
                selectLabel: isProPlan ? "Select" : "Upgrade to use",
                showSelectButton: false,
                showTitle: false,
                previewHeightClassName: "h-44",
                previewContainerClassName: "bg-transparent p-0",
                preview: (
                  <div className="relative flex h-full w-full items-center justify-center rounded-none bg-gray-200 p-2 transition-colors group-hover:bg-gray-300">
                    <img
                      src="/1link-list+product-carousel.png"
                      alt="1 link list + product carousel template"
                      className="h-full w-full object-contain"
                    />
                    <div className="pointer-events-none absolute bottom-2 left-1/2 -translate-x-1/2 max-w-[90%] overflow-hidden text-ellipsis whitespace-nowrap text-sm font-semibold text-gray-700 transition-opacity group-hover:opacity-0">
                      1 link list + product carousel
                    </div>
                    <div className="pointer-events-none absolute inset-x-4 bottom-3 opacity-0 transition-opacity group-hover:pointer-events-auto group-hover:opacity-100">
                      <Button
                        fullWidth
                        onClick={
                          isProPlan ? () => handleApplyBlockTemplate("multi-link-list-product-carousel") : () => { }
                        }
                        size="slim"
                        variant="primary"
                        style={{ backgroundColor: "#111827", borderColor: "#111827", color: "#ffffff" }}
                      >
                        {isProPlan ? "Select" : "Upgrade to use"}
                      </Button>
                    </div>
                  </div>
                ),
              })}
              {renderBlockTemplatePreviewCard({
                title: "4 images",
                onSelect: () => handleApplyBlockTemplate("multi-4-images"),
                showSelectButton: false,
                showTitle: false,
                previewHeightClassName: "h-44",
                previewContainerClassName: "bg-transparent p-0",
                preview: (
                  <div className="relative flex h-full w-full items-center justify-center rounded-none bg-gray-200 p-2 transition-colors group-hover:bg-gray-300">
                    <img
                      src="/4images.png"
                      alt="4 images template"
                      className="h-full w-full object-contain"
                    />
                    <div className="pointer-events-none absolute bottom-2 left-1/2 -translate-x-1/2 max-w-[90%] overflow-hidden text-ellipsis whitespace-nowrap text-sm font-semibold text-gray-700 transition-opacity group-hover:opacity-0">
                      4 images
                    </div>
                    <div className="pointer-events-none absolute inset-x-4 bottom-3 opacity-0 transition-opacity group-hover:pointer-events-auto group-hover:opacity-100">
                      <Button
                        fullWidth
                        onClick={() => handleApplyBlockTemplate("multi-4-images")}
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
                title: "Image + product carousel",
                onSelect: isProPlan ? () => handleApplyBlockTemplate("multi-image-product-carousel") : () => { },
                badge: "Pro",
                selectLabel: isProPlan ? "Select" : "Upgrade to use",
                showSelectButton: false,
                showTitle: false,
                previewHeightClassName: "h-44",
                previewContainerClassName: "bg-transparent p-0",
                preview: (
                  <div className="relative flex h-full w-full items-center justify-center rounded-none bg-gray-200 p-2 transition-colors group-hover:bg-gray-300">
                    <img
                      src="/image+product-carousel.png"
                      alt="Image + product carousel template"
                      className="h-full w-full object-contain"
                    />
                    <div className="pointer-events-none absolute bottom-2 left-1/2 -translate-x-1/2 max-w-[90%] overflow-hidden text-ellipsis whitespace-nowrap text-sm font-semibold text-gray-700 transition-opacity group-hover:opacity-0">
                      Image + product carousel
                    </div>
                    <div className="pointer-events-none absolute inset-x-4 bottom-3 opacity-0 transition-opacity group-hover:pointer-events-auto group-hover:opacity-100">
                      <Button
                        fullWidth
                        onClick={
                          isProPlan ? () => handleApplyBlockTemplate("multi-image-product-carousel") : () => { }
                        }
                        size="slim"
                        variant="primary"
                        style={{ backgroundColor: "#111827", borderColor: "#111827", color: "#ffffff" }}
                      >
                        {isProPlan ? "Select" : "Upgrade to use"}
                      </Button>
                    </div>
                  </div>
                ),
              })}
              {renderBlockTemplatePreviewCard({
                title: "4 products",
                onSelect: () => handleApplyBlockTemplate("multi-4-products"),
                showSelectButton: false,
                showTitle: false,
                previewHeightClassName: "h-44",
                previewContainerClassName: "bg-transparent p-0",
                preview: (
                  <div className="relative flex h-full w-full items-center justify-center rounded-none bg-gray-200 p-2 transition-colors group-hover:bg-gray-300">
                    <img
                      src="/4products.png"
                      alt="4 products template"
                      className="h-full w-full object-contain"
                    />
                    <div className="pointer-events-none absolute bottom-2 left-1/2 -translate-x-1/2 max-w-[90%] overflow-hidden text-ellipsis whitespace-nowrap text-sm font-semibold text-gray-700 transition-opacity group-hover:opacity-0">
                      4 products
                    </div>
                    <div className="pointer-events-none absolute inset-x-4 bottom-3 opacity-0 transition-opacity group-hover:pointer-events-auto group-hover:opacity-100">
                      <Button
                        fullWidth
                        onClick={() => handleApplyBlockTemplate("multi-4-products")}
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
                title: "Map + contact + address",
                onSelect: () => handleApplyBlockTemplate("multi-map-contact-address"),
                showSelectButton: false,
                showTitle: false,
                previewHeightClassName: "h-44",
                previewContainerClassName: "bg-transparent p-0",
                preview: (
                  <div className="relative flex h-full w-full items-center justify-center rounded-none bg-gray-200 p-2 transition-colors group-hover:bg-gray-300">
                    <img
                      src="/map-contact-adres.png"
                      alt="Map + contact + address template"
                      className="h-full w-full object-contain"
                    />
                    <div className="pointer-events-none absolute bottom-2 left-1/2 -translate-x-1/2 max-w-[90%] overflow-hidden text-ellipsis whitespace-nowrap text-sm font-semibold text-gray-700 transition-opacity group-hover:opacity-0">
                      Map + contact + address
                    </div>
                    <div className="pointer-events-none absolute inset-x-4 bottom-3 opacity-0 transition-opacity group-hover:pointer-events-auto group-hover:opacity-100">
                      <Button
                        fullWidth
                        onClick={() => handleApplyBlockTemplate("multi-map-contact-address")}
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
        case "tabs":
          return renderBlockTemplatePreviewCard({
            title: "Tabs",
            onSelect: selectTemplate,
            preview: (
              <div className="h-28 rounded-none bg-[#f3f4f6] p-2">
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
                  <div className="relative flex h-full w-full items-center justify-center rounded-none bg-gray-200 p-2 transition-colors group-hover:bg-gray-300">
                    <img
                      src="/image%201.png"
                      alt="Image 1 template"
                      className="h-full w-full object-contain"
                    />
                    <div className="pointer-events-none absolute bottom-2 left-1/2 -translate-x-1/2 max-w-[90%] overflow-hidden text-ellipsis whitespace-nowrap text-sm font-semibold text-gray-700 transition-opacity group-hover:opacity-0">
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
                  <div className="relative flex h-full w-full items-center justify-center rounded-none bg-gray-200 p-2 transition-colors group-hover:bg-gray-300">
                    <img
                      src="/I%CC%87mage%202.png"
                      alt="Image 2 template"
                      className="h-full w-full object-contain"
                    />
                    <div className="pointer-events-none absolute bottom-2 left-1/2 -translate-x-1/2 max-w-[90%] overflow-hidden text-ellipsis whitespace-nowrap text-sm font-semibold text-gray-700 transition-opacity group-hover:opacity-0">
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
          return (
            <div className="flex flex-col gap-0">
              {renderBlockTemplatePreviewCard({
                title: "Link list (2 columns)",
                onSelect: () => handleApplyBlockTemplate("links"),
                showSelectButton: false,
                showTitle: false,
                previewHeightClassName: "h-44",
                previewContainerClassName: "bg-transparent p-0",
                preview: (
                  <div className="relative flex h-full w-full items-center justify-center rounded-none bg-gray-200 p-2 transition-colors group-hover:bg-gray-300">
                    <img
                      src="/two-columns.png"
                      alt="Link list (2 columns) template"
                      className="h-full w-full object-contain"
                    />
                    <div className="pointer-events-none absolute bottom-2 left-1/2 -translate-x-1/2 max-w-[90%] overflow-hidden text-ellipsis whitespace-nowrap text-sm font-semibold text-gray-700 transition-opacity group-hover:opacity-0">
                      Link list (2 columns)
                    </div>
                    <div className="pointer-events-none absolute inset-x-4 bottom-3 opacity-0 transition-opacity group-hover:pointer-events-auto group-hover:opacity-100">
                      <Button
                        fullWidth
                        onClick={() => handleApplyBlockTemplate("links")}
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
                title: "Link list (3 columns)",
                onSelect: () => handleApplyBlockTemplate("links-3"),
                showSelectButton: false,
                showTitle: false,
                previewHeightClassName: "h-44",
                previewContainerClassName: "bg-transparent p-0",
                preview: (
                  <div className="relative flex h-full w-full items-center justify-center rounded-none bg-gray-200 p-2 transition-colors group-hover:bg-gray-300">
                    <img
                      src="/3-columns.png"
                      alt="Link list (3 columns) template"
                      className="h-full w-full object-contain"
                    />
                    <div className="pointer-events-none absolute bottom-2 left-1/2 -translate-x-1/2 max-w-[90%] overflow-hidden text-ellipsis whitespace-nowrap text-sm font-semibold text-gray-700 transition-opacity group-hover:opacity-0">
                      Link list (3 columns)
                    </div>
                    <div className="pointer-events-none absolute inset-x-4 bottom-3 opacity-0 transition-opacity group-hover:pointer-events-auto group-hover:opacity-100">
                      <Button
                        fullWidth
                        onClick={() => handleApplyBlockTemplate("links-3")}
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
                title: "Easy column",
                onSelect: () => handleApplyBlockTemplate("links-easy"),
                showSelectButton: false,
                showTitle: false,
                previewHeightClassName: "h-44",
                previewContainerClassName: "bg-transparent p-0",
                preview: (
                  <div className="relative flex h-full w-full items-center justify-center rounded-none bg-gray-200 p-2 transition-colors group-hover:bg-gray-300">
                    <img
                      src="/easy-column.png"
                      alt="Easy column template"
                      className="h-full w-full object-contain"
                    />
                    <div className="pointer-events-none absolute bottom-2 left-1/2 -translate-x-1/2 max-w-[90%] overflow-hidden text-ellipsis whitespace-nowrap text-sm font-semibold text-gray-700 transition-opacity group-hover:opacity-0">
                      Easy column
                    </div>
                    <div className="pointer-events-none absolute inset-x-4 bottom-3 opacity-0 transition-opacity group-hover:pointer-events-auto group-hover:opacity-100">
                      <Button
                        fullWidth
                        onClick={() => handleApplyBlockTemplate("links-easy")}
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
                title: "Columns with icons",
                onSelect: () => handleApplyBlockTemplate("links-icons"),
                showSelectButton: false,
                showTitle: false,
                previewHeightClassName: "h-44",
                previewContainerClassName: "bg-transparent p-0",
                preview: (
                  <div className="relative flex h-full w-full items-center justify-center rounded-none bg-gray-200 p-2 transition-colors group-hover:bg-gray-300">
                    <img
                      src="/columns-with-icons.png"
                      alt="Columns with icons template"
                      className="h-full w-full object-contain"
                    />
                    <div className="pointer-events-none absolute bottom-2 left-1/2 -translate-x-1/2 max-w-[90%] overflow-hidden text-ellipsis whitespace-nowrap text-sm font-semibold text-gray-700 transition-opacity group-hover:opacity-0">
                      Columns with icons
                    </div>
                    <div className="pointer-events-none absolute inset-x-4 bottom-3 opacity-0 transition-opacity group-hover:pointer-events-auto group-hover:opacity-100">
                      <Button
                        fullWidth
                        onClick={() => handleApplyBlockTemplate("links-icons")}
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
        case "product":
          return (
            <div className="flex flex-col gap-0">
              {renderBlockTemplatePreviewCard({
                title: "Product grid",
                onSelect: isProPlan ? () => handleApplyBlockTemplate("product-grid") : () => { },
                badge: "Pro",
                selectLabel: isProPlan ? "Select" : "Upgrade to use",
                showSelectButton: false,
                showTitle: false,
                previewHeightClassName: "h-44",
                previewContainerClassName: "bg-transparent p-0",
                preview: (
                  <div className="relative flex h-full w-full items-center justify-center rounded-none bg-gray-200 p-2 transition-colors group-hover:bg-gray-300">
                    <img
                      src="/product-grid.png"
                      alt="Product grid template"
                      className="h-full w-full object-contain"
                    />
                    <div className="pointer-events-none absolute bottom-2 left-1/2 -translate-x-1/2 max-w-[90%] overflow-hidden text-ellipsis whitespace-nowrap text-sm font-semibold text-gray-700 transition-opacity group-hover:opacity-0">
                      Product grid
                    </div>
                    <div className="pointer-events-none absolute inset-x-4 bottom-3 opacity-0 transition-opacity group-hover:pointer-events-auto group-hover:opacity-100">
                      <Button
                        fullWidth
                        onClick={isProPlan ? () => handleApplyBlockTemplate("product-grid") : () => { }}
                        size="slim"
                        variant="primary"
                        style={{ backgroundColor: "#111827", borderColor: "#111827", color: "#ffffff" }}
                      >
                        {isProPlan ? "Select" : "Upgrade to use"}
                      </Button>
                    </div>
                  </div>
                ),
              })}
              {renderBlockTemplatePreviewCard({
                title: "Product",
                onSelect: () => handleApplyBlockTemplate("product"),
                showSelectButton: false,
                showTitle: false,
                previewHeightClassName: "h-44",
                previewContainerClassName: "bg-transparent p-0",
                preview: (
                  <div className="relative flex h-full w-full items-center justify-center rounded-none bg-gray-200 p-2 transition-colors group-hover:bg-gray-300">
                    <img
                      src="/product.png"
                      alt="Product template"
                      className="h-full w-full object-contain"
                    />
                    <div className="pointer-events-none absolute bottom-2 left-1/2 -translate-x-1/2 max-w-[90%] overflow-hidden text-ellipsis whitespace-nowrap text-sm font-semibold text-gray-700 transition-opacity group-hover:opacity-0">
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
                title: "Product carousel",
                onSelect: isProPlan ? () => handleApplyBlockTemplate("product-carousel") : () => { },
                badge: "Pro",
                selectLabel: isProPlan ? "Select" : "Upgrade to use",
                showSelectButton: false,
                showTitle: false,
                previewHeightClassName: "h-44",
                previewContainerClassName: "bg-transparent p-0",
                preview: (
                  <div className="relative flex h-full w-full items-center justify-center rounded-none bg-gray-200 p-2 transition-colors group-hover:bg-gray-300">
                    <img
                      src="/product-carousel.png"
                      alt="Product carousel template"
                      className="h-full w-full object-contain"
                    />
                    <div className="pointer-events-none absolute bottom-2 left-1/2 -translate-x-1/2 max-w-[90%] overflow-hidden text-ellipsis whitespace-nowrap text-sm font-semibold text-gray-700 transition-opacity group-hover:opacity-0">
                      Product carousel
                    </div>
                    <div className="pointer-events-none absolute inset-x-4 bottom-3 opacity-0 transition-opacity group-hover:pointer-events-auto group-hover:opacity-100">
                      <Button
                        fullWidth
                        onClick={isProPlan ? () => handleApplyBlockTemplate("product-carousel") : () => { }}
                        size="slim"
                        variant="primary"
                        style={{ backgroundColor: "#111827", borderColor: "#111827", color: "#ffffff" }}
                      >
                        {isProPlan ? "Select" : "Upgrade to use"}
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
                  <div className="relative flex h-full w-full items-center justify-center rounded-none bg-gray-200 p-2 transition-colors group-hover:bg-gray-300">
                    <img
                      src="/product-yatay.png"
                      alt="Product horizontal template"
                      className="h-full w-full object-contain"
                    />
                    <div className="pointer-events-none absolute bottom-2 left-1/2 -translate-x-1/2 max-w-[90%] overflow-hidden text-ellipsis whitespace-nowrap text-sm font-semibold text-gray-700 transition-opacity group-hover:opacity-0">
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
              {renderBlockTemplatePreviewCard({
                title: "Product list",
                onSelect: isProPlan ? () => handleApplyBlockTemplate("product-list") : () => { },
                badge: "Pro",
                selectLabel: isProPlan ? "Select" : "Upgrade to use",
                showSelectButton: false,
                showTitle: false,
                previewHeightClassName: "h-44",
                previewContainerClassName: "bg-transparent p-0",
                preview: (
                  <div className="relative flex h-full w-full items-center justify-center rounded-none bg-gray-200 p-2 transition-colors group-hover:bg-gray-300">
                    <img
                      src="/product-list.png"
                      alt="Product list template"
                      className="h-full w-full object-contain"
                    />
                    <div className="pointer-events-none absolute bottom-2 left-1/2 -translate-x-1/2 max-w-[90%] overflow-hidden text-ellipsis whitespace-nowrap text-sm font-semibold text-gray-700 transition-opacity group-hover:opacity-0">
                      Product list
                    </div>
                    <div className="pointer-events-none absolute inset-x-4 bottom-3 opacity-0 transition-opacity group-hover:pointer-events-auto group-hover:opacity-100">
                      <Button
                        fullWidth
                        onClick={isProPlan ? () => handleApplyBlockTemplate("product-list") : () => { }}
                        size="slim"
                        variant="primary"
                        style={{ backgroundColor: "#111827", borderColor: "#111827", color: "#ffffff" }}
                      >
                        {isProPlan ? "Select" : "Upgrade to use"}
                      </Button>
                    </div>
                  </div>
                ),
              })}
              {renderBlockTemplatePreviewCard({
                title: "Horizontal product grid",
                onSelect: isProPlan ? () => handleApplyBlockTemplate("product-grid-horizontal") : () => { },
                badge: "Pro",
                selectLabel: isProPlan ? "Select" : "Upgrade to use",
                showSelectButton: false,
                showTitle: false,
                previewHeightClassName: "h-44",
                previewContainerClassName: "bg-transparent p-0",
                preview: (
                  <div className="relative flex h-full w-full items-center justify-center rounded-none bg-gray-200 p-2 transition-colors group-hover:bg-gray-300">
                    <img
                      src="/product-grid-horizontal.png"
                      alt="Horizontal product grid template"
                      className="h-full w-full object-contain"
                    />
                    <div className="pointer-events-none absolute bottom-2 left-1/2 -translate-x-1/2 max-w-[90%] overflow-hidden text-ellipsis whitespace-nowrap text-sm font-semibold text-gray-700 transition-opacity group-hover:opacity-0">
                      Horizontal product grid
                    </div>
                    <div className="pointer-events-none absolute inset-x-4 bottom-3 opacity-0 transition-opacity group-hover:pointer-events-auto group-hover:opacity-100">
                      <Button
                        fullWidth
                        onClick={isProPlan ? () => handleApplyBlockTemplate("product-grid-horizontal") : () => { }}
                        size="slim"
                        variant="primary"
                        style={{ backgroundColor: "#111827", borderColor: "#111827", color: "#ffffff" }}
                      >
                        {isProPlan ? "Select" : "Upgrade to use"}
                      </Button>
                    </div>
                  </div>
                ),
              })}
            </div>
          );
        case "collection":
          return (
            <div className="flex flex-col gap-0">
              {renderBlockTemplatePreviewCard({
                title: "Collection list",
                onSelect: isProPlan ? () => handleApplyBlockTemplate("collection") : () => { },
                badge: "Pro",
                selectLabel: isProPlan ? "Select" : "Upgrade to use",
                showSelectButton: false,
                showTitle: false,
                previewHeightClassName: "h-44",
                previewContainerClassName: "bg-transparent p-0",
                preview: (
                  <div className="relative flex h-full w-full items-center justify-center rounded-none bg-gray-200 p-2 transition-colors group-hover:bg-gray-300">
                    <img
                      src="/collection-list.png"
                      alt="Collection list template"
                      className="h-full w-full object-contain"
                    />
                    <div className="pointer-events-none absolute bottom-2 left-1/2 -translate-x-1/2 max-w-[90%] overflow-hidden text-ellipsis whitespace-nowrap text-sm font-semibold text-gray-700 transition-opacity group-hover:opacity-0">
                      Collection list
                    </div>
                    <div className="pointer-events-none absolute inset-x-4 bottom-3 opacity-0 transition-opacity group-hover:pointer-events-auto group-hover:opacity-100">
                      <Button
                        fullWidth
                        onClick={isProPlan ? () => handleApplyBlockTemplate("collection") : () => { }}
                        size="slim"
                        variant="primary"
                        style={{ backgroundColor: "#111827", borderColor: "#111827", color: "#ffffff" }}
                      >
                        {isProPlan ? "Select" : "Upgrade to use"}
                      </Button>
                    </div>
                  </div>
                ),
              })}
              {renderBlockTemplatePreviewCard({
                title: "Horizontal collection list",
                onSelect: isProPlan ? () => handleApplyBlockTemplate("collection-horizontal") : () => { },
                badge: "Pro",
                selectLabel: isProPlan ? "Select" : "Upgrade to use",
                showSelectButton: false,
                showTitle: false,
                previewHeightClassName: "h-44",
                previewContainerClassName: "bg-transparent p-0",
                preview: (
                  <div className="relative flex h-full w-full items-center justify-center rounded-none bg-gray-200 p-2 transition-colors group-hover:bg-gray-300">
                    <img
                      src="/horizontal-collection-list.png"
                      alt="Horizontal collection list template"
                      className="h-full w-full object-contain"
                    />
                    <div className="pointer-events-none absolute bottom-2 left-1/2 -translate-x-1/2 max-w-[90%] overflow-hidden text-ellipsis whitespace-nowrap text-sm font-semibold text-gray-700 transition-opacity group-hover:opacity-0">
                      Horizontal collection list
                    </div>
                    <div className="pointer-events-none absolute inset-x-4 bottom-3 opacity-0 transition-opacity group-hover:pointer-events-auto group-hover:opacity-100">
                      <Button
                        fullWidth
                        onClick={isProPlan ? () => handleApplyBlockTemplate("collection-horizontal") : () => { }}
                        size="slim"
                        variant="primary"
                        style={{ backgroundColor: "#111827", borderColor: "#111827", color: "#ffffff" }}
                      >
                        {isProPlan ? "Select" : "Upgrade to use"}
                      </Button>
                    </div>
                  </div>
                ),
              })}
            </div>
          );
        case "blogs":
          return (
            <div className="flex flex-col gap-0">
              {renderBlockTemplatePreviewCard({
                title: "Articles",
                onSelect: isProPlan ? () => handleApplyBlockTemplate("blogs") : () => { },
                badge: "Pro",
                selectLabel: isProPlan ? "Select" : "Upgrade to use",
                showSelectButton: false,
                showTitle: false,
                previewHeightClassName: "h-44",
                previewContainerClassName: "bg-transparent p-0",
                preview: (
                  <div className="relative flex h-full w-full items-center justify-center rounded-none bg-gray-200 p-2 transition-colors group-hover:bg-gray-300">
                    <img
                      src="/articles-blog.png"
                      alt="Articles template"
                      className="h-full w-full object-contain"
                    />
                    <div className="pointer-events-none absolute bottom-2 left-1/2 -translate-x-1/2 max-w-[90%] overflow-hidden text-ellipsis whitespace-nowrap text-sm font-semibold text-gray-700 transition-opacity group-hover:opacity-0">
                      Articles
                    </div>
                    <div className="pointer-events-none absolute inset-x-4 bottom-3 opacity-0 transition-opacity group-hover:pointer-events-auto group-hover:opacity-100">
                      <Button
                        fullWidth
                        onClick={isProPlan ? () => handleApplyBlockTemplate("blogs") : () => { }}
                        size="slim"
                        variant="primary"
                        style={{ backgroundColor: "#111827", borderColor: "#111827", color: "#ffffff" }}
                      >
                        {isProPlan ? "Select" : "Upgrade to use"}
                      </Button>
                    </div>
                  </div>
                ),
              })}
              {renderBlockTemplatePreviewCard({
                title: "Latest blog",
                onSelect: isProPlan ? () => handleApplyBlockTemplate("blogs-latest") : () => { },
                badge: "Pro",
                selectLabel: isProPlan ? "Select" : "Upgrade to use",
                showSelectButton: false,
                showTitle: false,
                previewHeightClassName: "h-44",
                previewContainerClassName: "bg-transparent p-0",
                preview: (
                  <div className="relative flex h-full w-full items-center justify-center rounded-none bg-gray-200 p-2 transition-colors group-hover:bg-gray-300">
                    <img
                      src="/latest-blog.png"
                      alt="Latest blog template"
                      className="h-full w-full object-contain"
                    />
                    <div className="pointer-events-none absolute bottom-2 left-1/2 -translate-x-1/2 max-w-[90%] overflow-hidden text-ellipsis whitespace-nowrap text-sm font-semibold text-gray-700 transition-opacity group-hover:opacity-0">
                      Latest blog
                    </div>
                    <div className="pointer-events-none absolute inset-x-4 bottom-3 opacity-0 transition-opacity group-hover:pointer-events-auto group-hover:opacity-100">
                      <Button
                        fullWidth
                        onClick={isProPlan ? () => handleApplyBlockTemplate("blogs-latest") : () => { }}
                        size="slim"
                        variant="primary"
                        style={{ backgroundColor: "#111827", borderColor: "#111827", color: "#ffffff" }}
                      >
                        {isProPlan ? "Select" : "Upgrade to use"}
                      </Button>
                    </div>
                  </div>
                ),
              })}
            </div>
          );
        case "contact":
          return renderBlockTemplatePreviewCard({
            title: "Contact form",
            onSelect: selectTemplate,
            showSelectButton: false,
            showTitle: false,
            previewHeightClassName: "h-44",
            previewContainerClassName: "bg-transparent p-0",
            preview: (
              <div className="relative flex h-full w-full items-center justify-center rounded-none bg-gray-200 p-2 transition-colors group-hover:bg-gray-300">
                <img
                  src="/contact%20form.png"
                  alt="Contact form template"
                  className="h-full w-full object-contain"
                />
                <div className="pointer-events-none absolute bottom-2 left-1/2 -translate-x-1/2 max-w-[90%] overflow-hidden text-ellipsis whitespace-nowrap text-sm font-semibold text-gray-700 transition-opacity group-hover:opacity-0">
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
          return (
            <div className="flex flex-col gap-0">
              {renderBlockTemplatePreviewCard({
                title: "Special HTML",
                onSelect: isPlusPlan ? () => handleApplyBlockTemplate("html-special") : () => { },
                badge: "Plus",
                selectLabel: isPlusPlan ? "Select" : "Upgrade to use",
                showSelectButton: false,
                showTitle: false,
                previewHeightClassName: "h-44",
                previewContainerClassName: "bg-transparent p-0",
                preview: (
                  <div className="relative flex h-full w-full items-center justify-center rounded-none bg-gray-200 p-2 transition-colors group-hover:bg-gray-300">
                    <img
                      src="/custom-html.png"
                      alt="Special HTML template"
                      className="h-full w-full object-contain"
                    />
                    <div className="pointer-events-none absolute bottom-2 left-1/2 -translate-x-1/2 max-w-[90%] overflow-hidden text-ellipsis whitespace-nowrap text-sm font-semibold text-gray-700 transition-opacity group-hover:opacity-0">
                      Special HTML
                    </div>
                    <div className="pointer-events-none absolute inset-x-4 bottom-3 opacity-0 transition-opacity group-hover:pointer-events-auto group-hover:opacity-100">
                      <Button
                        fullWidth
                        onClick={isPlusPlan ? () => handleApplyBlockTemplate("html-special") : () => { }}
                        size="slim"
                        variant="primary"
                        style={{ backgroundColor: "#111827", borderColor: "#111827", color: "#ffffff" }}
                      >
                        {isPlusPlan ? "Select" : "Upgrade to use"}
                      </Button>
                    </div>
                  </div>
                ),
              })}
            </div>
          );
      }
    };

    return (
      <div
        className={`absolute right-80 top-0 z-20 flex h-full w-80 flex-col border-l border-gray-200 bg-white shadow-xl transition-all duration-200 ease-out ${showPanel ? "translate-x-0 opacity-100" : "translate-x-full opacity-0 pointer-events-none"
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
        className={`absolute right-0 top-0 z-40 flex h-full w-80 min-h-0 flex-col border-l border-gray-200 bg-white shadow-xl transition-all duration-200 ease-out ${isOpen ? "translate-x-0 opacity-100" : "translate-x-full opacity-0 pointer-events-none"
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
          <BlockStack gap="0">
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
                  className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm text-gray-700 transition-colors ${isHovered ? "bg-gray-100" : "hover:bg-gray-100"
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
        className={`absolute right-0 top-0 z-30 flex h-full w-80 min-h-0 flex-col border-l border-gray-200 bg-white shadow-xl transition-all duration-200 ease-out ${isOpen ? "translate-x-0 opacity-100" : "translate-x-full opacity-0 pointer-events-none"
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
                  className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm text-gray-700 transition-colors ${isHovered ? "bg-gray-100" : "hover:bg-gray-100"
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
                  className={`flex h-10 w-10 items-center justify-center rounded-md border ${isSelected ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:bg-gray-50"
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

  const buildEasyColumnLinkItems = () => {
    const defaultItemLabels = ["Menu item 1", "Menu item 2"];
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

  const buildSingleColumnLinkItems = () => {
    const defaultItemLabels = [
      "Menu item 1",
      "Menu item 2",
      "Menu item 3",
      "Menu item 4",
      "Menu item 5",
      "Menu item 6",
      "Menu item 7",
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
        description: "",
      })),
    ];
  };

  const buildDropdownMenuItems = () => {
    const flyoutItems = ["Submenu item 1", "Submenu item 2", "Submenu item 3"].map((label) => ({
      id: buildId(),
      label,
      url: "/",
      role: "item",
    }));
    return [
      {
        id: buildId(),
        label: "Dropdown item 1",
        url: "/",
        role: "item",
      },
      {
        id: buildId(),
        label: "Dropdown item 2",
        url: "",
        role: "group",
        expanded: true,
        children: flyoutItems,
      },
      {
        id: buildId(),
        label: "Dropdown item 3",
        url: "/",
        role: "item",
      },
    ];
  };

  const buildEasyColumnWithIcons = () => {
    const [firstIcon, secondIcon] = (() => {
      if (!ICON_LIBRARY.length) return [undefined, undefined];
      const firstIndex = Math.floor(Math.random() * ICON_LIBRARY.length);
      let secondIndex = Math.floor(Math.random() * ICON_LIBRARY.length);
      if (ICON_LIBRARY.length > 1) {
        while (secondIndex === firstIndex) {
          secondIndex = Math.floor(Math.random() * ICON_LIBRARY.length);
        }
      }
      return [
        `${ICON_PREFIX}${ICON_LIBRARY[firstIndex].id}`,
        `${ICON_PREFIX}${ICON_LIBRARY[secondIndex].id}`,
      ];
    })();
    return [
      {
        id: buildId(),
        label: "Heading",
        url: "",
        role: "item",
        isHeading: true,
        description: "",
      },
      {
        id: buildId(),
        label: "Menu item 1",
        url: "/",
        role: "item",
        description: "Description",
        icon: firstIcon,
      },
      {
        id: buildId(),
        label: "Menu item 2",
        url: "/",
        role: "item",
        description: "Description",
        icon: secondIcon,
      },
    ];
  };

  const buildMultiBlockLinkGroups = () =>
    Array.from({ length: 4 }, () => ({
      id: buildId(),
      label: "Link list",
      url: "",
      role: "group",
      expanded: false,
      blockTemplate: "links" as const,
      multiLayout: "multi-links" as const,
      linkColumns: 1,
      linkWidth: 3,
      linkTextAlign: "left" as const,
      children: buildEasyColumnLinkItems(),
    }));

  const buildMultiBlockThreeColumnsPhoto = () => {
    const linkGroups = Array.from({ length: 3 }, () => ({
      id: buildId(),
      label: "Link list",
      url: "",
      role: "group",
      expanded: false,
      blockTemplate: "links" as const,
      multiLayout: "multi-3-photo" as const,
      linkColumns: 1,
      linkWidth: 3,
      linkTextAlign: "left" as const,
      children: buildEasyColumnLinkItems(),
    }));
    const imageGroup: MenuItem = {
      id: buildId(),
      label: "Image title",
      url: "",
      role: "group",
      expanded: false,
      blockTemplate: "image",
      multiLayout: "multi-3-photo",
      icon: `${ICON_PREFIX}image`,
      description: "",
      imageWidth: 3,
      imageNoFill: false,
      imageTextAlign: "left",
    };
    return [...linkGroups, imageGroup];
  };

  const buildMultiBlockTwoColumnsTwoPhotos = () => {
    const buildLinkGroup = () => ({
      id: buildId(),
      label: "Link list",
      url: "",
      role: "group",
      expanded: false,
      blockTemplate: "links" as const,
      multiLayout: "multi-2-photos" as const,
      linkColumns: 1,
      linkWidth: 3,
      linkTextAlign: "left" as const,
      children: buildEasyColumnLinkItems(),
    });
    const buildImageGroup = () => ({
      id: buildId(),
      label: "Image title",
      url: "",
      role: "group",
      expanded: false,
      blockTemplate: "image" as const,
      multiLayout: "multi-2-photos" as const,
      icon: `${ICON_PREFIX}image`,
      description: "",
      imageWidth: 3,
      imageNoFill: false,
      imageTextAlign: "left" as const,
    });
    return [buildLinkGroup(), buildImageGroup(), buildLinkGroup(), buildImageGroup()];
  };

  const buildMultiBlockOneColumnThreePhotos = () => {
    const linkGroup = {
      id: buildId(),
      label: "Link list",
      url: "",
      role: "group",
      expanded: false,
      blockTemplate: "links" as const,
      multiLayout: "multi-1-3-photos" as const,
      linkColumns: 1,
      linkWidth: 3,
      linkTextAlign: "left" as const,
      children: buildEasyColumnLinkItems(),
    };
    const buildImageGroup = () => ({
      id: buildId(),
      label: "Image title",
      url: "",
      role: "group",
      expanded: false,
      blockTemplate: "image" as const,
      multiLayout: "multi-1-3-photos" as const,
      icon: `${ICON_PREFIX}image`,
      description: "",
      imageWidth: 3,
      imageNoFill: false,
      imageTextAlign: "left" as const,
    });
    return [linkGroup, buildImageGroup(), buildImageGroup(), buildImageGroup()];
  };

  const buildMultiBlockFourImages = () =>
    Array.from({ length: 4 }, () => ({
      id: buildId(),
      label: "Image title",
      url: "",
      role: "group",
      expanded: false,
      blockTemplate: "image" as const,
      multiLayout: "multi-4-images" as const,
      icon: `${ICON_PREFIX}image`,
      description: "",
      imageWidth: 3,
      imageNoFill: false,
      imageTextAlign: "left" as const,
    }));

  const buildMultiBlockFourProducts = () =>
    Array.from({ length: 4 }, () => ({
      id: buildId(),
      label: "Example Product Title",
      url: "",
      role: "group",
      expanded: false,
      blockTemplate: "product" as const,
      multiLayout: "multi-4-products" as const,
      productLayout: "image-top" as const,
      productWidth: 3,
      productIds: [],
    }));

  const buildMultiBlockMapContactAddress = () => {
    const mapHtml = `<iframe src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d476861.25720572006!2d105.37180736560343!3d20.973445013776995!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3135008e13800a29%3A0x2987e416210b90d!2sSMOqIE7hu5lpLCBWAeG7h3QgTmFt!5e0!3m2!1svi!2s!4v1575429838619!5m2!1svi!2s" width="100%" height="260" frameborder="0" style="border:0; pointer-events:auto;" allowfullscreen="" loading="lazy" sandbox="allow-scripts allow-same-origin allow-forms"></iframe>`;
    const addressHtml =
      "Adi-Dassler-Strasse 191074 Herzogenaurach Germany<br/>Phone: +49 (0) 9132 84-0<br/>Working hours: 8:00 - 16:00, Monday - Friday";
    const mapBlock: MenuItem = {
      id: buildId(),
      label: "Custom HTML",
      url: "",
      role: "group",
      expanded: false,
      blockTemplate: "html",
      multiLayout: "multi-map-contact-address",
      icon: `${ICON_PREFIX}code`,
      htmlContent: mapHtml,
      imageWidth: 3,
    };
    const contactBlock: MenuItem = {
      id: buildId(),
      label: "Contact",
      url: "",
      role: "group",
      expanded: false,
      blockTemplate: "contact",
      multiLayout: "multi-map-contact-address",
      contactTitle: "Contact",
      contactDescription: "",
      contactNameLabel: "Name",
      contactEmailLabel: "Email",
      contactPhoneLabel: "Phone number",
      contactMessageLabel: "Message",
      contactSubmitLabel: "Send",
      contactSuccessMessage: "Thanks for contacting us. We'll get back to you soon.",
      imageWidth: 6,
    };
    const addressBlock: MenuItem = {
      id: buildId(),
      label: "Address",
      url: "",
      role: "group",
      expanded: false,
      blockTemplate: "html",
      multiLayout: "multi-map-contact-address",
      icon: `${ICON_PREFIX}code`,
      htmlContent: addressHtml,
      imageWidth: 3,
    };
    return [mapBlock, contactBlock, addressBlock];
  };

  const buildProductListColumnItems = (
    headingLabel: string,
    productLayout: "image-top" | "image-left" = "image-left",
    itemCount: number = 4
  ) => {
    const productItems = Array.from({ length: itemCount }, () => ({
      id: buildId(),
      label: "Example Product Title",
      url: "",
      role: "item" as const,
      blockTemplate: "product" as const,
      productLayout,
      productIds: [],
      icon: `${ICON_PREFIX}tag`,
    }));
    return [
      {
        id: buildId(),
        label: headingLabel,
        url: "",
        role: "item" as const,
        isHeading: true,
        description: "",
      },
      ...productItems,
    ];
  };

  const buildProductGridItems = () => buildProductListColumnItems("Heading", "image-top");
  const buildProductListItems = () => buildProductListColumnItems("Heading", "image-left", 3);
  const buildHorizontalProductGridItems = () =>
    buildProductListColumnItems("Heading", "image-left");

  const buildProductCarouselItems = () =>
    Array.from({ length: 8 }, () => ({
      id: buildId(),
      label: "Example Product Title",
      url: "",
      role: "item" as const,
      blockTemplate: "product" as const,
      productLayout: "image-top" as const,
      productIds: [],
      icon: `${ICON_PREFIX}tag`,
    }));

  const buildMultiBlockFourProductList = () => {
    const headings = Array.from({ length: 4 }, () => "Product list");
    return headings.map((label) => ({
      id: buildId(),
      label,
      url: "",
      role: "group",
      expanded: false,
      blockTemplate: "product" as const,
      multiLayout: "multi-4-product-list" as const,
      productLayout: "image-left" as const,
      productWidth: 3,
      productIds: [],
      children: buildProductListColumnItems(label),
    }));
  };

  const buildMultiBlockOneColumnThreeProductList = () => {
    const linkGroup: MenuItem = {
      id: buildId(),
      label: "Link list",
      url: "",
      role: "group",
      expanded: false,
      blockTemplate: "links",
      multiLayout: "multi-1-column-3-product-list",
      linkColumns: 1,
      linkWidth: 2,
      linkTextAlign: "left",
      children: buildSingleColumnLinkItems(),
    };
    const productGroups = Array.from({ length: 3 }, () => ({
      id: buildId(),
      label: "Product list",
      url: "",
      role: "group",
      expanded: false,
      blockTemplate: "product" as const,
      multiLayout: "multi-1-column-3-product-list" as const,
      productLayout: "image-left" as const,
      productWidth: 3,
      productIds: [],
      children: buildProductListColumnItems("Product list"),
    }));
    return [linkGroup, ...productGroups];
  };

  const buildMultiBlockProductCarousel = () => ({
    id: buildId(),
    label: "Product carousel",
    url: "",
    role: "group",
    expanded: false,
    blockTemplate: "product" as const,
    multiLayout: "multi-product-carousel" as const,
    productLayout: "image-top" as const,
    productWidth: 12,
    productIds: [],
    children: Array.from({ length: 8 }, () => ({
      id: buildId(),
      label: "Example Product Title",
      url: "",
      role: "item" as const,
      blockTemplate: "product" as const,
      productLayout: "image-top" as const,
      productIds: [],
      icon: `${ICON_PREFIX}tag`,
    })),
  });

  const buildMultiBlockLinkListProductCarousel = () => {
    const linkGroup: MenuItem = {
      id: buildId(),
      label: "Link list",
      url: "",
      role: "group",
      expanded: false,
      blockTemplate: "links",
      multiLayout: "multi-link-list-product-carousel",
      linkColumns: 1,
      linkWidth: 3,
      linkTextAlign: "left",
      children: buildSingleColumnLinkItems(),
    };
    const carouselGroup: MenuItem = {
      id: buildId(),
      label: "Product carousel",
      url: "",
      role: "group",
      expanded: false,
      blockTemplate: "product",
      multiLayout: "multi-link-list-product-carousel",
      productLayout: "image-top",
      productWidth: 9,
      productIds: [],
      children: Array.from({ length: 8 }, () => ({
        id: buildId(),
        label: "Example Product Title",
        url: "",
        role: "item",
        blockTemplate: "product",
        productLayout: "image-top",
        productIds: [],
        icon: `${ICON_PREFIX}tag`,
      })),
    };
    return [linkGroup, carouselGroup];
  };

  const buildMultiBlockImageProductCarousel = () => {
    const imageGroup: MenuItem = {
      id: buildId(),
      label: "Image title",
      url: "",
      role: "group",
      expanded: false,
      blockTemplate: "image",
      multiLayout: "multi-image-product-carousel",
      icon: `${ICON_PREFIX}image`,
      description: "",
      imageWidth: 3,
      imageNoFill: false,
      imageTextAlign: "left",
    };
    const carouselGroup: MenuItem = {
      id: buildId(),
      label: "Product carousel",
      url: "",
      role: "group",
      expanded: false,
      blockTemplate: "product",
      multiLayout: "multi-image-product-carousel",
      productLayout: "image-top",
      productWidth: 9,
      productIds: [],
      children: Array.from({ length: 8 }, () => ({
        id: buildId(),
        label: "Example Product Title",
        url: "",
        role: "item",
        blockTemplate: "product",
        productLayout: "image-top",
        productIds: [],
        icon: `${ICON_PREFIX}tag`,
      })),
    };
    return [imageGroup, carouselGroup];
  };

  const buildMultiBlockElementGroupMasonry = () => {
    const carouselGroup: MenuItem = {
      id: buildId(),
      label: "Product carousel",
      url: "",
      role: "group",
      expanded: false,
      blockTemplate: "product",
      multiLayout: "multi-element-group-masonry",
      productLayout: "image-top",
      productWidth: 6,
      productIds: [],
      children: Array.from({ length: 8 }, () => ({
        id: buildId(),
        label: "Example Product Title",
        url: "",
        role: "item",
        blockTemplate: "product",
        productLayout: "image-top",
        productIds: [],
        icon: `${ICON_PREFIX}tag`,
      })),
    };
    const linkGroup = () => ({
      id: buildId(),
      label: "Link list",
      url: "",
      role: "group",
      expanded: false,
      blockTemplate: "links" as const,
      multiLayout: "multi-element-group-masonry" as const,
      linkColumns: 1,
      linkWidth: 3,
      linkTextAlign: "left" as const,
      children: buildSingleColumnLinkItems(),
    });
    const textGroup: MenuItem = {
      id: buildId(),
      label: "Heading",
      url: "",
      role: "group",
      expanded: false,
      blockTemplate: "html",
      multiLayout: "multi-element-group-masonry",
      htmlContent:
        "The Current Culture Marketplace<br/>Our mission is to provide the world’s most curated collection of sneakers, apparel, collectibles, trading cards and more.",
      imageWidth: 6,
    };
    return [carouselGroup, linkGroup(), linkGroup(), textGroup];
  };

  const buildThreeColumnLinkItems = () => {
    const defaultItemLabels = [
      "Menu item 1",
      "Menu item 2",
      "Menu item 3",
      "Menu item 4",
      "Menu item 5",
      "Menu item 6",
      "Menu item 7",
      "Menu item 8",
      "Menu item 9",
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

  const buildCollectionListItems = () =>
    Array.from({ length: 3 }, () => ({
      id: buildId(),
      label: "Collection title",
      url: "",
      role: "item",
      blockTemplate: "collection" as const,
      collectionIds: [],
    }));

  const buildMultiBlockPreset = (templateId: BlockTemplateId) => {
    if (templateId === "multi-3-photo") return buildMultiBlockThreeColumnsPhoto();
    if (templateId === "multi-2-photos") return buildMultiBlockTwoColumnsTwoPhotos();
    if (templateId === "multi-1-3-photos") return buildMultiBlockOneColumnThreePhotos();
    if (templateId === "multi-4-images") return buildMultiBlockFourImages();
    if (templateId === "multi-4-products") return buildMultiBlockFourProducts();
    if (templateId === "multi-map-contact-address") return buildMultiBlockMapContactAddress();
    if (templateId === "multi-4-product-list") return buildMultiBlockFourProductList();
    if (templateId === "multi-1-column-3-product-list") return buildMultiBlockOneColumnThreeProductList();
    if (templateId === "multi-product-carousel") return [buildMultiBlockProductCarousel()];
    if (templateId === "multi-link-list-product-carousel") return buildMultiBlockLinkListProductCarousel();
    if (templateId === "multi-image-product-carousel") return buildMultiBlockImageProductCarousel();
    if (templateId === "multi-element-group-masonry") return buildMultiBlockElementGroupMasonry();
    return buildMultiBlockLinkGroups();
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
          children: hasChildren ? item.children : newBlocks,
        };
      })
    );
    setSubmenuTemplateTargetId(null);
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
    const dropdownItems = buildDropdownMenuItems();
    setMenuItems((items) =>
      updateItemById(items, submenuTemplateTargetId, (item) => {
        const hasChildren = Boolean(item.children?.length);
        return {
          ...item,
          expanded: true,
          submenuTemplate: templateId,
          submenuType: templateId === "dropdown" ? "dropdown" : templateId === "horizontal-dropdown" ? "horizontal-dropdown" : "mega",
          submenuWidth: templateId === "dropdown" || templateId === "horizontal-dropdown" ? item.submenuWidth ?? "content" : item.submenuWidth,
          submenuContentAlign:
            templateId === "dropdown" || templateId === "horizontal-dropdown" ? item.submenuContentAlign ?? "center" : item.submenuContentAlign,
          children:
            hasChildren
              ? item.children
              : templateId === "mega"
                ? [spaceBlock]
                : templateId === "dropdown" || templateId === "horizontal-dropdown"
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
    // Only show for submenus (depth > 0)
    if (depth === 0) return null;
    const indent = depth * 16;

    return (
      <div
        className="group/add relative -my-2 h-4 z-[100] cursor-default"
        style={{ marginLeft: indent, marginRight: 8 }}
      >
        {/* Invisible larger hover area */}
        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-6 pointer-events-auto" />

        {/* Animated Line - scales from center, slightly thicker and darker blue */}
        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-[2px] bg-blue-600 scale-x-0 group-hover/add:scale-x-100 transition-transform duration-300 origin-center pointer-events-none shadow-[0_0_2px_rgba(37,99,235,0.2)]" />

        {/* Centered Button & Tooltip Container */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover/add:opacity-100 transition-opacity pointer-events-auto flex items-center justify-center w-8 h-8">

          {/* Tooltip - Positioned absolutely above the button, doesn't shift the button center */}
          <div className="absolute bottom-[calc(100%+4px)] left-1/2 -translate-x-1/2 flex flex-col items-center pointer-events-none mb-1">
            <div className="bg-white px-2.5 py-1.5 rounded-lg border border-gray-100 shadow-[0_4px_16px_rgba(0,0,0,0.12)] text-[11px] font-bold text-gray-800 whitespace-nowrap z-50">
              Açılır menü ekle
            </div>
            {/* Tooltip Arrow */}
            <div className="w-2.5 h-2.5 bg-white border-r border-b border-gray-100 rotate-45 -mt-1.5 shadow-[2px_2px_5px_rgba(0,0,0,0.03)] z-40" />
          </div>

          {/* Plus Button with Halo Effect */}
          <div className="relative flex items-center justify-center w-full h-full">
            {/* Halo (Outer Glow) */}
            <div className="absolute w-8 h-8 rounded-full bg-blue-500/10 blur-[2px] group-hover/add:scale-125 transition-transform duration-300" />
            <div className="absolute w-6 h-6 rounded-full bg-blue-100/40" />

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleAddItemAt(parentId, afterId);
              }}
              className="relative flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-white shadow-[0_2px_5px_rgba(0,0,0,0.2)] hover:bg-blue-700 transition-all hover:scale-110 border-2 border-white z-50"
            >
              <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4" focusable="false" aria-hidden="true">
                <path d="M10.75 5.75c0-.414-.336-.75-.75-.75s-.75.336-.75.75v3.5h-3.5c-.414 0-.75.336-.75.75s.336.75.75.75h3.5v3.5c0 .414.336.75.75.75s.75-.336.75-.75v-3.5h3.5c.414 0 .75-.336.75-.75s-.336-.75-.75-.75h-3.5v-3.5Z"></path>
              </svg>
            </button>
          </div>
        </div>
      </div>
    );
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
      item.role === "menu" && (item.submenuType === "dropdown" || item.submenuTemplate === "dropdown");
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
    const depthIndent = depth === 0 ? 0 : depth * 16;

    const dragHandle = (
      <span
        className={`absolute inset-0 flex items-center justify-center opacity-0 transition-opacity group-hover:opacity-100 ${draggedItemId === item.id ? "cursor-grabbing" : "cursor-grab"
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
        <Box paddingInlineStart="0" style={{ paddingInlineStart: depthIndent }}>
          <div>
            <div
              className={`group flex items-center gap-2 rounded-lg px-0 py-1 transition-colors ${isSelected ? "bg-gray-50" : "hover:bg-gray-50"
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
                  overflow: isExpanded ? "visible" : "hidden",
                  transition: "max-height 140ms ease, opacity 140ms ease",
                }}
              >
                <Box>
                  <div className="ml-1 border-l border-dashed border-gray-300/70">
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
                                handleAddChild(item.id, "group");
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
                              const isDropdownChildItem = parentItem?.submenuTemplate === "dropdown";
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
                            Add item
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
      if (collectionPickerOpen) {
        return renderCollectionPickerPanel();
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
                {!isVisualBlock && !isLinkListBlock && !isProductListBlock && !isCollectionListBlock ? (
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
                        {editingItem.icon ? (
                          <div className="flex justify-center">
                            <button
                              type="button"
                              className="text-sm font-medium text-red-600 hover:text-red-700"
                              onClick={() => updateEditDraft("icon", "")}
                            >
                              Remove icon
                            </button>
                          </div>
                        ) : null}
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
                  </>
                ) : isBlogBlock || isLatestBlogBlock ? (
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
                                {child.icon ? (
                                  <div className="flex justify-center">
                                    <button
                                      type="button"
                                      className="text-sm font-medium text-red-600 hover:text-red-700"
                                      onClick={() =>
                                        updateEditDraftItemById(child.id, (item) => ({ ...item, icon: "" }))
                                      }
                                    >
                                      Remove icon
                                    </button>
                                  </div>
                                ) : null}
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
                                <button
                                  type="button"
                                  onClick={() => removeEditDraftItemById(child.id)}
                                  className="text-sm font-medium text-red-600 hover:text-red-700"
                                >
                                  Remove
                                </button>
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
                              <button
                                type="button"
                                onClick={() => removeEditDraftItemById(child.id)}
                                className="text-sm font-medium text-red-600 hover:text-red-700"
                              >
                                Remove
                              </button>
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

              {!isVisualBlock && !isLinkListBlock && !isProductListBlock && !isCollectionListBlock ? (
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

      return (
        <Card padding="0" className="flex min-h-0 flex-1 flex-col">
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
            <div ref={customItemsScrollRef} className="relative z-0 flex-1 min-h-0 overflow-y-auto">
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
                    className={`w-full rounded-md px-3 py-2 text-left text-sm ${isSelected ? "bg-gray-100" : "hover:bg-gray-100"
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
              className={`h-10 w-10 rounded-full border-2 shadow-sm ${isOpen ? "border-blue-500 ring-2 ring-blue-500/30" : "border-gray-300"
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

  const renderLinkListBlock = (
    group: MenuItem,
    options: { flex?: string; wrapperStyle?: CSSProperties } = {}
  ) => {
    const headingItem = group.children?.find((child) => child.isHeading);
    const linkItems = (group.children ?? []).filter((child) => !child.isHeading);
    const columnCount = Math.max(1, group.linkColumns ?? 2);
    const itemsPerColumn = linkItems.length ? Math.ceil(linkItems.length / columnCount) : 0;
    const columnsItems = Array.from({ length: columnCount }, (_, columnIndex) =>
      linkItems.slice(columnIndex * itemsPerColumn, (columnIndex + 1) * itemsPerColumn)
    );
    const linkWidth = Math.max(1, Math.min(12, group.linkWidth ?? 6));
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
                      handleSelectItem(headingItem.id);
                    }}
                    style={{
                      width: "100%",
                      textAlign: linkTextAlign,
                      border: headingSelected ? `2px dashed ${themeSettings.menuActive}` : "2px solid transparent",
                      borderRadius: 8,
                      padding: "4px 8px",
                      background: "transparent",
                      color: previewColors.submenuHeading,
                      fontWeight: 600,
                      ...subheadingTypography,
                      lineHeight: 1.2,
                    }}
                  >
                    <span
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        justifyContent: linkJustify,
                        width: "100%",
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
                      <span style={{ textAlign: linkTextAlign }}>{headingLabel}</span>
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
                          border: isChildSelected ? `2px dashed ${themeSettings.menuActive}` : "2px solid transparent",
                          borderRadius: 8,
                          padding: "6px 8px",
                          background: "transparent",
                          color: previewColors.submenuText,
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
                                color: previewColors.submenuText,
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
                                fontWeight: 600,
                                ...subheadingTypography,
                                lineHeight: 1.2,
                              }}
                            >
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
                          </div>
                        </div>
                      </button>
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
  };

  const renderHtmlBlock = (
    group: MenuItem,
    options: { flex?: string; wrapperStyle?: CSSProperties } = {}
  ) => {
    const isGroupSelected = selectedItemId === group.id;
    const htmlWidth = Math.max(1, Math.min(12, group.imageWidth ?? 3));
    const htmlFlexBasis = `${Math.round((htmlWidth / 12) * 100)}%`;
    const htmlContent = group.htmlContent ?? "";
    const htmlHasIframe = /<iframe/i.test(htmlContent);
    const allowHtmlDrag = !htmlHasIframe;
    const htmlTitle = (group.label ?? "").trim();
    const showHtmlTitle = Boolean(htmlTitle) && htmlTitle.toLowerCase() !== "custom html";
    const htmlMinHeight =
      useImageSpaceLayout && group.multiLayout !== "multi-element-group-masonry" ? 240 : undefined;

    return (
      <div
        key={group.id}
        className="group relative border-1 border-transparent transition-colors hover:border-dotted hover:border-blue-500"
        draggable={allowHtmlDrag}
        onDragStart={(event) => {
          if (!allowHtmlDrag) return;
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
          if (!allowHtmlDrag) return;
          setDraggedItemId(null);
          setDraggedParentId(null);
          lastDragOverIdRef.current = null;
        }}
        style={{
          minHeight: htmlMinHeight,
          flex: options.flex ?? (useImageSpaceLayout ? `0 0 ${htmlFlexBasis}` : undefined),
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
        <div
          style={{
            border: "1px solid #e5e7eb",
            background: "#ffffff",
            padding: "16px",
            display: "flex",
            flexDirection: "column",
            gap: 12,
          }}
        >
          {showHtmlTitle ? (
            <div
              style={{
                color: previewColors.submenuHeading,
                fontWeight: 600,
                ...subheadingTypography,
                lineHeight: 1.2,
              }}
            >
              {htmlTitle}
            </div>
          ) : null}
          <div
            style={{
              color: previewColors.submenuText,
              ...descriptionTypography,
              lineHeight: 1.4,
            }}
            // Intentionally raw to preview embedded content.
            dangerouslySetInnerHTML={{
              __html: htmlContent || "Add your custom HTML here.",
            }}
          />
        </div>
      </div>
    );
  };

  const renderProductBlock = (
    group: MenuItem,
    options: { flex?: string; wrapperStyle?: CSSProperties } = {}
  ) => {
    const isGroupSelected = selectedItemId === group.id;
    const productWidth = Math.max(1, Math.min(12, group.productWidth ?? 3));
    const isCarouselLayout =
      group.blockTemplate === "product-carousel" ||
      group.multiLayout === "multi-product-carousel" ||
      group.multiLayout === "multi-link-list-product-carousel" ||
      group.multiLayout === "multi-image-product-carousel" ||
      group.multiLayout === "multi-element-group-masonry";
    const isProductGridLayout =
      group.blockTemplate === "product-grid" || group.blockTemplate === "product-grid-horizontal";
    const isProductListGroup =
      (group.blockTemplate === "product" || isProductGridLayout) &&
      Boolean(group.children?.length) &&
      !isCarouselLayout;
    const productLayout = isCarouselLayout
      ? "image-top"
      : group.children?.length && !isProductGridLayout
        ? "image-left"
        : group.productLayout ??
        (group.blockTemplate === "product-horizontal" ? "image-left" : "image-top");
    const productFlexBasis = `${Math.round((productWidth / 12) * 100)}%`;
    const productPreviewHeight = useImageSpaceLayout ? 220 : 150;
    const isMultiLayout = Boolean(group.multiLayout);
    const resolvedProductFlexBasis =
      group.blockTemplate === "product-horizontal"
        ? "33%"
        : isProductListGroup
          ? productFlexBasis
          : !isCarouselLayout
            ? "20%"
            : productFlexBasis;
    const productItems = group.children ?? [];
    const headingItem = isProductListGroup ? productItems.find((child) => child.isHeading) : null;
    const productHeading = isProductListGroup
      ? headingItem?.label?.trim() ?? ""
      : group.label?.trim() ?? "";
    const showProductHeading = isProductListGroup
      ? Boolean(productHeading)
      : isCarouselLayout
        ? Boolean(productHeading)
        : Boolean(group.productListCount) && Boolean(productHeading);
    const selectedProductIds = isProductListGroup || isCarouselLayout ? [] : group.productIds ?? [];
    const selectedProducts = selectedProductIds
      .map((id) => products.find((product) => product.id === id))
      .filter((product): product is ProductSummary => Boolean(product));
    const productListCount = group.productListCount ?? 0;
    const limitedProducts = productListCount
      ? selectedProducts.slice(0, productListCount)
      : selectedProducts;
    const carouselItems = isCarouselLayout
      ? productItems.filter((child) => !child.isHeading)
      : [];
    const carouselSourceItems =
      isCarouselLayout && carouselItems.length === 0
        ? Array.from({ length: 8 }, () => null)
        : carouselItems;
    const carouselProducts = isCarouselLayout
      ? carouselSourceItems.map((child) => ({
        child: child ?? undefined,
        product: child ? products.find((product) => product.id === child.productIds?.[0]) ?? null : null,
      }))
      : [];
    const carouselPageSize = 4;
    const carouselPageCount = Math.max(1, Math.ceil(carouselProducts.length / carouselPageSize));
    const carouselPage = Math.min(
      productCarouselPageById[group.id] ?? 0,
      carouselPageCount - 1
    );
    const carouselStartIndex = carouselPage * carouselPageSize;
    const carouselPageItems = carouselProducts.slice(
      carouselStartIndex,
      carouselStartIndex + carouselPageSize
    );
    const displayProducts = isCarouselLayout
      ? carouselPageItems
      : isProductListGroup
        ? productItems
          .filter((child) => !child.isHeading)
          .map((child) => ({
            child,
            product: products.find((product) => product.id === child.productIds?.[0]) ?? null,
          }))
        : (limitedProducts.length
          ? limitedProducts
          : productListCount > 0
            ? Array.from({ length: productListCount }, () => null)
            : [null]
        ).map((product) => ({ product }));
    const cardGridStyle = isCarouselLayout
      ? {
        display: "grid",
        gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
        gap: 16,
        animation: "menucraftCarouselFade 180ms ease",
      }
      : isProductListGroup
        ? isProductGridLayout
          ? { display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 16 }
          : { display: "grid", gap: 16 }
        : productLayout === "image-top" && displayProducts.length > 1
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
          flex:
            options.flex ??
            (useImageSpaceLayout || isMultiLayout ? `0 0 ${resolvedProductFlexBasis}` : undefined),
          minWidth: isMultiLayout ? 0 : undefined,
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
          {showProductHeading ? (
            <>
              <div
                style={{
                  color: previewColors.submenuHeading,
                  fontWeight: 600,
                  ...subheadingTypography,
                  lineHeight: 1.2,
                }}
              >
                {productHeading}
              </div>
              <div
                style={{
                  borderTop: `1px solid ${previewColors.submenuHeading}`,
                  opacity: 0.5,
                }}
              />
            </>
          ) : null}
          <div
            style={{
              position: "relative",
              paddingBottom: isCarouselLayout && carouselPageCount > 1 ? 28 : undefined,
            }}
          >
            <div
              key={isCarouselLayout ? `${group.id}-page-${carouselPage}` : undefined}
              style={cardGridStyle}
            >
              {displayProducts.map(({ product, child }, index) => {
                const placeholderKey = `${group.id}-placeholder-${carouselStartIndex + index}`;
                const title = product?.title ?? child?.label ?? "Example Product Title";
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
                      (!decimalSeparator && wholePart.length > 4) ||
                      (hasOnlyZeros && wholePart.length > 4);
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
                        const currencyPart =
                          parts.find((part) => part.type === "currency")?.value ?? "₺";
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
                    key={child?.id ?? product?.id ?? placeholderKey}
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
            {isCarouselLayout && carouselPageCount > 1 ? (
              <>
                <button
                  type="button"
                  onClick={() =>
                    setProductCarouselPageById((prev) => ({
                      ...prev,
                      [group.id]: Math.max(0, carouselPage - 1),
                    }))
                  }
                  disabled={carouselPage === 0}
                  aria-label="Previous slide"
                  style={{
                    position: "absolute",
                    top: "50%",
                    left: 8,
                    transform: "translateY(-50%)",
                    width: 32,
                    height: 32,
                    borderRadius: 6,
                    border: "1px solid #cbd5e1",
                    background: "#ffffff",
                    color: "#111827",
                    cursor: carouselPage === 0 ? "not-allowed" : "pointer",
                    opacity: carouselPage === 0 ? 0.4 : 1,
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 16,
                    lineHeight: 1,
                    pointerEvents: "auto",
                  }}
                >
                  {"<"}
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setProductCarouselPageById((prev) => ({
                      ...prev,
                      [group.id]: Math.min(carouselPageCount - 1, carouselPage + 1),
                    }))
                  }
                  disabled={carouselPage >= carouselPageCount - 1}
                  aria-label="Next slide"
                  style={{
                    position: "absolute",
                    top: "50%",
                    right: 8,
                    transform: "translateY(-50%)",
                    width: 32,
                    height: 32,
                    borderRadius: 6,
                    border: "1px solid #cbd5e1",
                    background: "#ffffff",
                    color: "#111827",
                    cursor: carouselPage >= carouselPageCount - 1 ? "not-allowed" : "pointer",
                    opacity: carouselPage >= carouselPageCount - 1 ? 0.4 : 1,
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 16,
                    lineHeight: 1,
                    pointerEvents: "auto",
                  }}
                >
                  {">"}
                </button>
                <div
                  style={{
                    position: "absolute",
                    left: "50%",
                    bottom: 0,
                    transform: "translateX(-50%)",
                    display: "flex",
                    gap: 6,
                  }}
                >
                  {Array.from({ length: carouselPageCount }, (_, index) => {
                    const isActive = index === carouselPage;
                    return (
                      <button
                        key={`${group.id}-dot-${index}`}
                        type="button"
                        aria-label={`Go to slide ${index + 1}`}
                        onClick={() =>
                          setProductCarouselPageById((prev) => ({
                            ...prev,
                            [group.id]: index,
                          }))
                        }
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: 9999,
                          border: "none",
                          background: isActive ? "#111827" : "#cbd5e1",
                          cursor: "pointer",
                          padding: 0,
                        }}
                      />
                    );
                  })}
                </div>
              </>
            ) : null}
          </div>
        </div>
      </div>
    );
  };

  const renderCollectionBlock = (
    group: MenuItem,
    options: { flex?: string; wrapperStyle?: CSSProperties } = {}
  ) => {
    const isGroupSelected = selectedItemId === group.id;
    const collectionWidth = Math.max(1, Math.min(12, group.imageWidth ?? 6));
    const collectionFlexBasis = `${Math.round((collectionWidth / 12) * 100)}%`;
    const collectionItems = group.children ?? [];
    const displayItems =
      collectionItems.length > 0 ? collectionItems : Array.from({ length: 3 }, () => null);
    const collectionLayout = group.collectionLayout ?? "image-top";
    const isHorizontalLayout = collectionLayout === "image-left";
    const imageBoxSize = isHorizontalLayout ? 60 : undefined;

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
          flex:
            options.flex ??
            ((useImageSpaceLayout || useBlockFlexLayout) ? `0 0 ${collectionFlexBasis}` : undefined),
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
          <div
            style={{
              display: "flex",
              gap: 16,
              flexWrap: "nowrap",
            }}
          >
            {displayItems.map((child, index) => {
              const selectedCollection = child
                ? collections.find((collection) => collection.id === child.collectionIds?.[0])
                : null;
              const title = selectedCollection?.title ?? child?.label ?? "Collection title";
              const imageSrc = selectedCollection?.image?.url;
              const imageAlt = selectedCollection?.image?.altText ?? title;
              return (
                <div
                  key={child?.id ?? `collection-placeholder-${index}`}
                  style={{
                    display: "flex",
                    flexDirection: isHorizontalLayout ? "row" : "column",
                    gap: isHorizontalLayout ? 12 : 8,
                    flex: "1 1 0",
                    minWidth: 0,
                    alignItems: isHorizontalLayout ? "center" : "stretch",
                  }}
                >
                  <div
                    style={{
                      border: "1px solid #e5e7eb",
                      background: "#f3f4f4",
                      width: isHorizontalLayout ? imageBoxSize : "100%",
                      height: isHorizontalLayout ? imageBoxSize : undefined,
                      aspectRatio: isHorizontalLayout ? undefined : "1 / 1",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      overflow: "hidden",
                      flexShrink: 0,
                    }}
                  >
                    {imageSrc ? (
                      <img
                        src={imageSrc}
                        alt={imageAlt}
                        style={{ width: "100%", height: "100%", objectFit: "contain" }}
                      />
                    ) : (
                      <Icon source={CollectionIcon} tone="subdued" />
                    )}
                  </div>
                  <div
                    style={{
                      color: previewColors.submenuText,
                      fontWeight: 600,
                      ...subheadingTypography,
                      lineHeight: 1.2,
                      ...(isHorizontalLayout
                        ? { whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }
                        : {}),
                    }}
                  >
                    {title}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  const renderBlogBlock = (
    group: MenuItem,
    options: { flex?: string; wrapperStyle?: CSSProperties } = {}
  ) => {
    const isGroupSelected = selectedItemId === group.id;
    const blogWidth = Math.max(1, Math.min(12, group.imageWidth ?? 6));
    const blogFlexBasis = `${Math.round((blogWidth / 12) * 100)}%`;
    const isLatestBlock = group.blockTemplate === "blogs-latest";
    const selectedBlogId = group.blogIds?.[0];
    const selectedBlog =
      !isLatestBlock
        ? blogs.find((blog) => blog.id === selectedBlogId) ??
        (group.url
          ? blogs.find((blog) => group.url === `/blogs/${blog.handle}`)
          : undefined)
        : undefined;
    const blogArticles = isLatestBlock
      ? latestArticles
      : selectedBlog?.articles?.nodes ?? [];
    const headingTitle = group.label || (isLatestBlock ? "Latest blog" : "Articles");
    const hasSelection = isLatestBlock ? true : Boolean(selectedBlog);
    const displayCards = hasSelection ? blogArticles : Array.from({ length: 4 }, () => null);
    const showEmptyState = hasSelection && blogArticles.length === 0;

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
          flex:
            options.flex ??
            ((useImageSpaceLayout || useBlockFlexLayout) ? `0 0 ${blogFlexBasis}` : undefined),
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
          <div
            style={{
              color: previewColors.submenuHeading,
              fontWeight: 600,
              ...subheadingTypography,
              lineHeight: 1.2,
            }}
          >
            {headingTitle}
          </div>
          <div
            style={{
              borderTop: `1px solid ${previewColors.submenuHeading}`,
              opacity: 0.5,
            }}
          />
          {showEmptyState ? (
            <div
              style={{
                color: previewColors.submenuText,
                ...subheadingTypography,
                opacity: 0.7,
              }}
            >
              No posts found.
            </div>
          ) : (
            <div
              style={{
                display: "flex",
                gap: 16,
                flexWrap: "nowrap",
                justifyContent: displayCards.length === 1 ? "flex-start" : "space-between",
              }}
            >
              {displayCards.map((article, index) => {
                const title = article?.title ?? `Blog post ${index + 1}`;
                const imageSrc = article?.image?.url;
                const imageAlt = article?.image?.altText ?? title;
                const isSingleCard = displayCards.length === 1;
                return (
                  <div
                    key={article?.id ?? `${group.id}-blog-card-${index}`}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 8,
                      flex: isSingleCard ? "0 0 25%" : "1 1 0",
                      maxWidth: isSingleCard ? "25%" : undefined,
                      minWidth: 0,
                    }}
                  >
                    <div
                      style={{
                        border: "1px solid #e5e7eb",
                        background: "#f3f4f4",
                        width: "100%",
                        aspectRatio: "1 / 1",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        overflow: "hidden",
                      }}
                    >
                      {imageSrc ? (
                        <img
                          src={imageSrc}
                          alt={imageAlt}
                          style={{ width: "100%", height: "100%", objectFit: "cover" }}
                        />
                      ) : (
                        <Icon source={BlogIcon} tone="subdued" />
                      )}
                    </div>
                    <div
                      style={{
                        color: previewColors.submenuText,
                        fontWeight: 600,
                        ...subheadingTypography,
                        lineHeight: 1.2,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {title}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderElementGroupMasonry = (groups: MenuItem[]) => {
    if (!groups.length) return null;
    const productGroup = groups.find((group) => group.blockTemplate === "product");
    const htmlGroup = groups.find((group) => group.blockTemplate === "html");
    const linkGroups = groups.filter((group) => group.blockTemplate === "links");
    const leftWidthUnits = Math.max(
      1,
      Math.min(11, productGroup?.productWidth ?? htmlGroup?.imageWidth ?? 6)
    );
    const rightWidthUnits = Math.max(1, 12 - leftWidthUnits);
    const leftBasis = `${Math.round((leftWidthUnits / 12) * 100)}%`;
    const rightBasis = `${Math.round((rightWidthUnits / 12) * 100)}%`;
    const linkWeights = linkGroups.map((group) =>
      Math.max(1, Math.min(12, group.linkWidth ?? 3))
    );
    const linkTotal = linkWeights.reduce((sum, value) => sum + value, 0) || 1;

    return (
      <div
        key="multi-element-group-masonry"
        style={{
          display: "flex",
          gap: 24,
          flexWrap: "nowrap",
          alignItems: "flex-start",
          width: "100%",
          flex: useBlockFlexLayout ? "0 0 100%" : undefined,
          gridColumn: useBlockFlexLayout ? undefined : "1 / -1",
        }}
      >
        <div
          style={{
            flex: `0 1 ${leftBasis}`,
            minWidth: 0,
            display: "flex",
            flexDirection: "column",
            gap: 6,
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
            flex: `0 1 ${rightBasis}`,
            minWidth: 0,
            display: "flex",
            gap: 16,
            flexWrap: "nowrap",
          }}
        >
          {linkGroups.map((child, index) => {
            const linkShare = linkWeights[index] / linkTotal;
            const linkBasis = `${Math.round(linkShare * 100)}%`;
            return renderLinkListBlock(child, {
              flex: `0 1 ${linkBasis}`,
              wrapperStyle: { minWidth: 0 },
            });
          })}
        </div>
      </div>
    );
  };

  const dropdownGroups = previewMenu?.children ?? [];
  const isDropdownMenu =
    previewMenu?.submenuType === "dropdown" || previewMenu?.submenuTemplate === "dropdown";
  const isHorizontalDropdownMenu =
    previewMenu?.submenuType === "horizontal-dropdown" || previewMenu?.submenuTemplate === "horizontal-dropdown";
  const dropdownItems = isDropdownMenu ? dropdownGroups : [];
  const horizontalDropdownItems = isHorizontalDropdownMenu ? dropdownGroups : [];
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
  const activeHorizontalItem = useMemo(() =>
    horizontalDropdownItems.find(item =>
      selectedItemPath?.some(p => p.id === item.id)
    ), [horizontalDropdownItems, selectedItemPath]);

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
        group.blockTemplate === "blogs-latest"
    );
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
  const dropdownContentAlign = previewMenu?.submenuContentAlign ?? "center";
  const dropdownAlignJustify =
    dropdownContentAlign === "center"
      ? "center"
      : dropdownContentAlign === "right"
        ? "flex-end"
        : "flex-start";
  const dropdownPanelWidth = previewMenu?.submenuWidth === "content" ? 200 : "100%";

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
    setMenuItems(normalizedMenuItems);
    setSelectedItemId(normalizedMenuItems[0]?.id ?? null);
    setBuilderSettings({ ...DEFAULT_BUILDER_SETTINGS, ...menuSettings });
    setRequiresExplicitSave(false);
    setActiveSaveAction(null);
    setSubmenuTemplateTargetId(null);
    setBlockTemplateTargetId(null);
    setSavedFingerprint(
      JSON.stringify({
        status: menu.status,
        items: normalizedMenuItems,
        settings: { ...DEFAULT_BUILDER_SETTINGS, ...menuSettings },
      })
    );
  }, [menu.id, menuSettings, normalizedMenuItems]);

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
          className={`pointer-events-none absolute inset-0 z-10 bg-gray-900/40 transition-opacity duration-200 ${isTemplatePickerOpen ? "opacity-100" : "opacity-0"
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
                className={`flex h-11 w-11 items-center justify-center rounded-lg transition-colors ${activePanel === panel.id
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
            <BlockStack gap="400" className="flex min-h-0 h-full flex-col">
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

              {isDropdownMenu && previewMenu ? (
                <div
                  style={{
                    background: "transparent",
                    border: "none",
                    marginTop: 0,
                    padding: 0,
                    position: "absolute",
                    top: dropdownAnchor?.top ?? menuRowHeight,
                    left: dropdownAnchor?.left ?? 0,
                    zIndex: 20,
                  }}
                >
                  <div
                    className="group relative"
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
                      const dropdownItemHeight = builderSettings.spacingLinkListRowHeight;
                      const dropdownPanelStyle: CSSProperties = {
                        background: previewColors.submenuBackground,
                        border: builderSettings.submenuShowBorder
                          ? `1px solid ${previewColors.submenuBorder}`
                          : "none",
                        borderRadius: 0,
                        boxShadow: "0 10px 30px rgba(15, 23, 42, 0.15)",
                        width: dropdownPanelWidth,
                        maxWidth: submenuMaxWidth ?? undefined,
                        overflowY: dropdownOverflowY ? "auto" : "visible",
                        maxHeight: dropdownOverflowY ? 420 : "none",
                      };

                      // Seçili item'ın top pozisyonunu bul
                      let activeItemOffsetTop = 0;
                      if (activeDropdownItem) {
                        const mainPanel = document.querySelector('[data-dropdown-main-panel]');
                        const activeItemElement = mainPanel?.querySelector(`[data-dropdown-item-id="${activeDropdownItem.id}"]`);
                        if (activeItemElement) {
                          activeItemOffsetTop = (activeItemElement as HTMLElement).offsetTop + dropdownItemHeight;
                        }
                      }
                      return (
                        <>
                          <div style={{ display: "flex", gap: 0, position: "relative" }}>
                            <div className="relative" style={dropdownPanelStyle} data-dropdown-main-panel>
                              <div style={{ display: "flex", flexDirection: "column", gap: 0, padding: 12 }}>
                                {dropdownItems.map((child) => {
                                  const hasChildren = Boolean(child.children?.length);
                                  const isActiveChild = activeDropdownItem?.id === child.id;
                                  return (
                                    <div
                                      key={child.id}
                                      className={`group/item relative ${draggedItemId === child.id ? "opacity-50" : ""}`}
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
                                          } else {
                                            setActiveDropdownItemId(null);
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
                                          justifyContent: "space-between",
                                          gap: 10,
                                          minHeight: dropdownItemHeight,
                                          padding: "8px 10px",
                                          borderRadius: 0,
                                          border: "2px solid transparent",
                                          background: isActiveChild ? "rgba(59, 130, 246, 0.08)" : "transparent",
                                          color: previewColors.submenuText,
                                          width: "100%",
                                          textAlign: dropdownContentAlign,
                                          ...subtextTypography,
                                          lineHeight: 1.2,
                                        }}
                                      >
                                        <span style={{ flex: 1, textAlign: dropdownContentAlign }}>
                                          {child.label}
                                        </span>
                                        {hasChildren ? (
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
                                <button
                                  type="button"
                                  onClick={() => handleOpenAddRoot(previewMenu.id)}
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
                            </div>
                            {activeDropdownItem ? (
                              <div style={{
                                ...dropdownPanelStyle,
                                position: "absolute",
                                left: isPreviewLeftAligned
                                  ? `-${dropdownPanelWidth === "100%" ? "100%" : (typeof dropdownPanelWidth === "number" ? dropdownPanelWidth : parseInt(dropdownPanelWidth))}px`
                                  : `${dropdownPanelWidth === "100%" ? "100%" : (typeof dropdownPanelWidth === "number" ? dropdownPanelWidth : parseInt(dropdownPanelWidth))}px`,
                                top: activeItemOffsetTop,
                              }} data-submenu-panel>
                                <div style={{ display: "flex", flexDirection: "column", gap: 6, padding: 12 }}>
                                  {(activeDropdownItem.children ?? []).map((child) => (
                                    <div
                                      key={child.id}
                                      className={`group/item relative ${draggedItemId === child.id ? "opacity-50" : ""}`}
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
                                          border: "2px solid transparent",
                                          background: "transparent",
                                          color: previewColors.submenuText,
                                          width: "100%",
                                          textAlign: dropdownContentAlign,
                                          ...subtextTypography,
                                          lineHeight: 1.2,
                                        }}
                                      >
                                        <span style={{ flex: 1, textAlign: dropdownContentAlign }}>
                                          {child.label}
                                        </span>
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
                                <div className="flex items-center gap-0" style={{ background: "rgb(17, 24, 39)", padding: "4px", borderRadius: "0", width: "100%", justifyContent: "center", marginTop: "8px" }}>
                                  <button
                                    type="button"
                                    aria-label="Back"
                                    className="flex flex-1 h-6 items-center justify-center text-white hover:bg-gray-700"
                                    onClick={() => setIsPreviewLeftAligned((prev) => !prev)}
                                  >
                                    <span style={{ fontSize: "12px" }}>
                                      {isPreviewLeftAligned ? "→ Align right" : "← Align left"}
                                    </span>
                                  </button>
                                </div>
                              </div>
                            ) : null}
                          </div>
                          <div style={{ width: dropdownPanelWidth, marginTop: 0 }}>
                            <div className="flex items-center gap-0" style={{ background: "rgb(17, 24, 39)", padding: "4px", borderRadius: "0", width: "100%", justifyContent: "center" }}>
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
                        </>
                      );
                    })()}
                  </div>
                </div>
              ) : null}

              {/* Horizontal Dropdown */}
              {isHorizontalDropdownMenu && horizontalDropdownItems.length > 0 ? (
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
                          background: previewColors.submenuBackground,
                          border: builderSettings.submenuShowBorder
                            ? `1px solid ${previewColors.submenuBorder}`
                            : "none",
                          borderRadius: 0,
                          boxShadow: "0 10px 30px rgba(15, 23, 42, 0.15)",
                          width: "100%",
                        }}
                      >
                        <div style={{ display: "flex", flexDirection: "row", alignItems: "center", width: "100%" }}>
                          <div style={{ display: "flex", flexDirection: "row", gap: 0, flexWrap: "wrap", alignItems: "center", justifyContent: menuAlignmentMap[previewMenu.submenuContentAlign || 'center'], flex: 1, padding: "0 12px" }}>
                            {horizontalDropdownItems.map((child) => {
                              const isActive = activeHorizontalItem?.id === child.id;
                              return (
                                <div
                                  key={child.id}
                                  className={`group/item relative ${draggedItemId === child.id ? "opacity-50" : ""}`}
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
                                    onClick={() => handleSelectItem(child.id)}
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
                                      border: "2px solid transparent",
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
                              + Öğe Ekle
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
                        {activeHorizontalItem && (
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
                                flexWrap: "wrap",
                                alignItems: "center",
                                justifyContent: menuAlignmentMap[activeHorizontalItem.submenuContentAlign || 'center'],
                                flex: 1,
                                padding: "0 12px",
                              }}
                            >
                              {(activeHorizontalItem.children ?? []).map((child) => {
                                const isActive = selectedItemId === child.id || selectedItemPath?.some(p => p.id === child.id);
                                return (
                                  <div
                                    key={child.id}
                                    className={`group/item relative ${draggedItemId === child.id ? "opacity-50" : ""}`}
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
                                      onClick={() => handleSelectItem(child.id)}
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
                                        border: "2px solid transparent",
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
                                + Öğe Ekle
                              </button>
                            </div>

                            {/* Alignment Buttons for Row 2 */}
                            <div style={{ background: "rgb(17, 24, 39)", padding: "4px", borderRadius: "4px", marginRight: "12px", display: "flex", gap: 0 }}>
                              <button
                                type="button"
                                className={`flex h-6 w-6 items-center justify-center rounded text-white ${activeHorizontalItem.submenuContentAlign === "left" ? "bg-gray-700" : "hover:bg-gray-800"}`}
                                onClick={() => setMenuItems((items) => updateItemById(items, activeHorizontalItem.id, (item) => ({ ...item, submenuContentAlign: "left" })))}
                              >
                                <Icon source={TextAlignLeftIcon} />
                              </button>
                              <button
                                type="button"
                                className={`flex h-6 w-6 items-center justify-center rounded text-white ${activeHorizontalItem.submenuContentAlign === "center" ? "bg-gray-700" : "hover:bg-gray-800"}`}
                                onClick={() => setMenuItems((items) => updateItemById(items, activeHorizontalItem.id, (item) => ({ ...item, submenuContentAlign: "center" })))}
                              >
                                <Icon source={TextAlignCenterIcon} />
                              </button>
                              <button
                                type="button"
                                className={`flex h-6 w-6 items-center justify-center rounded text-white ${activeHorizontalItem.submenuContentAlign === "right" ? "bg-gray-700" : "hover:bg-gray-800"}`}
                                onClick={() => setMenuItems((items) => updateItemById(items, activeHorizontalItem.id, (item) => ({ ...item, submenuContentAlign: "right" })))}
                              >
                                <Icon source={TextAlignRightIcon} />
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}

              {dropdownGroups.length > 0 && !isDropdownMenu && !isHorizontalDropdownMenu && (
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
                            : `repeat(${dropdownGroups.length}, minmax(0, 1fr))`,
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
                            const isMultiLayout = Boolean(group.multiLayout);
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
                                  flex: useImageSpaceLayout
                                    ? isMultiLayout
                                      ? `0 0 ${imageFlexBasis}`
                                      : "0 0 30%"
                                    : useBlockFlexLayout
                                      ? `0 0 ${imageFlexBasis}`
                                      : undefined,
                                  minWidth: isMultiLayout ? 0 : undefined,
                                  order: useImageSpaceLayout ? 0 : undefined,
                                  border: isGroupSelected ? `1px dashed ${themeSettings.menuActive}` : undefined,
                                  padding: "6px",
                                  borderRadius: 0,
                                }}
                              >
                                <div
                                  className="pointer-events-none absolute left-1/2 top-3 z-10 flex -translate-x-1/2 items-center gap-1 rounded-full bg-gray-900 px-2 py-1 shadow-md opacity-0 transition-opacity group-hover:pointer-events-auto group-hover:opacity-100"
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
                                style={{
                                  gridColumn: useBlockFlexLayout ? undefined : "1 / -1",
                                  flex: useBlockFlexLayout ? "0 0 100%" : undefined,
                                  border: isGroupSelected ? `1px dashed ${themeSettings.menuActive}` : undefined,
                                  padding: "0",
                                  borderRadius: 0,
                                }}
                              >
                                <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
                                  {multiColumns.map((child) =>
                                    renderLinkListBlock(child, { flex: "1 1 0", wrapperStyle: { minWidth: 0 } })
                                  )}
                                </div>
                              </div>
                            );
                          }
                          if (group.blockTemplate === "links") {
                            return renderLinkListBlock(group);
                          }
                          if (group.blockTemplate === "html") {
                            return renderHtmlBlock(group);
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
                            group.blockTemplate === "product-horizontal" ||
                            group.blockTemplate === "product-grid" ||
                            group.blockTemplate === "product-carousel" ||
                            group.blockTemplate === "product-grid-horizontal"
                          ) {
                            return renderProductBlock(group);
                          }
                          if (group.blockTemplate === "collection") {
                            return renderCollectionBlock(group);
                          }
                          if (group.blockTemplate === "blogs" || group.blockTemplate === "blogs-latest") {
                            return renderBlogBlock(group);
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
        {renderBlockTemplatePreviewPanel()}
        {renderBlockTemplatePicker()}
        {renderSubmenuTemplatePreviewPanel()}
        {renderSubmenuTemplatePicker()}
      </div>
    </div>
  );
}
