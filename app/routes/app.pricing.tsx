import { useState } from "react";
import { json, redirect, type ActionFunctionArgs, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import {
  ArrowRight,
  Check,
  CreditCard,
  Rocket,
  Shield,
  Star,
  Zap,
} from "lucide-react";
import { authenticate } from "../shopify.server";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import {
  ALL_BILLING_PLAN_NAMES,
  BILLING_PLANS,
  getPlanSelection,
  type BillingPeriod,
} from "../config/billing";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { billing } = await authenticate.admin(request);
  const billingTestMode =
    process.env.BILLING_TEST === "true" || process.env.NODE_ENV !== "production";
  const { appSubscriptions } = await billing.check({
    plans: [...ALL_BILLING_PLAN_NAMES],
    isTest: billingTestMode,
  });
  const activeSubscription = appSubscriptions.find((subscription) =>
    ["ACTIVE", "ACCEPTED"].includes(subscription.status)
  );
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
  const appUrl = process.env.SHOPIFY_APP_URL || new URL(request.url).origin;

  return await billing.request({
    plan: planName,
    isTest: billingTestMode,
    returnUrl: new URL("/app/pricing", appUrl).toString(),
  });
};

export default function Pricing() {
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "yearly">("monthly");
  const { currentPlan } = useLoaderData<typeof loader>();

  const plans = [
    {
      id: "free",
      name: "Free",
      icon: Zap,
      iconColor: "bg-gray-100 text-gray-600",
      description: "Perfect for testing and small stores",
      priceMonthly: "$0",
      priceYearly: "$0",
      features: ["1 mega menu", "Basic styling", "7-day analytics", "Basic support"],
      popular: false,
    },
    {
      id: "pro",
      name: "Pro",
      icon: Star,
      iconColor: "bg-indigo-100 text-indigo-600",
      description: "Best for growing stores",
      priceMonthly: "$19.99",
      priceYearly: "$15.99",
      features: [
        "Unlimited mega menus",
        "Full design controls (typography, colors, spacing)",
        "Template library access",
        "Analytics (30/90 days)",
        "Mobile menu features",
        "Priority support",
      ],
      popular: true,
      trial: "Includes 14-day trial",
    },
    {
      id: "plus",
      name: "Plus",
      icon: Rocket,
      iconColor: "bg-purple-100 text-purple-600",
      description: "Advanced / Agencies",
      priceMonthly: "$49.99",
      priceYearly: "$39.99",
      features: [
        "Everything in Pro",
        "Multi-store / client management",
        "Advanced targeting (segment, device, geo)",
        "A/B testing & heatmaps",
        "Import / export tools",
        "Dedicated support & onboarding",
      ],
      popular: false,
    },
  ];

  const comparisonFeatures = [
    { name: "Mega Menus", free: "1", pro: "Unlimited", plus: "Unlimited" },
    { name: "Template Library", free: false, pro: true, plus: true },
    { name: "Design Controls (Typography/Colors/Spacing)", free: "Basic", pro: "Full", plus: "Full" },
    { name: "Analytics Range", free: "7 days", pro: "30/90 days", plus: "All + Advanced" },
    { name: "Mobile Menu Features", free: false, pro: true, plus: true },
    { name: "Advanced Targeting (Segment/Device/Geo)", free: false, pro: false, plus: true },
    { name: "A/B Testing & Heatmaps", free: false, pro: false, plus: true },
    { name: "Import / Export", free: false, pro: false, plus: true },
    { name: "Multi-store Management", free: false, pro: false, plus: true },
    { name: "Support Level", free: "Basic", pro: "Priority", plus: "Dedicated" },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-4xl text-gray-900">Plans & Billing</h1>
          <p className="text-lg text-gray-600">Choose the plan that fits your store's needs</p>

          <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-50 border border-green-200 rounded-full">
            <Shield className="w-4 h-4 text-green-600" />
            <span className="text-sm text-green-700">
              14-day free trial - No credit card required - Cancel anytime
            </span>
          </div>
        </div>

        <div className="flex justify-center">
          <div className="inline-flex items-center gap-3 p-1 bg-white border border-gray-200 rounded-lg shadow-sm">
            <button
              onClick={() => setBillingPeriod("monthly")}
              className={`px-6 py-2 rounded-md text-sm transition-all ${
                billingPeriod === "monthly"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingPeriod("yearly")}
              className={`px-6 py-2 rounded-md text-sm transition-all flex items-center gap-2 ${
                billingPeriod === "yearly"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Yearly
              {billingPeriod === "yearly" && (
                <Badge variant="success" className="text-xs">
                  Save 20%
                </Badge>
              )}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {plans.map((plan) => {
            const Icon = plan.icon;
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
            const ctaVariant = planIsCurrent || plan.id === "free" ? "outline" : "primary";

            return (
              <Card
                key={plan.id}
                className={`relative flex flex-col p-6 ${plan.popular ? "ring-2 ring-indigo-600" : ""}`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge variant="pro" className="shadow-sm">
                      Most Popular
                    </Badge>
                  </div>
                )}

                <div className={`w-14 h-14 ${plan.iconColor} rounded-full flex items-center justify-center mb-4`}>
                  <Icon className="w-7 h-7" />
                </div>

                <div className="space-y-2 mb-4">
                  <h3 className="text-xl text-gray-900">{plan.name}</h3>
                  <p className="text-sm text-gray-600">{plan.description}</p>
                </div>

                <div className="mb-6">
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl text-gray-900">{price}</span>
                    <span className="text-gray-600">/ {billingPeriod === "monthly" ? "month" : "year"}</span>
                  </div>
                  {plan.trial && <p className="text-xs text-gray-600 mt-2">{plan.trial}</p>}
                </div>

                <ul className="space-y-3 mb-6 flex-1">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>

                <form method="post">
                  <input type="hidden" name="plan" value={plan.id} />
                  <input type="hidden" name="billingPeriod" value={billingPeriod} />
                  <Button
                    variant={ctaVariant}
                    className="w-full"
                    disabled={isUpgradeDisabled}
                    type="submit"
                  >
                    {ctaLabel}
                  </Button>
                </form>
              </Card>
            );
          })}
        </div>

        <Card className="p-6">
          <h2 className="text-xl text-gray-900 mb-6 text-center">Feature Comparison</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm text-gray-600"></th>
                  <th className="text-center py-3 px-4 text-sm text-gray-900">Free</th>
                  <th className="text-center py-3 px-4 text-sm text-gray-900">
                    <div className="flex items-center justify-center gap-2">
                      Pro
                      <Badge variant="pro" className="text-xs">
                        Popular
                      </Badge>
                    </div>
                  </th>
                  <th className="text-center py-3 px-4 text-sm text-gray-900">Plus</th>
                </tr>
              </thead>
              <tbody>
                {comparisonFeatures.map((feature, index) => (
                  <tr key={index} className="border-b border-gray-100 last:border-0">
                    <td className="py-3 px-4 text-sm text-gray-700">{feature.name}</td>
                    <td className="py-3 px-4 text-center text-sm">
                      {typeof feature.free === "boolean" ? (
                        feature.free ? (
                          <Check className="w-5 h-5 text-green-600 mx-auto" />
                        ) : (
                          <span className="text-gray-400">-</span>
                        )
                      ) : (
                        <span className="text-gray-700">{feature.free}</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center text-sm bg-indigo-50">
                      {typeof feature.pro === "boolean" ? (
                        feature.pro ? (
                          <Check className="w-5 h-5 text-green-600 mx-auto" />
                        ) : (
                          <span className="text-gray-400">-</span>
                        )
                      ) : (
                        <span className="text-gray-700">{feature.pro}</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center text-sm">
                      {typeof feature.plus === "boolean" ? (
                        feature.plus ? (
                          <Check className="w-5 h-5 text-green-600 mx-auto" />
                        ) : (
                          <span className="text-gray-400">-</span>
                        )
                      ) : (
                        <span className="text-gray-700">{feature.plus}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card className="p-6 bg-blue-50 border-blue-200">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
              <CreditCard className="w-6 h-6 text-blue-600" />
            </div>
            <div className="flex-1 space-y-4">
              <div>
                <h3 className="text-lg text-gray-900 mb-2">How plan selection works</h3>
                <p className="text-sm text-gray-600">
                  Choose a plan to unlock features. After selecting a plan, you'll be redirected to your Dashboard.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center text-sm">
                    1
                  </div>
                  <span className="text-sm text-gray-700">Select plan</span>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-400" />
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center text-sm">
                    2
                  </div>
                  <span className="text-sm text-gray-700">Confirm billing</span>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-400" />
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center text-sm">
                    3
                  </div>
                  <span className="text-sm text-gray-700">Go to Dashboard</span>
                </div>
              </div>
            </div>
          </div>
        </Card>

        <div className="text-center">
          <p className="text-gray-600 mb-4">Have questions about pricing?</p>
          <Button variant="outline">Contact Sales</Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-12">
          <div className="flex items-center gap-3 p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
            <div className="w-8 h-8 bg-green-50 rounded-full flex items-center justify-center flex-shrink-0">
              <Shield className="w-4 h-4 text-green-600" />
            </div>
            <p className="text-sm text-gray-700">30-day money back guarantee</p>
          </div>

          <div className="flex items-center gap-3 p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
            <div className="w-8 h-8 bg-indigo-50 rounded-full flex items-center justify-center flex-shrink-0">
              <Star className="w-4 h-4 text-indigo-600" />
            </div>
            <p className="text-sm text-gray-700">Built for Shopify by Shopify Experts</p>
          </div>
        </div>
      </div>
    </div>
  );
}
