import type { authenticate } from "../shopify.server";

export const BILLING_PLANS = {
  pro: {
    monthly: "MenuCraft Pro Monthly",
    yearly: "MenuCraft Pro Annual",
  },
  plus: {
    monthly: "MenuCraft Plus Monthly",
    yearly: "MenuCraft Plus Annual",
  },
} as const;

export type BillingPlanId = keyof typeof BILLING_PLANS;
export type BillingPeriod = "monthly" | "yearly";

export const ALL_BILLING_PLAN_NAMES = [
  BILLING_PLANS.pro.monthly,
  BILLING_PLANS.pro.yearly,
  BILLING_PLANS.plus.monthly,
  BILLING_PLANS.plus.yearly,
] as const;

export type BillingPlanName = (typeof ALL_BILLING_PLAN_NAMES)[number];

export const getPlanSelection = (planName?: string | null) => {
  if (!planName) return null;
  if (planName === BILLING_PLANS.pro.monthly) {
    return { id: "pro" as const, period: "monthly" as const };
  }
  if (planName === BILLING_PLANS.pro.yearly) {
    return { id: "pro" as const, period: "yearly" as const };
  }
  if (planName === BILLING_PLANS.plus.monthly) {
    return { id: "plus" as const, period: "monthly" as const };
  }
  if (planName === BILLING_PLANS.plus.yearly) {
    return { id: "plus" as const, period: "yearly" as const };
  }
  return null;
};

type AdminContext = Awaited<ReturnType<typeof authenticate.admin>>;
type Billing = AdminContext["billing"];
type AppSubscriptions = Awaited<ReturnType<Billing["check"]>>["appSubscriptions"];

const subscriptionCache = new Map<string, { appSubscriptions: AppSubscriptions; expiresAt: number }>();
const SUBSCRIPTION_CACHE_TTL_MS = 5000;

// Every route's loader (plus the shared parent app.tsx loader) independently called
// billing.check() to derive the current plan, meaning a single page navigation fired
// 2+ live GraphQL requests to Shopify for the same shop. This short-lived cache lets
// loaders that fire together (parent + child, within the same navigation) share one
// network round-trip instead of duplicating it.
export const getActiveAppSubscriptions = async (
  billing: Billing,
  shop: string,
  isTest: boolean
): Promise<AppSubscriptions> => {
  const now = Date.now();
  const cached = subscriptionCache.get(shop);
  if (cached && cached.expiresAt > now) {
    return cached.appSubscriptions;
  }
  const { appSubscriptions } = await billing.check({
    plans: [...ALL_BILLING_PLAN_NAMES],
    isTest,
  });
  subscriptionCache.set(shop, { appSubscriptions, expiresAt: now + SUBSCRIPTION_CACHE_TTL_MS });
  return appSubscriptions;
};
