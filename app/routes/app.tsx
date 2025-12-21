import type { HeadersFunction, LoaderFunctionArgs } from "@remix-run/node";
import { Link, Outlet, useLoaderData, useRouteError, useLocation } from "@remix-run/react";
import { boundary } from "@shopify/shopify-app-remix/server";
import { AppProvider } from "@shopify/shopify-app-remix/react";
import { NavMenu } from "@shopify/app-bridge-react";
import polarisStyles from "@shopify/polaris/build/esm/styles.css?url";
import { Frame, Navigation, Text, BlockStack, Box } from "@shopify/polaris";

import { authenticate } from "../shopify.server";

export const links = () => [{ rel: "stylesheet", href: polarisStyles }];

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await authenticate.admin(request);

  return { apiKey: process.env.SHOPIFY_API_KEY || "" };
};

const navigationItems = [
  {
    label: "Dashboard",
    url: "/app",
  },
  {
    label: "Analytics",
    url: "/app/analytics",
  },
  {
    label: "Mega Menus",
    url: "/app/mega-menus",
  },
  {
    label: "Menu Builder",
    url: "/app/menu-builder",
  },
  {
    label: "Templates",
    url: "/app/templates",
  },
  {
    label: "Install & Theme Status",
    url: "/app/install-status",
  },
  {
    label: "Pricing & Plans",
    url: "/app/pricing",
  },
  {
    label: "Appearance",
    url: "/app/appearance",
  },
  {
    label: "Support",
    url: "/app/support",
  },
  {
    label: "Settings",
    url: "/app/settings",
  },
];

export default function App() {
  const { apiKey } = useLoaderData<typeof loader>();
  const location = useLocation();

  return (
    <AppProvider isEmbeddedApp apiKey={apiKey}>
      <Frame
        logo={{
          width: 200,
          topBarSource: "/menucraft-logo.png",
        }}
        navigation={
          <Navigation location={location.pathname}>
            <Navigation.Section
              items={navigationItems.map((item) => ({
                ...item,
                badge: undefined,
                selected: location.pathname === item.url || (item.url === "/app" && location.pathname === "/app"),
              }))}
            />
          </Navigation>
        }
      >
        <Outlet />
      </Frame>
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
