-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "shop" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "isOnline" BOOLEAN NOT NULL DEFAULT false,
    "scope" TEXT,
    "expires" TIMESTAMP(3),
    "accessToken" TEXT NOT NULL,
    "userId" BIGINT,
    "firstName" TEXT,
    "lastName" TEXT,
    "email" TEXT,
    "accountOwner" BOOLEAN NOT NULL DEFAULT false,
    "locale" TEXT,
    "collaborator" BOOLEAN DEFAULT false,
    "emailVerified" BOOLEAN DEFAULT false,
    "refreshToken" TEXT,
    "refreshTokenExpires" TIMESTAMP(3),

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Menu" (
    "id" SERIAL NOT NULL,
    "shop" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "items" JSONB NOT NULL,
    "settings" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Menu_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MenuEvent" (
    "id" SERIAL NOT NULL,
    "shop" TEXT NOT NULL,
    "menuId" INTEGER,
    "menuName" TEXT,
    "itemId" TEXT,
    "itemLabel" TEXT,
    "itemType" TEXT,
    "eventType" TEXT NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'storefront',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MenuEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BillingSubscription" (
    "id" SERIAL NOT NULL,
    "shop" TEXT NOT NULL,
    "subscriptionId" TEXT,
    "planName" TEXT,
    "status" TEXT,
    "test" BOOLEAN NOT NULL DEFAULT false,
    "trialDays" INTEGER,
    "currentPeriodEnd" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BillingSubscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShopPreference" (
    "id" SERIAL NOT NULL,
    "shop" TEXT NOT NULL,
    "language" TEXT NOT NULL DEFAULT 'en',
    "emailNotifications" BOOLEAN NOT NULL DEFAULT true,
    "marketingEmails" BOOLEAN NOT NULL DEFAULT false,
    "connectedThemeId" TEXT,
    "connectedThemeName" TEXT,
    "connectedThemeSelected" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ShopPreference_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContactSubmission" (
    "id" SERIAL NOT NULL,
    "shop" TEXT NOT NULL,
    "menuId" INTEGER,
    "menuItemId" TEXT,
    "name" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "message" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContactSubmission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MenuTemplate" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT,
    "items" JSONB NOT NULL,
    "settings" JSONB NOT NULL,
    "isPro" BOOLEAN NOT NULL DEFAULT false,
    "isNew" BOOLEAN NOT NULL DEFAULT false,
    "previewUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MenuTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Menu_shop_idx" ON "Menu"("shop");

-- CreateIndex
CREATE INDEX "MenuEvent_shop_idx" ON "MenuEvent"("shop");

-- CreateIndex
CREATE INDEX "MenuEvent_menuId_idx" ON "MenuEvent"("menuId");

-- CreateIndex
CREATE INDEX "MenuEvent_createdAt_idx" ON "MenuEvent"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "BillingSubscription_shop_key" ON "BillingSubscription"("shop");

-- CreateIndex
CREATE UNIQUE INDEX "ShopPreference_shop_key" ON "ShopPreference"("shop");

-- CreateIndex
CREATE INDEX "ContactSubmission_shop_idx" ON "ContactSubmission"("shop");

-- CreateIndex
CREATE INDEX "ContactSubmission_menuId_idx" ON "ContactSubmission"("menuId");

-- CreateIndex
CREATE INDEX "ContactSubmission_createdAt_idx" ON "ContactSubmission"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "MenuTemplate_name_key" ON "MenuTemplate"("name");
