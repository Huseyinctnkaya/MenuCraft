import { json } from "@remix-run/node";
import type { ActionFunctionArgs } from "@remix-run/node";

import { authenticate } from "../../shopify.server";
import prisma from "../../db.server";
import { sendContactEmail } from "../../email.server";
import type { BuilderSettings, MenuItem } from "../types";

export const action = async ({ request }: ActionFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const shop = session.shop;
  const formData = await request.formData();
  const intent = formData.get("intent");

  if (intent === "contact-submit") {
    const menuIdValue = Number(formData.get("menuId"));
    const menuId = Number.isFinite(menuIdValue) && menuIdValue > 0 ? menuIdValue : null;
    const menuItemId =
      typeof formData.get("menuItemId") === "string" ? String(formData.get("menuItemId")) : null;
    const name = typeof formData.get("name") === "string" ? formData.get("name").trim() : null;
    const email = typeof formData.get("email") === "string" ? formData.get("email").trim() : null;
    const phone = typeof formData.get("phone") === "string" ? formData.get("phone").trim() : null;
    const message =
      typeof formData.get("message") === "string" ? formData.get("message").trim() : null;

    const submission = await prisma.contactSubmission.create({
      data: {
        shop,
        menuId,
        menuItemId,
        name: name || null,
        email: email || null,
        phone: phone || null,
        message: message || null,
      },
    });

    let menuName: string | null = null;
    if (menuId) {
      const menu = await prisma.menu.findFirst({
        where: { id: menuId, shop },
        select: { name: true },
      });
      menuName = menu?.name ?? null;
    }

    try {
      await sendContactEmail({
        shop,
        menuId,
        menuName,
        menuItemId,
        name,
        email,
        phone,
        message,
      });
    } catch (error) {
      console.error("Failed to send contact email", error);
    }

    return json({ ok: true, menuItemId: submission.menuItemId ?? null });
  }

  if (intent !== "save") {
    return json({ ok: false, error: "Unknown intent" }, { status: 400 });
  }

  const menuId = Number(formData.get("menuId"));
  const itemsRaw = formData.get("items");
  const status = String(formData.get("status") || "draft");
  const settingsRaw = formData.get("settings");

  if (!menuId || typeof itemsRaw !== "string") {
    return json({ ok: false, error: "Missing data" }, { status: 400 });
  }

  let items: MenuItem[];
  let settings: BuilderSettings | null = null;
  try {
    items = JSON.parse(itemsRaw) as MenuItem[];
    if (typeof settingsRaw === "string") {
      settings = JSON.parse(settingsRaw) as BuilderSettings;
    }
  } catch {
    return json({ ok: false, error: "Invalid items payload" }, { status: 400 });
  }

  const existing = await prisma.menu.findFirst({ where: { id: menuId, shop } });
  if (!existing) {
    return json({ ok: false, error: "Menu not found" }, { status: 404 });
  }

  await prisma.$transaction(async (tx) => {
    if (status === "active") {
      await tx.menu.updateMany({
        where: {
          shop,
          status: "active",
          id: { not: menuId },
        },
        data: { status: "draft" },
      });
    }

    await tx.menu.update({
      where: { id: menuId },
      data: {
        items,
        status,
      },
    });

    if (settings) {
      await tx.$executeRaw`
        UPDATE Menu
        SET settings = ${JSON.stringify(settings)}
        WHERE id = ${menuId} AND shop = ${shop}
      `;
    }
  });

  return json({ ok: true });
};
