import { useEffect, useRef, useState } from "react";
import { useFetcher, useLoaderData, useLocation, useNavigate, useRevalidator, useRouteLoaderData } from "@remix-run/react";
import { json, type ActionFunctionArgs, type LoaderFunctionArgs } from "@remix-run/node";
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

const appBlockCache = new Map<string, { value: boolean; expiresAt: number }>();

const hasAppBlockInThemeAssets = async (
  shop: string,
  themeId: string,
  restHeaders: Record<string, string>
) => {
  const defaultKeys = [
    "sections/header-group.json",
    "sections/header.json",
    "templates/index.json",
  ];
  const cacheKey = `${shop}:${themeId}:menu-block`;
  const now = Date.now();
  const cached = appBlockCache.get(cacheKey);
  if (cached && cached.expiresAt > now) {
    return cached.value;
  }
  const readAssetValue = (assetData: any) => {
    if (typeof assetData?.asset?.value === "string") {
      return assetData.asset.value;
    }
    if (typeof assetData?.asset?.attachment === "string") {
      try {
        return Buffer.from(assetData.asset.attachment, "base64").toString("utf8");
      } catch {
        return "";
      }
    }
    return "";
  };
  const appBlockPattern = /shopify:\/\/apps\/[^/]+\/blocks\/menu-block[^"\\]*/i;
  const scanKeys = async (keys: Iterable<string>) => {
    for (const key of keys) {
      const assetResponse = await fetch(
        `https://${shop}/admin/api/2025-01/themes/${themeId}/assets.json?asset[key]=${encodeURIComponent(
          key
        )}`,
        { headers: restHeaders }
      );
      if (!assetResponse.ok) {
        if (assetResponse.status !== 404 && assetResponse.status !== 429) {
          console.error("Theme asset request failed", assetResponse.status, assetResponse.statusText);
        }
        continue;
      }
      const assetData = await assetResponse.json().catch(() => ({}));
      const value = readAssetValue(assetData);
      if (typeof value === "string" && appBlockPattern.test(value)) {
        appBlockCache.set(cacheKey, { value: true, expiresAt: now + 30_000 });
        return true;
      }
    }
    return false;
  };
  try {
    const keysToScan = new Set<string>(defaultKeys);
    try {
      const listResponse = await fetch(
        `https://${shop}/admin/api/2025-01/themes/${themeId}/assets.json`,
        { headers: restHeaders }
      );
      if (listResponse.ok) {
        const listData = await listResponse.json().catch(() => ({}));
        const assetKeys: string[] = (listData?.assets ?? [])
          .map((asset: { key?: string }) => asset?.key)
          .filter((key: string | undefined): key is string => Boolean(key))
          .filter(
            (key: string) =>
              (key.startsWith("sections/") || key.startsWith("templates/")) && key.endsWith(".json")
          );
        assetKeys.forEach((key: string) => keysToScan.add(key));
      }
    } catch (error) {
      console.error("Failed to list theme assets", error);
    }

    if (await scanKeys(keysToScan)) {
      return true;
    }
  } catch (error) {
    console.error("Failed to scan theme assets for app block", error);
  }
  appBlockCache.set(cacheKey, { value: false, expiresAt: now + 10_000 });
  return false;
};

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin, session } = await authenticate.admin(request);
  const shop = session.shop;
  const appEmbedPattern = /shopify:\/\/apps\/[^/]+\/blocks\/app-embed[^"\\]*/i;
  const appBlockPattern = /shopify:\/\/apps\/[^/]+\/blocks\/menu-block[^"\\]*/i;
  const restHeaders = session.accessToken
    ? {
      "X-Shopify-Access-Token": session.accessToken,
      "Content-Type": "application/json",
    }
    : null;
  const shopPreferenceClient = (prisma as any).shopPreference;
  const preferences = shopPreferenceClient
    ? await shopPreferenceClient.findUnique({ where: { shop } })
    : null;

  let themeName = "Unknown";
  let connectedThemeId: string | null = preferences?.connectedThemeId ?? null;
  let connectedThemeName: string | null = preferences?.connectedThemeName ?? null;
  const connectedThemeSelected = preferences?.connectedThemeSelected ?? false;
  let themes: Array<{ id: string; name: string; role?: string | null; editorUrl?: string }> = [];
  let appEmbedEnabled = false;
  let appBlockAdded = false;
  const skipAppBlockScan = true;
  let hasMenu = false;
  let hasActiveMenu = false;

  try {
    const response = await admin.graphql(
      `query ThemeStatus {
        themes(first: 50) {
          nodes {
            id
            name
            role
          }
        }
      }`
    );
    const data = await response.json();
    themes = (data?.data?.themes?.nodes ?? []).filter(
      (theme: { name?: string; role?: string | null }) =>
        !/app ext\. host/i.test(theme.name ?? "") && theme.role !== "APP"
    );
    const mainTheme = themes.find((theme: { role?: string | null }) => theme.role === "MAIN") ?? themes[0];
    const preferredTheme = connectedThemeId
      ? themes.find((theme: { id: string }) => theme.id === connectedThemeId) ?? null
      : null;
    const scanTheme = preferredTheme ?? mainTheme ?? themes[0];
    if (scanTheme?.name) {
      themeName = scanTheme.name;
    }
    if (preferredTheme?.id) {
      connectedThemeName = preferredTheme.name ?? connectedThemeName;
    }

    if (scanTheme?.id) {
      const themeIdMatch = scanTheme.id.match(/\/(\d+)$/);
      const themeId = themeIdMatch?.[1];
      let rawSettings: unknown = "";
      if (themeId && restHeaders) {
        try {
          const restResponse = await fetch(
            `https://${shop}/admin/api/2025-01/themes/${themeId}/assets.json?asset[key]=config/settings_data.json`,
            {
              headers: restHeaders,
            }
          );
          const restData = await restResponse.json();
          if (restData?.asset?.value) {
            rawSettings = restData.asset.value;
          }
        } catch (error) {
          console.error("Failed to load settings_data.json via REST", error);
        }
      }
      try {
        const parsed = typeof rawSettings === "string" ? JSON.parse(rawSettings) : rawSettings;
        const currentSettings = parsed?.current ?? parsed;
        const presetName = parsed?.current?.preset ?? parsed?.preset;
        const presetSettings = presetName ? parsed?.presets?.[presetName] : null;
        const appEmbeds =
          currentSettings?.app_embeds ??
          parsed?.app_embeds ??
          presetSettings?.app_embeds ??
          {};
        const appEmbedEntries = Object.entries(appEmbeds ?? {});
        appEmbedEnabled = appEmbedEntries.some(([key, value]) => {
          const matches = key.toLowerCase().includes("menucraft-embed") || key.toLowerCase().includes("menucraft");
          const enabled =
            typeof value === "object" && value !== null
              ? (value as any)?.enabled === true || (value as any)?.disabled === false || ((value as any)?.enabled === undefined && (value as any)?.disabled === undefined)
              : Boolean(value);
          return matches && enabled;
        });

        const scanNode = (node: unknown) => {
          if (!node) return;
          if (Array.isArray(node)) {
            node.forEach(scanNode);
            return;
          }
          if (typeof node !== "object") return;
          const record = node as Record<string, any>;
          if (typeof record.type === "string") {
            const type = record.type.toLowerCase();
            if (appEmbedPattern.test(type)) {
              const enabled = record.disabled === undefined ? true : record.disabled === false;
              if (enabled) appEmbedEnabled = true;
            } else if (appBlockPattern.test(type)) {
              appBlockAdded = true;
            }
          }
          Object.values(record).forEach(scanNode);
        };

        scanNode(parsed);
      } catch {
        const fallback = typeof rawSettings === "string" ? rawSettings.toLowerCase() : "";
        appEmbedEnabled = appEmbedPattern.test(fallback) || fallback.includes("menucraft-embed");
      }

      if (!appEmbedEnabled) {
        const embedEnabledMatch =
          /shopify:\/\/apps\/[^/]+\/blocks\/app-embed[\s\S]*?"disabled"\s*:\s*false/i.test(
            typeof rawSettings === "string" ? rawSettings : ""
          ) ||
          /shopify:\/\/apps\/[^/]+\/blocks\/app-embed[\s\S]*?"enabled"\s*:\s*true/i.test(
            typeof rawSettings === "string" ? rawSettings : ""
          );
        appEmbedEnabled = embedEnabledMatch;
      }

      if (!skipAppBlockScan && !appBlockAdded) {
        const blockMatch = appBlockPattern.test(
          typeof rawSettings === "string" ? rawSettings : ""
        );
        appBlockAdded = blockMatch;
      }

      if (!skipAppBlockScan && !appBlockAdded && themeId && restHeaders) {
        appBlockAdded = await hasAppBlockInThemeAssets(shop, themeId, restHeaders);
      }
    }

    if (!skipAppBlockScan && !appBlockAdded && restHeaders) {
      for (const theme of themes) {
        if (!theme?.id) continue;
        const themeIdMatch = theme.id.match(/\/(\d+)$/);
        const themeId = themeIdMatch?.[1];
        if (!themeId) continue;
        const found = await hasAppBlockInThemeAssets(shop, themeId, restHeaders);
        if (found) {
          appBlockAdded = true;
          break;
        }
      }
    }
    const menuCount = await prisma.menu.count({ where: { shop } });
    hasMenu = menuCount > 0;
    const activeMenuCount = await prisma.menu.count({ where: { shop, status: "active" } });
    hasActiveMenu = activeMenuCount > 0;
  } catch (error) {
    console.error("Failed to load theme status", error);
  }

  themes = themes.map((theme) => {
    const themeIdMatch = theme.id.match(/\/(\d+)$/);
    const themeId = themeIdMatch?.[1];
    const editorUrl = themeId
      ? `https://${shop}/admin/themes/${themeId}/editor?context=apps`
      : `https://${shop}/admin/themes/current/editor?context=apps`;
    return { ...theme, editorUrl };
  });
  const connectedTheme = connectedThemeId
    ? themes.find((theme) => theme.id === connectedThemeId) ?? null
    : null;
  const themeEditorUrl =
    connectedTheme?.editorUrl ?? `https://${shop}/admin/themes/current/editor?context=apps`;

  const integrationStatus: "active" | "deactive" = appEmbedEnabled ? "active" : "deactive";

  return json({
    themeName,
    connectedThemeId,
    connectedThemeName,
    connectedThemeSelected,
    themes,
    integrationStatus,
    appEmbedEnabled,
    appBlockAdded,
    hasMenu,
    hasActiveMenu,
    themeEditorUrl,
  });
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const shop = session.shop;
  const formData = await request.formData();
  const intent = formData.get("intent");

  if (intent !== "update-connected-theme") {
    return json({ ok: false, error: "Unknown intent" }, { status: 400 });
  }

  const themeId = typeof formData.get("themeId") === "string" ? formData.get("themeId") : null;
  const themeName = typeof formData.get("themeName") === "string" ? formData.get("themeName") : null;
  if (!themeId || !themeName) {
    return json({ ok: false, error: "Missing theme data" }, { status: 400 });
  }

  const shopPreferenceClient = (prisma as any).shopPreference;

  if (!shopPreferenceClient) {
    return json({ ok: false, error: "Preferences unavailable" }, { status: 500 });
  }

  await shopPreferenceClient.upsert({
    where: { shop },
    update: { connectedThemeId: themeId, connectedThemeName: themeName, connectedThemeSelected: true },
    create: { shop, connectedThemeId: themeId, connectedThemeName: themeName, connectedThemeSelected: true },
  });

  return json({ ok: true });
};

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
                      <Box>
                        <Icon
                          source={integrationStatus === "active" ? CheckCircleIcon : AlertCircleIcon}
                          tone={integrationStatus === "active" ? "success" : "critical"}
                        />
                      </Box>
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
                      <Box>
                        <Icon
                          source={hasConnectedTheme ? CheckCircleIcon : AlertCircleIcon}
                          tone={hasConnectedTheme ? "success" : "critical"}
                        />
                      </Box>
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
                      <Box>
                        <Icon
                          source={CheckCircleIcon}
                          tone={step.completed ? "success" : "subdued"}
                        />
                      </Box>
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
              <Box>
                <Icon source={ShieldCheckMarkIcon} tone="success" />
              </Box>
              <Text as="p" variant="bodySm">30-day money back guarantee</Text>
            </InlineStack>
          </Card>
          <Card>
            <InlineStack gap="300" blockAlign="center">
              <Box>
                <Icon source={StarIcon} tone="info" />
              </Box>
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
                      <Box>
                        <Icon source={openFaq === index ? ChevronUpIcon : ChevronDownIcon} tone="subdued" />
                      </Box>
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
        <Box paddingBlockEnd="1200" />
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
