import type { Menu, MenuItem, MenuVersion } from "@prisma/client";
import { prisma } from "../lib/db.server";

export type MenuWithItems = Menu & {
  items: MenuItem[];
  versions: MenuVersion[];
};

export async function listMenus(shopId: number) {
  return prisma.menu.findMany({
    where: { shopId },
    include: { versions: true },
    orderBy: { updatedAt: "desc" }
  });
}

export async function getMenuWithItems(menuId: number, shopId: number) {
  return prisma.menu.findFirst({
    where: { id: menuId, shopId },
    include: {
      items: {
        orderBy: { sort: "asc" }
      },
      versions: true
    }
  });
}

export async function createMenu(shopId: number, title: string) {
  return prisma.menu.create({
    data: { title, shopId }
  });
}

export async function renameMenu(menuId: number, shopId: number, title: string) {
  return prisma.menu.update({
    where: { id: menuId, shopId },
    data: { title }
  });
}

export async function deleteMenu(menuId: number, shopId: number) {
  await prisma.menu.delete({
    where: { id: menuId, shopId }
  });
}
