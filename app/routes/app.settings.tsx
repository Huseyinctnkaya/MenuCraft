import {
  json,
  type ActionFunctionArgs,
  type LoaderFunctionArgs,
} from "@remix-run/node";
import {
  Form,
  useActionData,
  useLoaderData,
  useLocation,
  useNavigate,
} from "@remix-run/react";
import { CreditCard, Globe, Gauge, Store, User, Users } from "lucide-react";
import { authenticate } from "../shopify.server";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import prisma from "../db.server";
import { ALL_BILLING_PLAN_NAMES, getPlanSelection } from "../config/billing";

type PreferencesPayload = {
  language: string;
  emailNotifications: boolean;
  marketingEmails: boolean;
};

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin, billing, session } = await authenticate.admin(request);
  const shop = session.shop;
  const billingTestMode =
    process.env.BILLING_TEST === "true" || process.env.NODE_ENV !== "production";

  const { appSubscriptions } = await billing.check({
    plans: [...ALL_BILLING_PLAN_NAMES],
    isTest: billingTestMode,
  });

  const activeSubscription = appSubscriptions.find((subscription) =>
    ["ACTIVE", "ACCEPTED"].includes(subscription.status)
  );

  if (activeSubscription) {
    await prisma.billingSubscription.upsert({
      where: { shop },
      update: {
        subscriptionId: activeSubscription.id,
        planName: activeSubscription.name,
        status: activeSubscription.status,
        test: activeSubscription.test,
        trialDays: activeSubscription.trialDays,
        currentPeriodEnd: new Date(activeSubscription.currentPeriodEnd),
      },
      create: {
        shop,
        subscriptionId: activeSubscription.id,
        planName: activeSubscription.name,
        status: activeSubscription.status,
        test: activeSubscription.test,
        trialDays: activeSubscription.trialDays,
        currentPeriodEnd: new Date(activeSubscription.currentPeriodEnd),
      },
    });
  } else {
    await prisma.billingSubscription.deleteMany({ where: { shop } });
  }

  const record = await prisma.billingSubscription.findUnique({ where: { shop } });
  const selection = getPlanSelection(record?.planName) ?? {
    id: "free",
    period: null,
  };

  const menuCount = await prisma.menu.count({ where: { shop } });
  const menuLimit = selection.id === "free" ? 1 : null;

  const shopPreferenceClient = (prisma as {
    shopPreference?: {
      findUnique: typeof prisma.billingSubscription.findUnique;
      upsert: typeof prisma.billingSubscription.upsert;
    };
  }).shopPreference;
  const preferences = shopPreferenceClient
    ? await shopPreferenceClient.findUnique({ where: { shop } })
    : null;

  let shopName = shop;
  let shopDomain = shop;
  let shopPlan = "Unknown";
  let themeName = "Unknown";

  try {
    const response = await admin.graphql(
      `query SettingsMeta {
        shop {
          name
          myshopifyDomain
          plan {
            displayName
          }
        }
        themes(first: 50) {
          nodes {
            id
            name
            role
          }
        }
      }`
    );
    const data = await response.json();
    const shopInfo = data?.data?.shop;
    if (shopInfo?.name) shopName = shopInfo.name;
    if (shopInfo?.myshopifyDomain) shopDomain = shopInfo.myshopifyDomain;
    if (shopInfo?.plan?.displayName) shopPlan = shopInfo.plan.displayName;

    const themes = data?.data?.themes?.nodes ?? [];
    const mainTheme = themes.find((theme: { role?: string }) => theme.role === "MAIN") ?? themes[0];
    if (mainTheme?.name) themeName = mainTheme.name;
  } catch (error) {
    console.error("Failed to load settings metadata", error);
  }

  return json({
    selection,
    currentPeriodEnd: record?.currentPeriodEnd?.toISOString() ?? null,
    menuCount,
    menuLimit,
    shopInfo: {
      name: shopName,
      domain: shopDomain,
      plan: shopPlan,
      themeName,
    },
    preferencesAvailable: Boolean(shopPreferenceClient),
    preferences: {
      language: preferences?.language ?? "en",
      emailNotifications: preferences?.emailNotifications ?? true,
      marketingEmails: preferences?.marketingEmails ?? false,
    } satisfies PreferencesPayload,
    links: {
      billingUrl: `https://${shop}/admin/settings/billing`,
      invoicesUrl: `https://${shop}/admin/settings/billing/invoices`,
      staffUrl: `https://${shop}/admin/settings/account`,
    },
  });
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const shop = session.shop;
  const formData = await request.formData();
  const intent = formData.get("intent");

  if (intent !== "update-preferences") {
    return json({ ok: false, error: "Unsupported action." }, { status: 400 });
  }

  const languageValue = formData.get("language");
  const language = typeof languageValue === "string" && languageValue.trim().length > 0
    ? languageValue
    : "en";

  const emailNotifications = formData.get("emailNotifications") === "on";
  const marketingEmails = formData.get("marketingEmails") === "on";

  const shopPreferenceClient = (prisma as {
    shopPreference?: {
      findUnique: typeof prisma.billingSubscription.findUnique;
      upsert: typeof prisma.billingSubscription.upsert;
    };
  }).shopPreference;
  if (!shopPreferenceClient) {
    return json(
      { ok: false, error: "Preferences storage is not available yet. Run prisma migrate dev." },
      { status: 409 }
    );
  }

  await shopPreferenceClient.upsert({
    where: { shop },
    update: {
      language,
      emailNotifications,
      marketingEmails,
    },
    create: {
      shop,
      language,
      emailNotifications,
      marketingEmails,
    },
  });

  return json({ ok: true });
};

export default function AccountSettings() {
  const {
    selection,
    currentPeriodEnd,
    menuCount,
    menuLimit,
    shopInfo,
    preferences,
    preferencesAvailable,
    links,
  } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigate = useNavigate();
  const location = useLocation();

  const withSearch = (path: string) => ({ pathname: path, search: location.search });
  const usagePercent = menuLimit ? Math.min((menuCount / menuLimit) * 100, 100) : 0;

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl text-gray-900">Account Settings</h1>
          <p className="text-gray-600 mt-1">Manage your account and preferences</p>
        </div>

        <Card className="p-6">
          <div className="flex items-start gap-4 mb-2">
            <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center">
              <User className="w-6 h-6 text-indigo-600" />
            </div>
            <div className="flex-1">
              <h2 className="text-lg text-gray-900">Current Plan</h2>
              <div className="flex items-center gap-3 mt-2">
                <Badge variant={selection.id === "pro" ? "pro" : "default"}>
                  {selection.id === "free" ? "Free Plan" : `${selection.id} Plan`.replace(/^./, (c) => c.toUpperCase())}
                </Badge>
                <span className="text-sm text-gray-600">
                  {selection.id === "free"
                    ? "$0/month"
                    : selection.period === "yearly"
                      ? "Billed yearly"
                      : "Billed monthly"}
                </span>
              </div>
            </div>
            <Button variant="outline" onClick={() => navigate(withSearch("/app/pricing"))}>
              Change Plan
            </Button>
          </div>

          <div className="pt-6 border-t border-gray-200 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Next billing date</span>
              <span className="text-gray-900">
                {currentPeriodEnd
                  ? new Date(currentPeriodEnd).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })
                  : "—"}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Payment method</span>
              <span className="text-gray-900">Managed in Shopify</span>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-lg text-gray-900 mb-4 flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Billing
          </h2>
          <div className="space-y-3">
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => {
                if (typeof window !== "undefined") {
                  window.open(links.billingUrl, "_blank", "noopener,noreferrer");
                }
              }}
            >
              Update Payment Method
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => {
                if (typeof window !== "undefined") {
                  window.open(links.invoicesUrl, "_blank", "noopener,noreferrer");
                }
              }}
            >
              Download Invoices
            </Button>
          </div>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-6">
            <h2 className="text-lg text-gray-900 mb-2 flex items-center gap-2">
              <Globe className="w-5 h-5" />
              Preferences
            </h2>
            <Form method="post" className="space-y-4">
              <input type="hidden" name="intent" value="update-preferences" />
              <div>
                <label className="block text-sm text-gray-700 mb-2">Language</label>
                <select
                  name="language"
                  defaultValue={preferences.language}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                >
                  <option value="en">English</option>
                </select>
              </div>

              <label className="flex items-center justify-between">
                <span className="text-sm text-gray-700">Email notifications</span>
                <input
                  type="checkbox"
                  name="emailNotifications"
                  defaultChecked={preferences.emailNotifications}
                  className="w-4 h-4"
                />
              </label>

              <label className="flex items-center justify-between">
                <span className="text-sm text-gray-700">Marketing emails</span>
                <input
                  type="checkbox"
                  name="marketingEmails"
                  defaultChecked={preferences.marketingEmails}
                  className="w-4 h-4"
                />
              </label>

              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">
                  Changes apply to this store only.
                </span>
                <Button
                  type="submit"
                  variant="outline"
                  size="sm"
                  disabled={!preferencesAvailable}
                >
                  Save Preferences
                </Button>
              </div>

              {actionData?.ok ? (
                <p className="text-xs text-green-600">Preferences saved.</p>
              ) : null}
              {actionData?.error ? (
                <p className="text-xs text-red-600">{actionData.error}</p>
              ) : null}
              {!preferencesAvailable ? null : null}
            </Form>
          </Card>

          <Card className="p-6">
            <h2 className="text-lg text-gray-900 mb-3 flex items-center gap-2">
              <Store className="w-5 h-5" />
              Store & Theme
            </h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Store name</span>
                <span className="text-gray-900">{shopInfo.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Domain</span>
                <span className="text-gray-900">{shopInfo.domain}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Shopify plan</span>
                <span className="text-gray-900">{shopInfo.plan}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Active theme</span>
                <span className="text-gray-900">{shopInfo.themeName}</span>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="text-lg text-gray-900 mb-3 flex items-center gap-2">
              <Gauge className="w-5 h-5" />
              Usage & Limits
            </h2>
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Menus created</span>
                <span className="text-gray-900">
                  {menuLimit ? `${menuCount} / ${menuLimit}` : `${menuCount} / Unlimited`}
                </span>
              </div>
              {menuLimit ? (
                <div className="h-2 w-full rounded-full bg-gray-100">
                  <div
                    className="h-2 rounded-full bg-indigo-500"
                    style={{ width: `${usagePercent}%` }}
                  />
                </div>
              ) : (
                <p className="text-xs text-gray-500">Unlimited menus on your current plan.</p>
              )}
              <p className="text-xs text-gray-500">
                Upgrade for unlimited menus and advanced features.
              </p>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg text-gray-900 flex items-center gap-2">
                <Users className="w-5 h-5" />
                Team & Access
              </h2>
              <Badge variant="new">Coming soon</Badge>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Manage collaborators and control who can edit menus.
            </p>
            <Button
              variant="outline"
              className="w-full justify-start"
              disabled
              onClick={() => {
                if (typeof window !== "undefined") {
                  window.open(links.staffUrl, "_blank", "noopener,noreferrer");
                }
              }}
            >
              Manage staff in Shopify
            </Button>
          </Card>
        </div>

      </div>
    </div>
  );
}
