import { json } from "@remix-run/node";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import crypto from "node:crypto";

import prisma from "../db.server";
import { sendContactEmail } from "../email.server";

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
  return json({ error: "Method Not Allowed" }, { status: 405 });
};

export const action = async ({ request }: ActionFunctionArgs) => {
  if (request.method !== "POST") {
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

  const formData = await request.formData();
  const menuIdRaw = formData.get("menuId");
  const menuId = typeof menuIdRaw === "string" ? Number(menuIdRaw) : null;
  const menuItemId = formData.get("menuItemId");
  const name = formData.get("name");
  const email = formData.get("email");
  const phone = formData.get("phone");
  const message = formData.get("message");

  const submission = await prisma.contactSubmission.create({
    data: {
      shop,
      menuId: Number.isFinite(menuId) ? menuId : null,
      menuItemId: typeof menuItemId === "string" ? menuItemId : null,
      name: typeof name === "string" ? name.trim() : null,
      email: typeof email === "string" ? email.trim() : null,
      phone: typeof phone === "string" ? phone.trim() : null,
      message: typeof message === "string" ? message.trim() : null,
    },
  });

  try {
    await sendContactEmail({
      shop,
      menuId: Number.isFinite(menuId) ? menuId : null,
      menuItemId: typeof menuItemId === "string" ? menuItemId : null,
      name: typeof name === "string" ? name.trim() : null,
      email: typeof email === "string" ? email.trim() : null,
      phone: typeof phone === "string" ? phone.trim() : null,
      message: typeof message === "string" ? message.trim() : null,
    });
  } catch (error) {
    console.error("Failed to send contact email", error);
  }

  return json({ ok: true, id: submission.id });
};
