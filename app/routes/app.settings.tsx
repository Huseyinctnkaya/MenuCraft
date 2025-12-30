import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { CreditCard, Globe, User } from "lucide-react";
import { useLoaderData, useLocation, useNavigate } from "@remix-run/react";
import { authenticate } from "../shopify.server";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import prisma from "../db.server";
import { ALL_BILLING_PLAN_NAMES, getPlanSelection } from "../config/billing";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { billing, session } = await authenticate.admin(request);
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

  return json({
    selection,
    currentPeriodEnd: record?.currentPeriodEnd?.toISOString() ?? null,
  });
};

export default function AccountSettings() {
  const { selection, currentPeriodEnd } = useLoaderData<typeof loader>();
  const navigate = useNavigate();
  const location = useLocation();

  const withSearch = (path: string) => ({ pathname: path, search: location.search });

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto space-y-6">
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
            <Button variant="outline" className="w-full justify-start">
              Update Payment Method
            </Button>
            <Button variant="outline" className="w-full justify-start">
              Download Invoices
            </Button>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-lg text-gray-900 mb-2 flex items-center gap-2">
            <Globe className="w-5 h-5" />
            Preferences
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-700 mb-2">Language</label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
                <option>English</option>
                <option>Spanish</option>
                <option>French</option>
                <option>German</option>
              </select>
            </div>

            <label className="flex items-center justify-between">
              <span className="text-sm text-gray-700">Email notifications</span>
              <input type="checkbox" className="w-4 h-4" defaultChecked />
            </label>

            <label className="flex items-center justify-between">
              <span className="text-sm text-gray-700">Marketing emails</span>
              <input type="checkbox" className="w-4 h-4" />
            </label>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-lg text-gray-900 mb-3">Danger Zone</h2>
          <p className="text-sm text-gray-600 mb-4">
            Uninstalling MenuCraft will remove all menus and settings. This action cannot be undone.
          </p>
          <Button variant="outline" className="text-red-600 border-red-300 hover:bg-red-50">
            Uninstall App
          </Button>
        </Card>
      </div>
    </div>
  );
}
