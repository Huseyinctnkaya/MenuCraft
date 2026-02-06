import type { LoaderFunctionArgs } from "@remix-run/node";
import { useLocation, useNavigate } from "@remix-run/react";
import { Lock } from "lucide-react";
import { authenticate } from "../shopify.server";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import { json, redirect } from "@remix-run/node";
import { useLoaderData, useFetcher } from "@remix-run/react";
import prisma from "../db.server";
import { ALL_BILLING_PLAN_NAMES, getPlanSelection } from "../config/billing";
import { DEFAULT_BUILDER_SETTINGS } from "../menu-builder/constants";
import { buildId } from "../menu-builder/utils";
import type { MenuItem } from "../menu-builder/types";

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
  };

  // Fetch existing menus to check for duplicates
  const existingMenus = await prisma.menu.findMany({
    where: { shop },
    select: { name: true },
  });

  return json({
    planTier: planSelection.id,
    existingMenuNames: existingMenus.map(m => m.name),
  });
};

export default function Templates() {
  const { planTier, existingMenuNames } = useLoaderData<typeof loader>();
  const isPro = planTier === "pro" || planTier === "plus";
  const navigate = useNavigate();
  const location = useLocation();

  const withSearch = (path: string, extra?: Record<string, string>) => {
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
    return { pathname: path, search: output ? `?${output}` : "" };
  };

  const templates = [
    { id: 1, name: "Fashion Edit", category: "Fashion", pro: false, new: true },
    { id: 2, name: "Tech Essentials", category: "Electronics", pro: false, new: false },
    { id: 3, name: "Beauty Studio", category: "Beauty", pro: false, new: true },
    { id: 4, name: "Fresh Market", category: "Grocery", pro: false, new: false },
    { id: 5, name: "Home & Living", category: "Home", pro: false, new: false },
    { id: 6, name: "Outdoor Gear", category: "Sports", pro: false, new: true },
  ];

  const menuFetcher = useFetcher();

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl text-gray-900">Template Library</h1>
          <p className="text-gray-600 mt-1">Start with a pre-built template and customize it</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {templates.map((template) => {
            const isAlreadyUsed = existingMenuNames.includes(template.name);

            return (
              <Card
                key={template.id}
                className="group cursor-pointer hover:shadow-lg transition-shadow relative overflow-hidden p-6"
                onClick={() => {
                  // Optional: could trigger the same action or just view details. 
                  // For now keeping card click as "view details" or similar if we implemented a details view.
                  // But since the button handles the main action, maybe we can leave the card click as navigates to preview?
                  // The prompt doesn't specify preview, so let's stick to the button action.
                  // Actually the original code navigated to /app/templates/:id. I'll leave that if it exists, or remove if unused.
                  // The user only asked for "Use Template".
                }}
              >
                <div className="aspect-video bg-gradient-to-br from-indigo-100 to-purple-100 rounded-lg mb-4 relative">
                  {template.pro && !isPro && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <div className="text-center text-white">
                        <Lock className="w-8 h-8 mx-auto mb-2" />
                        <p className="text-sm">Pro Template</p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm text-gray-900">{template.name}</h3>
                    {template.new && <Badge variant="new">New</Badge>}
                    {template.pro && <Badge variant="pro">Pro</Badge>}
                  </div>
                  <p className="text-xs text-gray-600">{template.category}</p>
                  <div onClick={(e) => e.stopPropagation()}>
                    {template.pro && !isPro ? (
                      <Button
                        variant="primary"
                        size="sm"
                        className="w-full"
                        onClick={() => navigate(withSearch("/app/pricing"))}
                      >
                        Upgrade to Use
                      </Button>
                    ) : isAlreadyUsed ? (
                      <Button
                        variant="primary"
                        size="sm"
                        className="w-full"
                        disabled
                      >
                        Already in Use
                      </Button>
                    ) : (
                      <menuFetcher.Form method="post">
                        <input type="hidden" name="intent" value="create-from-template" />
                        <input type="hidden" name="templateId" value={template.id} />
                        <Button
                          variant="primary"
                          size="sm"
                          className="w-full"
                          type="submit"
                          loading={menuFetcher.state === "submitting" && menuFetcher.formData?.get("templateId") === String(template.id)}
                        >
                          Use Template
                        </Button>
                      </menuFetcher.Form>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}

const TEMPLATES_DATA: Record<number, any> = {
  1: {
    name: "Fashion Edit",
    items: [
      { label: "New Arrivals", role: "menu", url: "/", expanded: true, children: [] },
      { label: "Women", role: "menu", url: "/", expanded: true, children: [] },
      { label: "Men", role: "menu", url: "/", expanded: true, children: [] },
      { label: "Sale", role: "menu", url: "/", expanded: true, children: [] }
    ],
    settings: {
      layoutMaxWidth: "1200px",
      typographyMainFont: "Inter, system-ui, sans-serif",
      typographyMainSize: 14,
      colorMainBackground: "#ffffff",
      colorMainText: "#111827",
      colorSubmenuHeading: "#4f46e5"
    }
  },
  2: {
    name: "Tech Essentials",
    items: [
      { label: "Computers", role: "menu", url: "/", expanded: true, children: [] },
      { label: "Smartphones", role: "menu", url: "/", expanded: true, children: [] },
      { label: "Audio", role: "menu", url: "/", expanded: true, children: [] },
      { label: "Accessories", role: "menu", url: "/", expanded: true, children: [] }
    ],
    settings: {
      layoutMaxWidth: "1200px",
      typographyMainFont: "Roboto, system-ui, sans-serif",
      typographyMainSize: 14,
      colorMainBackground: "#0f172a",
      colorMainText: "#f8fafc",
      colorSubmenuHeading: "#3b82f6"
    }
  },
  3: {
    name: "Beauty Studio",
    items: [
      { label: "Skincare", role: "menu", url: "/", expanded: true, children: [] },
      { label: "Makeup", role: "menu", url: "/", expanded: true, children: [] },
      { label: "Hair Care", role: "menu", url: "/", expanded: true, children: [] },
      { label: "Fragrance", role: "menu", url: "/", expanded: true, children: [] }
    ],
    settings: {
      layoutMaxWidth: "1100px",
      typographyMainFont: "Playfair Display, serif",
      typographyMainSize: 15,
      colorMainBackground: "#fff1f2",
      colorMainText: "#881337",
      colorSubmenuHeading: "#be123c"
    }
  },
  4: {
    name: "Fresh Market",
    items: [
      { label: "Fruits & Vegetables", role: "menu", url: "/", expanded: true, children: [] },
      { id: "grocery-2", label: "Dairy & Eggs", role: "menu", url: "/", expanded: true, children: [] },
      { id: "grocery-3", label: "Bakery", role: "menu", url: "/", expanded: true, children: [] },
      { id: "grocery-4", label: "Meat & Seafood", role: "menu", url: "/", expanded: true, children: [] }
    ],
    settings: {
      animationDesktopTrigger: "click",
      layoutMaxWidth: "1200px",
      typographyMainFont: "Open Sans, system-ui, sans-serif",
      typographyMainSize: 16,
      colorMainBackground: "#f0fdf4",
      colorMainText: "#14532d",
      colorSubmenuHeading: "#16a34a"
    }
  },
  5: {
    name: "Home & Living",
    items: [
      { label: "Furniture", role: "menu", url: "/", expanded: true, children: [] },
      { label: "Decor", role: "menu", url: "/", expanded: true, children: [] },
      { label: "Kitchen & Dining", role: "menu", url: "/", expanded: true, children: [] },
      { label: "Bedding & Bath", role: "menu", url: "/", expanded: true, children: [] }
    ],
    settings: {
      layoutMaxWidth: "1400px",
      typographyMainFont: "Lato, system-ui, sans-serif",
      typographyMainSize: 14,
      colorMainBackground: "#fff7ed",
      colorMainText: "#431407",
      colorSubmenuHeading: "#9a3412"
    }
  },
  6: {
    name: "Outdoor Gear",
    items: [
      { label: "Camping", role: "menu", url: "/", expanded: true, children: [] },
      { label: "Hiking", role: "menu", url: "/", expanded: true, children: [] },
      { label: "Cycling", role: "menu", url: "/", expanded: true, children: [] },
      { label: "Apparel", role: "menu", url: "/", expanded: true, children: [] }
    ],
    settings: {
      layoutMaxWidth: "1200px",
      typographyMainFont: "Oswald, system-ui, sans-serif",
      typographyMainSize: 15,
      colorMainBackground: "#ffffff",
      colorMainText: "#000000",
      colorSubmenuHeading: "#dc2626"
    }
  }
};

export const action = async ({ request }: import("@remix-run/node").ActionFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const shop = session.shop;
  const formData = await request.formData();
  const intent = formData.get("intent");

  if (intent === "create-from-template") {
    const templateId = Number(formData.get("templateId"));
    const templateData = TEMPLATES_DATA[templateId];

    if (!templateData) {
      return json({ ok: false, error: "Template not found" }, { status: 404 });
    }

    // Generate fresh IDs and merge settings at runtime to avoid circular dependency/initialization issues
    const freshItems = (templateData.items || []).map((item: any) => ({
      ...item,
      id: buildId(),
      children: item.children || [],
    }));

    const finalSettings = {
      ...DEFAULT_BUILDER_SETTINGS,
      ...(templateData.settings || {})
    };

    const menu = await prisma.menu.create({
      data: {
        shop,
        name: templateData.name || "New Menu",
        status: "draft",
        items: freshItems as any,
        settings: finalSettings as any,
      }
    });

    const url = new URL(request.url);
    const searchParams = url.searchParams;
    const redirectUrl = new URL(`/app/menu-builder`, url.origin);
    redirectUrl.searchParams.set("id", String(menu.id));

    // Preserve mandatory Shopify parameters
    if (searchParams.has("shop")) redirectUrl.searchParams.set("shop", searchParams.get("shop")!);
    if (searchParams.has("host")) redirectUrl.searchParams.set("host", searchParams.get("host")!);

    return redirect(redirectUrl.pathname + redirectUrl.search);
  }

  return null;
};
