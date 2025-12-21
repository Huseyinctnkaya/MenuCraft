import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { Outlet, useLoaderData } from "@remix-run/react";
import type { Shop } from "@prisma/client";
import AppFrame from "../components/AppFrame";
import { requireShopSession } from "../lib/shopify.server";

export type AppLoaderData = {
  shop: Shop;
};

export async function loader({ request }: LoaderFunctionArgs) {
  const shop = await requireShopSession(request);
  return json<AppLoaderData>({ shop });
}

export default function AppLayout() {
  const { shop } = useLoaderData<typeof loader>();

  return (
    <AppFrame shopDomain={shop.shopDomain}>
      <main>
        <Outlet />
      </main>
    </AppFrame>
  );
}
