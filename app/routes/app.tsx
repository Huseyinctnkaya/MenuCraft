import type { HeadersFunction, LoaderFunctionArgs } from "@remix-run/node";
import { Outlet, useLoaderData, useRouteError } from "@remix-run/react";
import { boundary } from "@shopify/shopify-app-remix/server";
import { AppProvider } from "@shopify/shopify-app-remix/react";
import { NavMenu } from "@shopify/app-bridge-react";
import polarisStyles from "@shopify/polaris/build/esm/styles.css?url";
import CrispChat from "../components/CrispChat";

import { authenticate } from "../shopify.server";

import {
  getActiveAppSubscriptions,
  getPlanSelection,
} from "../config/billing";
import prisma from "../db.server";

export const links = () => [{ rel: "stylesheet", href: polarisStyles }];

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { billing, session } = await authenticate.admin(request);
  const shop = session.shop;

  // Check current plan
  const billingTestMode =
    process.env.BILLING_TEST === "true" || process.env.NODE_ENV !== "production";
  const appSubscriptions = await getActiveAppSubscriptions(billing, shop, billingTestMode);
  const activeSubscription = appSubscriptions.find((subscription) =>
    ["ACTIVE", "ACCEPTED"].includes(subscription.status)
  );

  const planSelection = getPlanSelection(activeSubscription?.name) ?? {
    id: "free" as const,
  };

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

  return (
    <AppProvider isEmbeddedApp apiKey={apiKey}>
      <NavMenu>
        <a href="/app" rel="home">
          Dashboard
        </a>
        <a href="/app/analytics">Analytics</a>
        <a href="/app/mega-menus">Mega Menus</a>
        <a href="/app/install-status">Install &amp; Theme Status</a>
        <a href="/app/pricing">Pricing &amp; Plans</a>
        <a href="/app/support">Support</a>
        <a href="/app/settings">Settings</a>
      </NavMenu>
      <Outlet />
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
