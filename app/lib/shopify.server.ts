import type { Shop } from "@prisma/client";
import { redirect } from "@remix-run/node";
import { LATEST_API_VERSION, shopifyApi } from "@shopify/shopify-api";
import { prisma } from "./db.server";

const scopes = (process.env.SCOPES ?? "")
  .split(",")
  .map((scope) => scope.trim())
  .filter(Boolean);

export const shopify = shopifyApi({
  apiKey: process.env.SHOPIFY_API_KEY ?? "",
  apiSecretKey: process.env.SHOPIFY_API_SECRET ?? "",
  scopes,
  hostName: (process.env.SHOPIFY_APP_URL ?? "localhost").replace(/^https?:\/\//, ""),
  apiVersion: (process.env.ADMIN_API_VERSION as string) ?? LATEST_API_VERSION,
  isEmbeddedApp: true
});

export async function requireShopSession(request: Request): Promise<Shop> {
  const url = new URL(request.url);
  const shopDomain = url.searchParams.get("shop");

  if (!shopDomain) {
    throw redirect("/auth");
  }

  const shop = await prisma.shop.findUnique({
    where: { shopDomain }
  });

  if (!shop) {
    throw redirect(`/auth?shop=${encodeURIComponent(shopDomain)}`);
  }

  return shop;
}

export async function upsertShopFromAuth(shopDomain: string, accessToken: string) {
  if (!shopDomain || !accessToken) {
    throw new Error("shopDomain and accessToken are required");
  }

  return prisma.shop.upsert({
    where: { shopDomain },
    update: { accessToken },
    create: {
      shopDomain,
      accessToken
    }
  });
}
