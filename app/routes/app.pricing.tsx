import { useState } from "react";
import { json, redirect, type ActionFunctionArgs, type LoaderFunctionArgs } from "@remix-run/node";
import { useActionData, useLoaderData } from "@remix-run/react";
import { authenticate } from "../shopify.server";
import {
  Badge,
  Banner,
  BlockStack,
  Box,
  Button,
  Card,
  DataTable,
  Icon,
  InlineGrid,
  InlineStack,
  Page,
  Text,
} from "@shopify/polaris";
import {
  ArrowRightIcon,
  CheckIcon,
  ConfettiIcon,
  CreditCardIcon,
  GiftCardIcon,
  ShieldCheckMarkIcon,
  StarIcon,
} from "@shopify/polaris-icons";
import {
  BILLING_PLANS,
  getActiveAppSubscriptions,
  getPlanSelection,
  type BillingPeriod,
} from "../config/billing";
import prisma from "../db.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { billing, session } = await authenticate.admin(request);
  const shop = session.shop;
  const billingTestMode =
    process.env.BILLING_TEST === "true" || process.env.NODE_ENV !== "production";
  const appSubscriptions = await getActiveAppSubscriptions(billing, shop, billingTestMode);
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
  const selection = getPlanSelection(activeSubscription?.name) ?? {
    id: "free",
    period: null,
  };

  return json({
    currentPlan: selection,
  });
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { billing } = await authenticate.admin(request);
  const formData = await request.formData();
  const plan = formData.get("plan");
  const period = formData.get("billingPeriod");

  if (plan !== "pro" && plan !== "plus") {
    return redirect("/app/pricing");
  }

  const billingPeriod: BillingPeriod = period === "yearly" ? "yearly" : "monthly";
  const planName = BILLING_PLANS[plan][billingPeriod];
  const billingTestMode =
    process.env.BILLING_TEST === "true" || process.env.NODE_ENV !== "production";
  const returnUrl = new URL(request.url);
  returnUrl.pathname = "/app/pricing";
  returnUrl.searchParams.delete("plan");
  returnUrl.searchParams.delete("billingPeriod");

  try {
    return await billing.request({
      plan: planName,
      isTest: billingTestMode,
      returnUrl: returnUrl.toString(),
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Billing request failed.";
    const errorData = (error as { errorData?: unknown })?.errorData;
    const graphQlErrors = (error as { response?: { body?: { errors?: unknown } } })?.response?.body?.errors;
    let details = "";
    if (Array.isArray(errorData) && errorData.length > 0) {
      details = errorData
        .map((item) => {
          if (item && typeof item === "object" && "message" in item) {
            return String((item as { message?: string }).message);
          }
          return String(item);
        })
        .join("; ");
    } else if (Array.isArray(graphQlErrors) && graphQlErrors.length > 0) {
      details = graphQlErrors
        .map((item) => {
          if (item && typeof item === "object" && "message" in item) {
            return String((item as { message?: string }).message);
          }
          return String(item);
        })
        .join("; ");
    }

    console.error("Billing request failed", {
      error: errorMessage,
      details,
      errorData,
      graphQlErrors,
    });

    return json(
      { billingError: details ? `${errorMessage}: ${details}` : errorMessage },
      { status: 400 }
    );
  }
};

export default function Pricing() {
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "yearly">("monthly");
  const { currentPlan } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();

  const plans = [
    {
      id: "free",
      name: "Free",
      icon: GiftCardIcon,
      iconColor: "bg-emerald-100 text-emerald-600",
      description: "Perfect for new stores",
      priceMonthly: "$0",
      priceYearly: "$0",
      features: [
        "1 mega menu",
        "Dropdown & Mega menu types",
        "Unlimited menu items",
        "Basic styling controls",
        "7-day analytics history",
        "No watermark / No branding",
      ],
      popular: false,
    },
    {
      id: "pro",
      name: "Pro",
      icon: StarIcon,
      iconColor: "bg-indigo-100 text-indigo-600",
      description: "Best for growing stores",
      priceMonthly: "$9.99",
      priceYearly: "$7.99",
      features: [
        "Unlimited Mega Menus",
        "Menu Item Badges & Labels",
        "Product & Collection Grids",
        "Mobile Menu Features",
        "90-Day Analytics History",
      ],
      popular: true,
      trial: "Includes 14-day trial",
    },
    {
      id: "plus",
      name: "Plus",
      icon: ConfettiIcon,
      iconColor: "bg-purple-100 text-purple-600",
      description: "Advanced stores & Agencies",
      priceMonthly: "$29.99",
      priceYearly: "$23.99",
      features: [
        "Tabbed (Sekmeli) Menus",
        "Custom HTML & Liquid Blocks",
        "Masonry (Item Group) Layout",
        "Advanced Targeting (Geo/Device)",
        "Import / Export Tools",
        "Dedicated Success Manager",
      ],
      popular: false,
    },
  ];

  const comparisonFeatures = [
    { name: "Mega Menus count", free: "1", pro: "Unlimited", plus: "Unlimited" },
    { name: "No App Branding", free: true, pro: true, plus: true },
    { name: "Design Controls", free: "Basic", pro: "Advanced", plus: "Advanced" },
    { name: "Analytics Range", free: "7 days", pro: "90 days", plus: "Unlimited" },
    { name: "Menu Item Badges", free: false, pro: true, plus: true },
    { name: "Product & Collection Grids", free: false, pro: true, plus: true },
    { name: "Tabbed Menus", free: false, pro: false, plus: true },
    { name: "Custom HTML / Liquid", free: false, pro: false, plus: true },
    { name: "Masonry Layout", free: false, pro: false, plus: true },

    { name: "A/B Testing", free: false, pro: false, plus: true },
    { name: "Import / Export", free: false, pro: false, plus: true },

  ];

  return (
    <Page title="Plans & Billing" subtitle="Choose the plan that fits your store's needs">
      <BlockStack gap="500">
        <InlineStack align="center">
          <Box background="bg-surface-success" borderRadius="full" paddingInline="400" paddingBlock="200">
            <InlineStack gap="200" blockAlign="center">
              <Box>
                <Icon source={ShieldCheckMarkIcon} tone="success" />
              </Box>
              <Text as="span" variant="bodySm" tone="success">
                14-day free trial - No credit card required - Cancel anytime
              </Text>
            </InlineStack>
          </Box>
        </InlineStack>

        <InlineStack align="center" gap="200" blockAlign="center">
          <InlineStack gap="0">
            <Button pressed={billingPeriod === "monthly"} onClick={() => setBillingPeriod("monthly")}>
              Monthly
            </Button>
            <Button pressed={billingPeriod === "yearly"} onClick={() => setBillingPeriod("yearly")}>
              Yearly
            </Button>
          </InlineStack>
          {billingPeriod === "yearly" && <Badge tone="success">Save 20%</Badge>}
        </InlineStack>

        {actionData?.billingError && (
          <Banner tone="critical">{actionData.billingError}</Banner>
        )}

        <InlineGrid columns={{ xs: 1, md: 2, lg: 3 }} gap="400">
          {plans.map((plan) => {
            const price = billingPeriod === "monthly" ? plan.priceMonthly : plan.priceYearly;
            const planIsCurrent =
              currentPlan.id === plan.id &&
              (plan.id === "free" || currentPlan.period === billingPeriod);
            const isUpgradeDisabled = plan.id === "free" || planIsCurrent;
            const ctaLabel = planIsCurrent
              ? "Current Plan"
              : plan.id === "pro"
                ? "Upgrade to Pro"
                : "Upgrade to Plus";

            return (
              <Card key={plan.id}>
                <BlockStack gap="400">
                  {plan.popular && <Badge tone="info">Most Popular</Badge>}
                  <Box>
                    <Icon source={plan.icon} tone="info" />
                  </Box>
                  <BlockStack gap="100">
                    <Text as="h3" variant="headingLg">{plan.name}</Text>
                    <Text as="p" variant="bodySm" tone="subdued">{plan.description}</Text>
                  </BlockStack>
                  <BlockStack gap="050">
                    <InlineStack gap="100" blockAlign="baseline">
                      <Text as="span" variant="heading2xl">{price}</Text>
                      <Text as="span" variant="bodySm" tone="subdued">
                        / {billingPeriod === "monthly" ? "month" : "year"}
                      </Text>
                    </InlineStack>
                    {plan.trial && <Text as="p" variant="bodySm" tone="subdued">{plan.trial}</Text>}
                  </BlockStack>
                  <BlockStack gap="200">
                    {plan.features.map((feature, index) => (
                      <InlineStack key={index} gap="200" blockAlign="start" wrap={false}>
                        <Box>
                          <Icon source={CheckIcon} tone="success" />
                        </Box>
                        <Text as="span" variant="bodySm">{feature}</Text>
                      </InlineStack>
                    ))}
                  </BlockStack>
                  <form method="post">
                    <input type="hidden" name="plan" value={plan.id} />
                    <input type="hidden" name="billingPeriod" value={billingPeriod} />
                    <Button
                      variant={isUpgradeDisabled ? undefined : "primary"}
                      fullWidth
                      disabled={isUpgradeDisabled}
                      submit
                    >
                      {ctaLabel}
                    </Button>
                  </form>
                </BlockStack>
              </Card>
            );
          })}
        </InlineGrid>

        <Card padding="0">
          <Box padding="400" paddingBlockEnd="0">
            <Text as="h2" variant="headingMd" alignment="center">Feature Comparison</Text>
          </Box>
          <DataTable
            columnContentTypes={["text", "text", "text", "text"]}
            headings={["", "Free", "Pro", "Plus"]}
            rows={comparisonFeatures.map((feature) => [
              feature.name,
              typeof feature.free === "boolean" ? (feature.free ? "✓" : "—") : feature.free,
              typeof feature.pro === "boolean" ? (feature.pro ? "✓" : "—") : feature.pro,
              typeof feature.plus === "boolean" ? (feature.plus ? "✓" : "—") : feature.plus,
            ])}
          />
        </Card>

        <Card>
          <InlineStack gap="400" blockAlign="start" wrap={false}>
            <Box>
              <Icon source={CreditCardIcon} tone="info" />
            </Box>
            <BlockStack gap="400">
              <BlockStack gap="100">
                <Text as="h3" variant="headingMd">How plan selection works</Text>
                <Text as="p" variant="bodySm" tone="subdued">
                  Choose a plan to unlock features. After selecting a plan, you'll be redirected to your Dashboard.
                </Text>
              </BlockStack>
              <InlineStack gap="300" blockAlign="center">
                <Text as="span" variant="bodySm">1. Select plan</Text>
                <Box>
                  <Icon source={ArrowRightIcon} tone="subdued" />
                </Box>
                <Text as="span" variant="bodySm">2. Confirm billing</Text>
                <Box>
                  <Icon source={ArrowRightIcon} tone="subdued" />
                </Box>
                <Text as="span" variant="bodySm">3. Go to Dashboard</Text>
              </InlineStack>
            </BlockStack>
          </InlineStack>
        </Card>

        <InlineStack align="center">
          <BlockStack gap="200" inlineAlign="center">
            <Text as="p" variant="bodyMd" tone="subdued">Have questions about pricing?</Text>
            <Button>Contact Sales</Button>
          </BlockStack>
        </InlineStack>

        <InlineGrid columns={{ xs: 1, md: 2 }} gap="400">
          <Card>
            <InlineStack gap="300" blockAlign="center">
              <Box>
                <Icon source={ShieldCheckMarkIcon} tone="success" />
              </Box>
              <Text as="p" variant="bodySm">30-day money back guarantee</Text>
            </InlineStack>
          </Card>
          <Card>
            <InlineStack gap="300" blockAlign="center">
              <Box>
                <Icon source={StarIcon} tone="info" />
              </Box>
              <Text as="p" variant="bodySm">Built for Shopify by Shopify Experts</Text>
            </InlineStack>
          </Card>
        </InlineGrid>
        <Box paddingBlockEnd="1200" />
      </BlockStack>
    </Page>
  );
}
