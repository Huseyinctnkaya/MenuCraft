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
    items: [
      { id: "nav-1", label: "New Arrivals", type: "link", url: "", children: [] },
      { id: "nav-2", label: "Women", type: "link", url: "", children: [] },
      { id: "nav-3", label: "Men", type: "link", url: "", children: [] },
      { id: "nav-4", label: "Sale", type: "link", url: "", children: [] }
    ],
    settings: {
      layout: "horizontal",
      trigger: "hover",
      maxWidth: "1200px",
      typography: { fontFamily: "Inter", fontSize: "14px" },
      colors: { background: "#ffffff", text: "#111827", accent: "#4f46e5" }
    }
  },
  2: {
    items: [
      { id: "tech-1", label: "Computers", type: "link", url: "", children: [] },
      { id: "tech-2", label: "Smartphones", type: "link", url: "", children: [] },
      { id: "tech-3", label: "Audio", type: "link", url: "", children: [] },
      { id: "tech-4", label: "Accessories", type: "link", url: "", children: [] }
    ],
    settings: {
      layout: "horizontal",
      trigger: "hover",
      maxWidth: "1200px",
      typography: { fontFamily: "Roboto", fontSize: "14px" },
      colors: { background: "#0f172a", text: "#f8fafc", accent: "#3b82f6" }
    }
  },
  3: {
    items: [
      { id: "beauty-1", label: "Skincare", type: "link", url: "", children: [] },
      { id: "beauty-2", label: "Makeup", type: "link", url: "", children: [] },
      { id: "beauty-3", label: "Hair Care", type: "link", url: "", children: [] },
      { id: "beauty-4", label: "Fragrance", type: "link", url: "", children: [] }
    ],
    settings: {
      layout: "horizontal",
      trigger: "hover",
      maxWidth: "1100px",
      typography: { fontFamily: "Playfair Display", fontSize: "15px" },
      colors: { background: "#fff1f2", text: "#881337", accent: "#be123c" }
    }
  },
  4: {
    items: [
      { id: "grocery-1", label: "Fruits & Vegetables", type: "link", url: "", children: [] },
      { id: "grocery-2", label: "Dairy & Eggs", type: "link", url: "", children: [] },
      { id: "grocery-3", label: "Bakery", type: "link", url: "", children: [] },
      { id: "grocery-4", label: "Meat & Seafood", type: "link", url: "", children: [] }
    ],
    settings: {
      layout: "horizontal",
      trigger: "click",
      maxWidth: "1200px",
      typography: { fontFamily: "Open Sans", fontSize: "16px" },
      colors: { background: "#f0fdf4", text: "#14532d", accent: "#16a34a" }
    }
  },
  5: {
    items: [
      { id: "home-1", label: "Furniture", type: "link", url: "", children: [] },
      { id: "home-2", label: "Decor", type: "link", url: "", children: [] },
      { id: "home-3", label: "Kitchen & Dining", type: "link", url: "", children: [] },
      { id: "home-4", label: "Bedding & Bath", type: "link", url: "", children: [] }
    ],
    settings: {
      layout: "horizontal",
      trigger: "hover",
      maxWidth: "1400px",
      typography: { fontFamily: "Lato", fontSize: "14px" },
      colors: { background: "#fff7ed", text: "#431407", accent: "#9a3412" }
    }
  },
  6: {
    items: [
      { id: "sport-1", label: "Camping", type: "link", url: "", children: [] },
      { id: "sport-2", label: "Hiking", type: "link", url: "", children: [] },
      { id: "sport-3", label: "Cycling", type: "link", url: "", children: [] },
      { id: "sport-4", label: "Apparel", type: "link", url: "", children: [] }
    ],
    settings: {
      layout: "horizontal",
      trigger: "hover",
      maxWidth: "1200px",
      typography: { fontFamily: "Oswald", fontSize: "15px" },
      colors: { background: "#ffffff", text: "#000000", accent: "#dc2626" }
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

    // Default fallback if no data found
    const dataToUse = templateData || { items: [], settings: {} };
    // Find template name from the list in component (duplication here but simple)
    const templates = [
      { id: 1, name: "Fashion Edit" },
      { id: 2, name: "Tech Essentials" },
      { id: 3, name: "Beauty Studio" },
      { id: 4, name: "Fresh Market" },
      { id: 5, name: "Home & Living" },
      { id: 6, name: "Outdoor Gear" },
    ];
    const templateName = templates.find(t => t.id === templateId)?.name || "New Menu";

    const menu = await prisma.menu.create({
      data: {
        shop,
        name: templateName,
        status: "draft",
        items: dataToUse.items as any,
        settings: dataToUse.settings as any,
      }
    });

    return redirect("/app/mega-menus");
  }

  return null;
};
