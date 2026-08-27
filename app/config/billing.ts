import type { authenticate } from "../shopify.server";

export const BILLING_PLANS = {
  pro: {
    monthly: "MenuCraft Pro Monthly",
  },
  plus: {
    monthly: "MenuCraft Plus Monthly",
  },
} as const;

export type BillingPlanId = keyof typeof BILLING_PLANS;

export const ALL_BILLING_PLAN_NAMES = [
  BILLING_PLANS.pro.monthly,
  BILLING_PLANS.plus.monthly,
] as const;

export type BillingPlanName = (typeof ALL_BILLING_PLAN_NAMES)[number];

export const getPlanSelection = (planName?: string | null) => {
  if (!planName) return null;
  if (planName === BILLING_PLANS.pro.monthly) {
    return { id: "pro" as const };
  }
  if (planName === BILLING_PLANS.plus.monthly) {
    return { id: "plus" as const };
  }
  return null;
};

type AdminContext = Awaited<ReturnType<typeof authenticate.admin>>;
type Billing = AdminContext["billing"];
type AppSubscriptions = Awaited<ReturnType<Billing["check"]>>["appSubscriptions"];

// Whether a NEW charge should be created as a test charge (no real money).
//
// This only ever belongs on billing.request(). Do not pass it to billing.check() —
// see the comment on getActiveAppSubscriptions for why that combination silently
// hides real subscriptions.
export const isBillingTestMode = () =>
  process.env.BILLING_TEST === "true" || process.env.NODE_ENV !== "production";

const subscriptionCache = new Map<string, { appSubscriptions: AppSubscriptions; expiresAt: number }>();
const SUBSCRIPTION_CACHE_TTL_MS = 5000;

// Every route's loader (plus the shared parent app.tsx loader) independently called
// billing.check() to derive the current plan, meaning a single page navigation fired
// 2+ live GraphQL requests to Shopify for the same shop. This short-lived cache lets
// loaders that fire together (parent + child, within the same navigation) share one
// network round-trip instead of duplicating it.
export const getActiveAppSubscriptions = async (
  billing: Billing,
  shop: string
): Promise<AppSubscriptions> => {
  const now = Date.now();
  const cached = subscriptionCache.get(shop);
  if (cached && cached.expiresAt > now) {
    return cached.appSubscriptions;
  }
  const { appSubscriptions } = await billing.check({
    plans: [...ALL_BILLING_PLAN_NAMES],
    // `isTest` reads as "only test charges", but in billing.check() it is a widening
    // flag, not a narrowing one: the library keeps a subscription when
    // `isTest || !subscription.test`. So `isTest: true` means "count test AND live
    // subscriptions" (it is also the library's own default), while `isTest: false`
    // means "ignore every test subscription".
    //
    // It must stay `true` here. Shopify cannot charge development, test or
    // staff-affiliated stores, so on those stores it creates the approved
    // subscription with `test: true` — including for the App Store review team. With
    // `isTest: false` that ACTIVE subscription was filtered out, every loader fell
    // back to the Free plan, and the merchant saw no error at all. That is App Store
    // rejection 1.2.2.
    isTest: true,
  });
  subscriptionCache.set(shop, { appSubscriptions, expiresAt: now + SUBSCRIPTION_CACHE_TTL_MS });
  return appSubscriptions;
};

// Call after an action mutates the shop's subscription state (e.g. cancellation) so
// the next read within the TTL window doesn't serve stale pre-mutation data.
export const invalidateAppSubscriptionsCache = (shop: string) => {
  subscriptionCache.delete(shop);
};
