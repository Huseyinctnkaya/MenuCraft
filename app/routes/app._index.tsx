import { useEffect, useState } from "react";
import { useFetcher, useLoaderData, useLocation, useNavigate, useRevalidator } from "@remix-run/react";
import { json, type ActionFunctionArgs, type LoaderFunctionArgs } from "@remix-run/node";
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
import { Select } from "@shopify/polaris";
import polarisStyles from "@shopify/polaris/build/esm/styles.css?url";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";

export const links = () => [{ rel: "stylesheet", href: polarisStyles }];

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
  const restHeaders = session.accessToken
    ? {
        "X-Shopify-Access-Token": session.accessToken,
        "Content-Type": "application/json",
      }
    : null;
  const shopPreferenceClient = (prisma as {
    shopPreference?: {
      findUnique: typeof prisma.billingSubscription.findUnique;
      upsert: typeof prisma.billingSubscription.upsert;
    };
  }).shopPreference;
  const preferences = shopPreferenceClient
    ? await shopPreferenceClient.findUnique({ where: { shop } })
    : null;

  let themeName = "Unknown";
  let connectedThemeId: string | null = preferences?.connectedThemeId ?? null;
  let connectedThemeName: string | null = preferences?.connectedThemeName ?? null;
  let themes: Array<{ id: string; name: string; role?: string | null; editorUrl?: string }> = [];
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
    themes = data?.data?.themes?.nodes ?? [];
    const mainTheme = themes.find((theme: { role?: string }) => theme.role === "MAIN") ?? themes[0];
    const preferredTheme = connectedThemeId
      ? themes.find((theme: { id: string }) => theme.id === connectedThemeId) ?? null
      : null;
    const activeTheme = preferredTheme ?? mainTheme ?? themes[0];
    if (activeTheme?.name) {
      themeName = activeTheme.name;
    }
    if (activeTheme?.id) {
      connectedThemeId = activeTheme.id;
      connectedThemeName = activeTheme.name ?? connectedThemeName;
    }

    if (activeTheme?.id) {
      const themeIdMatch = activeTheme.id.match(/\/(\d+)$/);
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

  const integrationStatus: "active" | "pending" = appEmbedEnabled ? "active" : "pending";

  return json({
    themeName,
    connectedThemeId,
    connectedThemeName: connectedThemeName ?? themeName,
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

  const shopPreferenceClient = (prisma as {
    shopPreference?: {
      findUnique: typeof prisma.billingSubscription.findUnique;
      upsert: typeof prisma.billingSubscription.upsert;
    };
  }).shopPreference;

  if (!shopPreferenceClient) {
    return json({ ok: false, error: "Preferences unavailable" }, { status: 500 });
  }

  await shopPreferenceClient.upsert({
    where: { shop },
    update: { connectedThemeId: themeId, connectedThemeName: themeName },
    create: { shop, connectedThemeId: themeId, connectedThemeName: themeName },
  });

  return json({ ok: true });
};

export default function Dashboard() {
  const {
    themeName,
    connectedThemeId,
    connectedThemeName,
    themes,
    integrationStatus,
    appEmbedEnabled,
    appBlockAdded,
    hasMenu,
    hasActiveMenu,
    themeEditorUrl,
  } = useLoaderData<typeof loader>();
  const themeFetcher = useFetcher<typeof action>();
  const revalidator = useRevalidator();
  const navigate = useNavigate();
  const location = useLocation();
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [themeConfigOpen, setThemeConfigOpen] = useState(false);
  const [selectedThemeId, setSelectedThemeId] = useState(connectedThemeId ?? "");
  const [activeThemeId, setActiveThemeId] = useState(connectedThemeId ?? "");
  const [activeThemeName, setActiveThemeName] = useState(connectedThemeName ?? themeName);

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

  const themeOptions = themes.map((theme) => ({
    label: theme.name,
    value: theme.id,
  }));
  const activeTheme = themes.find((theme) => theme.id === activeThemeId) ?? themes[0] ?? null;
  const selectedTheme = themes.find((theme) => theme.id === selectedThemeId) ?? activeTheme;
  const resolvedThemeEditorUrl = activeTheme?.editorUrl ?? themeEditorUrl;
  const isThemeSaving = themeFetcher.state !== "idle";

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
    if (integrationStatus === "active") return;
    if (typeof document === "undefined" || typeof window === "undefined") return;

    let intervalId: number | null = null;
    const stop = () => {
      if (intervalId === null) return;
      window.clearInterval(intervalId);
      intervalId = null;
    };
    const tick = () => {
      if (revalidator.state !== "loading") {
        revalidator.revalidate();
      }
    };
    const start = () => {
      if (intervalId !== null) return;
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
    return () => {
      stop();
      document.removeEventListener("visibilitychange", handleVisibility);
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
    if (!appBlockAdded) {
      if (typeof window !== "undefined") {
        window.open(`${resolvedThemeEditorUrl}&template=index`, "_blank", "noopener,noreferrer");
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
                      window.open(resolvedThemeEditorUrl, "_blank", "noopener,noreferrer");
                    }
                  }}
                >
                  Configure
                </Button>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm text-gray-900">Connected Theme</p>
                  <p className="text-xs text-gray-600">{activeThemeName}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="success">Active</Badge>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedThemeId(activeThemeId || selectedThemeId);
                      setThemeConfigOpen((prev) => !prev);
                    }}
                  >
                    Configure
                  </Button>
                </div>
              </div>
              {themeConfigOpen ? (
                <div className="rounded-lg border border-gray-200 bg-white p-3">
                  <div className="text-sm text-gray-900 font-medium mb-2">Select theme</div>
                  <Select
                    label="Select theme"
                    labelHidden
                    options={themeOptions}
                    value={selectedThemeId}
                    onChange={setSelectedThemeId}
                    disabled={themeOptions.length === 0}
                  />
                  <div className="mt-3 flex justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedThemeId(activeThemeId);
                        setThemeConfigOpen(false);
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleSaveConnectedTheme}
                      disabled={!selectedTheme || isThemeSaving}
                    >
                      Save
                    </Button>
                  </div>
                </div>
              ) : null}
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
