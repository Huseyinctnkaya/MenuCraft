import { json } from "@remix-run/node";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";

import prisma from "../db.server";
import shopify from "../shopify.server";

const MAX_FIELD_LENGTH = 255;

const cleanString = (value: unknown): string | null => {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed.slice(0, MAX_FIELD_LENGTH);
};

export const loader = async (_args: LoaderFunctionArgs) => {
  return json({ ok: false, error: "Method Not Allowed" }, { status: 405 });
};

export const action = async ({ request }: ActionFunctionArgs) => {
  if (request.method !== "POST") {
    return json({ ok: false, error: "Method Not Allowed" }, { status: 405 });
  }

  let shop: string | undefined;
  try {
    const { session } = await shopify.authenticate.public.appProxy(request);
    shop = session?.shop;
  } catch {
    return json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }
  if (!shop) {
    return json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  // sendBeacon cannot send Content-Type: application/json, so parse manually.
  let payload: unknown;
  try {
    payload = JSON.parse(await request.text());
  } catch {
    return json({ ok: false, error: "Invalid payload" }, { status: 400 });
  }
  if (!payload || typeof payload !== "object") {
    return json({ ok: false, error: "Invalid payload" }, { status: 400 });
  }

  const body = payload as Record<string, unknown>;
  const eventType = body.eventType;
  if (eventType !== "impression" && eventType !== "click") {
    return json({ ok: false, error: "Invalid eventType" }, { status: 400 });
  }

  const menuIdValue = Number(body.menuId);
  const menuId = Number.isFinite(menuIdValue) ? menuIdValue : null;

  try {
    await prisma.menuEvent.create({
      data: {
        shop,
        menuId,
        menuName: cleanString(body.menuName),
        itemId: cleanString(body.itemId),
        itemLabel: cleanString(body.itemLabel),
        itemType: cleanString(body.itemType),
        eventType,
        source: "storefront",
      },
    });
  } catch (error) {
    console.error("[analytics] Failed to record event", error);
    return json({ ok: false, error: "Failed to record event" }, { status: 500 });
  }

  return json({ ok: true });
};
