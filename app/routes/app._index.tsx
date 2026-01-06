import { useState } from "react";
import { useLoaderData, useLocation, useNavigate } from "@remix-run/react";
import { json, type LoaderFunctionArgs } from "@remix-run/node";
import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Download,
  Menu,
  Shield,
  Smartphone,
  Star,
} from "lucide-react";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";

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
    const listResponse = await fetch(
      `https://${shop}/admin/api/2025-01/themes/${themeId}/assets.json?fields=key`,
      { headers: restHeaders }
    );
    if (!listResponse.ok) {
      console.error("Theme assets list request failed", listResponse.status, listResponse.statusText);
    }
    const listData = await listResponse.json().catch(() => ({}));
    const assetKeys = (listData?.assets ?? [])
      .map((asset: { key?: string }) => asset.key)
      .filter((key: string | undefined): key is string => Boolean(key));

    const preferredKeys = defaultKeys.filter((key) => assetKeys.includes(key));
    const templateKeys = assetKeys.filter((key) => /^(sections|templates)\/.+\.json$/.test(key));
    const keysToScan = assetKeys.length
      ? Array.from(new Set([...preferredKeys, ...templateKeys]))
      : defaultKeys;

    for (const key of keysToScan) {
      const assetResponse = await fetch(
        `https://${shop}/admin/api/2025-01/themes/${themeId}/assets.json?asset[key]=${encodeURIComponent(key)}`,
        { headers: restHeaders }
      );
      if (!assetResponse.ok) {
        continue;
      }
      const assetData = await assetResponse.json().catch(() => ({}));
      const value = readAssetValue(assetData);
      if (typeof value === "string") {
        const hasBlock = appBlockPattern.test(value);
        if (hasBlock) return true;
      }
    }
  } catch (error) {
    console.error("Failed to scan theme assets for app block", error);
  }
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
  let themeName = "Unknown";
  let appEmbedEnabled = false;
  let appBlockAdded = false;
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
    const themes = data?.data?.themes?.nodes ?? [];
    const mainTheme = themes.find((theme: { role?: string }) => theme.role === "MAIN") ?? themes[0];
    if (mainTheme?.name) {
      themeName = mainTheme.name;
    }

    if (mainTheme?.id) {
      const themeIdMatch = mainTheme.id.match(/\/(\d+)$/);
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

    if (!appBlockAdded && restHeaders) {
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

  const themeEditorUrl = `https://${shop}/admin/themes/current/editor?context=apps`;

  const integrationStatus: "active" | "pending" = appEmbedEnabled ? "active" : "pending";

  return json({
    themeName,
    integrationStatus,
    appEmbedEnabled,
    appBlockAdded,
    hasMenu,
    hasActiveMenu,
    themeEditorUrl,
  });
};

export default function Dashboard() {
  const { themeName, integrationStatus, appEmbedEnabled, appBlockAdded, hasMenu, hasActiveMenu, themeEditorUrl } =
    useLoaderData<typeof loader>();
  const navigate = useNavigate();
  const location = useLocation();
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const withSearch = (path: string) => ({
    pathname: path,
    search: location.search,
  });

  const features = [
    {
      icon: Menu,
      title: "Create Mega Menu",
      description: "Build powerful navigation menus with unlimited depth and customization",
      action: () => navigate(withSearch("/app/mega-menus")),
    },
    {
      icon: Smartphone,
      title: "Mobile Menu",
      description: "Responsive mobile-first menus optimized for all devices",
      badge: "Pro",
      action: () => navigate(withSearch("/app/pricing")),
    },
    {
      icon: Download,
      title: "Import Menu",
      description: "Import existing menus from your Shopify store instantly",
      badge: "Pro",
      action: () => navigate(withSearch("/app/pricing")),
    },
  ];

  const setupSteps = [
    { title: "Create your first menu", completed: hasMenu },
    { title: "Enable app embed", completed: appEmbedEnabled },
    { title: "Add menu block to your theme", completed: appBlockAdded },
    { title: "Publish and go live", completed: hasActiveMenu },
  ];

  const setupButtonLabel = hasMenu ? "Continue Setup" : "Start Setup";
  const handleSetupClick = () => {
    if (!hasMenu) {
      navigate(withSearch("/app/mega-menus"));
      return;
    }
    if (!appEmbedEnabled) {
      if (typeof window !== "undefined") {
        window.open(themeEditorUrl, "_blank", "noopener,noreferrer");
      }
      return;
    }
    if (!appBlockAdded) {
      if (typeof window !== "undefined") {
        window.open(`${themeEditorUrl}&template=index`, "_blank", "noopener,noreferrer");
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
      a: "Yes! MenuCraft offers a free plan with essential features. Upgrade anytime to unlock Pro features.",
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
    <div className="min-h-screen p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="text-center py-8 flex flex-col items-center gap-4">
          <h1 className="!text-[32px] !leading-tight font-semibold text-gray-900">
            Welcome to MenuCraft
          </h1>
          <p className="!text-[18px] !leading-7 text-gray-600 max-w-2xl mx-auto">
            Create stunning mega menus that boost navigation and increase conversions for your Shopify store
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <Card
              key={index}
              className="text-center space-y-2 hover:shadow-md transition-shadow cursor-pointer p-6"
              onClick={feature.action}
            >
              <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto">
                <feature.icon className="w-8 h-8 text-indigo-600" />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-center gap-2">
                  <h3 className="text-lg text-gray-900">{feature.title}</h3>
                  {feature.badge && <Badge variant="pro">{feature.badge}</Badge>}
                </div>
                <p className="text-sm text-gray-600">{feature.description}</p>
              </div>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 tracking-tight mb-4">
              App Status
            </h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  {integrationStatus === "active" ? (
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-rose-600" />
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm text-gray-900">Installation Status</p>
                      <Badge variant={integrationStatus === "active" ? "success" : "warning"}>
                        {integrationStatus === "active" ? "Active" : "Pending"}
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-600">
                      {integrationStatus === "active"
                        ? "Theme integration active"
                        : "Theme integration pending"}
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (typeof window !== "undefined") {
                      window.open(themeEditorUrl, "_blank", "noopener,noreferrer");
                    }
                  }}
                >
                  Configure
                </Button>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm text-gray-900">Connected Theme</p>
                  <p className="text-xs text-gray-600">{themeName}</p>
                </div>
                <Badge variant="success">Active</Badge>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="text-lg text-gray-900 mb-4">Setup Checklist</h2>
            <div className="space-y-3">
              {setupSteps.map((step, index) => (
                <div key={index} className="flex items-center gap-3">
                  {step.completed ? (
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                  ) : (
                    <div className="w-5 h-5 rounded-full border-2 border-gray-300" />
                  )}
                  <span
                    className={`text-sm ${step.completed ? "text-gray-600 line-through" : "text-gray-900"}`}
                  >
                    {step.title}
                  </span>
                </div>
              ))}
              <Button
                variant="outline"
                size="sm"
                className="w-full mt-4"
                onClick={handleSetupClick}
              >
                {setupButtonLabel}
              </Button>
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center gap-3 p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
            <div className="w-8 h-8 bg-green-50 rounded-full flex items-center justify-center flex-shrink-0">
              <Shield className="w-4 h-4 text-green-600" />
            </div>
            <p className="text-sm text-gray-700">30-day money back guarantee</p>
          </div>

          <div className="flex items-center gap-3 p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
            <div className="w-8 h-8 bg-indigo-50 rounded-full flex items-center justify-center flex-shrink-0">
              <Star className="w-4 h-4 text-indigo-600" />
            </div>
            <p className="text-sm text-gray-700">Built for Shopify by Shopify Experts</p>
          </div>
        </div>

        <Card className="p-6">
          <h2 className="text-xl text-gray-900 mb-2">Frequently Asked Questions</h2>
          <div className="space-y-3">
            {faqs.map((faq, index) => (
              <div key={index} className="border-b border-gray-200 last:border-0 pb-3">
                <button
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                  className="w-full flex items-center justify-between text-left py-2"
                >
                  <span className="text-sm text-gray-900">{faq.q}</span>
                  {openFaq === index ? (
                    <ChevronUp className="w-5 h-5 text-gray-400" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  )}
                </button>
                {openFaq === index && (
                  <p className="text-sm text-gray-600 mt-2">{faq.a}</p>
                )}
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
