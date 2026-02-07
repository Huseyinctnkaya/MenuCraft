import crypto from "crypto";
import { useEffect, useRef, useState } from "react";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useFetcher, useLoaderData, useLocation, useNavigate, useRevalidator } from "@remix-run/react";
import { Copy, Download, Edit, Eye, EyeOff, MoreVertical, Plus, Smartphone, Trash2, Upload } from "lucide-react";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";
import Badge from "../components/ui/Badge";
import CustomButton from "../components/ui/Button";
import Card from "../components/ui/Card";
import { ALL_BILLING_PLAN_NAMES, getPlanSelection } from "../config/billing";
import type { loader as appLoader } from "./app";
import { useRouteLoaderData } from "@remix-run/react";
import { Banner, BlockStack, Modal, Select, Text as PolarisText, TextField } from "@shopify/polaris";
import polarisStyles from "@shopify/polaris/build/esm/styles.css?url";

export const links = () => [
  { rel: "stylesheet", href: polarisStyles },
];

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin: adminLoader, billing, session } = await authenticate.admin(request);
  const shop = session.shop;

  /* DEV OVERRIDE */
  const planSelection = {
    id: "plus" as const,
    period: "monthly" as const,
  };

  const [menus, shopifyMenusResponse, eventCounts] = await Promise.all([
    prisma.$queryRaw<any[]>`
      SELECT id, name, status, json_array_length(items) as itemCount
      FROM Menu
      WHERE shop = ${shop}
      ORDER BY id ASC
    `,
    adminLoader.graphql(
      `#graphql
      query getShopifyMenus {
        menus(first: 50) {
          nodes {
            id
            title
          }
        }
      }`
    ),
    prisma.menuEvent.groupBy({
      by: ["menuId"],
      where: {
        shop,
        eventType: "impression",
      },
      _count: {
        _all: true,
      },
    }),
  ]);

  const viewCounts = new Map(
    eventCounts.map((ec) => [ec.menuId, ec._count._all])
  );
  const shopifyMenusData = await shopifyMenusResponse.json();
  const shopifyMenus = shopifyMenusData?.data?.menus?.nodes || [];

  return json({
    planTier: planSelection.id,
    menuCount: menus.length,
    menus: menus.map((menu) => ({
      id: menu.id,
      name: menu.name,
      status: menu.status,
      itemCount: Number(menu.itemCount || 0),
      views: Number(viewCounts.get(menu.id) || 0),
    })),
    shopifyMenus,
  });
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { admin, billing, session } = await authenticate.admin(request);
  const shop = session.shop;
  const formData = await request.formData();
  const intent = formData.get("intent");

  if (intent === "delete") {
    const menuId = Number(formData.get("menuId"));
    if (!menuId) {
      return json({ ok: false, error: "Missing menu id" }, { status: 400 });
    }
    await prisma.menu.deleteMany({ where: { id: menuId, shop } });
    return json({ ok: true });
  }

  if (intent === "duplicate") {
    const menuId = Number(formData.get("menuId"));
    if (!menuId) {
      return json({ ok: false, error: "Missing menu id" }, { status: 400 });
    }
    const menu = await prisma.menu.findFirst({ where: { id: menuId, shop } });
    if (!menu) {
      return json({ ok: false, error: "Menu not found" }, { status: 404 });
    }

    // Check plan limit for duplication
    const billingTestMode =
      process.env.BILLING_TEST === "true" || process.env.NODE_ENV !== "production";
    const { appSubscriptions } = await billing.check({
      plans: [...ALL_BILLING_PLAN_NAMES],
      isTest: billingTestMode,
    });
    const activeSubscription = appSubscriptions.find((subscription) =>
      ["ACTIVE", "ACCEPTED"].includes(subscription.status)
    );
    /* DEV OVERRIDE */
    const planSelection = { id: "plus" as const };

    if (planSelection.id === "free") {
      const menuCount = await prisma.menu.count({ where: { shop } });
      if (menuCount >= 1) {
        return json({ ok: false, error: "Plan limit reached. Upgrade to Pro for unlimited menus." }, { status: 403 });
      }
    }

    const duplicated = await prisma.menu.create({
      data: {
        shop,
        name: menu.name,
        status: menu.status,
        items: menu.items as any,
        settings: menu.settings as any,
      },
    });
    const copyName = menu.name.toLowerCase().startsWith("mega menu #")
      ? `Mega menu #${duplicated.id} (Copy)`
      : `${menu.name} (Copy)`;
    const updated = await prisma.menu.update({
      where: { id: duplicated.id },
      data: { name: copyName },
    });
    return json({
      ok: true,
      menu: {
        id: updated.id,
        name: updated.name,
        status: updated.status,
        items: updated.items,
        views: 0,
      },
    });
  }

  if (intent === "rename") {
    const menuId = Number(formData.get("menuId"));
    const newName = formData.get("newName") as string;
    if (!menuId || !newName) {
      return json({ ok: false, error: "Missing menu id or new name" }, { status: 400 });
    }
    await prisma.menu.update({
      where: { id: menuId, shop },
      data: { name: newName },
    });
    return json({ ok: true });
  }

  if (intent === "import") {
    // Check plan
    const billingTestMode = process.env.BILLING_TEST === "true" || process.env.NODE_ENV !== "production";
    const { appSubscriptions } = await billing.check({
      plans: [...ALL_BILLING_PLAN_NAMES],
      isTest: billingTestMode,
    });
    const activeSubscription = appSubscriptions.find((subscription) =>
      ["ACTIVE", "ACCEPTED"].includes(subscription.status)
    );
    /* DEV OVERRIDE */
    const planSelection = { id: "plus" as const };
    const isPlusPlan = planSelection.id === "plus";
    if (!isPlusPlan) {
      return json({ ok: false, error: "Import feature is only available on Plus plan" }, { status: 403 });
    }

    const configStr = formData.get("config") as string;
    if (!configStr) {
      return json({ ok: false, error: "Missing configuration data" }, { status: 400 });
    }

    try {
      const config = JSON.parse(configStr);
      const imported = await prisma.menu.create({
        data: {
          shop,
          name: `${config.name} (Imported)`,
          status: "draft",
          items: (config.items || []) as any,
          settings: (config.settings || {}) as any,
        },
      });

      return json({
        ok: true,
        menu: {
          id: imported.id,
          name: imported.name,
          status: imported.status,
          items: imported.items,
          settings: imported.settings,
          views: 0,
        },
      });
    } catch (e) {
      return json({ ok: false, error: "Invalid configuration format" }, { status: 400 });
    }
  }

  if (intent === "export-config") {
    const menuId = Number(formData.get("menuId"));
    if (!menuId) {
      return json({ ok: false, error: "Missing menu id" }, { status: 400 });
    }
    const menu = await prisma.menu.findFirst({
      where: { id: menuId, shop },
      select: {
        name: true,
        items: true,
        settings: true,
      }
    });
    if (!menu) {
      return json({ ok: false, error: "Menu not found" }, { status: 404 });
    }
    return json({ ok: true, config: menu });
  }

  if (intent === "import-shopify") {
    // Check plan
    const billingTestMode = process.env.BILLING_TEST === "true" || process.env.NODE_ENV !== "production";
    const { appSubscriptions } = await billing.check({
      plans: [...ALL_BILLING_PLAN_NAMES],
      isTest: billingTestMode,
    });
    const activeSubscription = appSubscriptions.find((subscription) =>
      ["ACTIVE", "ACCEPTED"].includes(subscription.status)
    );
    /* DEV OVERRIDE */
    const planSelection = { id: "plus" as const };
    const isPlusPlan = planSelection.id === "plus";
    if (!isPlusPlan) {
      return json({ ok: false, error: "Shopify import feature is only available on Plus plan" }, { status: 403 });
    }

    const shopifyMenuId = formData.get("shopifyMenuId") as string;

    // Fetch Shopify menus using the same query format as loader
    const shopifyMenusResponse = await admin.graphql(
      `#graphql
      query getShopifyMenus {
        menus(first: 50) {
          nodes {
            id
            title
            handle
            items {
              id
              title
              url
              items {
                id
                title
                url
                items {
                  id
                  title
                  url
                }
              }
            }
          }
        }
      }`
    );
    const shopifyMenusData = await shopifyMenusResponse.json();
    const shopifyMenus = shopifyMenusData?.data?.menus?.nodes || [];

    const sourceMenu = shopifyMenus.find((m: any) => m.id === shopifyMenuId);
    if (!sourceMenu) {
      return json({ ok: false, error: "Shopify menu not found" }, { status: 404 });
    }

    const mapItems = (items: any[]): any[] => {
      return items.map((item) => ({
        id: crypto.randomUUID(),
        label: item.title,
        type: "link",
        url: item.url || "#",
        children: item.items ? mapItems(item.items) : [],
      }));
    };

    const imported = await prisma.menu.create({
      data: {
        shop,
        name: `${sourceMenu.title} (Shopify Import)`,
        status: "draft",
        items: mapItems(sourceMenu.items || []) as any,
        settings: {
          layout: "horizontal",
          trigger: "hover",
          maxWidth: "1200px",
          typography: {
            fontFamily: "Inter",
            fontSize: "14px",
          },
          colors: {
            background: "#ffffff",
            text: "#111827",
            accent: "#4f46e5",
          }
        } as any,
      },
    });

    return json({ ok: true, menuId: imported.id });
  }

  return json({ ok: false, error: "Unknown intent" }, { status: 400 });
};

export default function MegaMenusList() {
  const { menus: rawMenus, planTier, menuCount } = useLoaderData<typeof loader>();
  const appData = useRouteLoaderData<typeof appLoader>("routes/app");
  const currentPlan = planTier ?? appData?.planTier ?? "free";
  const currentMenuCount = menuCount ?? appData?.menuCount ?? 0;

  const isFreePlan = currentPlan === "free";
  const isPlusPlan = currentPlan === "plus";
  const limitReached = isFreePlan && currentMenuCount >= 1;
  const navigate = useNavigate();
  const location = useLocation();
  const deleteFetcher = useFetcher<typeof action>();
  const duplicateFetcher = useFetcher<typeof action>();
  const importFetcher = useFetcher<typeof action>();
  const renameFetcher = useFetcher<typeof action>();
  const revalidator = useRevalidator();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [shopifyImportOpen, setShopifyImportOpen] = useState(false);
  const [selectedShopifyMenuId, setSelectedShopifyMenuId] = useState("");
  const shopifyImportFetcher = useFetcher<any>();
  const exportFetcher = useFetcher<any>();
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, right: 0 });
  const buttonRefs = useRef<{ [key: number]: HTMLButtonElement | null }>({});
  const [menusState, setMenusState] = useState(rawMenus);
  const deleteRevalidatedRef = useRef(false);
  const duplicateRevalidatedRef = useRef(false);
  const renameRevalidatedRef = useRef(false);
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const [renameModalOpen, setRenameModalOpen] = useState(false);
  const [renameMenuId, setRenameMenuId] = useState<number | null>(null);
  const [renameNewName, setRenameNewName] = useState("");

  useEffect(() => {
    setMenusState(rawMenus);
  }, [rawMenus]);

  const countItems = (items: unknown): number => {
    if (!Array.isArray(items)) return 0;
    return items.reduce((total, item) => {
      if (!item || typeof item !== "object") return total;
      const children = (item as { children?: unknown }).children;
      return total + 1 + countItems(children);
    }, 0);
  };

  const menus = menusState.map((menu: any) => ({
    ...menu,
    items: countItems(menu.items),
  }));

  const buildSearch = (extra?: Record<string, string>) => {
    const search = new URLSearchParams(location.search);
    if (extra) {
      Object.entries(extra).forEach(([key, value]) => {
        if (value) {
          search.set(key, value);
        } else {
          search.delete(key);
        }
      });
    }
    const output = search.toString();
    return output ? `?${output}` : "";
  };

  const withSearch = (path: string, extra?: Record<string, string>): any => ({
    pathname: path,
    search: buildSearch(extra),
  });

  const handleOpenDropdown = (menuId: number) => {
    const button = buttonRefs.current[menuId];
    if (button) {
      const rect = button.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + 4,
        right: window.innerWidth - rect.right,
      });
      setOpenMenuId(menuId);
    }
  };

  useEffect(() => {
    if (deleteFetcher.state === "submitting") {
      deleteRevalidatedRef.current = false;
      return;
    }
    if (deleteFetcher.state === "idle" && deleteFetcher.data?.ok && !deleteRevalidatedRef.current) {
      deleteRevalidatedRef.current = true;
      revalidator.revalidate();
    }
  }, [deleteFetcher.state, deleteFetcher.data, revalidator]);

  useEffect(() => {
    if (duplicateFetcher.state === "submitting") {
      duplicateRevalidatedRef.current = false;
      return;
    }
    if (duplicateFetcher.state === "idle" && duplicateFetcher.data?.ok && !duplicateRevalidatedRef.current) {
      duplicateRevalidatedRef.current = true;
      revalidator.revalidate();
    }
  }, [duplicateFetcher.state, duplicateFetcher.data, revalidator]);

  useEffect(() => {
    if (renameFetcher.state === "submitting") {
      renameRevalidatedRef.current = false;
      return;
    }
    if (renameFetcher.state === "idle" && renameFetcher.data?.ok && !renameRevalidatedRef.current) {
      renameRevalidatedRef.current = true;
      setRenameModalOpen(false);
      revalidator.revalidate();
    }
  }, [renameFetcher.state, renameFetcher.data, revalidator]);

  useEffect(() => {
    if (shopifyImportFetcher.state === "idle" && shopifyImportFetcher.data?.ok) {
      setShopifyImportOpen(false);
      revalidator.revalidate();
    }
  }, [shopifyImportFetcher.state, shopifyImportFetcher.data, revalidator]);

  useEffect(() => {
    if (exportFetcher.state === "idle" && exportFetcher.data?.ok && exportFetcher.data?.config) {
      const { config } = exportFetcher.data;
      const exportData = {
        name: config.name,
        items: config.items,
        settings: config.settings,
      };
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${config.name.replace(/\s+/g, "_")}_config.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  }, [exportFetcher.state, exportFetcher.data]);

  const handleExport = (menu: any) => {
    if (!isPlusPlan) {
      setUpgradeModalOpen(true);
      setOpenMenuId(null);
      return;
    }
    const actionPath = withSearch("/app/mega-menus");
    exportFetcher.submit(
      { intent: "export-config", menuId: String(menu.id) },
      { method: "post", action: `${actionPath.pathname}${actionPath.search}` }
    );
  };

  const handleImportClick = () => {
    if (!isPlusPlan) {
      setUpgradeModalOpen(true);
      return;
    }
    fileInputRef.current?.click();
  };

  const handleShopifyImportClick = () => {
    if (!isPlusPlan) {
      setUpgradeModalOpen(true);
      return;
    }
    setShopifyImportOpen(true);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      const actionPath = withSearch("/app/mega-menus");
      importFetcher.submit(
        { intent: "import", config: content },
        { method: "post", action: `${actionPath.pathname}${actionPath.search}` }
      );
    };
    reader.readAsText(file);
    event.target.value = ""; // Reset
  };

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <PolarisText as="h1" variant="headingXl">Mega Menus</PolarisText>
            <PolarisText as="p" variant="bodyMd" tone="subdued">Manage all your navigation menus</PolarisText>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="file"
              ref={fileInputRef}
              style={{ display: "none" }}
              accept=".json"
              onChange={handleFileChange}
            />
            <CustomButton variant={"ghost" as any} onClick={handleImportClick} loading={importFetcher.state === "submitting"}>
              <Upload className="w-4 h-4" />
              Import from File
            </CustomButton>
            <CustomButton variant={"ghost" as any} onClick={handleShopifyImportClick}>
              <Smartphone className="w-4 h-4" />
              Import from Shopify
            </CustomButton>
            <CustomButton
              disabled={limitReached}
              onClick={() =>
                navigate(withSearch("/app/menu-builder", { id: "", returnTo: location.pathname }))
              }
            >
              <Plus className="w-4 h-4" />
              Create New Menu
            </CustomButton>
          </div>
        </div>

        {limitReached && (
          <Banner
            title="Menu limit reached"
            action={{ content: "Upgrade to Pro", onAction: () => navigate("/app/pricing") }}
            tone="info"
          >
            <BlockStack gap="200">
              <PolarisText as="p" variant="bodyMd">
                You are currently on the <strong>Free plan</strong>, which is limited to <strong>1 mega menu</strong>.
                Upgrade to the <strong>Pro plan</strong> to create unlimited menus and unlock advanced features.
              </PolarisText>
            </BlockStack>
          </Banner>
        )}

        <Card>
          {menus.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-gray-600">No menus yet. Create your first one!</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs text-gray-600">Menu Name</th>
                    <th className="px-6 py-3 text-left text-xs text-gray-600">Status</th>
                    <th className="px-6 py-3 text-left text-xs text-gray-600">Items</th>
                    <th className="px-6 py-3 text-left text-xs text-gray-600">Views</th>
                    <th className="px-6 py-3 text-right text-xs text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {menus.map((menu) => (
                    <tr key={menu.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <button
                          className="text-sm text-gray-900 hover:text-indigo-600"
                          onClick={() =>
                            navigate(
                              withSearch("/app/menu-builder", {
                                id: String(menu.id),
                                returnTo: location.pathname,
                              })
                            )
                          }
                        >
                          {menu.name}
                        </button>
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant={menu.status === "active" ? "success" : "default"}>
                          {menu.status === "active" ? (
                            <>
                              <Eye className="w-3 h-3" /> Active
                            </>
                          ) : (
                            <>
                              <EyeOff className="w-3 h-3" /> Draft
                            </>
                          )}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {menu.itemCount}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {menu.views.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 relative">
                        <div className="flex items-center justify-end gap-2">
                          <CustomButton
                            variant={"ghost" as any}
                            size="sm"
                            onClick={() =>
                              navigate(
                                withSearch("/app/menu-builder", {
                                  id: String(menu.id),
                                  returnTo: location.pathname,
                                })
                              )
                            }
                          >
                            Customize
                          </CustomButton>
                          <CustomButton
                            variant={"ghost" as any}
                            size="sm"
                            disabled={limitReached}
                            onClick={() => {
                              if (limitReached) return;
                              const actionPath = withSearch("/app/mega-menus");
                              duplicateFetcher.submit(
                                { intent: "duplicate", menuId: String(menu.id) },
                                { method: "post", action: `${actionPath.pathname}${actionPath.search}` }
                              );
                            }}
                          >
                            <Copy className="w-4 h-4" />
                          </CustomButton>
                          <div className="relative">
                            <CustomButton
                              variant={"ghost" as any}
                              size="sm"
                              ref={(el: HTMLButtonElement | null) => {
                                buttonRefs.current[menu.id] = el;
                              }}
                              onClick={() => handleOpenDropdown(menu.id)}
                            >
                              <MoreVertical className="w-4 h-4" />
                            </CustomButton>

                            {openMenuId === menu.id && (
                              <>
                                <div
                                  className="fixed inset-0 z-10"
                                  onClick={() => setOpenMenuId(null)}
                                />
                                <div
                                  className="fixed w-48 bg-white rounded-lg border border-gray-200 shadow-lg z-50"
                                  style={{
                                    top: `${dropdownPosition.top}px`,
                                    right: `${dropdownPosition.right}px`,
                                  }}
                                >
                                  <div className="py-1">
                                    <button
                                      onClick={() => {
                                        setRenameMenuId(menu.id);
                                        setRenameNewName(menu.name);
                                        setRenameModalOpen(true);
                                        setOpenMenuId(null);
                                      }}
                                      className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                                    >
                                      <Edit className="w-4 h-4" />
                                      Rename Menu
                                    </button>
                                    <button
                                      onClick={() => {
                                        handleExport(menu);
                                        setOpenMenuId(null);
                                      }}
                                      className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                                    >
                                      <Download className="w-4 h-4" />
                                      Export Menu
                                    </button>
                                    <div className="border-t border-gray-200 my-1" />
                                    <button
                                      onClick={() => {
                                        setMenusState((prev) => prev.filter((item) => item.id !== menu.id));
                                        const actionPath = withSearch("/app/mega-menus");
                                        deleteFetcher.submit(
                                          { intent: "delete", menuId: String(menu.id) },
                                          { method: "post", action: `${actionPath.pathname}${actionPath.search}` }
                                        );
                                        setOpenMenuId(null);
                                      }}
                                      className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                      Delete Menu
                                    </button>
                                  </div>
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {/* Shopify Import Modal */}
        <Modal
          open={shopifyImportOpen}
          onClose={() => setShopifyImportOpen(false)}
          title="Import from Shopify Navigation"
          primaryAction={{
            content: "Import Menu",
            onAction: () => {
              if (!selectedShopifyMenuId) return;
              const actionPath = withSearch("/app/mega-menus");
              shopifyImportFetcher.submit(
                { intent: "import-shopify", shopifyMenuId: selectedShopifyMenuId },
                { method: "post", action: `${actionPath.pathname}${actionPath.search}` }
              );
            },
            loading: shopifyImportFetcher.state === "submitting",
            disabled: !selectedShopifyMenuId,
          }}
          secondaryActions={[
            {
              content: "Cancel",
              onAction: () => setShopifyImportOpen(false),
            },
          ]}
        >
          <Modal.Section>
            <BlockStack gap="400">
              <PolarisText as="p" variant="bodyMd">
                Select an existing Shopify navigation menu to import. We will convert it into a Mega Menu structure for you.
              </PolarisText>
              <Select
                label="Select Shopify Menu"
                options={[
                  { label: "Choose a menu...", value: "" },
                  ...(useLoaderData<typeof loader>().shopifyMenus || []).map((m: any) => ({
                    label: m.title,
                    value: m.id,
                  })),
                ]}
                value={selectedShopifyMenuId}
                onChange={setSelectedShopifyMenuId}
              />
            </BlockStack>
          </Modal.Section>
        </Modal>

        {/* Upgrade Modal */}
        <Modal
          open={upgradeModalOpen}
          onClose={() => setUpgradeModalOpen(false)}
          title="Upgrade to Plus"
          primaryAction={{
            content: "Upgrade Now",
            onAction: () => navigate("/app/pricing"),
          }}
          secondaryActions={[
            {
              content: "Cancel",
              onAction: () => setUpgradeModalOpen(false),
            },
          ]}
        >
          <Modal.Section>
            <BlockStack gap="400">
              <PolarisText as="p" variant="bodyMd">
                Import and Export features are available on the <strong>Plus plan</strong>.
              </PolarisText>
              <PolarisText as="p" variant="bodyMd">
                Upgrade now to unlock:
              </PolarisText>
              <ul style={{ marginLeft: "20px", listStyle: "disc" }}>
                <li>Import menus from Shopify navigation</li>
                <li>Import menus from JSON files</li>
                <li>Export menus as JSON files</li>
                <li>Unlimited menus</li>
              </ul>
            </BlockStack>
          </Modal.Section>
        </Modal>

        <Modal
          open={renameModalOpen}
          onClose={() => setRenameModalOpen(false)}
          title="Rename Menu"
          primaryAction={{
            content: "Save",
            loading: renameFetcher.state === "submitting",
            onAction: () => {
              renameFetcher.submit(
                { intent: "rename", menuId: String(renameMenuId), newName: renameNewName },
                { method: "post" }
              );
            },
          }}
          secondaryActions={[
            {
              content: "Cancel",
              onAction: () => setRenameModalOpen(false),
            },
          ]}
        >
          <Modal.Section>
            <TextField
              label="New Name"
              value={renameNewName}
              onChange={setRenameNewName}
              autoComplete="off"
              placeholder="Enter menu name"
            />
          </Modal.Section>
        </Modal>
      </div>
    </div>
  );
}
