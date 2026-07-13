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
import { authenticate } from "../shopify.server";
import {
  Badge,
  Banner,
  BlockStack,
  Button,
  Card,
  Checkbox,
  Divider,
  FormLayout,
  Icon,
  InlineGrid,
  InlineStack,
  Page,
  ProgressBar,
  Select,
  Text,
} from "@shopify/polaris";
import {
  CreditCardIcon,
  GaugeIcon,
  GlobeIcon,
  PersonIcon,
  StoreIcon,
  TeamIcon,
} from "@shopify/polaris-icons";
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
    <Page title="Account Settings" subtitle="Manage your account and preferences">
      <BlockStack gap="400">
        <Card>
          <BlockStack gap="400">
            <InlineStack align="space-between" blockAlign="start" wrap={false}>
              <InlineStack gap="400" blockAlign="start">
                <Icon source={PersonIcon} tone="info" />
                <BlockStack gap="150">
                  <Text as="h2" variant="headingMd">Current Plan</Text>
                  <InlineStack gap="300" blockAlign="center">
                    <Badge tone={selection.id === "pro" ? "info" : undefined}>
                      {selection.id === "free" ? "Free Plan" : `${selection.id} Plan`.replace(/^./, (c) => c.toUpperCase())}
                    </Badge>
                    <Text as="span" variant="bodySm" tone="subdued">
                      {selection.id === "free"
                        ? "$0/month"
                        : selection.period === "yearly"
                          ? "Billed yearly"
                          : "Billed monthly"}
                    </Text>
                  </InlineStack>
                </BlockStack>
              </InlineStack>
              <Button onClick={() => navigate(withSearch("/app/pricing"))}>Change Plan</Button>
            </InlineStack>
            <Divider />
            <BlockStack gap="200">
              <InlineStack align="space-between">
                <Text as="span" variant="bodySm" tone="subdued">Next billing date</Text>
                <Text as="span" variant="bodySm">
                  {currentPeriodEnd
                    ? new Date(currentPeriodEnd).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
                    : "—"}
                </Text>
              </InlineStack>
              <InlineStack align="space-between">
                <Text as="span" variant="bodySm" tone="subdued">Payment method</Text>
                <Text as="span" variant="bodySm">Managed in Shopify</Text>
              </InlineStack>
            </BlockStack>
          </BlockStack>
        </Card>

        <Card>
          <BlockStack gap="300">
            <InlineStack gap="200" blockAlign="center">
              <Icon source={CreditCardIcon} tone="info" />
              <Text as="h2" variant="headingMd">Billing</Text>
            </InlineStack>
            <BlockStack gap="200">
              <Button
                textAlign="left"
                fullWidth
                onClick={() => {
                  if (typeof window !== "undefined") {
                    window.open(links.billingUrl, "_blank", "noopener,noreferrer");
                  }
                }}
              >
                Update Payment Method
              </Button>
              <Button
                textAlign="left"
                fullWidth
                onClick={() => {
                  if (typeof window !== "undefined") {
                    window.open(links.invoicesUrl, "_blank", "noopener,noreferrer");
                  }
                }}
              >
                Download Invoices
              </Button>
            </BlockStack>
          </BlockStack>
        </Card>

        <InlineGrid columns={{ xs: 1, lg: 2 }} gap="400">
          <Card>
            <BlockStack gap="300">
              <InlineStack gap="200" blockAlign="center">
                <Icon source={GlobeIcon} tone="info" />
                <Text as="h2" variant="headingMd">Preferences</Text>
              </InlineStack>
              <Form method="post">
                <input type="hidden" name="intent" value="update-preferences" />
                <FormLayout>
                  <Select
                    label="Language"
                    name="language"
                    options={[{ label: "English", value: "en" }]}
                    defaultValue={preferences.language}
                  />
                  <Checkbox label="Email notifications" name="emailNotifications" defaultChecked={preferences.emailNotifications} />
                  <Checkbox label="Marketing emails" name="marketingEmails" defaultChecked={preferences.marketingEmails} />
                  <InlineStack align="space-between" blockAlign="center">
                    <Text as="span" variant="bodySm" tone="subdued">Changes apply to this store only.</Text>
                    <Button submit disabled={!preferencesAvailable}>Save Preferences</Button>
                  </InlineStack>
                  {actionData?.ok ? <Banner tone="success">Preferences saved.</Banner> : null}
                  {actionData?.error ? <Banner tone="critical">{actionData.error}</Banner> : null}
                </FormLayout>
              </Form>
            </BlockStack>
          </Card>

          <Card>
            <BlockStack gap="300">
              <InlineStack gap="200" blockAlign="center">
                <Icon source={StoreIcon} tone="info" />
                <Text as="h2" variant="headingMd">Store &amp; Theme</Text>
              </InlineStack>
              <BlockStack gap="200">
                <InlineStack align="space-between">
                  <Text as="span" variant="bodySm" tone="subdued">Store name</Text>
                  <Text as="span" variant="bodySm">{shopInfo.name}</Text>
                </InlineStack>
                <InlineStack align="space-between">
                  <Text as="span" variant="bodySm" tone="subdued">Domain</Text>
                  <Text as="span" variant="bodySm">{shopInfo.domain}</Text>
                </InlineStack>
                <InlineStack align="space-between">
                  <Text as="span" variant="bodySm" tone="subdued">Shopify plan</Text>
                  <Text as="span" variant="bodySm">{shopInfo.plan}</Text>
                </InlineStack>
                <InlineStack align="space-between">
                  <Text as="span" variant="bodySm" tone="subdued">Active theme</Text>
                  <Text as="span" variant="bodySm">{shopInfo.themeName}</Text>
                </InlineStack>
              </BlockStack>
            </BlockStack>
          </Card>

          <Card>
            <BlockStack gap="300">
              <InlineStack gap="200" blockAlign="center">
                <Icon source={GaugeIcon} tone="info" />
                <Text as="h2" variant="headingMd">Usage &amp; Limits</Text>
              </InlineStack>
              <InlineStack align="space-between">
                <Text as="span" variant="bodySm" tone="subdued">Menus created</Text>
                <Text as="span" variant="bodySm">
                  {menuLimit ? `${menuCount} / ${menuLimit}` : `${menuCount} / Unlimited`}
                </Text>
              </InlineStack>
              {menuLimit ? (
                <ProgressBar progress={usagePercent} size="small" tone="primary" />
              ) : (
                <Text as="p" variant="bodySm" tone="subdued">Unlimited menus on your current plan.</Text>
              )}
              <Text as="p" variant="bodySm" tone="subdued">
                Upgrade for unlimited menus and advanced features.
              </Text>
            </BlockStack>
          </Card>

          <Card>
            <BlockStack gap="300">
              <InlineStack align="space-between" blockAlign="center">
                <InlineStack gap="200" blockAlign="center">
                  <Icon source={TeamIcon} tone="info" />
                  <Text as="h2" variant="headingMd">Team &amp; Access</Text>
                </InlineStack>
                <Badge tone="info">Coming soon</Badge>
              </InlineStack>
              <Text as="p" variant="bodySm" tone="subdued">
                Manage collaborators and control who can edit menus.
              </Text>
              <Button
                textAlign="left"
                fullWidth
                disabled
                onClick={() => {
                  if (typeof window !== "undefined") {
                    window.open(links.staffUrl, "_blank", "noopener,noreferrer");
                  }
                }}
              >
                Manage staff in Shopify
              </Button>
            </BlockStack>
          </Card>
        </InlineGrid>
      </BlockStack>
    </Page>
  );
}
