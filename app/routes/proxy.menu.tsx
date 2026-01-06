import { json } from "@remix-run/node";
import type { LoaderFunctionArgs } from "@remix-run/node";
import crypto from "node:crypto";

import prisma from "../db.server";

const timingSafeEqual = (a: string, b: string) => {
  const aBuffer = Buffer.from(a);
  const bBuffer = Buffer.from(b);
  if (aBuffer.length !== bBuffer.length) {
    return false;
  }
  return crypto.timingSafeEqual(aBuffer, bBuffer);
};

const isValidAppProxyRequest = (url: URL) => {
  const signature = url.searchParams.get("signature");
  const secret = process.env.SHOPIFY_API_SECRET;

  if (!signature || !secret) {
    return false;
  }

  const params = new URLSearchParams(url.searchParams);
  params.delete("signature");
  params.delete("hmac");

  const sortedQuery = Array.from(params.entries())
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => `${key}=${value}`)
    .join("");

  const digest = crypto.createHmac("sha256", secret).update(sortedQuery).digest("hex");
  return timingSafeEqual(digest, signature);
};

export const loader = async ({ request }: LoaderFunctionArgs) => {
  if (request.method !== "GET") {
    return json({ error: "Method Not Allowed" }, { status: 405 });
  }

  const url = new URL(request.url);
  const shop = url.searchParams.get("shop");

  if (!shop) {
    return json({ error: "Missing shop parameter." }, { status: 400 });
  }

  if (!isValidAppProxyRequest(url)) {
    return json({ error: "Invalid signature." }, { status: 401 });
  }

  const menu = await prisma.menu.findFirst({
    where: { shop, status: "active" },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      name: true,
      status: true,
      items: true,
      settings: true,
    },
  });

  return json({ ok: true, menu });
};
