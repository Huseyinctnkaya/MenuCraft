-- CreateTable
CREATE TABLE "BillingSubscription" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "shop" TEXT NOT NULL,
    "subscriptionId" TEXT,
    "planName" TEXT,
    "status" TEXT,
    "test" BOOLEAN NOT NULL DEFAULT false,
    "trialDays" INTEGER,
    "currentPeriodEnd" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "BillingSubscription_shop_key" ON "BillingSubscription"("shop");
