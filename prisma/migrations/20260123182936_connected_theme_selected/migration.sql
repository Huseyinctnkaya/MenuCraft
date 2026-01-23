-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ShopPreference" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "shop" TEXT NOT NULL,
    "language" TEXT NOT NULL DEFAULT 'en',
    "emailNotifications" BOOLEAN NOT NULL DEFAULT true,
    "marketingEmails" BOOLEAN NOT NULL DEFAULT false,
    "connectedThemeId" TEXT,
    "connectedThemeName" TEXT,
    "connectedThemeSelected" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_ShopPreference" ("connectedThemeId", "connectedThemeName", "createdAt", "emailNotifications", "id", "language", "marketingEmails", "shop", "updatedAt") SELECT "connectedThemeId", "connectedThemeName", "createdAt", "emailNotifications", "id", "language", "marketingEmails", "shop", "updatedAt" FROM "ShopPreference";
DROP TABLE "ShopPreference";
ALTER TABLE "new_ShopPreference" RENAME TO "ShopPreference";
CREATE UNIQUE INDEX "ShopPreference_shop_key" ON "ShopPreference"("shop");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
