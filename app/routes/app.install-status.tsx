import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";
import { Badge, BlockStack, Button, Card, Icon, InlineStack, Page, Text } from "@shopify/polaris";
import { AlertCircleIcon, CheckCircleIcon, ExternalIcon } from "@shopify/polaris-icons";

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
            (key) =>
              (key.startsWith("sections/") || key.startsWith("templates/")) && key.endsWith(".json")
          );
        assetKeys.forEach((key) => keysToScan.add(key));
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
  const shopPreferenceClient = (prisma as {
    shopPreference?: {
      findUnique: typeof prisma.billingSubscription.findUnique;
    };
  }).shopPreference;
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
  const restHeaders = session.accessToken
    ? {
        "X-Shopify-Access-Token": session.accessToken,
        "Content-Type": "application/json",
      }
    : null;

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
    const mainTheme = themes.find((theme: { role?: string }) => theme.role === "MAIN") ?? themes[0];
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
            typeof value === "object"
              ? value?.enabled === true || value?.disabled === false || (value?.enabled === undefined && value?.disabled === undefined)
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
        const candidateId = typeof theme?.id === "string" ? theme.id.match(/\/(\d+)$/)?.[1] : null;
        if (!candidateId) continue;
        if (await hasAppBlockInThemeAssets(shop, candidateId, restHeaders)) {
          appBlockAdded = true;
          break;
        }
      }
    }
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

  return json({
    themeName,
    connectedThemeId,
    connectedThemeName,
    connectedThemeSelected,
    appEmbedEnabled,
    appBlockAdded,
    themeEditorUrl,
  });
};

export default function InstallStatus() {
  const {
    themeName,
    connectedThemeId,
    connectedThemeName,
    connectedThemeSelected,
    appEmbedEnabled,
    themeEditorUrl,
  } =
    useLoaderData<typeof loader>();
  const hasConnectedTheme = Boolean(connectedThemeSelected && connectedThemeId);
  const displayThemeName = hasConnectedTheme ? connectedThemeName ?? themeName : "Not selected";
  const checks = [
    {
      label: "Shopify Online Store 2.0",
      status: hasConnectedTheme ? "success" : "warning",
      message: hasConnectedTheme ? "Active" : "Deactive",
    },
    {
      label: "App Embed Enabled",
      status: appEmbedEnabled ? "success" : "warning",
      message: appEmbedEnabled ? "Active" : "Deactive",
    },
  ];

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
