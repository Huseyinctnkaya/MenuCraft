import type { LoaderFunctionArgs } from "@remix-run/node";
import { Code, Layout, MousePointer, Palette, Smartphone, Zap } from "lucide-react";
import { authenticate } from "../shopify.server";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await authenticate.admin(request);
  return null;
};

export default function DesignSettings() {
  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl text-gray-900">Updates</h1>
              <Badge variant="new">Changelog</Badge>
            </div>
            <p className="text-gray-600 mt-1">See what’s new in MenuCraft and what’s coming next</p>
          </div>
          <Button disabled>Coming soon</Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-6">
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Zap className="w-5 h-5 text-gray-600" />
                <h2 className="text-lg text-gray-900">Latest Release</h2>
              </div>
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Badge variant="primary">v1.6</Badge>
                  <span className="text-sm text-gray-500">Dec 30, 2025</span>
                </div>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li>• Builder UI polish and menu preview controls</li>
                  <li>• Install status checks for app embed</li>
                  <li>• Analytics dashboard scaffolding</li>
                </ul>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Palette className="w-5 h-5 text-gray-600" />
                <h2 className="text-lg text-gray-900">Design & UX</h2>
              </div>
              <div className="space-y-3">
                <p className="text-sm text-gray-600">Improvements to spacing, typography, and visual hierarchy.</p>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li>• New card balance and lighter borders</li>
                  <li>• Better contrast on menu item states</li>
                  <li>• Cleaner button sizing across pages</li>
                </ul>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <MousePointer className="w-5 h-5 text-gray-600" />
                <h2 className="text-lg text-gray-900">Interactions</h2>
              </div>
              <div className="space-y-2 text-sm text-gray-700">
                <p>Polish for hover states, item toolbars, and inline actions.</p>
                <p className="text-gray-600">More feedback on drag, drop, and active menus.</p>
              </div>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Smartphone className="w-5 h-5 text-gray-600" />
                <h2 className="text-lg text-gray-900">Mobile</h2>
              </div>
              <div className="space-y-2 text-sm text-gray-700">
                <p>Mobile preview and layout refinements are underway.</p>
                <ul className="space-y-2">
                  <li>• Full-width mobile menu layout</li>
                  <li>• Better spacing and touch targets</li>
                  <li>• Clear submenu indicators</li>
                </ul>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Code className="w-5 h-5 text-gray-600" />
                <h2 className="text-lg text-gray-900">Developer Notes</h2>
              </div>
              <div className="space-y-2 text-sm text-gray-700">
                <p>Backend updates that support new builder capabilities.</p>
                <ul className="space-y-2">
                  <li>• Theme app extension status checks</li>
                  <li>• Analytics event pipeline groundwork</li>
                  <li>• Cleaner app embed detection</li>
                </ul>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Layout className="w-5 h-5 text-gray-600" />
                <h2 className="text-lg text-gray-900">Coming Soon</h2>
              </div>
              <div className="space-y-3 text-sm text-gray-700">
                <p>Planned work for upcoming releases.</p>
                <ul className="space-y-2">
                  <li>• Template marketplace</li>
                  <li>• A/B testing and heatmaps</li>
                  <li>• Billing and plan gating</li>
                </ul>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
