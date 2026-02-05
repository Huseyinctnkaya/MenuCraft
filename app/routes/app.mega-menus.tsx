import { useEffect, useRef, useState } from "react";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useFetcher, useLoaderData, useLocation, useNavigate, useRevalidator } from "@remix-run/react";
import { Copy, Edit, Eye, EyeOff, MoreVertical, Plus, Trash2 } from "lucide-react";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";
import Badge from "../components/ui/Badge";
import CustomButton from "../components/ui/Button";
import Card from "../components/ui/Card";
import { ALL_BILLING_PLAN_NAMES, getPlanSelection } from "../config/billing";
import type { loader as appLoader } from "./app";
import { useRouteLoaderData } from "@remix-run/react";
import { Banner, BlockStack, Text as PolarisText } from "@shopify/polaris";
import polarisStyles from "@shopify/polaris/build/esm/styles.css?url";

export const links = () => [
  { rel: "stylesheet", href: polarisStyles },
];

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { billing, session } = await authenticate.admin(request);
  const shop = session.shop;

  const billingTestMode =
    process.env.BILLING_TEST === "true" || process.env.NODE_ENV !== "production";
  const { appSubscriptions } = await billing.check({
    plans: [...ALL_BILLING_PLAN_NAMES] as any,
    isTest: billingTestMode,
  });
  const activeSubscription = appSubscriptions.find((subscription) =>
    ["ACTIVE", "ACCEPTED"].includes(subscription.status)
  );

  const planSelection = getPlanSelection(activeSubscription?.name) ?? {
    id: "free" as const,
    period: null,
  };

  const menus = await prisma.menu.findMany({
    where: { shop },
    orderBy: { id: "asc" },
  });

  return json({
    planTier: planSelection.id,
    menuCount: menus.length,
    menus: menus.map((menu) => ({
      id: menu.id,
      name: menu.name,
      status: menu.status,
      items: menu.items,
      views: 0,
    })),
  });
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { session } = await authenticate.admin(request);
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
    const { billing: billingAction } = await authenticate.admin(request);
    const billingTestMode =
      process.env.BILLING_TEST === "true" || process.env.NODE_ENV !== "production";
    const { appSubscriptions } = await billingAction.check({
      plans: [...ALL_BILLING_PLAN_NAMES],
      isTest: billingTestMode,
    });
    const activeSubscription = appSubscriptions.find((subscription) =>
      ["ACTIVE", "ACCEPTED"].includes(subscription.status)
    );
    const planSelection = getPlanSelection(activeSubscription?.name) ?? {
      id: "free" as const,
    };

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
        items: menu.items,
        settings: menu.settings,
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

  return json({ ok: false, error: "Unknown intent" }, { status: 400 });
};

export default function MegaMenusList() {
  const { menus: rawMenus, planTier, menuCount } = useLoaderData<typeof loader>();
  const appData = useRouteLoaderData<typeof appLoader>("routes/app");
  const currentPlan = planTier ?? appData?.planTier ?? "free";
  const currentMenuCount = menuCount ?? appData?.menuCount ?? 0;

  const isFreePlan = currentPlan === "free";
  const limitReached = isFreePlan && currentMenuCount >= 1;
  const navigate = useNavigate();
  const location = useLocation();
  const deleteFetcher = useFetcher<typeof action>();
  const duplicateFetcher = useFetcher<typeof action>();
  const revalidator = useRevalidator();
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, right: 0 });
  const buttonRefs = useRef<{ [key: number]: HTMLButtonElement | null }>({});
  const [menusState, setMenusState] = useState(rawMenus);
  const deleteRevalidatedRef = useRef(false);
  const duplicateRevalidatedRef = useRef(false);

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

  const withSearch = (path: string, extra?: Record<string, string>) => ({
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

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <PolarisText as="h1" variant="headingXl">Mega Menus</PolarisText>
            <PolarisText as="p" variant="bodyMd" tone="subdued">Manage all your navigation menus</PolarisText>
          </div>
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
                    <td className="px-6 py-4 text-sm text-gray-600">{menu.items}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {menu.views.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 relative">
                      <div className="flex items-center justify-end gap-2">
                        <CustomButton
                          variant="ghost"
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
                          variant="ghost"
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
                            variant="ghost"
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
                                      navigate(
                                        withSearch("/app/menu-builder", {
                                          id: String(menu.id),
                                          returnTo: location.pathname,
                                        })
                                      );
                                      setOpenMenuId(null);
                                    }}
                                    className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                                  >
                                    <Edit className="w-4 h-4" />
                                    Edit Menu
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

          {menus.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-600 mb-4">No menus yet. Create your first one!</p>
              <CustomButton
                onClick={() =>
                  navigate(withSearch("/app/menu-builder", { id: "", returnTo: location.pathname }))
                }
              >
                <Plus className="w-4 h-4" />
                Create Menu
              </CustomButton>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
