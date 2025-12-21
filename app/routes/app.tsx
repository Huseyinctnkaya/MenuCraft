import type { HeadersFunction, LoaderFunctionArgs } from "@remix-run/node";
import { Link, Outlet, useLoaderData, useRouteError, useLocation } from "@remix-run/react";
import { boundary } from "@shopify/shopify-app-remix/server";
import { AppProvider } from "@shopify/shopify-app-remix/react";
import { LayoutDashboard, BarChart3, Grid3x3, Wand2, Zap, Download, DollarSign, Palette, MessageCircle, Settings } from "lucide-react";

import { authenticate } from "../shopify.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await authenticate.admin(request);

  return { apiKey: process.env.SHOPIFY_API_KEY || "" };
};

const navigationItems = [
  { label: "Dashboard", url: "/app", icon: LayoutDashboard },
  { label: "Analytics", url: "/app/analytics", icon: BarChart3 },
  { label: "Mega Menus", url: "/app/mega-menus", icon: Grid3x3 },
  { label: "Menu Builder", url: "/app/menu-builder", icon: Wand2 },
  { label: "Templates", url: "/app/templates", icon: Zap },
  { label: "Install & Theme Status", url: "/app/install-status", icon: Download },
  { label: "Pricing & Plans", url: "/app/pricing", icon: DollarSign },
  { label: "Appearance", url: "/app/appearance", icon: Palette },
  { label: "Support", url: "/app/support", icon: MessageCircle },
  { label: "Settings", url: "/app/settings", icon: Settings },
];

export default function App() {
  const { apiKey } = useLoaderData<typeof loader>();
  const location = useLocation();

  return (
    <AppProvider isEmbeddedApp apiKey={apiKey}>
      <div className="flex h-screen bg-gray-50">
        {/* Sidebar */}
        <div className="w-64 bg-white border-r border-gray-200 shadow-sm flex flex-col">
          {/* Logo */}
          <div className="p-6 border-b border-gray-200">
            <img src="/menucraft-logo.png" alt="MenuCraft" className="h-8" />
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-4">
            <div className="space-y-1">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.url || (item.url === "/app" && location.pathname === "/app");

                return (
                  <Link
                    key={item.url}
                    to={item.url}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                      isActive
                        ? "bg-indigo-50 text-indigo-600"
                        : "text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    <span className="text-sm font-medium truncate">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-gray-200 space-y-2">
            <a href="#" className="w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors text-center block">
              Help & Support
            </a>
            <a href="#" className="w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors text-center block">
              Docs
            </a>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-auto">
          <Outlet />
        </div>
      </div>
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

