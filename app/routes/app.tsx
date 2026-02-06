import type { HeadersFunction, LoaderFunctionArgs } from "@remix-run/node";
import { Outlet, useLoaderData, useRouteError, useLocation } from "@remix-run/react";
import { boundary } from "@shopify/shopify-app-remix/server";
import { AppProvider } from "@shopify/shopify-app-remix/react";
import Sidebar from "../components/Sidebar";
import CrispChat from "../components/CrispChat";

import { authenticate } from "../shopify.server";

import {
  ALL_BILLING_PLAN_NAMES,
  getPlanSelection,
} from "../config/billing";
import prisma from "../db.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { billing, session } = await authenticate.admin(request);
  const shop = session.shop;

  // Check current plan
  const billingTestMode =
    process.env.BILLING_TEST === "true" || process.env.NODE_ENV !== "production";
  const { appSubscriptions } = await billing.check({
    plans: [...ALL_BILLING_PLAN_NAMES],
    isTest: billingTestMode,
  });
  const activeSubscription = appSubscriptions.find((subscription) =>
    ["ACTIVE", "ACCEPTED"].includes(subscription.status)
  );

  /* 
     DEV OVERRIDE: Unlocking Plus plan for template design.
     Change this back before production.
  */
  const planSelection = { id: "plus" as const, period: "monthly" as const };

  // Check menu count
  const menuCount = await prisma.menu.count({ where: { shop } });

  return {
    apiKey: process.env.SHOPIFY_API_KEY || "",
    planTier: planSelection.id,
    menuCount,
    crispWebsiteId: process.env.CRISP_WEBSITE_ID || "",
  };
};

export default function App() {
  const { apiKey, crispWebsiteId } = useLoaderData<typeof loader>();
  const location = useLocation();
  const isBuilderView = location.pathname.startsWith("/app/menu-builder");

  return (
    <AppProvider isEmbeddedApp apiKey={apiKey}>
      {isBuilderView ? (
        <div className="min-h-screen bg-gray-100">
          <Outlet />
        </div>
      ) : (
        <div className="flex min-h-screen bg-gray-50">
          <Sidebar />
          <main className="flex-1 ml-64">
            <Outlet />
          </main>
        </div>
      )}
      <CrispChat websiteId={crispWebsiteId} />
    </AppProvider>
  );
}

// Shopify needs Remix to catch some thrown responses, so that their headers are included in the response.
export function ErrorBoundary() {
  return boundary.error(useRouteError());
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
