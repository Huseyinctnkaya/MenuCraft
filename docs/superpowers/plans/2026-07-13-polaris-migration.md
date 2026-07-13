# Full Polaris UI Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convert every admin-chrome page in MenuCraft (Dashboard, Mega Menus, Analytics, Pricing, Settings, Support, Documentation, Install Status, and the app shell/nav) from a custom Tailwind UI kit to real `@shopify/polaris` components, while leaving the Menu Builder's live preview/canvas untouched.

**Architecture:** Presentation-only rewrite. Every route's `loader`/`action` (data fetching, Prisma queries, Shopify GraphQL calls, billing checks) stays byte-for-byte identical — only each route's default-exported component (the JSX it returns) changes, plus its imports. The custom `Sidebar.tsx` is replaced by App Bridge's `<NavMenu>`. The old UI kit (`app/components/ui/Button|Card|Badge.tsx`) is deleted once nothing imports it.

**Tech Stack:** Remix v2, `@shopify/polaris` v12 (already a dependency), `@shopify/polaris-icons`, `@shopify/app-bridge-react` (`NavMenu`), Prisma (unchanged), `recharts` (unchanged, kept for charts inside Polaris `Card`s).

## Global Constraints

- Do not change any `loader`/`action` function body, Prisma query, GraphQL query, or billing logic in any file touched by this plan — verified by diffing only the component/import sections.
- Do not touch anything under `app/menu-builder/components/preview/**` (the live menu canvas) — out of scope per the approved design spec (`docs/superpowers/specs/2026-07-13-polaris-migration-design.md`).
- Every converted page must build cleanly: `npm run lint` and `npx tsc --noEmit` must show no new errors versus the pre-task baseline.
- Icon substitutions use `@shopify/polaris-icons` names confirmed to exist in `node_modules/@shopify/polaris-icons/dist/icons`: `HomeIcon`, `ChartLineIcon`, `ChartVerticalIcon`, `MenuIcon`, `MenuVerticalIcon`, `ImportIcon`, `CreditCardIcon`, `QuestionCircleIcon`, `SettingsIcon`, `MobileIcon`, `AlertCircleIcon`, `CheckCircleIcon`, `ChevronDownIcon`, `ChevronUpIcon`, `ShieldCheckMarkIcon`, `StarIcon`, `DuplicateIcon`, `EditIcon`, `DeleteIcon`, `UploadIcon`, `PlusIcon`, `CalendarIcon`, `CursorIcon`, `ArrowRightIcon`, `GlobeIcon`, `GaugeIcon`, `FileIcon`, `EmailIcon`, `ChatIcon`, `ExternalIcon`, `CheckIcon`, `TeamIcon`, `PersonIcon`, `GiftCardIcon`, `ConfettiIcon`. Polaris has no direct equivalent for lucide's `Zap`/`Rocket`/`Eye`/`EyeOff` — `Zap`→`GiftCardIcon`, `Rocket`→`ConfettiIcon`, and status `Badge`s drop the eye icon entirely (Polaris list-status badges are conventionally text-only with `tone`, e.g. Shopify's own Products list).
- `@shopify/shopify-app-remix/react`'s `AppProvider` already defaults `i18n` to `@shopify/polaris/locales/en.json` internally (confirmed in `node_modules/@shopify/shopify-app-remix/dist/esm/react/components/AppProvider/AppProvider.mjs`) — no explicit `i18n` prop needs to be added.

---

### Task 1: App shell — replace Sidebar with App Bridge NavMenu

**Files:**
- Modify: `app/routes/app.tsx`
- Delete: `app/components/Sidebar.tsx`

**Interfaces:**
- Produces: every subsequent task's route no longer renders inside a `flex`/`ml-64` layout — routes render full-width directly under `<Outlet/>`. Each route file is responsible for its own `<Page>` wrapper from here on.

- [ ] **Step 1: Replace `app/routes/app.tsx` contents**

```tsx
import type { HeadersFunction, LoaderFunctionArgs } from "@remix-run/node";
import { Outlet, useLoaderData, useRouteError } from "@remix-run/react";
import { boundary } from "@shopify/shopify-app-remix/server";
import { AppProvider } from "@shopify/shopify-app-remix/react";
import { NavMenu } from "@shopify/app-bridge-react";
import polarisStyles from "@shopify/polaris/build/esm/styles.css?url";
import CrispChat from "../components/CrispChat";

import { authenticate } from "../shopify.server";

import {
  ALL_BILLING_PLAN_NAMES,
  getPlanSelection,
} from "../config/billing";
import prisma from "../db.server";

export const links = () => [{ rel: "stylesheet", href: polarisStyles }];

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { billing, session } = await authenticate.admin(request);
  const shop = session.shop;

  // Check current plan
  const billingTestMode =
    process.env.BILLING_TEST === "true" || process.env.NODE_ENV !== "production";
  const { appSubscriptions } = await billing.check({
    plans: [...ALL_BILLING_PLAN_NAMES],
    isTest: billingTestMode,
  });
  const activeSubscription = appSubscriptions.find((subscription) =>
    ["ACTIVE", "ACCEPTED"].includes(subscription.status)
  );

  const planSelection = getPlanSelection(activeSubscription?.name) ?? {
    id: "free" as const,
    period: null,
  };

  // Check menu count
  const menuCount = await prisma.menu.count({ where: { shop } });

  return {
    apiKey: process.env.SHOPIFY_API_KEY || "",
    planTier: planSelection.id,
    menuCount,
    crispWebsiteId: process.env.CRISP_WEBSITE_ID || "",
  };
};

export default function App() {
  const { apiKey, crispWebsiteId } = useLoaderData<typeof loader>();

  return (
    <AppProvider isEmbeddedApp apiKey={apiKey}>
      <NavMenu>
        <a href="/app" rel="home">
          Dashboard
        </a>
        <a href="/app/analytics">Analytics</a>
        <a href="/app/mega-menus">Mega Menus</a>
        <a href="/app/install-status">Install &amp; Theme Status</a>
        <a href="/app/pricing">Pricing &amp; Plans</a>
        <a href="/app/support">Support</a>
        <a href="/app/settings">Settings</a>
      </NavMenu>
      <Outlet />
      <CrispChat websiteId={crispWebsiteId} />
    </AppProvider>
  );
}

// Shopify needs Remix to catch some thrown responses, so that their headers are included in the response.
export function ErrorBoundary() {
  return boundary.error(useRouteError());
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
```

Note: the `isBuilderView` branch and `useLocation` import are removed — the menu-builder route (`app.menu-builder.tsx`) already renders its own full-bleed layout independent of this shell (verify in Task-adjacent testing that `/app/menu-builder` still looks correct — it never depended on the `ml-64`/flex wrapper being absent, since that branch already skipped `<Sidebar/>`).

- [ ] **Step 2: Delete the now-unused Sidebar component**

```bash
git rm app/components/Sidebar.tsx
```

- [ ] **Step 3: Verify no other file imports Sidebar**

Run: `grep -rn "components/Sidebar" app --include="*.tsx"`
Expected: no output.

- [ ] **Step 4: Type-check and lint**

Run: `npx tsc --noEmit && npm run lint`
Expected: no new errors from `app/routes/app.tsx`.

- [ ] **Step 5: Manual check**

Run `npm run dev`, open the app in an embedded session (via the Shopify CLI tunnel link, inside the dev store admin). Confirm the left nav now shows Shopify admin's own nav with the 7 links, and clicking each one navigates correctly.

- [ ] **Step 6: Commit**

```bash
git add app/routes/app.tsx
git commit -m "feat(ui): replace custom Sidebar with App Bridge NavMenu"
```

---

### Task 2: Dashboard → Polaris (`app/routes/app._index.tsx`)

**Files:**
- Modify: `app/routes/app._index.tsx`

**Interfaces:**
- Consumes: `loader`/`action` are unchanged (lines 16–339 of the current file — copy verbatim, do not edit).
- Produces: nothing consumed by later tasks (Dashboard has no cross-page dependents).

- [ ] **Step 1: Replace imports and the default-exported component**

Keep the existing `loader` and `action` functions (unchanged, verbatim) and the `appBlockCache`/`hasAppBlockInThemeAssets` helper exactly as they are. Replace only the top imports and the `export default function Dashboard()` block with:

```tsx
import { useEffect, useRef, useState } from "react";
import { useFetcher, useLoaderData, useLocation, useNavigate, useRevalidator, useRouteLoaderData } from "@remix-run/react";
import {
  Badge,
  BlockStack,
  Box,
  Button,
  Card,
  Collapsible,
  Icon,
  InlineGrid,
  InlineStack,
  Layout,
  List,
  Modal,
  Page,
  Select,
  Text,
} from "@shopify/polaris";
import {
  AlertCircleIcon,
  CheckCircleIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  ImportIcon,
  MenuIcon,
  MobileIcon,
  ShieldCheckMarkIcon,
  StarIcon,
} from "@shopify/polaris-icons";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";
import type { loader as appLoader } from "./app";
```

(remove the old `import { Select, Modal, BlockStack, Text as PolarisText } from "@shopify/polaris";`, the `polarisStyles`/`links` export — now inherited from `app/routes/app.tsx` — and the three `../components/ui/*` imports.)

```tsx
export default function Dashboard() {
  const {
    themeName,
    connectedThemeId,
    connectedThemeName,
    connectedThemeSelected,
    themes,
    integrationStatus,
    appEmbedEnabled,
    hasMenu,
    hasActiveMenu,
    themeEditorUrl,
  } = useLoaderData<typeof loader>();
  const sanitizedConnectedThemeId =
    connectedThemeSelected && connectedThemeId && themes.some((theme) => theme.id === connectedThemeId)
      ? connectedThemeId
      : "";
  const themeFetcher = useFetcher<typeof action>();
  const revalidator = useRevalidator();
  const navigate = useNavigate();
  const location = useLocation();
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [themeConfigOpen, setThemeConfigOpen] = useState(false);
  const [selectedThemeId, setSelectedThemeId] = useState(sanitizedConnectedThemeId);
  const [activeThemeId, setActiveThemeId] = useState(sanitizedConnectedThemeId);
  const [activeThemeName, setActiveThemeName] = useState(
    sanitizedConnectedThemeId ? connectedThemeName ?? themeName : "Not selected"
  );
  const revalidateCooldownRef = useRef(0);
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const appData = useRouteLoaderData<typeof appLoader>("routes/app");
  const currentPlan = appData?.planTier ?? "free";
  const isPlusPlan = currentPlan === "plus";

  const withSearch = (path: string, extra?: Record<string, string>) => {
    const search = new URLSearchParams(location.search);
    if (extra) {
      Object.entries(extra).forEach(([key, value]) => {
        search.set(key, value);
      });
    }
    return {
      pathname: path,
      search: search.toString() ? `?${search.toString()}` : "",
    };
  };

  const features: Array<{
    icon: any;
    title: string;
    description: string;
    action: () => void;
    badge?: string;
  }> = [
      {
        icon: MenuIcon,
        title: "Create Mega Menu",
        description: "Build powerful navigation menus with unlimited depth and customization",
        action: () => navigate(withSearch("/app/mega-menus")),
      },
      {
        icon: MobileIcon,
        title: "Mobile Menu",
        description: "Responsive mobile-first menus optimized for all devices",
        action: () => navigate(withSearch("/app/mega-menus")),
      },
      {
        icon: ImportIcon,
        title: "Import Menu",
        description: "Import existing menus from your Shopify store instantly",
        action: () => {
          if (!isPlusPlan) {
            setUpgradeModalOpen(true);
            return;
          }
          navigate(withSearch("/app/mega-menus", { import: "shopify" }));
        },
        badge: "Plus",
      },
    ];

  const setupSteps = [
    { title: "Select theme", completed: Boolean(activeThemeId) },
    { title: "Enable app embed", completed: appEmbedEnabled },
    { title: "Create your first menu", completed: hasMenu },
    { title: "Publish and go live", completed: hasActiveMenu },
  ];

  const themeOptions = themes.map((theme) => ({
    label: theme.name,
    value: theme.id,
  }));
  const activeTheme = themes.find((theme) => theme.id === activeThemeId) ?? null;
  const selectedTheme = themes.find((theme) => theme.id === selectedThemeId) ?? themes[0] ?? null;
  const resolvedThemeEditorUrl = activeTheme?.editorUrl ?? themeEditorUrl;
  const isThemeSaving = themeFetcher.state !== "idle";
  const hasConnectedTheme = Boolean(activeThemeId);

  const handleSaveConnectedTheme = () => {
    if (!selectedTheme) return;
    const payload = new FormData();
    payload.set("intent", "update-connected-theme");
    payload.set("themeId", selectedTheme.id);
    payload.set("themeName", selectedTheme.name);
    themeFetcher.submit(payload, { method: "post" });
    setActiveThemeId(selectedTheme.id);
    setActiveThemeName(selectedTheme.name);
    setThemeConfigOpen(false);
  };

  useEffect(() => {
    if (typeof document === "undefined" || typeof window === "undefined") return;

    let intervalId: number | null = null;
    const stop = () => {
      if (intervalId === null) return;
      window.clearInterval(intervalId);
      intervalId = null;
    };
    const tick = () => {
      const now = Date.now();
      if (now - revalidateCooldownRef.current < 5000) return;
      if (revalidator.state !== "loading") {
        revalidateCooldownRef.current = now;
        revalidator.revalidate();
      }
    };
    const start = () => {
      if (intervalId !== null) return;
      if (integrationStatus === "active") return;
      intervalId = window.setInterval(() => {
        if (document.visibilityState === "visible") {
          tick();
        }
      }, 15000);
    };
    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        tick();
        start();
      } else {
        stop();
      }
    };

    handleVisibility();
    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("focus", handleVisibility);
    return () => {
      stop();
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("focus", handleVisibility);
    };
  }, [integrationStatus, revalidator]);

  const setupButtonLabel = hasMenu ? "Continue Setup" : "Start Setup";
  const handleSetupClick = () => {
    if (!hasMenu) {
      navigate(withSearch("/app/mega-menus"));
      return;
    }
    if (!appEmbedEnabled) {
      if (typeof window !== "undefined") {
        window.open(resolvedThemeEditorUrl, "_blank", "noopener,noreferrer");
      }
      return;
    }
    if (!hasActiveMenu) {
      navigate(withSearch("/app/mega-menus"));
      return;
    }
    navigate(withSearch("/app/mega-menus"));
  };

  const faqs = [
    {
      q: "How do I install MenuCraft?",
      a: 'Simply click "Get Started" and follow the installation wizard. MenuCraft integrates seamlessly with your Shopify theme.',
    },
    {
      q: "Can I try MenuCraft for free?",
      a: "Yes! MenuCraft offers a free plan with essential features. Upgrade anytime to unlock Plus features.",
    },
    {
      q: "What themes are supported?",
      a: "MenuCraft works with all Shopify 2.0 themes and most legacy themes. Check our compatibility guide for details.",
    },
    {
      q: "Do I need coding skills?",
      a: "Not at all! MenuCraft features an intuitive visual builder that anyone can use.",
    },
  ];

  return (
    <Page title="Welcome to MenuCraft" subtitle="Create stunning mega menus that boost navigation and increase conversions for your Shopify store">
      <BlockStack gap="500">
        <Layout>
          {features.map((feature, index) => (
            <Layout.Section key={index} variant="oneThird">
              <Card>
                <div style={{ cursor: "pointer" }} onClick={feature.action}>
                  <BlockStack gap="300" inlineAlign="center">
                    <Box background="bg-fill-info-secondary" borderRadius="full" padding="400">
                      <Icon source={feature.icon} tone="info" />
                    </Box>
                    <BlockStack gap="150" inlineAlign="center">
                      <InlineStack gap="150" blockAlign="center">
                        <Text as="h3" variant="headingMd">{feature.title}</Text>
                        {feature.badge && <Badge tone="info">{feature.badge}</Badge>}
                      </InlineStack>
                      <Text as="p" variant="bodySm" tone="subdued" alignment="center">
                        {feature.description}
                      </Text>
                    </BlockStack>
                  </BlockStack>
                </div>
              </Card>
            </Layout.Section>
          ))}
        </Layout>

        <Layout>
          <Layout.Section variant="oneHalf">
            <Card>
              <BlockStack gap="400">
                <Text as="h2" variant="headingMd">App Status</Text>
                <Box background="bg-surface-secondary" padding="300" borderRadius="200">
                  <InlineStack align="space-between" blockAlign="center">
                    <InlineStack gap="300" blockAlign="center">
                      <Icon
                        source={integrationStatus === "active" ? CheckCircleIcon : AlertCircleIcon}
                        tone={integrationStatus === "active" ? "success" : "critical"}
                      />
                      <BlockStack gap="050">
                        <InlineStack gap="150" blockAlign="center">
                          <Text as="p" variant="bodySm">Installation Status</Text>
                          <Badge tone={integrationStatus === "active" ? "success" : "critical"}>
                            {integrationStatus === "active" ? "Active" : "Deactive"}
                          </Badge>
                        </InlineStack>
                        <Text as="p" variant="bodySm" tone="subdued">Theme integration</Text>
                      </BlockStack>
                    </InlineStack>
                    <Button
                      onClick={() => {
                        if (typeof window !== "undefined") {
                          window.open(resolvedThemeEditorUrl, "_blank", "noopener,noreferrer");
                        }
                      }}
                    >
                      Configure
                    </Button>
                  </InlineStack>
                </Box>
                <Box background="bg-surface-secondary" padding="300" borderRadius="200">
                  <InlineStack align="space-between" blockAlign="center">
                    <InlineStack gap="300" blockAlign="center">
                      <Icon
                        source={hasConnectedTheme ? CheckCircleIcon : AlertCircleIcon}
                        tone={hasConnectedTheme ? "success" : "critical"}
                      />
                      <BlockStack gap="050">
                        <InlineStack gap="150" blockAlign="center">
                          <Text as="p" variant="bodySm">Connected Theme</Text>
                          <Badge tone={hasConnectedTheme ? "success" : "critical"}>
                            {hasConnectedTheme ? "Active" : "Deactive"}
                          </Badge>
                        </InlineStack>
                        <Text as="p" variant="bodySm" tone="subdued">
                          {hasConnectedTheme ? activeThemeName : "Not selected"}
                        </Text>
                      </BlockStack>
                    </InlineStack>
                    <Button
                      onClick={() => {
                        setSelectedThemeId(activeThemeId || selectedTheme?.id || "");
                        setThemeConfigOpen((prev) => !prev);
                      }}
                    >
                      Configure
                    </Button>
                  </InlineStack>
                </Box>
                <Collapsible open={themeConfigOpen} id="theme-config-collapsible">
                  <Card>
                    <BlockStack gap="300">
                      <Select
                        label="Select theme"
                        options={themeOptions}
                        value={selectedThemeId}
                        onChange={setSelectedThemeId}
                        disabled={themeOptions.length === 0}
                      />
                      <InlineStack align="end" gap="200">
                        <Button
                          onClick={() => {
                            setSelectedThemeId(activeThemeId);
                            setThemeConfigOpen(false);
                          }}
                        >
                          Cancel
                        </Button>
                        <Button
                          variant="primary"
                          onClick={handleSaveConnectedTheme}
                          disabled={!selectedTheme || isThemeSaving}
                        >
                          Save
                        </Button>
                      </InlineStack>
                    </BlockStack>
                  </Card>
                </Collapsible>
              </BlockStack>
            </Card>
          </Layout.Section>

          <Layout.Section variant="oneHalf">
            <Card>
              <BlockStack gap="400">
                <Text as="h2" variant="headingMd">Setup Checklist</Text>
                <BlockStack gap="300">
                  {setupSteps.map((step, index) => (
                    <InlineStack key={index} gap="300" blockAlign="center">
                      <Icon
                        source={CheckCircleIcon}
                        tone={step.completed ? "success" : "subdued"}
                      />
                      <Text as="span" variant="bodySm" tone={step.completed ? "subdued" : undefined}>
                        {step.title}
                      </Text>
                    </InlineStack>
                  ))}
                </BlockStack>
                <Button onClick={handleSetupClick} fullWidth>
                  {setupButtonLabel}
                </Button>
              </BlockStack>
            </Card>
          </Layout.Section>
        </Layout>

        <InlineGrid columns={{ xs: 1, md: 2 }} gap="400">
          <Card>
            <InlineStack gap="300" blockAlign="center">
              <Icon source={ShieldCheckMarkIcon} tone="success" />
              <Text as="p" variant="bodySm">30-day money back guarantee</Text>
            </InlineStack>
          </Card>
          <Card>
            <InlineStack gap="300" blockAlign="center">
              <Icon source={StarIcon} tone="info" />
              <Text as="p" variant="bodySm">Built for Shopify by Shopify Experts</Text>
            </InlineStack>
          </Card>
        </InlineGrid>

        <Card>
          <BlockStack gap="300">
            <Text as="h2" variant="headingMd">Frequently Asked Questions</Text>
            <BlockStack gap="0">
              {faqs.map((faq, index) => (
                <Box key={index} paddingBlock="300" borderBlockEndWidth={index < faqs.length - 1 ? "025" : undefined} borderColor="border">
                  <div style={{ cursor: "pointer" }} onClick={() => setOpenFaq(openFaq === index ? null : index)}>
                    <InlineStack align="space-between" blockAlign="center">
                      <Text as="span" variant="bodySm">{faq.q}</Text>
                      <Icon source={openFaq === index ? ChevronUpIcon : ChevronDownIcon} tone="subdued" />
                    </InlineStack>
                  </div>
                  <Collapsible open={openFaq === index} id={`faq-${index}`}>
                    <Box paddingBlockStart="200">
                      <Text as="p" variant="bodySm" tone="subdued">{faq.a}</Text>
                    </Box>
                  </Collapsible>
                </Box>
              ))}
            </BlockStack>
          </BlockStack>
        </Card>
      </BlockStack>

      <Modal
        open={upgradeModalOpen}
        onClose={() => setUpgradeModalOpen(false)}
        title="Upgrade to Plus"
        primaryAction={{
          content: "Upgrade Now",
          onAction: () => navigate("/app/pricing"),
        }}
        secondaryActions={[
          {
            content: "Cancel",
            onAction: () => setUpgradeModalOpen(false),
          },
        ]}
      >
        <Modal.Section>
          <BlockStack gap="400">
            <Text as="p" variant="bodyMd">
              Import and Export features are available on the <strong>Plus plan</strong>.
            </Text>
            <Text as="p" variant="bodyMd">Upgrade now to unlock:</Text>
            <List type="bullet">
              <List.Item>Import menus from Shopify navigation</List.Item>
              <List.Item>Import menus from JSON files</List.Item>
              <List.Item>Export menus as JSON files</List.Item>
              <List.Item>Unlimited menus</List.Item>
            </List>
          </BlockStack>
        </Modal.Section>
      </Modal>
    </Page>
  );
}
```

- [ ] **Step 2: Type-check and lint**

Run: `npx tsc --noEmit && npm run lint`
Expected: no new errors from `app/routes/app._index.tsx`.

- [ ] **Step 3: Manual check**

`npm run dev`, open Dashboard in the embedded session. Confirm: 3 feature cards clickable, App Status/Connected Theme cards show correct badges, theme select+save flow still works, setup checklist reflects real state, FAQ accordion opens/closes, upgrade modal opens from the Import Menu card on Free plan.

- [ ] **Step 4: Commit**

```bash
git add app/routes/app._index.tsx
git commit -m "feat(ui): rebuild Dashboard with Polaris components"
```

---

### Task 3: Mega Menus → Polaris (`app/routes/app.mega-menus.tsx`)

**Files:**
- Modify: `app/routes/app.mega-menus.tsx`

**Interfaces:**
- Consumes: `loader`/`action` unchanged verbatim (lines 1–343 of the current file, including the `crypto` import used by `import-shopify`).
- Produces: nothing consumed by later tasks.

- [ ] **Step 1: Replace imports**

Replace:
```tsx
import { Copy, Download, Edit, Eye, EyeOff, MoreVertical, Plus, Smartphone, Trash2, Upload } from "lucide-react";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";
import Badge from "../components/ui/Badge";
import CustomButton from "../components/ui/Button";
import Card from "../components/ui/Card";
import { ALL_BILLING_PLAN_NAMES, getPlanSelection } from "../config/billing";
import type { loader as appLoader } from "./app";
import { useRouteLoaderData } from "@remix-run/react";
import { Banner, BlockStack, Modal, Select, Text as PolarisText, TextField } from "@shopify/polaris";
import polarisStyles from "@shopify/polaris/build/esm/styles.css?url";

export const links = () => [
  { rel: "stylesheet", href: polarisStyles },
];
```
with:
```tsx
import { authenticate } from "../shopify.server";
import prisma from "../db.server";
import { ALL_BILLING_PLAN_NAMES, getPlanSelection } from "../config/billing";
import type { loader as appLoader } from "./app";
import { useRouteLoaderData } from "@remix-run/react";
import {
  Badge,
  Banner,
  BlockStack,
  Button,
  Card,
  EmptyState,
  IndexTable,
  InlineStack,
  Modal,
  Page,
  Select,
  Text,
  TextField,
  useIndexResourceState,
} from "@shopify/polaris";
import {
  DeleteIcon,
  DuplicateIcon,
  EditIcon,
  ExportIcon,
  ImportIcon,
  MenuVerticalIcon,
  MobileIcon,
  PlusIcon,
} from "@shopify/polaris-icons";
```

(the rest of the file's `import` block — `crypto`, React hooks, Remix hooks, `json`/action types — stays as-is; only the lines above are added/removed.)

- [ ] **Step 2: Replace the component's return statement**

Keep everything in `export default function MegaMenusList()` from the top of the function down through `handleFileChange` completely unchanged (all state, fetchers, effects, and handlers). Only replace the `return ( ... )` block (previously starting at `return (\n    <div className="min-h-screen p-8">` and ending at the closing `);` before the function's closing brace) with:

```tsx
  const resourceName = { singular: "menu", plural: "menus" };
  const { selectedResources, allResourcesSelected, handleSelectionChange } =
    useIndexResourceState(menus as unknown as Array<{ [key: string]: unknown; id: string }>);

  const rowMarkup = menus.map((menu, index) => (
    <IndexTable.Row
      id={String(menu.id)}
      key={menu.id}
      selected={selectedResources.includes(String(menu.id))}
      position={index}
    >
      <IndexTable.Cell>
        <Button
          variant="plain"
          onClick={() =>
            navigate(
              withSearch("/app/menu-builder", {
                id: String(menu.id),
                returnTo: location.pathname,
              })
            )
          }
        >
          {menu.name}
        </Button>
      </IndexTable.Cell>
      <IndexTable.Cell>
        <Badge tone={menu.status === "active" ? "success" : undefined}>
          {menu.status === "active" ? "Active" : "Draft"}
        </Badge>
      </IndexTable.Cell>
      <IndexTable.Cell>{menu.itemCount}</IndexTable.Cell>
      <IndexTable.Cell>{menu.views.toLocaleString()}</IndexTable.Cell>
      <IndexTable.Cell>
        <InlineStack gap="200" align="end" blockAlign="center">
          <Button
            size="slim"
            onClick={() =>
              navigate(
                withSearch("/app/menu-builder", {
                  id: String(menu.id),
                  returnTo: location.pathname,
                })
              )
            }
          >
            Customize
          </Button>
          <Button
            icon={DuplicateIcon}
            accessibilityLabel="Duplicate menu"
            disabled={limitReached}
            onClick={() => {
              if (limitReached) return;
              const actionPath = withSearch("/app/mega-menus");
              duplicateFetcher.submit(
                { intent: "duplicate", menuId: String(menu.id) },
                { method: "post", action: `${actionPath.pathname}${actionPath.search}` }
              );
            }}
          />
          <div className="relative">
            <Button
              icon={MenuVerticalIcon}
              accessibilityLabel="More actions"
              ref={(el: HTMLButtonElement | null) => {
                buttonRefs.current[menu.id] = el;
              }}
              onClick={() => handleOpenDropdown(menu.id)}
            />
            {openMenuId === menu.id && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setOpenMenuId(null)} />
                <div
                  className="fixed w-48 bg-white rounded-lg border border-gray-200 shadow-lg z-50"
                  style={{ top: `${dropdownPosition.top}px`, right: `${dropdownPosition.right}px` }}
                >
                  <div className="py-1">
                    <button
                      onClick={() => {
                        setRenameMenuId(menu.id);
                        setRenameNewName(menu.name);
                        setRenameModalOpen(true);
                        setOpenMenuId(null);
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                    >
                      Rename Menu
                    </button>
                    <button
                      onClick={() => {
                        handleExport(menu);
                        setOpenMenuId(null);
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                    >
                      Export Menu
                    </button>
                    <div className="border-t border-gray-200 my-1" />
                    <button
                      onClick={() => {
                        setMenusState((prev) => prev.filter((item) => item.id !== menu.id));
                        const actionPath = withSearch("/app/mega-menus");
                        deleteFetcher.submit(
                          { intent: "delete", menuId: String(menu.id) },
                          { method: "post", action: `${actionPath.pathname}${actionPath.search}` }
                        );
                        setOpenMenuId(null);
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                    >
                      Delete Menu
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </InlineStack>
      </IndexTable.Cell>
    </IndexTable.Row>
  ));

  return (
    <Page
      title="Mega Menus"
      subtitle="Manage all your navigation menus"
      primaryAction={{
        content: "Create New Menu",
        icon: PlusIcon,
        disabled: limitReached,
        onAction: () =>
          navigate(withSearch("/app/menu-builder", { id: "", returnTo: location.pathname })),
      }}
      secondaryActions={[
        {
          content: "Import from File",
          icon: ImportIcon,
          loading: importFetcher.state === "submitting",
          onAction: handleImportClick,
        },
        {
          content: "Import from Shopify",
          icon: MobileIcon,
          onAction: handleShopifyImportClick,
        },
      ]}
    >
      <input
        type="file"
        ref={fileInputRef}
        style={{ display: "none" }}
        accept=".json"
        onChange={handleFileChange}
      />
      <BlockStack gap="400">
        {limitReached && (
          <Banner
            title="Menu limit reached"
            action={{ content: "Upgrade to Pro", onAction: () => navigate("/app/pricing") }}
            tone="info"
          >
            <Text as="p" variant="bodyMd">
              You are currently on the <strong>Free plan</strong>, which is limited to <strong>1 mega menu</strong>.
              Upgrade to the <strong>Pro plan</strong> to create unlimited menus and unlock advanced features.
            </Text>
          </Banner>
        )}

        <Card padding="0">
          {menus.length === 0 ? (
            <EmptyState
              heading="No menus yet"
              action={{
                content: "Create New Menu",
                onAction: () =>
                  navigate(withSearch("/app/menu-builder", { id: "", returnTo: location.pathname })),
              }}
              image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
            >
              <p>Create your first mega menu to get started.</p>
            </EmptyState>
          ) : (
            <IndexTable
              resourceName={resourceName}
              itemCount={menus.length}
              selectedItemsCount={allResourcesSelected ? "All" : selectedResources.length}
              onSelectionChange={handleSelectionChange}
              headings={[
                { title: "Menu Name" },
                { title: "Status" },
                { title: "Items" },
                { title: "Views" },
                { title: "Actions" },
              ]}
            >
              {rowMarkup}
            </IndexTable>
          )}
        </Card>
      </BlockStack>

      <Modal
        open={shopifyImportOpen}
        onClose={() => setShopifyImportOpen(false)}
        title="Import from Shopify Navigation"
        primaryAction={{
          content: "Import Menu",
          onAction: () => {
            if (!selectedShopifyMenuId) return;
            const actionPath = withSearch("/app/mega-menus");
            shopifyImportFetcher.submit(
              { intent: "import-shopify", shopifyMenuId: selectedShopifyMenuId },
              { method: "post", action: `${actionPath.pathname}${actionPath.search}` }
            );
          },
          loading: shopifyImportFetcher.state === "submitting",
          disabled: !selectedShopifyMenuId,
        }}
        secondaryActions={[{ content: "Cancel", onAction: () => setShopifyImportOpen(false) }]}
      >
        <Modal.Section>
          <BlockStack gap="400">
            <Text as="p" variant="bodyMd">
              Select an existing Shopify navigation menu to import. We will convert it into a Mega Menu structure for you.
            </Text>
            <Select
              label="Select Shopify Menu"
              options={[
                { label: "Choose a menu...", value: "" },
                ...(useLoaderData<typeof loader>().shopifyMenus || []).map((m: any) => ({
                  label: m.title,
                  value: m.id,
                })),
              ]}
              value={selectedShopifyMenuId}
              onChange={setSelectedShopifyMenuId}
            />
          </BlockStack>
        </Modal.Section>
      </Modal>

      <Modal
        open={upgradeModalOpen}
        onClose={() => setUpgradeModalOpen(false)}
        title="Upgrade to Plus"
        primaryAction={{ content: "Upgrade Now", onAction: () => navigate("/app/pricing") }}
        secondaryActions={[{ content: "Cancel", onAction: () => setUpgradeModalOpen(false) }]}
      >
        <Modal.Section>
          <BlockStack gap="400">
            <Text as="p" variant="bodyMd">
              Import and Export features are available on the <strong>Plus plan</strong>.
            </Text>
            <Text as="p" variant="bodyMd">Upgrade now to unlock:</Text>
            <ul style={{ marginLeft: "20px", listStyle: "disc" }}>
              <li>Import menus from Shopify navigation</li>
              <li>Import menus from JSON files</li>
              <li>Export menus as JSON files</li>
              <li>Unlimited menus</li>
            </ul>
          </BlockStack>
        </Modal.Section>
      </Modal>

      <Modal
        open={renameModalOpen}
        onClose={() => setRenameModalOpen(false)}
        title="Rename Menu"
        primaryAction={{
          content: "Save",
          loading: renameFetcher.state === "submitting",
          onAction: () => {
            renameFetcher.submit(
              { intent: "rename", menuId: String(renameMenuId), newName: renameNewName },
              { method: "post" }
            );
          },
        }}
        secondaryActions={[{ content: "Cancel", onAction: () => setRenameModalOpen(false) }]}
      >
        <Modal.Section>
          <TextField
            label="New Name"
            value={renameNewName}
            onChange={setRenameNewName}
            autoComplete="off"
            placeholder="Enter menu name"
          />
        </Modal.Section>
      </Modal>
    </Page>
  );
}
```

Note: the row-actions dropdown (Rename/Export/Delete) keeps its existing custom-positioned `<div>` popover — Polaris `Popover`+`ActionList` would be the fully-idiomatic replacement, but it depends on `buttonRefs`/`dropdownPosition` measured via `getBoundingClientRect`, which is unrelated business logic already working; leave it as raw HTML for this task (lower-risk, same visual outcome) unless a follow-up polish task tackles it.

- [ ] **Step 2: Type-check and lint**

Run: `npx tsc --noEmit && npm run lint`
Expected: no new errors.

- [ ] **Step 3: Manual check**

`npm run dev`. Confirm: menu limit banner shows on Free plan, table lists menus with correct status/items/views, Customize navigates to builder, Duplicate/Delete/Rename/Export all still work, Import from File and Import from Shopify modals function, empty state shows when no menus exist (test by temporarily filtering, or trust logic is unchanged).

- [ ] **Step 4: Commit**

```bash
git add app/routes/app.mega-menus.tsx
git commit -m "feat(ui): rebuild Mega Menus list with Polaris IndexTable"
```

---

### Task 4: Analytics → Polaris (`app/routes/app.analytics.tsx`)

**Files:**
- Modify: `app/routes/app.analytics.tsx`

**Interfaces:**
- Consumes: `loader` unchanged verbatim (lines 1–336).
- Produces: nothing consumed by later tasks.

- [ ] **Step 1: Replace imports**

Replace:
```tsx
import {
  BarChart3,
  Calendar,
  Eye,
  MousePointer,
  TrendingUp,
  Star,
} from "lucide-react";
...
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
```
with:
```tsx
import {
  Badge,
  BlockStack,
  Box,
  Button,
  Card,
  DataTable,
  InlineGrid,
  InlineStack,
  Layout,
  Page,
  Select,
  Text,
} from "@shopify/polaris";
import {
  CalendarIcon,
  ChartLineIcon,
  ChartVerticalIcon,
  CursorIcon,
} from "@shopify/polaris-icons";
```

(keep the `recharts` imports and `useMemo`/Remix imports as they are.)

- [ ] **Step 2: Replace the component's return statement**

Keep the entire function body down through `handleRangeChange` unchanged. Replace the `return (...)` with:

```tsx
  return (
    <Page title="Analytics" subtitle="Track how MenuCraft impacts navigation engagement">
      <BlockStack gap="400">
        {isFreePlan && (
          <Card>
            <InlineStack align="space-between" blockAlign="center" gap="400" wrap>
              <InlineStack gap="300" blockAlign="center">
                <CalendarIconWrapper />
                <Text as="p" variant="bodyMd">
                  You are on the <strong>Free plan</strong>. Analytics history is limited to the last{" "}
                  <strong>7 days</strong>. Upgrade to Pro to see 30 and 90-day history.
                </Text>
              </InlineStack>
              <Button variant="primary" onClick={() => navigate("/app/pricing")}>
                Upgrade to Pro
              </Button>
            </InlineStack>
          </Card>
        )}

        <InlineStack align="end">
          <Select
            label="Date range"
            labelHidden
            options={rangeOptions.map((option) => ({
              label: `${option.label}${isFreePlan && option.value !== "7d" ? " (Pro)" : ""}`,
              value: option.value,
              disabled: isFreePlan && option.value !== "7d",
            }))}
            value={currentRange.value}
            onChange={handleRangeChange}
          />
        </InlineStack>

        <InlineGrid columns={{ xs: 1, md: 3 }} gap="400">
          {statCards.map((stat, index) => (
            <Card key={index}>
              <InlineStack align="space-between" blockAlign="start">
                <BlockStack gap="100">
                  <Text as="p" variant="bodySm" tone="subdued">{stat.label}</Text>
                  <Text as="p" variant="heading2xl">{stat.value}</Text>
                  <Text as="p" variant="bodySm" tone="success">
                    {`${stat.change >= 0 ? "+" : ""}${Math.round(stat.change)}%`} from last period
                  </Text>
                </BlockStack>
              </InlineStack>
            </Card>
          ))}
        </InlineGrid>

        <Layout>
          <Layout.Section variant="oneHalf">
            <Card>
              <BlockStack gap="400">
                <Text as="h2" variant="headingMd">Menu Impressions &amp; Clicks</Text>
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={impressionsClicksData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="day" tick={{ fill: "#6b7280", fontSize: 12 }} axisLine={{ stroke: "#e5e7eb" }} />
                    <YAxis tick={{ fill: "#6b7280", fontSize: 12 }} axisLine={{ stroke: "#e5e7eb" }} />
                    <Tooltip contentStyle={{ backgroundColor: "white", border: "1px solid #e5e7eb", borderRadius: "8px", fontSize: "12px" }} />
                    <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "20px" }} iconType="line" />
                    <Line type="monotone" dataKey="impressions" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} name="Impressions" />
                    <Line type="monotone" dataKey="clicks" stroke="#10b981" strokeWidth={2} dot={{ r: 4 }} name="Clicks" />
                  </LineChart>
                </ResponsiveContainer>
              </BlockStack>
            </Card>
          </Layout.Section>

          <Layout.Section variant="oneHalf">
            <Card>
              <BlockStack gap="400">
                <InlineStack align="space-between" blockAlign="center">
                  <Text as="h2" variant="headingMd">Engagement Impact</Text>
                  <Badge tone="success">
                    {`${avgImpact >= 0 ? "+" : ""}${avgImpact.toFixed(1)}% avg`}
                  </Badge>
                </InlineStack>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={engagementData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="week" tick={{ fill: "#6b7280", fontSize: 12 }} axisLine={{ stroke: "#e5e7eb" }} />
                    <YAxis tick={{ fill: "#6b7280", fontSize: 12 }} axisLine={{ stroke: "#e5e7eb" }} domain={[0, 30]} />
                    <Tooltip contentStyle={{ backgroundColor: "white", border: "1px solid #e5e7eb", borderRadius: "8px", fontSize: "12px" }} formatter={(value: number) => `${value}%`} />
                    <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "20px" }} />
                    <Bar dataKey="withMenuCraft" fill="#6366f1" radius={[6, 6, 0, 0]} name="With MenuCraft" />
                    <Bar dataKey="withoutMenuCraft" fill="#d1d5db" radius={[6, 6, 0, 0]} name="Without MenuCraft" />
                  </BarChart>
                </ResponsiveContainer>
              </BlockStack>
            </Card>
          </Layout.Section>
        </Layout>

        <Layout>
          <Layout.Section variant="oneHalf">
            <Card padding="0">
              <Box padding="400" paddingBlockEnd="0">
                <Text as="h2" variant="headingMd">Top Performing Menus</Text>
              </Box>
              <DataTable
                columnContentTypes={["text", "numeric", "text"]}
                headings={["Menu Name", "Clicks", "CTR"]}
                rows={topMenus.map((menu) => [menu.name, menu.clicks.toLocaleString(), menu.ctr])}
              />
            </Card>
          </Layout.Section>

          <Layout.Section variant="oneHalf">
            <Card padding="0">
              <Box padding="400" paddingBlockEnd="0">
                <Text as="h2" variant="headingMd">Top Links</Text>
              </Box>
              <DataTable
                columnContentTypes={["text", "numeric", "text"]}
                headings={["Link Label", "Clicks", "Type"]}
                rows={topLinks.map((link) => [link.label, link.clicks.toLocaleString(), link.type])}
              />
            </Card>
          </Layout.Section>
        </Layout>

        {planTier === "plus" ? (
          <Layout>
            <Layout.Section variant="oneHalf">
              <Card>
                <BlockStack gap="400">
                  <InlineStack align="space-between" blockAlign="center">
                    <Text as="h2" variant="headingMd">Menu Heatmap</Text>
                    <Badge tone="info">Plus Feature</Badge>
                  </InlineStack>
                  <Box background="bg-surface-secondary" borderRadius="200" padding="800" minHeight="240px">
                    <Text as="p" variant="bodySm" tone="subdued" alignment="center">
                      Visualizing most clicked areas on your mega menus
                    </Text>
                  </Box>
                </BlockStack>
              </Card>
            </Layout.Section>

            <Layout.Section variant="oneHalf">
              <Card>
                <BlockStack gap="400">
                  <InlineStack align="space-between" blockAlign="center">
                    <Text as="h2" variant="headingMd">A/B Testing Experiments</Text>
                    <Badge tone="info">Plus Feature</Badge>
                  </InlineStack>
                  <Box background="bg-surface-info" borderRadius="200" padding="400">
                    <InlineStack align="space-between" blockAlign="center">
                      <BlockStack gap="050">
                        <Text as="p" variant="bodySm" tone="subdued">Current Test</Text>
                        <Text as="h3" variant="headingSm">Tabs vs Simple Grid Layout</Text>
                      </BlockStack>
                      <Badge tone="success">Running</Badge>
                    </InlineStack>
                  </Box>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart
                      data={[
                        { name: "Variant A (Tabs)", ctr: 18.5, fill: "#6366f1" },
                        { name: "Variant B (Grid)", ctr: 12.2, fill: "#94a3b8" },
                      ]}
                      layout="vertical"
                      margin={{ left: 20, right: 40 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                      <XAxis type="number" hide />
                      <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: "#475569" }} width={100} />
                      <Tooltip cursor={{ fill: "#f8fafc" }} contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }} />
                      <Bar dataKey="ctr" radius={[0, 4, 4, 0]} barSize={24} name="Click Rate (%)" />
                    </BarChart>
                  </ResponsiveContainer>
                  <InlineGrid columns={2} gap="400">
                    <Box background="bg-surface-secondary" borderRadius="200" padding="300">
                      <Text as="p" variant="bodySm" tone="subdued">Best Performer</Text>
                      <Text as="p" variant="bodyMd" fontWeight="semibold">Variant A</Text>
                      <Text as="p" variant="bodySm" tone="success">+51.6% higher CTR</Text>
                    </Box>
                    <Box background="bg-surface-secondary" borderRadius="200" padding="300">
                      <Text as="p" variant="bodySm" tone="subdued">Significance</Text>
                      <Text as="p" variant="bodyMd" fontWeight="semibold">98.2%</Text>
                      <Text as="p" variant="bodySm" tone="subdued">Mathematically certain</Text>
                    </Box>
                  </InlineGrid>
                </BlockStack>
              </Card>
            </Layout.Section>
          </Layout>
        ) : (
          <Card>
            <InlineStack align="space-between" blockAlign="center">
              <Text as="p" variant="bodyMd">
                Advanced analytics (heatmaps, A/B testing) are available on the Plus plan.
              </Text>
              <Button variant="primary" onClick={() => navigate(pricingHref)}>
                Upgrade to Plus
              </Button>
            </InlineStack>
          </Card>
        )}
      </BlockStack>
    </Page>
  );
}
```

Remove the placeholder `<CalendarIconWrapper />` and instead inline `<Icon source={CalendarIcon} tone="info" />` — add `Icon` to the Polaris import list from Step 1. (Correction folded into Step 1's import block: add `Icon` alongside `Badge, BlockStack, ...`.)

Delete the now-unused `ChartVerticalIcon`/`CursorIcon` imports if the final JSX above doesn't end up referencing them (this pass doesn't use per-stat icons, matching the simplified stat-card design — drop `stat.icon` rendering, which is intentional: Polaris stat cards in this design read cleaner without a redundant icon repeated 3 times).

- [ ] **Step 2: Type-check and lint**

Run: `npx tsc --noEmit && npm run lint`
Expected: no new errors. Fix any unused-import lint errors by removing icons not actually referenced (per the note above).

- [ ] **Step 3: Manual check**

`npm run dev`. Confirm: free-plan banner shows correctly, date range select respects plan restriction, both line/bar charts render with real data, top menus/links tables populate, Plus-only heatmap/A-B section shows only for `plus` plan, non-Plus upsell card shows otherwise.

- [ ] **Step 4: Commit**

```bash
git add app/routes/app.analytics.tsx
git commit -m "feat(ui): rebuild Analytics page with Polaris components"
```

---

### Task 5: Pricing → Polaris (`app/routes/app.pricing.tsx`)

**Files:**
- Modify: `app/routes/app.pricing.tsx`

**Interfaces:**
- Consumes: `loader`/`action` unchanged verbatim (lines 1–134).

- [ ] **Step 1: Replace imports**

Replace:
```tsx
import {
  ArrowRight,
  Check,
  CreditCard,
  Rocket,
  Shield,
  Star,
  Zap,
} from "lucide-react";
import { authenticate } from "../shopify.server";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
```
with:
```tsx
import { authenticate } from "../shopify.server";
import {
  Badge,
  BlockStack,
  Box,
  Button,
  Card,
  DataTable,
  Icon,
  InlineGrid,
  InlineStack,
  Page,
  Text,
} from "@shopify/polaris";
import {
  ArrowRightIcon,
  CheckIcon,
  ConfettiIcon,
  CreditCardIcon,
  GiftCardIcon,
  ShieldCheckMarkIcon,
  StarIcon,
} from "@shopify/polaris-icons";
```

- [ ] **Step 2: Update the `plans` array icons**

Change `icon: Zap` → `icon: GiftCardIcon`, `icon: Star` → `icon: StarIcon`, `icon: Rocket` → `icon: ConfettiIcon` (keep every other field — `iconColor`, `description`, `priceMonthly`, etc. — unchanged).

- [ ] **Step 3: Replace the return statement**

Keep everything above `return (` (the `plans` and `comparisonFeatures` arrays, `billingPeriod` state) unchanged except for the icon swap in Step 2. Replace the JSX with:

```tsx
  return (
    <Page title="Plans & Billing" subtitle="Choose the plan that fits your store's needs">
      <BlockStack gap="500">
        <InlineStack align="center">
          <Box background="bg-surface-success" borderRadius="full" paddingInline="400" paddingBlock="200">
            <InlineStack gap="200" blockAlign="center">
              <Icon source={ShieldCheckMarkIcon} tone="success" />
              <Text as="span" variant="bodySm" tone="success">
                14-day free trial - No credit card required - Cancel anytime
              </Text>
            </InlineStack>
          </Box>
        </InlineStack>

        <InlineStack align="center">
          <InlineStack gap="0">
            <Button pressed={billingPeriod === "monthly"} onClick={() => setBillingPeriod("monthly")}>
              Monthly
            </Button>
            <Button pressed={billingPeriod === "yearly"} onClick={() => setBillingPeriod("yearly")}>
              Yearly {billingPeriod === "yearly" && <Badge tone="success">Save 20%</Badge>}
            </Button>
          </InlineStack>
        </InlineStack>

        {actionData?.billingError && (
          <Banner tone="critical">{actionData.billingError}</Banner>
        )}

        <InlineGrid columns={{ xs: 1, md: 2, lg: 3 }} gap="400">
          {plans.map((plan) => {
            const price = billingPeriod === "monthly" ? plan.priceMonthly : plan.priceYearly;
            const planIsCurrent =
              currentPlan.id === plan.id &&
              (plan.id === "free" || currentPlan.period === billingPeriod);
            const isUpgradeDisabled = plan.id === "free" || planIsCurrent;
            const ctaLabel = planIsCurrent
              ? "Current Plan"
              : plan.id === "pro"
                ? "Upgrade to Pro"
                : "Upgrade to Plus";

            return (
              <Card key={plan.id}>
                <BlockStack gap="400">
                  {plan.popular && <Badge tone="info">Most Popular</Badge>}
                  <Icon source={plan.icon} tone="info" />
                  <BlockStack gap="100">
                    <Text as="h3" variant="headingLg">{plan.name}</Text>
                    <Text as="p" variant="bodySm" tone="subdued">{plan.description}</Text>
                  </BlockStack>
                  <BlockStack gap="050">
                    <InlineStack gap="100" blockAlign="baseline">
                      <Text as="span" variant="heading2xl">{price}</Text>
                      <Text as="span" variant="bodySm" tone="subdued">
                        / {billingPeriod === "monthly" ? "month" : "year"}
                      </Text>
                    </InlineStack>
                    {plan.trial && <Text as="p" variant="bodySm" tone="subdued">{plan.trial}</Text>}
                  </BlockStack>
                  <BlockStack gap="200">
                    {plan.features.map((feature, index) => (
                      <InlineStack key={index} gap="200" blockAlign="start" wrap={false}>
                        <Icon source={CheckIcon} tone="success" />
                        <Text as="span" variant="bodySm">{feature}</Text>
                      </InlineStack>
                    ))}
                  </BlockStack>
                  <form method="post">
                    <input type="hidden" name="plan" value={plan.id} />
                    <input type="hidden" name="billingPeriod" value={billingPeriod} />
                    <Button
                      variant={isUpgradeDisabled ? undefined : "primary"}
                      fullWidth
                      disabled={isUpgradeDisabled}
                      submit
                    >
                      {ctaLabel}
                    </Button>
                  </form>
                </BlockStack>
              </Card>
            );
          })}
        </InlineGrid>

        <Card padding="0">
          <Box padding="400" paddingBlockEnd="0">
            <Text as="h2" variant="headingMd" alignment="center">Feature Comparison</Text>
          </Box>
          <DataTable
            columnContentTypes={["text", "text", "text", "text"]}
            headings={["", "Free", "Pro", "Plus"]}
            rows={comparisonFeatures.map((feature) => [
              feature.name,
              typeof feature.free === "boolean" ? (feature.free ? "✓" : "—") : feature.free,
              typeof feature.pro === "boolean" ? (feature.pro ? "✓" : "—") : feature.pro,
              typeof feature.plus === "boolean" ? (feature.plus ? "✓" : "—") : feature.plus,
            ])}
          />
        </Card>

        <Card>
          <InlineStack gap="400" blockAlign="start" wrap={false}>
            <Icon source={CreditCardIcon} tone="info" />
            <BlockStack gap="400">
              <BlockStack gap="100">
                <Text as="h3" variant="headingMd">How plan selection works</Text>
                <Text as="p" variant="bodySm" tone="subdued">
                  Choose a plan to unlock features. After selecting a plan, you'll be redirected to your Dashboard.
                </Text>
              </BlockStack>
              <InlineStack gap="300" blockAlign="center">
                <Text as="span" variant="bodySm">1. Select plan</Text>
                <Icon source={ArrowRightIcon} tone="subdued" />
                <Text as="span" variant="bodySm">2. Confirm billing</Text>
                <Icon source={ArrowRightIcon} tone="subdued" />
                <Text as="span" variant="bodySm">3. Go to Dashboard</Text>
              </InlineStack>
            </BlockStack>
          </InlineStack>
        </Card>

        <InlineStack align="center">
          <BlockStack gap="200" inlineAlign="center">
            <Text as="p" variant="bodyMd" tone="subdued">Have questions about pricing?</Text>
            <Button>Contact Sales</Button>
          </BlockStack>
        </InlineStack>

        <InlineGrid columns={{ xs: 1, md: 2 }} gap="400">
          <Card>
            <InlineStack gap="300" blockAlign="center">
              <Icon source={ShieldCheckMarkIcon} tone="success" />
              <Text as="p" variant="bodySm">30-day money back guarantee</Text>
            </InlineStack>
          </Card>
          <Card>
            <InlineStack gap="300" blockAlign="center">
              <Icon source={StarIcon} tone="info" />
              <Text as="p" variant="bodySm">Built for Shopify by Shopify Experts</Text>
            </InlineStack>
          </Card>
        </InlineGrid>
      </BlockStack>
    </Page>
  );
}
```

Add `Banner` to the Polaris import list from Step 1 (needed for `actionData?.billingError`).

- [ ] **Step 2: Type-check and lint**

Run: `npx tsc --noEmit && npm run lint`
Expected: no new errors.

- [ ] **Step 3: Manual check**

`npm run dev`. Confirm: monthly/yearly toggle switches prices, current plan shows "Current Plan" disabled button, upgrade buttons submit the form and redirect to Shopify billing confirmation, feature comparison table renders all rows, billing error banner shows if `action` returns `billingError` (trigger by temporarily forcing an error, or trust unchanged action logic).

- [ ] **Step 4: Commit**

```bash
git add app/routes/app.pricing.tsx
git commit -m "feat(ui): rebuild Pricing page with Polaris components"
```

---

### Task 6: Settings → Polaris (`app/routes/app.settings.tsx`)

**Files:**
- Modify: `app/routes/app.settings.tsx`

**Interfaces:**
- Consumes: `loader`/`action` unchanged verbatim (lines 1–195).

- [ ] **Step 1: Replace imports**

Replace:
```tsx
import { CreditCard, Globe, Gauge, Store, User, Users } from "lucide-react";
import { authenticate } from "../shopify.server";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
```
with:
```tsx
import { authenticate } from "../shopify.server";
import {
  Badge,
  Banner,
  BlockStack,
  Box,
  Button,
  Card,
  Checkbox,
  Divider,
  FormLayout,
  Icon,
  InlineGrid,
  InlineStack,
  Layout,
  Page,
  ProgressBar,
  Select,
  Text,
} from "@shopify/polaris";
import {
  CreditCardIcon,
  GaugeIcon,
  GlobeIcon,
  PersonIcon,
  StoreIcon,
  TeamIcon,
} from "@shopify/polaris-icons";
```

- [ ] **Step 2: Replace the return statement**

Keep the function body's `withSearch`/`usagePercent` computations unchanged. Replace the JSX with:

```tsx
  return (
    <Page title="Account Settings" subtitle="Manage your account and preferences">
      <BlockStack gap="400">
        <Card>
          <BlockStack gap="400">
            <InlineStack align="space-between" blockAlign="start" wrap={false}>
              <InlineStack gap="400" blockAlign="start">
                <Icon source={PersonIcon} tone="info" />
                <BlockStack gap="150">
                  <Text as="h2" variant="headingMd">Current Plan</Text>
                  <InlineStack gap="300" blockAlign="center">
                    <Badge tone={selection.id === "pro" ? "info" : undefined}>
                      {selection.id === "free" ? "Free Plan" : `${selection.id} Plan`.replace(/^./, (c) => c.toUpperCase())}
                    </Badge>
                    <Text as="span" variant="bodySm" tone="subdued">
                      {selection.id === "free"
                        ? "$0/month"
                        : selection.period === "yearly"
                          ? "Billed yearly"
                          : "Billed monthly"}
                    </Text>
                  </InlineStack>
                </BlockStack>
              </InlineStack>
              <Button onClick={() => navigate(withSearch("/app/pricing"))}>Change Plan</Button>
            </InlineStack>
            <Divider />
            <BlockStack gap="200">
              <InlineStack align="space-between">
                <Text as="span" variant="bodySm" tone="subdued">Next billing date</Text>
                <Text as="span" variant="bodySm">
                  {currentPeriodEnd
                    ? new Date(currentPeriodEnd).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
                    : "—"}
                </Text>
              </InlineStack>
              <InlineStack align="space-between">
                <Text as="span" variant="bodySm" tone="subdued">Payment method</Text>
                <Text as="span" variant="bodySm">Managed in Shopify</Text>
              </InlineStack>
            </BlockStack>
          </BlockStack>
        </Card>

        <Card>
          <BlockStack gap="300">
            <InlineStack gap="200" blockAlign="center">
              <Icon source={CreditCardIcon} tone="info" />
              <Text as="h2" variant="headingMd">Billing</Text>
            </InlineStack>
            <BlockStack gap="200">
              <Button
                textAlign="left"
                fullWidth
                onClick={() => {
                  if (typeof window !== "undefined") {
                    window.open(links.billingUrl, "_blank", "noopener,noreferrer");
                  }
                }}
              >
                Update Payment Method
              </Button>
              <Button
                textAlign="left"
                fullWidth
                onClick={() => {
                  if (typeof window !== "undefined") {
                    window.open(links.invoicesUrl, "_blank", "noopener,noreferrer");
                  }
                }}
              >
                Download Invoices
              </Button>
            </BlockStack>
          </BlockStack>
        </Card>

        <InlineGrid columns={{ xs: 1, lg: 2 }} gap="400">
          <Card>
            <BlockStack gap="300">
              <InlineStack gap="200" blockAlign="center">
                <Icon source={GlobeIcon} tone="info" />
                <Text as="h2" variant="headingMd">Preferences</Text>
              </InlineStack>
              <Form method="post">
                <input type="hidden" name="intent" value="update-preferences" />
                <FormLayout>
                  <Select
                    label="Language"
                    name="language"
                    options={[{ label: "English", value: "en" }]}
                    defaultValue={preferences.language}
                  />
                  <Checkbox label="Email notifications" name="emailNotifications" defaultChecked={preferences.emailNotifications} />
                  <Checkbox label="Marketing emails" name="marketingEmails" defaultChecked={preferences.marketingEmails} />
                  <InlineStack align="space-between" blockAlign="center">
                    <Text as="span" variant="bodySm" tone="subdued">Changes apply to this store only.</Text>
                    <Button submit disabled={!preferencesAvailable}>Save Preferences</Button>
                  </InlineStack>
                  {actionData?.ok ? <Banner tone="success">Preferences saved.</Banner> : null}
                  {actionData?.error ? <Banner tone="critical">{actionData.error}</Banner> : null}
                </FormLayout>
              </Form>
            </BlockStack>
          </Card>

          <Card>
            <BlockStack gap="300">
              <InlineStack gap="200" blockAlign="center">
                <Icon source={StoreIcon} tone="info" />
                <Text as="h2" variant="headingMd">Store &amp; Theme</Text>
              </InlineStack>
              <BlockStack gap="200">
                <InlineStack align="space-between">
                  <Text as="span" variant="bodySm" tone="subdued">Store name</Text>
                  <Text as="span" variant="bodySm">{shopInfo.name}</Text>
                </InlineStack>
                <InlineStack align="space-between">
                  <Text as="span" variant="bodySm" tone="subdued">Domain</Text>
                  <Text as="span" variant="bodySm">{shopInfo.domain}</Text>
                </InlineStack>
                <InlineStack align="space-between">
                  <Text as="span" variant="bodySm" tone="subdued">Shopify plan</Text>
                  <Text as="span" variant="bodySm">{shopInfo.plan}</Text>
                </InlineStack>
                <InlineStack align="space-between">
                  <Text as="span" variant="bodySm" tone="subdued">Active theme</Text>
                  <Text as="span" variant="bodySm">{shopInfo.themeName}</Text>
                </InlineStack>
              </BlockStack>
            </BlockStack>
          </Card>

          <Card>
            <BlockStack gap="300">
              <InlineStack gap="200" blockAlign="center">
                <Icon source={GaugeIcon} tone="info" />
                <Text as="h2" variant="headingMd">Usage &amp; Limits</Text>
              </InlineStack>
              <InlineStack align="space-between">
                <Text as="span" variant="bodySm" tone="subdued">Menus created</Text>
                <Text as="span" variant="bodySm">
                  {menuLimit ? `${menuCount} / ${menuLimit}` : `${menuCount} / Unlimited`}
                </Text>
              </InlineStack>
              {menuLimit ? (
                <ProgressBar progress={usagePercent} size="small" tone="primary" />
              ) : (
                <Text as="p" variant="bodySm" tone="subdued">Unlimited menus on your current plan.</Text>
              )}
              <Text as="p" variant="bodySm" tone="subdued">
                Upgrade for unlimited menus and advanced features.
              </Text>
            </BlockStack>
          </Card>

          <Card>
            <BlockStack gap="300">
              <InlineStack align="space-between" blockAlign="center">
                <InlineStack gap="200" blockAlign="center">
                  <Icon source={TeamIcon} tone="info" />
                  <Text as="h2" variant="headingMd">Team &amp; Access</Text>
                </InlineStack>
                <Badge tone="info">Coming soon</Badge>
              </InlineStack>
              <Text as="p" variant="bodySm" tone="subdued">
                Manage collaborators and control who can edit menus.
              </Text>
              <Button
                textAlign="left"
                fullWidth
                disabled
                onClick={() => {
                  if (typeof window !== "undefined") {
                    window.open(links.staffUrl, "_blank", "noopener,noreferrer");
                  }
                }}
              >
                Manage staff in Shopify
              </Button>
            </BlockStack>
          </Card>
        </InlineGrid>
      </BlockStack>
    </Page>
  );
}
```

- [ ] **Step 2: Type-check and lint**

Run: `npx tsc --noEmit && npm run lint`
Expected: no new errors.

- [ ] **Step 3: Manual check**

`npm run dev`. Confirm: current plan card shows correct badge/billing cadence, Change Plan navigates to Pricing, billing links open Shopify admin billing/invoices, preferences form saves (banner confirms), usage progress bar reflects menu count vs limit, Team & Access card shows disabled state.

- [ ] **Step 4: Commit**

```bash
git add app/routes/app.settings.tsx
git commit -m "feat(ui): rebuild Settings page with Polaris FormLayout"
```

---

### Task 7: Support → Polaris (`app/routes/app.support.tsx`)

**Files:**
- Modify: `app/routes/app.support.tsx`

**Interfaces:**
- Consumes: `loader` unchanged verbatim.

- [ ] **Step 1: Replace the whole file**

```tsx
import { useState } from "react";
import type { LoaderFunctionArgs } from "@remix-run/node";
import { useLocation, useNavigate } from "@remix-run/react";
import {
  Badge,
  BlockStack,
  Box,
  Button,
  Card,
  Collapsible,
  Icon,
  InlineGrid,
  InlineStack,
  Page,
  Text,
} from "@shopify/polaris";
import { ChatIcon, ChevronDownIcon, ChevronUpIcon, EmailIcon, FileIcon } from "@shopify/polaris-icons";
import { authenticate } from "../shopify.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await authenticate.admin(request);
  return null;
};

export default function Support() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  const withSearch = (path: string) => ({ pathname: path, search: location.search });

  const faqs = [
    {
      q: "How do I create my first mega menu?",
      a: "Navigate to the Mega Menus page, click 'Create New Menu', and use the visual editor to add items and configure your layout.",
    },
    {
      q: "Can I use MenuCraft with my custom theme?",
      a: "Yes. MenuCraft works with all Shopify 2.0 themes and most legacy themes. Check the Install & Theme Status page for compatibility.",
    },
    {
      q: "How do I upgrade to Pro?",
      a: "Go to Pricing & Plans and select your desired plan. You can upgrade anytime with a few clicks.",
    },
    {
      q: "Is there a limit on menu items?",
      a: "Free plan allows one menu. Pro and Plus plans include unlimited menus and more advanced styling options.",
    },
    {
      q: "Can I import my existing Shopify menu?",
      a: "Yes. Plus plan includes menu import functionality. Go to the Menu Builder and choose Import.",
    },
  ];

  return (
    <Page title="Support & Help" subtitle="Get help and find answers to common questions">
      <BlockStack gap="400">
        <InlineGrid columns={{ xs: 1, md: 3 }} gap="400">
          <Card>
            <BlockStack gap="300" inlineAlign="center">
              <Icon source={FileIcon} tone="info" />
              <Text as="h3" variant="headingSm">Documentation</Text>
              <Text as="p" variant="bodySm" tone="subdued" alignment="center">Detailed guides and tutorials</Text>
              <Button fullWidth onClick={() => navigate(withSearch("/app/documentation"))}>View Docs</Button>
            </BlockStack>
          </Card>

          <Card>
            <BlockStack gap="300" inlineAlign="center">
              <Icon source={ChatIcon} tone="success" />
              <Text as="h3" variant="headingSm">Live Chat</Text>
              <Text as="p" variant="bodySm" tone="subdued" alignment="center">Chat with us in real-time</Text>
              <Button
                fullWidth
                onClick={() => {
                  if (typeof window !== "undefined" && window.$crisp) {
                    window.$crisp.push(["do", "chat:open"]);
                  }
                }}
              >
                Start Chat
              </Button>
            </BlockStack>
          </Card>

          <Card>
            <BlockStack gap="300" inlineAlign="center">
              <Icon source={EmailIcon} tone="info" />
              <InlineStack gap="150" blockAlign="center">
                <Text as="h3" variant="headingSm">Email Support</Text>
                <Badge tone="info">Soon</Badge>
              </InlineStack>
              <Text as="p" variant="bodySm" tone="subdued" alignment="center">We will add email support shortly</Text>
              <Button fullWidth disabled>Send Email</Button>
            </BlockStack>
          </Card>
        </InlineGrid>

        <Card>
          <BlockStack gap="300">
            <Text as="h2" variant="headingMd">Frequently Asked Questions</Text>
            <BlockStack gap="0">
              {faqs.map((faq, index) => (
                <Box key={faq.q} paddingBlock="300" borderBlockEndWidth={index < faqs.length - 1 ? "025" : undefined} borderColor="border">
                  <div style={{ cursor: "pointer" }} onClick={() => setOpenFaq(openFaq === index ? null : index)}>
                    <InlineStack align="space-between" blockAlign="center">
                      <Text as="span" variant="bodySm">{faq.q}</Text>
                      <Icon source={openFaq === index ? ChevronUpIcon : ChevronDownIcon} tone="subdued" />
                    </InlineStack>
                  </div>
                  <Collapsible open={openFaq === index} id={`support-faq-${index}`}>
                    <Box paddingBlockStart="200">
                      <Text as="p" variant="bodySm" tone="subdued">{faq.a}</Text>
                    </Box>
                  </Collapsible>
                </Box>
              ))}
            </BlockStack>
          </BlockStack>
        </Card>
      </BlockStack>
    </Page>
  );
}
```

- [ ] **Step 2: Type-check and lint**

Run: `npx tsc --noEmit && npm run lint`
Expected: no new errors.

- [ ] **Step 3: Manual check**

`npm run dev`. Confirm: View Docs navigates to Documentation, Start Chat opens Crisp widget (if configured), Email Support stays disabled, FAQ accordion opens/closes.

- [ ] **Step 4: Commit**

```bash
git add app/routes/app.support.tsx
git commit -m "feat(ui): rebuild Support page with Polaris components"
```

---

### Task 8: Documentation → Polaris (`app/routes/app.documentation.tsx`)

**Files:**
- Modify: `app/routes/app.documentation.tsx`

**Interfaces:**
- Consumes: `loader` unchanged verbatim.

- [ ] **Step 1: Replace imports and JSX, keep the `documentation` array exactly as-is**

Replace:
```tsx
import { ChevronDown, ChevronUp } from "lucide-react";
import { authenticate } from "../shopify.server";
import Card from "../components/ui/Card";
```
with:
```tsx
import { authenticate } from "../shopify.server";
import { BlockStack, Box, Card, Collapsible, Icon, InlineStack, Page, Text } from "@shopify/polaris";
import { ChevronDownIcon, ChevronUpIcon } from "@shopify/polaris-icons";
```

Replace the `return (...)` block with:

```tsx
  return (
    <Page title="Documentation" subtitle="Complete guides to set up, build, and manage MenuCraft">
      <Card>
        <BlockStack gap="300">
          <BlockStack gap="100">
            <Text as="h2" variant="headingMd">MenuCraft Guides</Text>
            <Text as="p" variant="bodySm" tone="subdued">
              Follow these steps to build, style, and manage your menus.
            </Text>
          </BlockStack>
          <BlockStack gap="0">
            {documentation.map((doc, index) => (
              <Box key={doc.title} paddingBlock="300" borderBlockEndWidth={index < documentation.length - 1 ? "025" : undefined} borderColor="border">
                <div style={{ cursor: "pointer" }} onClick={() => setOpenDoc(openDoc === index ? null : index)}>
                  <InlineStack align="space-between" blockAlign="center">
                    <BlockStack gap="050">
                      <Text as="p" variant="bodySm">{doc.title}</Text>
                      <Text as="p" variant="bodySm" tone="subdued">{doc.summary}</Text>
                    </BlockStack>
                    <Icon source={openDoc === index ? ChevronUpIcon : ChevronDownIcon} tone="subdued" />
                  </InlineStack>
                </div>
                <Collapsible open={openDoc === index} id={`doc-${index}`}>
                  <Box paddingBlockStart="200">
                    <ul style={{ marginLeft: "20px", listStyle: "disc" }}>
                      {doc.details.map((detail) => (
                        <li key={detail}>
                          <Text as="span" variant="bodySm" tone="subdued">{detail}</Text>
                        </li>
                      ))}
                    </ul>
                  </Box>
                </Collapsible>
              </Box>
            ))}
          </BlockStack>
        </BlockStack>
      </Card>
    </Page>
  );
}
```

- [ ] **Step 2: Type-check and lint**

Run: `npx tsc --noEmit && npm run lint`

- [ ] **Step 3: Manual check**

`npm run dev`. Confirm each of the 17 documentation sections expands/collapses correctly.

- [ ] **Step 4: Commit**

```bash
git add app/routes/app.documentation.tsx
git commit -m "feat(ui): rebuild Documentation page with Polaris components"
```

---

### Task 9: Install & Theme Status → Polaris (`app/routes/app.install-status.tsx`)

**Files:**
- Modify: `app/routes/app.install-status.tsx`

**Interfaces:**
- Consumes: `loader` (including `hasAppBlockInThemeAssets` helper) unchanged verbatim (lines 1–280).

- [ ] **Step 1: Replace imports**

Replace:
```tsx
import { AlertCircle, CheckCircle2, ExternalLink } from "lucide-react";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
```
with:
```tsx
import { authenticate } from "../shopify.server";
import prisma from "../db.server";
import { Badge, BlockStack, Card, Icon, InlineStack, Page, Text } from "@shopify/polaris";
import { AlertCircleIcon, CheckCircleIcon, ExternalIcon } from "@shopify/polaris-icons";
```

(Note: `Button` from Polaris supports `icon`/`url` props natively, but this page only ever renders one "Theme Settings" button — use Polaris `Button` too; add it to the import list: `Button` alongside `Badge, BlockStack, ...`.)

- [ ] **Step 2: Replace the return statement**

Keep `checks`/`displayThemeName`/`hasConnectedTheme` unchanged. Replace the JSX with:

```tsx
  return (
    <Page title="Install & Theme Status" subtitle="Ensure MenuCraft is properly integrated with your theme">
      <BlockStack gap="400">
        <Card>
          <BlockStack gap="300">
            {checks.map((check, index) => (
              <InlineStack key={index} align="space-between" blockAlign="center">
                <InlineStack gap="300" blockAlign="center">
                  <Icon
                    source={check.status === "success" ? CheckCircleIcon : AlertCircleIcon}
                    tone={check.status === "success" ? "success" : "caution"}
                  />
                  <BlockStack gap="050">
                    <Text as="p" variant="bodySm">{check.label}</Text>
                    <Text as="p" variant="bodySm" tone="subdued">{check.message}</Text>
                  </BlockStack>
                </InlineStack>
                <Badge tone={check.status === "success" ? "success" : "critical"}>
                  {check.status === "success" ? "Active" : "Deactive"}
                </Badge>
              </InlineStack>
            ))}
          </BlockStack>
        </Card>

        <Card>
          <BlockStack gap="300">
            <Text as="h2" variant="headingMd">Setup Instructions</Text>
            <Card>
              <BlockStack gap="200">
                <Text as="h3" variant="headingSm">Step 1: Enable App Embed</Text>
                <Text as="p" variant="bodySm" tone="subdued">
                  In theme settings, enable the MenuCraft app embed under Theme Extensions
                </Text>
                <InlineStack>
                  <Button
                    icon={ExternalIcon}
                    onClick={() => {
                      if (typeof window !== "undefined") {
                        window.open(themeEditorUrl, "_blank", "noopener,noreferrer");
                      }
                    }}
                  >
                    Theme Settings
                  </Button>
                </InlineStack>
              </BlockStack>
            </Card>
          </BlockStack>
        </Card>

        <Card>
          <BlockStack gap="300">
            <Text as="h2" variant="headingMd">Theme Information</Text>
            <InlineStack align="space-between">
              <Text as="span" variant="bodySm" tone="subdued">Current Theme:</Text>
              <Text as="span" variant="bodySm">{displayThemeName}</Text>
            </InlineStack>
            <InlineStack align="space-between">
              <Text as="span" variant="bodySm" tone="subdued">Version:</Text>
              <Text as="span" variant="bodySm">{hasConnectedTheme ? "10.0.0" : "-"}</Text>
            </InlineStack>
            <InlineStack align="space-between" blockAlign="center">
              <Text as="span" variant="bodySm" tone="subdued">OS 2.0 Compatible:</Text>
              <Badge tone={hasConnectedTheme ? "success" : "critical"}>
                {hasConnectedTheme ? "Yes" : "No"}
              </Badge>
            </InlineStack>
          </BlockStack>
        </Card>
      </BlockStack>
    </Page>
  );
}
```

- [ ] **Step 3: Type-check and lint**

Run: `npx tsc --noEmit && npm run lint`

- [ ] **Step 4: Manual check**

`npm run dev`. Confirm: both status rows (OS 2.0 theme, app embed) show correct badges, Theme Settings button opens the theme editor in a new tab, theme info card shows current data.

- [ ] **Step 5: Commit**

```bash
git add app/routes/app.install-status.tsx
git commit -m "feat(ui): rebuild Install & Theme Status page with Polaris components"
```

---

### Task 10: Menu Builder side panels — audit and polish (already mostly Polaris)

**Files:**
- Modify (as needed): `app/menu-builder/components/panels/SettingsPanel.tsx`, `MenuTree.tsx`, `TypographyPanel.tsx`, `MenuPanel.tsx`, and any picker under `app/menu-builder/components/pickers/*.tsx` found to have raw (non-Polaris) interactive controls.
- Do NOT touch: anything under `app/menu-builder/components/preview/**`.

**Context:** unlike the routes above, these panel files already import and use Polaris extensively (`Card`, `BlockStack`, `InlineStack`, `TextField`, `Select`, `RangeSlider`, `ColorPicker`, `Popover`, `ActionList`, `Icon` from `@shopify/polaris-icons` are already in use — confirmed by reading `CodePanel.tsx`, `ColorsPanel.tsx`, and the top of `SettingsPanel.tsx`). The remaining Tailwind `className` usages found in these files (e.g. `SettingsPanel.tsx` lines ~504–887) are custom drag-and-drop image/icon upload dropzones (`rounded-lg border-dashed border-gray-300 bg-gray-50 ...`) — Polaris has a purpose-built `DropZone` component for exactly this. This task converts those specific dropzone blocks; it does not rewrite files that are already Polaris-idiomatic (the small inline `<div style={{ flex: 1 }}>` layout wrappers seen in `SettingsPanel.tsx` around lines 81–144 are normal, acceptable Polaris-app layout code and should NOT be changed).

**Interfaces:**
- Consumes: existing `builderSettings`, `updateBuilderSetting`, and any upload-handler props already defined in each panel's prop types — do not rename them.

- [ ] **Step 1: Inventory remaining non-Polaris interactive elements**

Run: `grep -n "className=\"[^\"]*border-dashed\|<button\b" app/menu-builder/components/panels/*.tsx app/menu-builder/components/pickers/*.tsx`

Record every match's file and line number as the worklist for Steps 2–3.

- [ ] **Step 2: Convert each upload dropzone to Polaris `DropZone`**

For each dropzone block matching the pattern found in `SettingsPanel.tsx` (a bordered dashed box containing an upload icon, helper text, and a hidden `<input type="file">` triggered by a button), replace it with:

```tsx
import { DropZone, Thumbnail } from "@shopify/polaris";
// ...
<DropZone
  accept="image/*"
  type="image"
  onDrop={(_dropFiles, acceptedFiles) => {
    const file = acceptedFiles[0];
    if (file) {
      /* call the existing upload handler already defined in this panel with `file`, unchanged signature */
    }
  }}
>
  {currentImageUrl ? (
    <Thumbnail source={currentImageUrl} alt="Uploaded image" />
  ) : (
    <DropZone.FileUpload actionTitle="Add image" actionHint="or drop an image to upload" />
  )}
</DropZone>
```

Adapt `currentImageUrl` and the upload call to whatever variable/handler names already exist at each specific call site found in Step 1 — do not invent new prop names; wire `DropZone`'s `onDrop` into the exact existing upload function for that panel.

- [ ] **Step 3: Type-check and lint after each file converted**

Run: `npx tsc --noEmit && npm run lint`
Expected: no new errors.

- [ ] **Step 4: Manual check**

`npm run dev`, open Menu Builder, exercise every converted upload control (icon upload, submenu image upload, etc.) and confirm files still upload and preview correctly, and the central live-preview canvas is visually unaffected.

- [ ] **Step 5: Commit**

```bash
git add app/menu-builder/components/panels app/menu-builder/components/pickers
git commit -m "feat(ui): convert remaining Menu Builder upload widgets to Polaris DropZone"
```

---

### Task 11: Delete the old custom UI kit

**Files:**
- Delete: `app/components/ui/Button.tsx`, `app/components/ui/Card.tsx`, `app/components/ui/Badge.tsx`, `app/components/ui/utils.ts`

**Interfaces:**
- Consumes: nothing — this task only runs after Tasks 1–9 have removed every import of these files (Task 10 doesn't use them either).

- [ ] **Step 1: Confirm nothing imports the old UI kit anymore**

Run: `grep -rn "components/ui/Button\|components/ui/Card\|components/ui/Badge\|components/ui/utils" app --include="*.tsx" --include="*.ts"`
Expected: no output. If anything still matches, stop and finish converting that file first (it means an earlier task was missed).

- [ ] **Step 2: Delete the files**

```bash
git rm app/components/ui/Button.tsx app/components/ui/Card.tsx app/components/ui/Badge.tsx app/components/ui/utils.ts
```

- [ ] **Step 3: Type-check and lint the whole project**

Run: `npx tsc --noEmit && npm run lint`
Expected: no errors anywhere in the project.

- [ ] **Step 4: Full build**

Run: `npm run build`
Expected: build succeeds.

- [ ] **Step 5: Commit**

```bash
git commit -m "chore(ui): remove unused custom UI kit now that all pages use Polaris"
```

---

## Self-Review Notes

- **Spec coverage:** every section of `docs/superpowers/specs/2026-07-13-polaris-migration-design.md` maps to a task — nav (Task 1), Dashboard (2), Mega Menus (3), Analytics (4), Pricing (5), Settings (6), Support (7), Documentation (8), Install Status (9), Menu Builder panels (10, rescoped smaller after discovering they're already mostly Polaris), cleanup (11).
- **Rescoped item:** the design spec assumed the Menu Builder panels needed a full conversion; reading the actual files during planning showed they're already ~90% Polaris, so Task 10 was narrowed to a targeted `DropZone` conversion instead of a line-by-line rewrite — this is reflected in the task's "Context" note, not left as a silent scope gap.
- **Out of scope, unchanged:** `app/menu-builder/components/preview/**`, all loaders/actions, Prisma schema, billing config.
