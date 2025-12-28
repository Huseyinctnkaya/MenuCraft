import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import type { ActionFunctionArgs, LoaderFunctionArgs, LinksFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useFetcher, useLocation, useNavigate, useLoaderData } from "@remix-run/react";
import {
  Badge,
  BlockStack,
  Box,
  Button,
  ButtonGroup,
  Card,
  Checkbox,
  ChoiceList,
  Divider,
  InlineStack,
  RangeSlider,
  Select,
  Text,
  TextField,
  Icon,
} from "@shopify/polaris";
import {
  ArrowLeftIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  CodeIcon,
  DesktopIcon,
  DragHandleIcon,
  DuplicateIcon,
  EditIcon,
  DeleteIcon,
  MenuIcon,
  MobileIcon,
  PaintBrushRoundIcon,
  PlusIcon,
  SearchIcon,
  SettingsIcon,
  TextFontListIcon,
  TextIcon,
} from "@shopify/polaris-icons";
import polarisStyles from "@shopify/polaris/build/esm/styles.css?url";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";

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

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
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

  return json({
    menu: {
      id: menu.id,
      name: menu.name,
      status: menu.status,
    },
    menuItems: menu.items as MenuItem[],
    menuSettings: (menu.settings as BuilderSettings | null) ?? DEFAULT_BUILDER_SETTINGS,
  });
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const shop = session.shop;
  const formData = await request.formData();
  const intent = formData.get("intent");

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

  await prisma.menu.update({
    where: { id: menuId },
    data: {
      items,
      status,
    },
  });
  if (settings) {
    await prisma.$executeRaw`
      UPDATE Menu
      SET settings = ${JSON.stringify(settings)}
      WHERE id = ${menuId} AND shop = ${shop}
    `;
  }

  return json({ ok: true });
};

type MenuItem = {
  id: string;
  label: string;
  url: string;
  role: "menu" | "group" | "item";
  expanded?: boolean;
  children?: MenuItem[];
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
};

const FONT_OPTIONS = [
  { label: "Inter", value: "Inter, system-ui, sans-serif" },
  { label: "Shopify Sans", value: "Shopify Sans, Inter, system-ui, sans-serif" },
  { label: "Helvetica", value: "Helvetica, Arial, sans-serif" },
  { label: "Georgia", value: "Georgia, serif" },
];

const buildId = () => Math.random().toString(36).slice(2, 9);

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

export default function MenuBuilder() {
  const { menu, menuItems: initialMenuItems, menuSettings } = useLoaderData<typeof loader>();
  const navigate = useNavigate();
  const location = useLocation();
  const saveFetcher = useFetcher<typeof action>();
  const [activePanel, setActivePanel] = useState<RailPanel>("menu");
  const [menuView, setMenuView] = useState<"list" | "edit">("list");
  const [menuStatus, setMenuStatus] = useState<"active" | "draft">(
    menu.status === "active" ? "active" : "draft"
  );
  const menuEnabled = menuStatus === "active";
  const [hasSavedOnce, setHasSavedOnce] = useState(menu.status === "active");
  const [previewMode, setPreviewMode] = useState<"desktop" | "mobile">("desktop");
  const [selectedItemId, setSelectedItemId] = useState<string | null>(
    initialMenuItems[0]?.id ?? null
  );
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [hoveredMenuId, setHoveredMenuId] = useState<string | null>(null);
  const [draggedItemId, setDraggedItemId] = useState<string | null>(null);
  const [draggedParentId, setDraggedParentId] = useState<string | null>(null);
  const itemRowRefs = useRef(new Map<string, HTMLDivElement>());
  const prevPositionsRef = useRef(new Map<string, DOMRect>());
  const lastDragOverIdRef = useRef<string | null>(null);

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

  const [menuItems, setMenuItems] = useState<MenuItem[]>(initialMenuItems);
  const [builderSettings, setBuilderSettings] = useState<BuilderSettings>({
    ...menuSettings,
  });
  const [requiresExplicitSave, setRequiresExplicitSave] = useState(false);
  const [savedFingerprint, setSavedFingerprint] = useState(() =>
    JSON.stringify({
      status: menu.status,
      items: initialMenuItems,
      settings: menuSettings,
    })
  );
  const lastSaveIntentRef = useRef<"save" | "publish" | "enable">("save");

  const selectedPath = useMemo(() => findItemPath(menuItems, selectedItemId), [menuItems, selectedItemId]);
  const selectedItem = selectedPath?.[selectedPath.length - 1] ?? null;
  const activeMenu = selectedPath?.[0] ?? null;
  const previewMenu = useMemo(
    () => (openMenuId ? menuItems.find((item) => item.id === openMenuId) ?? null : null),
    [menuItems, openMenuId]
  );

  const updateBuilderSetting = <K extends keyof BuilderSettings>(
    key: K,
    value: BuilderSettings[K]
  ) => {
    setBuilderSettings((prev) => ({ ...prev, [key]: value }));
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

  const handleUpdateSelected = (key: "label" | "url", value: string) => {
    if (!selectedItemId) return;
    setMenuItems((items) => updateItemById(items, selectedItemId, (item) => ({ ...item, [key]: value })));
  };

  const handleAddRoot = () => {
    const newItem: MenuItem = {
      id: buildId(),
      label: "New menu",
      url: "/",
      role: "menu",
      expanded: true,
    };
    setMenuItems((items) => [...items, newItem]);
  };

  const handleAddChild = (parentId: string, role: "group" | "item") => {
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
    const isSelected = selectedItemId === item.id;
    const hasChildren = Boolean(item.children?.length);
    const isExpanded = Boolean(item.expanded);
    const showToggle = item.role === "menu" || hasChildren;
    const itemIcon = item.role === "group" ? TextFontListIcon : TextIcon;

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
            {showToggle ? (
              <button
                type="button"
                onClick={() => handleToggleExpand(item.id)}
                aria-label={isExpanded ? "Collapse" : "Expand"}
                className="flex h-5 w-5 items-center justify-center text-gray-500 hover:text-gray-700"
              >
                <Icon source={isExpanded ? ChevronDownIcon : ChevronRightIcon} tone="subdued" />
              </button>
            ) : (
              <div className="h-5 w-5" />
            )}
            <div className="flex flex-1 items-center gap-2 text-left text-sm text-gray-700">
              <span className="flex items-center group-hover:hidden">
                <Icon source={itemIcon} tone="subdued" />
              </span>
              <span
                className={`hidden items-center group-hover:flex cursor-grab ${
                  draggedItemId === item.id ? "cursor-grabbing" : ""
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
              <span className={item.role === "menu" ? "font-medium" : "font-normal"}>
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
                onClick={() => {}}
                aria-label="Duplicate item"
                className="flex h-7 w-7 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 hover:bg-gray-100 hover:text-gray-700"
              >
                <Icon source={DuplicateIcon} tone="subdued" />
              </button>
              <button
                type="button"
                onClick={() => {}}
                aria-label="Delete item"
                className="flex h-7 w-7 items-center justify-center rounded-lg border border-gray-200 bg-white text-red-600 hover:bg-gray-100 hover:text-red-700"
              >
                <Icon source={DeleteIcon} tone="critical" />
              </button>
            </div>
          </div>

          {item.role !== "item" && isExpanded && (
            <Box>
              <div className="ml-1 border-l border-dashed border-gray-300/70 pl-5">
                <BlockStack gap="300">
                  {hasChildren
                    ? item.children?.map((child) => renderMenuTree(child, depth + 1))
                    : null}
                {item.role === "menu" ? (
                  <button
                    type="button"
                    onClick={() => handleAddChild(item.id, "group")}
                    className="mt-2 flex items-center gap-2 rounded-lg px-2 py-1 text-sm font-medium text-blue-600 hover:bg-gray-100 hover:text-blue-700"
                  >
                    <span className="h-5 w-5" />
                    <span className="flex h-5 w-5 items-center justify-center rounded-full border-2 border-blue-600 text-blue-600 text-xs leading-none">
                      +
                    </span>
                    {hasChildren ? "Blok ekle" : "Alt menü ekle"}
                  </button>
                ) : null}
                {item.role === "group" ? (
                  <button
                    type="button"
                    onClick={() => handleAddChild(item.id, "item")}
                    className="mt-2 flex items-center gap-2 rounded-lg px-2 py-1 text-sm font-medium text-blue-600 hover:bg-gray-100 hover:text-blue-700"
                  >
                    <span className="h-5 w-5" />
                    <span className="flex h-5 w-5 items-center justify-center rounded-full border-2 border-blue-600 text-blue-600 text-xs leading-none">
                      +
                    </span>
                    Öğe Ekle
                  </button>
                ) : null}
                </BlockStack>
              </div>
            </Box>
          )}
          </div>
        </Box>
      </div>
    );
  };

  const renderMenuPanel = () => {
    if (menuView === "edit" && selectedItem) {
      return (
        <Card padding="400">
          <BlockStack gap="400">
            <InlineStack gap="200" blockAlign="center">
              <Button variant="plain" icon={ArrowLeftIcon} onClick={() => setMenuView("list")}>
                Back
              </Button>
              <Text as="h2" variant="headingMd">
                Edit item
              </Text>
            </InlineStack>

            <Divider />

            <BlockStack gap="300">
              <Text as="h3" variant="headingSm">
                General
              </Text>
              <TextField
                label="Label"
                value={selectedItem.label}
                onChange={(value) => handleUpdateSelected("label", value)}
                autoComplete="off"
              />
              <TextField
                label="Link"
                value={selectedItem.url}
                onChange={(value) => handleUpdateSelected("url", value)}
                autoComplete="off"
                placeholder="https://"
              />
              <Checkbox label="Open in new tab" checked={false} onChange={() => {}} />
            </BlockStack>

            <BlockStack gap="300">
              <Text as="h3" variant="headingSm">
                Appearance
              </Text>
              <Select
                label="Item style"
                options={[
                  { label: "Default", value: "default" },
                  { label: "Highlight", value: "highlight" },
                  { label: "Badge", value: "badge" },
                ]}
                onChange={() => {}}
                value="default"
              />
              <TextField label="Badge text" value="" onChange={() => {}} autoComplete="off" />
            </BlockStack>

            <Divider />

            <InlineStack align="end" gap="200">
              <Button variant="tertiary" onClick={() => setMenuView("list")}>Cancel</Button>
              <Button variant="primary">Apply changes</Button>
            </InlineStack>
          </BlockStack>
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
            <BlockStack gap="200">
              {menuItems.map((item) => renderMenuTree(item))}
            </BlockStack>
          </div>
          <Box paddingBlockStart="200">
            <button
              type="button"
              onClick={handleAddRoot}
              className="flex w-full items-center gap-2 rounded-lg px-2 py-1 text-sm font-medium text-blue-600 hover:bg-gray-100"
            >
              <span className="flex h-5 w-5 items-center justify-center rounded-full border-2 border-blue-600 text-blue-600 text-xs leading-none">
                +
              </span>
              Öğe Ekle
            </button>
          </Box>
        </BlockStack>
      </Card>
    );
  };

  const renderTypographyPanel = () => (
    <Card padding="400">
      <BlockStack gap="400">
        <Text as="h2" variant="headingMd">
          Typography
        </Text>
        <Divider />
        <BlockStack gap="300">
          <Select
            label="Font family"
            options={FONT_OPTIONS}
            value={themeSettings.fontFamily}
            onChange={(value) => setThemeSettings((prev) => ({ ...prev, fontFamily: value }))}
          />
        </BlockStack>
      </BlockStack>
    </Card>
  );

  const renderColorsPanel = () => (
    <Card padding="400">
      <BlockStack gap="400">
        <Text as="h2" variant="headingMd">
          Colors
        </Text>
        <Divider />
        <BlockStack gap="300">
          <TextField
            label="Menu background"
            value={themeSettings.menuBackground}
            onChange={(value) => setThemeSettings((prev) => ({ ...prev, menuBackground: value }))}
            autoComplete="off"
          />
          <TextField
            label="Menu text"
            value={themeSettings.menuText}
            onChange={(value) => setThemeSettings((prev) => ({ ...prev, menuText: value }))}
            autoComplete="off"
          />
          <TextField
            label="Active item"
            value={themeSettings.menuActive}
            onChange={(value) => setThemeSettings((prev) => ({ ...prev, menuActive: value }))}
            autoComplete="off"
          />
          <TextField
            label="Dropdown background"
            value={themeSettings.dropdownBackground}
            onChange={(value) => setThemeSettings((prev) => ({ ...prev, dropdownBackground: value }))}
            autoComplete="off"
          />
          <TextField
            label="Dropdown text"
            value={themeSettings.dropdownText}
            onChange={(value) => setThemeSettings((prev) => ({ ...prev, dropdownText: value }))}
            autoComplete="off"
          />
          <TextField
            label="Dropdown heading"
            value={themeSettings.dropdownHeading}
            onChange={(value) => setThemeSettings((prev) => ({ ...prev, dropdownHeading: value }))}
            autoComplete="off"
          />
          <TextField
            label="Canvas background"
            value={themeSettings.canvasBackground}
            onChange={(value) => setThemeSettings((prev) => ({ ...prev, canvasBackground: value }))}
            autoComplete="off"
          />
        </BlockStack>
      </BlockStack>
    </Card>
  );

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
            Genel Ayarlar
          </Text>
          <Divider />

          <BlockStack gap="300">
            <Text as="h3" variant="headingSm">
              Konum
            </Text>
            <ChoiceList
              choices={[
                { label: "Otomatik", value: "auto" },
                { label: "Gezinmeyi Değiştir", value: "replaceNavigation" },
                {
                  label: "Bu CSS seçicisinde menüyü göster",
                  value: "cssSelector",
                  helpText:
                    "Bu seçeneği yalnızca geliştiriciyseniz veya yukarıdaki seçenekler işe yaramıyorsa kullanın.",
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
              Düzen
            </Text>
            <ChoiceList
              title="Oryantasyon"
              choices={[
                { label: "Yatay", value: "horizontal" },
                { label: "Dikey", value: "vertical" },
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
              title="Hizala"
              choices={[
                { label: "Sol", value: "left" },
                { label: "Sağ", value: "right" },
                { label: "Merkez", value: "center" },
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
              label="Menü maksimum genişliği"
              value={builderSettings.layoutMaxWidth}
              onChange={(value) => updateBuilderSetting("layoutMaxWidth", value)}
              suffix="px"
              autoComplete="off"
            />
          </BlockStack>

          <Divider />

          <BlockStack gap="300">
            <Text as="h3" variant="headingSm">
              Animasyon
            </Text>
            <Select
              label="Tetikleyici - Masaüstü"
              options={[
                { label: "Gezinme", value: "hover" },
                { label: "Tıklama", value: "click" },
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
              label="Tetikleyici - Mobil"
              options={[
                { label: "Geçiş düğmesine tıklayın", value: "toggle" },
                { label: "Dokunma", value: "tap" },
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
              label="Etki"
              options={[
                { label: "Solmak", value: "fade" },
                { label: "Kaydır", value: "slide" },
                { label: "Ölçek", value: "scale" },
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
                label="Geçiş hızı"
                type="number"
                value={String(builderSettings.animationDuration)}
                onChange={(value) =>
                  updateBuilderSetting("animationDuration", toNumber(value))
                }
                suffix="ms"
                autoComplete="off"
              />
              <TextField
                label="Geçiş gecikmesi"
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
              Boşluk
            </Text>
            {renderSpacingControl(
              "Ana menü dolgusu",
              builderSettings.spacingMainPadding,
              (value) => updateBuilderSetting("spacingMainPadding", value),
              0,
              60
            )}
            {renderSpacingControl(
              "Ana menü satır yüksekliği",
              builderSettings.spacingMainRowHeight,
              (value) => updateBuilderSetting("spacingMainRowHeight", value),
              30,
              90
            )}
            {renderSpacingControl(
              "Açılır satır yüksekliği",
              builderSettings.spacingDropdownRowHeight,
              (value) => updateBuilderSetting("spacingDropdownRowHeight", value),
              30,
              90
            )}
            {renderSpacingControl(
              "Sekme satır yüksekliği",
              builderSettings.spacingTabRowHeight,
              (value) => updateBuilderSetting("spacingTabRowHeight", value),
              30,
              90
            )}
            {renderSpacingControl(
              "Bağlantı listesi satır yüksekliği",
              builderSettings.spacingLinkListRowHeight,
              (value) => updateBuilderSetting("spacingLinkListRowHeight", value),
              20,
              60
            )}
          </BlockStack>

          <Divider />

          <BlockStack gap="300">
            <Text as="h3" variant="headingSm">
              Atlıkarınca
            </Text>
            <Checkbox
              label="Otomatik oynatma"
              checked={builderSettings.carouselAutoPlay}
              onChange={(value) => updateBuilderSetting("carouselAutoPlay", value)}
            />
            <Checkbox
              label="Sonsuzluk döngüsü"
              checked={builderSettings.carouselLoop}
              onChange={(value) => updateBuilderSetting("carouselLoop", value)}
            />
          </BlockStack>

          <Divider />

          <BlockStack gap="300">
            <Text as="h3" variant="headingSm">
              Gelişmiş
            </Text>
            <TextField
              label="Genişlik 'den az olduğunda mobil menü"
              type="number"
              value={String(builderSettings.advancedMobileBreakpoint)}
              onChange={(value) =>
                updateBuilderSetting("advancedMobileBreakpoint", toNumber(value))
              }
              suffix="px"
              autoComplete="off"
            />
            <Checkbox
              label="Bağlantı listesi bloğunun alt menüsünü gizle"
              checked={builderSettings.advancedHideLinkListSubmenu}
              onChange={(value) => updateBuilderSetting("advancedHideLinkListSubmenu", value)}
            />
            <Checkbox
              label="Sepete Ekle düğmesini göster"
              checked={builderSettings.advancedShowAddToCart}
              onChange={(value) => updateBuilderSetting("advancedShowAddToCart", value)}
            />
            <Checkbox
              label="Tembel yükleme görüntüsünü etkinleştir"
              checked={builderSettings.advancedEnableLazyLoading}
              onChange={(value) => updateBuilderSetting("advancedEnableLazyLoading", value)}
            />
          </BlockStack>

          <Divider />

          <BlockStack gap="300">
            <Text as="h3" variant="headingSm">
              Öğeler
            </Text>
            <Checkbox
              label="Arama kutusunu göster"
              checked={builderSettings.elementsShowSearch}
              onChange={(value) => updateBuilderSetting("elementsShowSearch", value)}
            />
            <Checkbox
              label="Masaüstünde ayırıcıyı göster"
              checked={builderSettings.elementsShowDesktopDivider}
              onChange={(value) => updateBuilderSetting("elementsShowDesktopDivider", value)}
            />
            <Checkbox
              label="Mobilde ayırıcı göster"
              checked={builderSettings.elementsShowMobileDivider}
              onChange={(value) => updateBuilderSetting("elementsShowMobileDivider", value)}
            />
            <Checkbox
              label="Göstergeleri göster (aşağı ok)"
              checked={builderSettings.elementsShowIndicators}
              onChange={(value) => updateBuilderSetting("elementsShowIndicators", value)}
            />
          </BlockStack>

          <Divider />

          <BlockStack gap="300">
            <Text as="h3" variant="headingSm">
              Hesap bağlantıları
            </Text>
            <Checkbox
              label="Giriş bağlantısını göster"
              checked={builderSettings.accountShowLogin}
              helpText="Giriş yapılmadığında"
              onChange={(value) => updateBuilderSetting("accountShowLogin", value)}
            />
            <Checkbox
              label="Kayıt bağlantısını göster"
              checked={builderSettings.accountShowRegister}
              helpText="Giriş yapılmadığında"
              onChange={(value) => updateBuilderSetting("accountShowRegister", value)}
            />
            <Checkbox
              label="Hesap bağlantısını göster"
              checked={builderSettings.accountShowAccount}
              helpText="Giriş yapıldığında"
              onChange={(value) => updateBuilderSetting("accountShowAccount", value)}
            />
            <Checkbox
              label="Çıkış bağlantısını göster"
              checked={builderSettings.accountShowLogout}
              helpText="Giriş yapıldığında"
              onChange={(value) => updateBuilderSetting("accountShowLogout", value)}
            />
          </BlockStack>

          <Divider />

          <BlockStack gap="300">
            <Text as="h3" variant="headingSm">
              Alt menü
            </Text>
            <Checkbox
              label="Sınırı göster"
              checked={builderSettings.submenuShowBorder}
              onChange={(value) => updateBuilderSetting("submenuShowBorder", value)}
            />
            <Checkbox
              label="Masaüstünde kaydırma çubuğunu etkinleştir"
              checked={builderSettings.submenuEnableDesktopScroll}
              onChange={(value) => updateBuilderSetting("submenuEnableDesktopScroll", value)}
            />
            <Checkbox
              label="Mobil cihazda kaydırma çubuğunu etkinleştir"
              checked={builderSettings.submenuEnableMobileScroll}
              onChange={(value) => updateBuilderSetting("submenuEnableMobileScroll", value)}
            />
            <TextField
              label="Alt menü maksimum genişliği"
              value={builderSettings.submenuMaxWidth}
              onChange={(value) => updateBuilderSetting("submenuMaxWidth", value)}
              suffix="px"
              autoComplete="off"
            />
            <Select
              label="Mobilde stil aç"
              options={[
                { label: "Yıkılmak", value: "collapse" },
                { label: "Açılır", value: "drawer" },
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
        <Text as="p" variant="bodySm" tone="subdued">
          Add custom CSS or JS for this mega menu.
        </Text>
        <TextField label="Custom CSS" value="" onChange={() => {}} multiline autoComplete="off" />
      </BlockStack>
    </Card>
  );

  const dropdownGroups = previewMenu?.children ?? [];
  const menuAlignmentMap: Record<BuilderSettings["layoutAlignment"], string> = {
    left: "flex-start",
    right: "flex-end",
    center: "center",
  };
  const isVerticalMenu = builderSettings.layoutOrientation === "vertical";
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
  const dropdownOverflowY =
    previewMode === "mobile"
      ? builderSettings.submenuEnableMobileScroll
      : builderSettings.submenuEnableDesktopScroll;

  const handleSaveMenu = (
    nextStatus?: "active" | "draft",
    intent: "save" | "publish" | "enable" = "save"
  ) => {
    lastSaveIntentRef.current = intent;
    if (intent !== "save") {
      setRequiresExplicitSave(true);
    }
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
  const backDisabled = isDirty || !hasSavedOnce || isSaving || requiresExplicitSave;

  useEffect(() => {
    if (saveFetcher.state === "idle" && saveFetcher.data?.ok) {
      setHasSavedOnce(true);
      setSavedFingerprint(currentFingerprint);
      if (lastSaveIntentRef.current === "save") {
        setRequiresExplicitSave(false);
      }
    }
  }, [saveFetcher.state, saveFetcher.data, currentFingerprint]);

  useEffect(() => {
    setMenuStatus(menu.status === "active" ? "active" : "draft");
    setMenuItems(initialMenuItems);
    setHasSavedOnce(menu.status === "active");
    setBuilderSettings({ ...menuSettings });
    setRequiresExplicitSave(false);
    setSavedFingerprint(
      JSON.stringify({
        status: menu.status,
        items: initialMenuItems,
        settings: menuSettings,
      })
    );
  }, [menu.id, menuSettings, initialMenuItems]);

  return (
    <div className="menucraft-builder h-screen flex flex-col bg-gray-100">
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <InlineStack align="space-between" blockAlign="center" gap="400">
          <InlineStack gap="300" blockAlign="center">
            <Button
              variant="tertiary"
              icon={ArrowLeftIcon}
              disabled={backDisabled}
              onClick={() => navigate({ pathname: "/app/mega-menus", search: location.search })}
            >
              Back
            </Button>
            <InlineStack gap="300" blockAlign="center">
              <Text as="h1" variant="headingMd">
                {menu.name}
              </Text>
              {isDirty || !hasSavedOnce ? (
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
            >
              Enable
            </Button>
            <Button
              variant="secondary"
              onClick={() => handleSaveMenu(undefined, "save")}
              loading={isSaving}
            >
              Save
            </Button>
            <Button
              variant="primary"
              onClick={() => handleSaveMenu("active", "publish")}
              loading={isSaving}
            >
              Publish
            </Button>
          </InlineStack>
        </InlineStack>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <aside className="w-16 bg-white border-r border-gray-200 flex flex-col items-center py-4 gap-2">
          {[
            { id: "menu", icon: MenuIcon, label: "Menu" },
            { id: "settings", icon: SettingsIcon, label: "Settings" },
            { id: "typography", icon: TextIcon, label: "Typography" },
            { id: "colors", icon: PaintBrushRoundIcon, label: "Colors" },
            { id: "code", icon: CodeIcon, label: "Code" },
          ].map((panel) => (
            <button
              key={panel.id}
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
                  : "text-gray-500 hover:bg-gray-50 hover:text-gray-700"
              }`}
            >
              <Icon source={panel.icon} tone={activePanel === panel.id ? "primary" : "subdued"} />
            </button>
          ))}
        </aside>

        <aside className="w-80 bg-white border-r border-gray-200 overflow-y-auto">
          <BlockStack gap="400">
            {activePanel === "menu" && renderMenuPanel()}
            {activePanel === "settings" && renderSettingsPanel()}
            {activePanel === "typography" && renderTypographyPanel()}
            {activePanel === "colors" && renderColorsPanel()}
            {activePanel === "code" && renderCodePanel()}
          </BlockStack>
        </aside>

        <main className="flex-1 overflow-auto relative" style={{ background: themeSettings.canvasBackground }}>
          <Box padding="600">
            <div
              style={{
                maxWidth: previewMode === "mobile" ? 420 : menuMaxWidth ?? 1100,
                margin: "36px auto 0",
                padding: "0 32px",
                fontFamily: themeSettings.fontFamily,
              }}
            >
              <div style={{ background: themeSettings.menuBackground, borderRadius: 0, overflow: "visible" }}>
                <div
                  style={{
                    display: "flex",
                    flexDirection: isVerticalMenu ? "column" : "row",
                    alignItems: isVerticalMenu ? "stretch" : "center",
                    justifyContent: isVerticalMenu ? "flex-start" : menuAlignmentMap[builderSettings.layoutAlignment],
                    gap: 0,
                    padding: isVerticalMenu
                      ? `${builderSettings.spacingMainPadding}px`
                      : `0 ${builderSettings.spacingMainPadding}px`,
                    height: isVerticalMenu ? "auto" : builderSettings.spacingMainRowHeight,
                    color: themeSettings.menuText,
                  }}
                >
                  {menuItems.map((item) => {
                    const isActive = openMenuId === item.id;
                    const isDimmed = Boolean(selectedItemId && activeMenu?.id && activeMenu.id !== item.id);
                    return (
                      <div
                        key={item.id}
                        className="relative inline-flex pt-9 -mt-9"
                        onMouseEnter={() => setHoveredMenuId(item.id)}
                        onMouseLeave={() => setHoveredMenuId(null)}
                      >
                        {hoveredMenuId === item.id && (
                          <div className="absolute top-0 left-0 z-20 flex items-center gap-1 rounded-lg bg-gray-900 px-2 py-1 shadow-md">
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
                              onClick={() => {}}
                              aria-label="Duplicate item"
                              className="flex h-6 w-6 items-center justify-center rounded-md text-white hover:bg-gray-800"
                            >
                              <Icon source={DuplicateIcon} />
                            </button>
                            <button
                              type="button"
                              onClick={() => {}}
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
                            background:
                              isActive || hoveredMenuId === item.id
                                ? "rgba(255,255,255,0.12)"
                                : "transparent",
                            borderRight:
                              showDividers && !isVerticalMenu
                                ? "1px solid rgba(255,255,255,0.12)"
                                : "none",
                            borderBottom:
                              showDividers && isVerticalMenu
                                ? "1px solid rgba(255,255,255,0.12)"
                                : "none",
                            borderRadius: 0,
                            height: isVerticalMenu
                              ? builderSettings.spacingMainRowHeight
                              : "100%",
                            minWidth: isVerticalMenu ? "100%" : 80,
                            padding: isVerticalMenu ? "0 12px" : "0 18px",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 6,
                            color: themeSettings.menuText,
                            opacity: isDimmed ? 0.5 : 1,
                            cursor: "grab",
                          }}
                        >
                          <span>{item.label}</span>
                          {builderSettings.elementsShowIndicators && item.children?.length ? (
                            <span style={{ display: "inline-flex" }}>
                              <ChevronDownIcon width="14" height="14" fill={themeSettings.menuText} />
                            </span>
                          ) : null}
                        </button>
                        {isActive && dropdownGroups.length === 0 && (
                          <div
                            style={{
                              position: "absolute",
                              left: 0,
                              top: "100%",
                              marginTop: 10,
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
                                background: themeSettings.dropdownBackground,
                                color: themeSettings.dropdownText,
                                fontSize: 14,
                                fontWeight: 500,
                                whiteSpace: "nowrap",
                              }}
                            >
                              <span style={{ fontSize: 16, lineHeight: 1 }}>+</span>
                              Alt menü ekle
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                  <button
                    type="button"
                    style={{
                      color: themeSettings.menuText,
                      height: isVerticalMenu ? builderSettings.spacingMainRowHeight : "100%",
                      minWidth: isVerticalMenu ? "100%" : 50,
                      padding: isVerticalMenu ? "0 12px" : "0 18px",
                      borderRight:
                        showDividers && !isVerticalMenu
                          ? "1px solid rgba(255,255,255,0.12)"
                          : "none",
                      borderBottom:
                        showDividers && isVerticalMenu
                          ? "1px solid rgba(255,255,255,0.12)"
                          : "none",
                      borderRadius: 0,
                      background: "transparent",
                    }}
                  >
                    +
                  </button>
                  {builderSettings.elementsShowSearch && (
                    <span
                      style={{
                        marginLeft: isVerticalMenu ? 0 : "auto",
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        height: isVerticalMenu ? builderSettings.spacingMainRowHeight : "100%",
                        width: isVerticalMenu ? "100%" : 50,
                        borderLeft:
                          showDividers && !isVerticalMenu
                            ? "1px solid rgba(255,255,255,0.12)"
                            : "none",
                        borderTop:
                          showDividers && isVerticalMenu
                            ? "1px solid rgba(255,255,255,0.12)"
                            : "none",
                      }}
                    >
                      <SearchIcon width="18" height="18" />
                    </span>
                  )}
                </div>
              </div>

              {dropdownGroups.length > 0 && (
                <div
                  style={{
                    background: themeSettings.dropdownBackground,
                    border: builderSettings.submenuShowBorder ? "1px solid #e5e7eb" : "none",
                    borderRadius: 12,
                    marginTop: 16,
                    padding: "20px 24px",
                    boxShadow: "0 10px 30px rgba(15, 23, 42, 0.15)",
                    maxWidth: submenuMaxWidth ?? "none",
                    overflowY: dropdownOverflowY ? "auto" : "visible",
                    maxHeight: dropdownOverflowY ? 420 : "none",
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
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: `repeat(${dropdownGroups.length}, minmax(0, 1fr))`,
                      gap: 24,
                      color: themeSettings.dropdownText,
                    }}
                  >
                    {dropdownGroups.map((group) => {
                      const isGroupSelected = selectedItemId === group.id;
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
                              <span style={{ color: themeSettings.dropdownHeading }}>{group.label}</span>
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
                                  style={{
                                    textAlign: "left",
                                    border: isChildSelected
                                      ? `2px dashed ${themeSettings.menuActive}`
                                      : "2px solid transparent",
                                    borderRadius: 8,
                                    padding: "6px 8px",
                                    minHeight: builderSettings.spacingLinkListRowHeight,
                                    background: "transparent",
                                    color: themeSettings.dropdownText,
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
                              style={{ minHeight: builderSettings.spacingLinkListRowHeight }}
                            >
                              Add item
                            </Button>
                          </BlockStack>
                        </div>
                      );
                    })}
                  </div>
                  <Box paddingBlockStart="400">
                    <ButtonGroup>
                      <Button variant="secondary" icon={PlusIcon} onClick={() => activeMenu && handleAddChild(activeMenu.id, "group")}>
                        Add block
                      </Button>
                    </ButtonGroup>
                  </Box>
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
      </div>
    </div>
  );
}
