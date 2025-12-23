import { useMemo, useState } from "react";
import type { LoaderFunctionArgs, LinksFunction } from "@remix-run/node";
import { useLocation, useNavigate } from "@remix-run/react";
import {
  Badge,
  BlockStack,
  Box,
  Button,
  ButtonGroup,
  Card,
  Checkbox,
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

export const links: LinksFunction = () => [
  { rel: "stylesheet", href: polarisStyles },
];

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await authenticate.admin(request);
  return null;
};

type MenuItem = {
  id: string;
  label: string;
  url: string;
  role: "menu" | "group" | "item";
  expanded?: boolean;
  children?: MenuItem[];
};

type RailPanel = "menu" | "theme" | "settings" | "code";

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
  const navigate = useNavigate();
  const location = useLocation();
  const [activePanel, setActivePanel] = useState<RailPanel>("menu");
  const [menuView, setMenuView] = useState<"list" | "edit">("list");
  const [menuEnabled, setMenuEnabled] = useState(true);
  const [previewMode, setPreviewMode] = useState<"desktop" | "mobile">("desktop");
  const [selectedItemId, setSelectedItemId] = useState<string | null>("catalogs");

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

  const [menuItems, setMenuItems] = useState<MenuItem[]>([
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
  ]);

  const selectedPath = useMemo(() => findItemPath(menuItems, selectedItemId), [menuItems, selectedItemId]);
  const selectedItem = selectedPath?.[selectedPath.length - 1] ?? null;
  const activeMenu = selectedPath?.[0] ?? null;

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

  const renderMenuTree = (item: MenuItem, depth: number = 0) => {
    const isSelected = selectedItemId === item.id;
    const hasChildren = Boolean(item.children?.length);
    const isExpanded = Boolean(item.expanded);
    const showToggle = item.role === "menu" || hasChildren;
    const itemIcon = item.role === "group" ? TextFontListIcon : TextIcon;

    return (
      <Box key={item.id} paddingInlineStart={depth === 0 ? "0" : "200"} paddingBlockStart="0">
        <div
          className={`group flex items-center gap-2 rounded-lg px-0 py-1 transition-colors ${
            isSelected ? "bg-gray-50" : "hover:bg-gray-50"
          }`}
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
            <span className="hidden items-center group-hover:flex">
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

        {item.role !== "item" && (
          <Box>
            <BlockStack gap="200">
              {hasChildren && item.expanded
                ? item.children?.map((child) => renderMenuTree(child, depth + 1))
                : null}
              {item.role === "menu" && isExpanded ? (
                <button
                  type="button"
                  onClick={() => handleAddChild(item.id, "group")}
                  className="flex w-full items-center gap-2 rounded-xl bg-gray-50 px-3 py-2 text-sm font-medium text-blue-600 hover:bg-gray-100"
                >
                  <span className="flex h-5 w-5 items-center justify-center rounded-full border-2 border-blue-600 text-blue-600 text-xs leading-none">
                    +
                  </span>
                  Alt menü ekle
                </button>
              ) : null}
              {item.role === "group" && (item.expanded || !hasChildren) ? (
                <button
                  type="button"
                  onClick={() => handleAddChild(item.id, "item")}
                  className="flex w-full items-center gap-2 rounded-lg py-2 pl-5 pr-2 text-sm font-medium text-blue-600 hover:bg-gray-100"
                >
                  <span className="flex h-5 w-5 items-center justify-center rounded-full border-2 border-blue-600 text-blue-600 text-xs leading-none">
                    +
                  </span>
                  Öğe Ekle
                </button>
              ) : null}
            </BlockStack>
          </Box>
        )}
      </Box>
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
          <BlockStack gap="200">
            {menuItems.map((item) => renderMenuTree(item))}
          </BlockStack>
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

  const renderThemePanel = () => (
    <Card padding="400">
      <BlockStack gap="400">
        <Text as="h2" variant="headingMd">
          Theme settings
        </Text>
        <Divider />
        <BlockStack gap="300">
          <Text as="h3" variant="headingSm">
            Typography
          </Text>
          <Select
            label="Font family"
            options={FONT_OPTIONS}
            value={themeSettings.fontFamily}
            onChange={(value) => setThemeSettings((prev) => ({ ...prev, fontFamily: value }))}
          />
        </BlockStack>
        <BlockStack gap="300">
          <Text as="h3" variant="headingSm">
            Colors
          </Text>
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
        <BlockStack gap="300">
          <Text as="h3" variant="headingSm">
            Layout
          </Text>
          <RangeSlider
            label="Menu item spacing"
            value={themeSettings.menuItemSpacing}
            min={12}
            max={60}
            onChange={(value) => setThemeSettings((prev) => ({ ...prev, menuItemSpacing: value }))}
          />
        </BlockStack>
      </BlockStack>
    </Card>
  );

  const renderSettingsPanel = () => (
    <Card padding="400">
      <BlockStack gap="400">
        <Text as="h2" variant="headingMd">
          Menu settings
        </Text>
        <Divider />
        <BlockStack gap="300">
          <Select
            label="Alignment"
            options={[
              { label: "Left", value: "left" },
              { label: "Center", value: "center" },
              { label: "Right", value: "right" },
            ]}
            onChange={() => {}}
            value="left"
          />
          <Checkbox label="Show search icon" checked onChange={() => {}} />
          <Checkbox label="Show dropdown indicators" checked onChange={() => {}} />
          <Checkbox label="Enable sticky header" checked={false} onChange={() => {}} />
        </BlockStack>
      </BlockStack>
    </Card>
  );

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

  const dropdownGroups = activeMenu?.children ?? [];

  return (
    <div className="menucraft-builder h-screen flex flex-col bg-gray-100">
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <InlineStack align="space-between" blockAlign="center" gap="400">
          <InlineStack gap="300" blockAlign="center">
            <Button
              variant="tertiary"
              icon={ArrowLeftIcon}
              onClick={() => navigate({ pathname: "/app/mega-menus", search: location.search })}
            >
              Back
            </Button>
            <InlineStack gap="200" blockAlign="center">
              <Text as="h1" variant="headingMd">
                Mega menu #160205
              </Text>
              <Badge tone={menuEnabled ? "success" : "read-only"}>{menuEnabled ? "Active" : "Draft"}</Badge>
            </InlineStack>
          </InlineStack>

          <InlineStack gap="200" blockAlign="center">
            <Button variant="secondary" onClick={() => setMenuEnabled(!menuEnabled)}>
              {menuEnabled ? "Disable" : "Enable"}
            </Button>
            <Button variant="secondary">Save</Button>
            <Button variant="primary">Publish</Button>
          </InlineStack>
        </InlineStack>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <aside className="w-16 bg-white border-r border-gray-200 flex flex-col items-center py-4 gap-3">
          {[
            { id: "menu", icon: MenuIcon, label: "Menu" },
            { id: "theme", icon: PaintBrushRoundIcon, label: "Theme" },
            { id: "settings", icon: SettingsIcon, label: "Settings" },
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
              className={`flex h-12 w-12 items-center justify-center rounded-xl border transition-colors ${
                activePanel === panel.id
                  ? "border-indigo-100 bg-indigo-50"
                  : "border-transparent text-gray-500 hover:bg-gray-50 hover:text-gray-700"
              }`}
            >
              <Icon source={panel.icon} tone={activePanel === panel.id ? "primary" : "subdued"} />
            </button>
          ))}
        </aside>

        <aside className="w-96 bg-white border-r border-gray-200 overflow-y-auto">
          <BlockStack gap="400">
            {activePanel === "menu" && renderMenuPanel()}
            {activePanel === "theme" && renderThemePanel()}
            {activePanel === "settings" && renderSettingsPanel()}
            {activePanel === "code" && renderCodePanel()}
          </BlockStack>
        </aside>

        <main className="flex-1 overflow-auto relative" style={{ background: themeSettings.canvasBackground }}>
          <Box padding="600">
            <div
              style={{
                maxWidth: previewMode === "mobile" ? 420 : 1100,
                margin: "0 auto",
                fontFamily: themeSettings.fontFamily,
              }}
            >
              <div style={{ background: themeSettings.menuBackground, borderRadius: 14, overflow: "hidden" }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: themeSettings.menuItemSpacing,
                    padding: "14px 24px",
                    color: themeSettings.menuText,
                  }}
                >
                  {menuItems.map((item) => {
                    const isActive = activeMenu?.id === item.id;
                    const isDimmed = Boolean(selectedItemId && activeMenu?.id && activeMenu.id !== item.id);
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleSelectItem(item.id)}
                        style={{
                          background: isActive ? "rgba(255,255,255,0.08)" : "transparent",
                          border: isActive ? `2px solid ${themeSettings.menuActive}` : "2px solid transparent",
                          borderRadius: 10,
                          padding: "6px 12px",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 6,
                          color: themeSettings.menuText,
                          opacity: isDimmed ? 0.5 : 1,
                          cursor: "pointer",
                        }}
                      >
                        <span>{item.label}</span>
                        {item.role === "menu" && item.children?.length ? (
                          <span style={{ display: "inline-flex" }}>
                            <ChevronDownIcon width="14" height="14" />
                          </span>
                        ) : null}
                      </button>
                    );
                  })}
                  <button type="button" style={{ color: themeSettings.menuText }}>
                    +
                  </button>
                  <span style={{ marginLeft: "auto", display: "flex" }}>
                    <SearchIcon width="18" height="18" />
                  </span>
                </div>
              </div>

              <div
                style={{
                  background: themeSettings.dropdownBackground,
                  border: "1px solid #e5e7eb",
                  borderRadius: 12,
                  marginTop: 16,
                  padding: "20px 24px",
                  boxShadow: "0 10px 30px rgba(15, 23, 42, 0.15)",
                }}
              >
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: `repeat(${Math.max(dropdownGroups.length, 1)}, minmax(0, 1fr))`,
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
                        <Text as="h3" variant="headingSm" fontWeight="semibold">
                          <span style={{ color: themeSettings.dropdownHeading }}>{group.label}</span>
                        </Text>
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
