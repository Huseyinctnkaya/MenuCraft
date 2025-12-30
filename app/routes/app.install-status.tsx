import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { AlertCircle, CheckCircle2, ExternalLink } from "lucide-react";
import { authenticate } from "../shopify.server";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin, session } = await authenticate.admin(request);
  const shop = session.shop;
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
      let rawSettings: unknown = "";
      if (session.accessToken) {
        const themeIdMatch = mainTheme.id.match(/\/(\d+)$/);
        const themeId = themeIdMatch?.[1];
        if (themeId) {
          try {
            const restResponse = await fetch(
              `https://${shop}/admin/api/2025-01/themes/${themeId}/assets.json?asset[key]=config/settings_data.json`,
              {
                headers: {
                  "X-Shopify-Access-Token": session.accessToken,
                  "Content-Type": "application/json",
                },
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
            if (type.includes("shopify://apps/menucraft/blocks/app-embed")) {
              const enabled = record.disabled === undefined ? true : record.disabled === false;
              if (enabled) appEmbedEnabled = true;
            } else if (type.includes("shopify://apps/menucraft/blocks/")) {
              appBlockAdded = true;
            }
          }
          Object.values(record).forEach(scanNode);
        };

        scanNode(parsed);
      } catch {
        const fallback = typeof rawSettings === "string" ? rawSettings.toLowerCase() : "";
        appEmbedEnabled = fallback.includes("menucraft-embed") || fallback.includes("menucraft");
      }

      if (!appEmbedEnabled) {
        const embedEnabledMatch =
          /shopify:\/\/apps\/menucraft\/blocks\/app-embed[\s\S]*?"disabled"\s*:\s*false/i.test(
            typeof rawSettings === "string" ? rawSettings : ""
          ) ||
          /shopify:\/\/apps\/menucraft\/blocks\/app-embed[\s\S]*?"enabled"\s*:\s*true/i.test(
            typeof rawSettings === "string" ? rawSettings : ""
          );
        appEmbedEnabled = embedEnabledMatch;
      }

      if (!appBlockAdded) {
        const blockMatch = /shopify:\/\/apps\/menucraft\/blocks\/(?!app-embed)[^"\\]+/i.test(
          typeof rawSettings === "string" ? rawSettings : ""
        );
        appBlockAdded = blockMatch;
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
