import type { Shop } from "@prisma/client";
import { prisma } from "../lib/db.server";

export async function getShopByDomain(shopDomain: string): Promise<Shop | null> {
  return prisma.shop.findUnique({ where: { shopDomain } });
}

export async function ensureShop(shopDomain: string, accessToken: string) {
  return prisma.shop.upsert({
    where: { shopDomain },
    update: { accessToken },
    create: {
      shopDomain,
      accessToken
    }
  });
}
