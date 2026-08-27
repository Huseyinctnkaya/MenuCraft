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
type Admin = AdminContext["admin"];
type AppSubscriptions = Awaited<ReturnType<Billing["check"]>>["appSubscriptions"];

const SHOP_BILLABILITY_QUERY = `#graphql
  query BillingShopPlan {
    shop {
      plan {
        partnerDevelopment
      }
    }
  }
`;

// Whether a NEW charge should be created as a test charge (no real money).
//
// This only ever belongs on billing.request(). Do not pass it to billing.check() —
// see the comment on getActiveAppSubscriptions for why that combination silently
// hides real subscriptions.
//
// The question that decides this is "can this shop actually be charged?", which is
// a property of the shop, not of our server. Keying it off NODE_ENV conflated the
// two: against the production server every shop got a live charge, including
// partner development stores, which have no payment method and therefore cannot
// approve one — the merchant just lands on a confirmation page with a disabled
// button. That blocks our own testing and, more importantly, blocks App Store
// reviewers, who install onto development stores.
export const resolveBillingTestMode = async (admin: Admin): Promise<boolean> => {
  // Escape hatch for forcing test charges on a shop that would otherwise be
  // billable. Not needed for development stores anymore — those are detected.
  if (process.env.BILLING_TEST === "true") {
    return true;
  }
  try {
    const response = await admin.graphql(SHOP_BILLABILITY_QUERY);
    const body = (await response.json()) as {
      data?: { shop?: { plan?: { partnerDevelopment?: boolean } } };
    };
    return body?.data?.shop?.plan?.partnerDevelopment === true;
  } catch (error) {
    // Fall back to a live charge rather than a test one. The two failure modes are
    // not symmetric: guessing "test" would hand a real merchant a paid plan they
    // are never billed for, and nothing would surface that. Guessing "live" at
    // worst blocks a development store at the approval screen, which is loud and
    // gets noticed.
    console.error("Could not determine whether the shop is billable", error);
    return false;
  }
};

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
