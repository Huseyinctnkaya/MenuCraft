import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { AlertCircle, CheckCircle2, ExternalLink } from "lucide-react";
import { authenticate } from "../shopify.server";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";

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
  try {
    for (const key of defaultKeys) {
      const assetResponse = await fetch(
        `https://${shop}/admin/api/2025-01/themes/${themeId}/assets.json?asset[key]=${encodeURIComponent(key)}`,
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
      if (typeof value === "string") {
        const hasBlock = appBlockPattern.test(value);
        if (hasBlock) {
          appBlockCache.set(cacheKey, { value: true, expiresAt: now + 30_000 });
          return true;
        }
      }
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
  let themeName = "Unknown";
  let appEmbedEnabled = false;
  let appBlockAdded = false;

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
    const themes = data?.data?.themes?.nodes ?? [];
    const mainTheme = themes.find((theme: { role?: string }) => theme.role === "MAIN") ?? themes[0];
    if (mainTheme?.name) {
      themeName = mainTheme.name;
    }

    if (mainTheme?.id) {
      const themeIdMatch = mainTheme.id.match(/\/(\d+)$/);
      const themeId = themeIdMatch?.[1];
      const restHeaders = session.accessToken
        ? {
            "X-Shopify-Access-Token": session.accessToken,
            "Content-Type": "application/json",
          }
        : null;
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

      if (!appBlockAdded) {
        const blockMatch = appBlockPattern.test(
          typeof rawSettings === "string" ? rawSettings : ""
        );
        appBlockAdded = blockMatch;
      }

      if (!appBlockAdded && themeId && restHeaders) {
        appBlockAdded = await hasAppBlockInThemeAssets(shop, themeId, restHeaders);
      }
    }

    if (!appBlockAdded && session.accessToken) {
      const restHeaders = {
        "X-Shopify-Access-Token": session.accessToken,
        "Content-Type": "application/json",
      };
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

  const themeEditorUrl = `https://${shop}/admin/themes/current/editor?context=apps`;

  return json({
    themeName,
    appEmbedEnabled,
    appBlockAdded,
    themeEditorUrl,
  });
};

export default function InstallStatus() {
  const { themeName, appEmbedEnabled, appBlockAdded, themeEditorUrl } =
    useLoaderData<typeof loader>();
  const checks = [
    { label: "Shopify Online Store 2.0", status: "success", message: "Theme is compatible" },
    {
      label: "App Embed Enabled",
      status: appEmbedEnabled ? "success" : "warning",
      message: appEmbedEnabled ? "Enabled" : "Enable in theme editor",
    },
    {
      label: "App Block Added",
      status: appBlockAdded ? "success" : "warning",
      message: appBlockAdded ? "Enabled" : "Action required",
    },
  ];

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl text-gray-900">Install & Theme Status</h1>
          <p className="text-gray-600 mt-1">Ensure MenuCraft is properly integrated with your theme</p>
        </div>

        <Card className="p-6">
          <div className="space-y-4">
            {checks.map((check, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  {check.status === "success" ? (
                    <CheckCircle2 className="w-6 h-6 text-green-600" />
                  ) : (
                    <AlertCircle className="w-6 h-6 text-amber-500" />
                  )}
                  <div>
                    <p className="text-sm text-gray-900">{check.label}</p>
                    <p className="text-xs text-gray-600">{check.message}</p>
                  </div>
                </div>
                <Badge variant={check.status === "success" ? "success" : "warning"}>
                  {check.status === "success" ? "Complete" : "Pending"}
                </Badge>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-lg text-gray-900 mb-4">Setup Instructions</h2>
          <div className="space-y-4">
            <div className="p-4 border border-gray-200 rounded-lg">
              <h3 className="text-sm text-gray-900 mb-2">Step 1: Enable App Embed</h3>
              <p className="text-sm text-gray-600 mb-3">
                In theme settings, enable the MenuCraft app embed under Theme Extensions
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (typeof window !== "undefined") {
                    window.open(themeEditorUrl, "_blank", "noopener,noreferrer");
                  }
                }}
              >
                <ExternalLink className="w-4 h-4" />
                Theme Settings
              </Button>
            </div>

            <div className="p-4 border border-gray-200 rounded-lg">
              <h3 className="text-sm text-gray-900 mb-2">Step 2: Add App Block</h3>
              <p className="text-sm text-gray-600 mb-3">
                Open your theme editor and add the MenuCraft block to your header section
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (typeof window !== "undefined") {
                    window.open(themeEditorUrl, "_blank", "noopener,noreferrer");
                  }
                }}
              >
                <ExternalLink className="w-4 h-4" />
                Open Theme Editor
              </Button>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-lg text-gray-900 mb-3">Theme Information</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Current Theme:</span>
              <span className="text-gray-900">{themeName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Version:</span>
              <span className="text-gray-900">10.0.0</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">OS 2.0 Compatible:</span>
              <Badge variant="success">Yes</Badge>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
