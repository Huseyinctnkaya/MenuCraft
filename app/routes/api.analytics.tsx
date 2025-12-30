import { json, type ActionFunctionArgs, type LoaderFunctionArgs } from "@remix-run/node";
import prisma from "../db.server";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export const loader = async ({ request }: LoaderFunctionArgs) => {
  if (request.method === "OPTIONS") {
    return json(null, { headers: corsHeaders });
  }
  return json({ ok: true }, { headers: corsHeaders });
};

export const action = async ({ request }: ActionFunctionArgs) => {
  if (request.method === "OPTIONS") {
    return json(null, { headers: corsHeaders });
  }

  if (request.method !== "POST") {
    return json({ ok: false, error: "Method not allowed" }, { status: 405, headers: corsHeaders });
  }

  const payload = await request.json().catch(() => null);
  if (!payload || typeof payload !== "object") {
    return json({ ok: false, error: "Invalid payload" }, { status: 400, headers: corsHeaders });
  }

  const shop = typeof payload.shop === "string" ? payload.shop.trim() : "";
  const eventType = typeof payload.eventType === "string" ? payload.eventType.trim() : "";

  if (!shop || !eventType) {
    return json({ ok: false, error: "Missing shop or eventType" }, { status: 400, headers: corsHeaders });
  }

  if (!/^[a-z0-9][a-z0-9-]*\.myshopify\.com$/i.test(shop)) {
    return json({ ok: false, error: "Invalid shop domain" }, { status: 400, headers: corsHeaders });
  }

  const menuId = Number.isFinite(payload.menuId) ? Number(payload.menuId) : null;
  const menuName = typeof payload.menuName === "string" ? payload.menuName : null;
  const itemId = typeof payload.itemId === "string" ? payload.itemId : null;
  const itemLabel = typeof payload.itemLabel === "string" ? payload.itemLabel : null;
  const itemType = typeof payload.itemType === "string" ? payload.itemType : null;
  const source = typeof payload.source === "string" ? payload.source : "storefront";

  await prisma.menuEvent.create({
    data: {
      shop,
      menuId,
      menuName,
      itemId,
      itemLabel,
      itemType,
      eventType,
      source,
    },
  });

  return json({ ok: true }, { headers: corsHeaders });
};
