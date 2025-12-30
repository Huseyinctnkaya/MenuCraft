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
  let integrationStatus: "active" | "pending" = "pending";

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
      const settingsResponse = await admin.graphql(
        `query ThemeSettings($id: ID!) {
          theme(id: $id) {
            files(first: 1, filenames: ["config/settings_data.json"]) {
              nodes {
                body
              }
            }
          }
        }`,
        { variables: { id: mainTheme.id } }
      );
      const settingsData = await settingsResponse.json();
      const body = settingsData?.data?.theme?.files?.nodes?.[0]?.body;
      let rawSettings = "";
      if (typeof body === "string") {
        rawSettings = body;
      } else if (body?.value) {
        rawSettings = body.value;
      } else if (body?.content) {
        rawSettings = body.content;
      } else if (body) {
        rawSettings = JSON.stringify(body);
      }
      if (rawSettings.toLowerCase().includes("menucraft")) {
        integrationStatus = "active";
      }
    }
  } catch (error) {
    console.error("Failed to load theme status", error);
  }

  const themeEditorUrl = `https://${shop}/admin/themes/current/editor?context=apps`;

  return json({
    themeName,
    integrationStatus,
    themeEditorUrl,
  });
};

export default function InstallStatus() {
  const { themeName, integrationStatus, themeEditorUrl } = useLoaderData<typeof loader>();
  const checks = [
    { label: "Shopify Online Store 2.0", status: "success", message: "Theme is compatible" },
    {
      label: "App Block Added",
      status: "warning",
      message: "Action required",
    },
    {
      label: "App Embed Enabled",
      status: integrationStatus === "active" ? "success" : "warning",
      message: integrationStatus === "active" ? "Enabled" : "Action required",
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
              <h3 className="text-sm text-gray-900 mb-2">Step 1: Add App Block</h3>
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

            <div className="p-4 border border-gray-200 rounded-lg">
              <h3 className="text-sm text-gray-900 mb-2">Step 2: Enable App Embed</h3>
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
