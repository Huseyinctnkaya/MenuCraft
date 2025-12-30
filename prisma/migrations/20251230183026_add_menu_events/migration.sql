-- CreateTable
CREATE TABLE "MenuEvent" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "shop" TEXT NOT NULL,
    "menuId" INTEGER,
    "menuName" TEXT,
    "itemId" TEXT,
    "itemLabel" TEXT,
    "itemType" TEXT,
    "eventType" TEXT NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'storefront',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE INDEX "MenuEvent_shop_idx" ON "MenuEvent"("shop");

-- CreateIndex
CREATE INDEX "MenuEvent_menuId_idx" ON "MenuEvent"("menuId");

-- CreateIndex
CREATE INDEX "MenuEvent_createdAt_idx" ON "MenuEvent"("createdAt");
