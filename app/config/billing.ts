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
