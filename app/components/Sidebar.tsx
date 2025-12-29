import { Link, useLocation } from "@remix-run/react";
import {
  BarChart3,
  CreditCard,
  Download,
  HelpCircle,
  LayoutDashboard,
  LayoutTemplate,
  Menu,
  Palette,
  Settings,
} from "lucide-react";

const navItems = [
  { path: "/app", icon: LayoutDashboard, label: "Dashboard" },
  { path: "/app/analytics", icon: BarChart3, label: "Analytics" },
  { path: "/app/mega-menus", icon: Menu, label: "Mega Menus" },
  { path: "/app/templates", icon: LayoutTemplate, label: "Templates" },
  { path: "/app/install-status", icon: Download, label: "Install & Theme Status" },
  { path: "/app/pricing", icon: CreditCard, label: "Pricing & Plans" },
  { path: "/app/appearance", icon: Palette, label: "Appearance" },
  { path: "/app/support", icon: HelpCircle, label: "Support" },
  { path: "/app/settings", icon: Settings, label: "Settings" },
];

export default function Sidebar() {
  const location = useLocation();

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-white border-r border-gray-200 overflow-y-auto">
      <div className="p-6">
        <div className="flex items-center gap-3 mb-8">
          <img
            src="/menucraft-logo.png"
            alt="MenuCraft"
            className="h-9 w-9"
          />
          <div className="leading-tight">
            <h1 className="text-xl text-gray-900">MenuCraft</h1>
            <div className="text-[10px] tracking-[0.3em] text-gray-500">
              MEGA MENU BUILDER
            </div>
          </div>
        </div>

        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              location.pathname === item.path ||
              (item.path === "/app" && location.pathname === "/app");

            return (
              <Link
                key={item.path}
                to={{ pathname: item.path, search: location.search }}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                  isActive
                    ? "bg-indigo-50 text-indigo-600"
                    : "text-gray-700 hover:bg-gray-50"
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-sm">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
