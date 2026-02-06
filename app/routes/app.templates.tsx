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

  // Fetch templates from database
  const templates = await prisma.menuTemplate.findMany({
    orderBy: [
      { category: 'asc' },
      { createdAt: 'desc' }
    ]
  });

  return json({
    planTier: planSelection.id,
    existingMenuNames: existingMenus.map(m => m.name),
    templates,
  });
};

export default function Templates() {
  const { planTier, existingMenuNames, templates } = useLoaderData<typeof loader>();
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
                <div className="aspect-video bg-gradient-to-br from-indigo-100 to-purple-100 rounded-lg mb-4 relative overflow-hidden shadow-sm">
                  {template.previewUrl && (
                    <img
                      src={template.previewUrl}
                      alt={template.name}
                      className="absolute inset-0 w-full h-full object-contain bg-white rounded-lg"
                    />
                  )}
                  {template.isPro && !isPro && (
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
                    {template.isNew && <Badge variant="new">New</Badge>}
                    {template.isPro && <Badge variant="pro">Pro</Badge>}
                  </div>
                  <p className="text-xs text-gray-600">{template.category}</p>
                  {template.description && (
                    <p className="text-xs text-gray-500 line-clamp-2">{template.description}</p>
                  )}
                  <div onClick={(e) => e.stopPropagation()}>
                    {template.isPro && !isPro ? (
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


export const action = async ({ request }: import("@remix-run/node").ActionFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const shop = session.shop;
  const formData = await request.formData();
  const intent = formData.get("intent");

  if (intent === "create-from-template") {
    const templateId = Number(formData.get("templateId"));

    // Fetch template from database
    const template = await prisma.menuTemplate.findUnique({
      where: { id: templateId }
    });

    if (!template) {
      return json({ ok: false, error: "Template not found" }, { status: 404 });
    }

    // Generate fresh IDs and merge settings at runtime to avoid circular dependency/initialization issues
    const freshItems = (template.items as any[] || []).map((item: any) => ({
      ...item,
      id: buildId(),
      children: item.children || [],
    }));

    const finalSettings = {
      ...DEFAULT_BUILDER_SETTINGS,
      ...(template.settings as any || {})
    };

    const menu = await prisma.menu.create({
      data: {
        shop,
        name: template.name || "New Menu",
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

