import type { LoaderFunctionArgs } from "@remix-run/node";
import { Palette, Layout, Smartphone, MousePointer, Zap, Code } from 'lucide-react';
import { authenticate } from "../shopify.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await authenticate.admin(request);
  return null;
};

export default function Appearance() {
  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold text-gray-900">Appearance</h1>
              <span className="inline-flex items-center rounded-md bg-indigo-100 px-2 py-0.5 text-xs font-medium text-indigo-700">
                Pro
              </span>
            </div>
            <p className="text-gray-600 mt-1">Customize how your menus look and behave</p>
          </div>
          <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium">
            Save Changes
          </button>
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* LEFT COLUMN */}
          <div className="space-y-6">
            {/* Colors */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center gap-2 mb-4">
                <Palette className="w-5 h-5 text-gray-600" />
                <h2 className="text-lg font-semibold text-gray-900">Colors</h2>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Background Color</label>
                  <div className="flex gap-2">
                    <input type="color" defaultValue="#ffffff" className="w-12 h-10 rounded border border-gray-300 cursor-pointer" />
                    <input type="text" defaultValue="#ffffff" className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Text Color</label>
                  <div className="flex gap-2">
                    <input type="color" defaultValue="#111827" className="w-12 h-10 rounded border border-gray-300 cursor-pointer" />
                    <input type="text" defaultValue="#111827" className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Hover Color</label>
                  <div className="flex gap-2">
                    <input type="color" defaultValue="#4f46e5" className="w-12 h-10 rounded border border-gray-300 cursor-pointer" />
                    <input type="text" defaultValue="#4f46e5" className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                  </div>
                </div>
              </div>
            </div>

            {/* Layout */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center gap-2 mb-4">
                <Layout className="w-5 h-5 text-gray-600" />
                <h2 className="text-lg font-semibold text-gray-900">Layout</h2>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Menu Width</label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" name="width" defaultChecked />
                      <span className="text-sm text-gray-700">Full Width</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" name="width" />
                      <span className="text-sm text-gray-700">Boxed</span>
                    </label>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Spacing (px)</label>
                  <input type="range" min="0" max="40" defaultValue="20" className="w-full cursor-pointer" />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>0</span>
                    <span>20</span>
                    <span>40</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Orientation</label>
                  <div className="space-y-2">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input type="radio" name="orientation" defaultChecked />
                      <span className="text-sm text-gray-700">Horizontal</span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input type="radio" name="orientation" />
                      <span className="text-sm text-gray-700">Vertical</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* Effects */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center gap-2 mb-4">
                <Zap className="w-5 h-5 text-gray-600" />
                <h2 className="text-lg font-semibold text-gray-900">Effects</h2>
              </div>
              <div className="space-y-3">
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-sm text-gray-700">Enable hover animations</span>
                  <input type="checkbox" defaultChecked className="w-4 h-4 cursor-pointer" />
                </label>
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-sm text-gray-700">Show dropdown shadows</span>
                  <input type="checkbox" defaultChecked className="w-4 h-4 cursor-pointer" />
                </label>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN */}
          <div className="space-y-6">
            {/* Trigger Behavior */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center gap-2 mb-4">
                <MousePointer className="w-5 h-5 text-gray-600" />
                <h2 className="text-lg font-semibold text-gray-900">Trigger Behavior</h2>
              </div>
              <div className="space-y-3">
                <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                  <input type="radio" name="trigger" defaultChecked />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Hover to Open</p>
                    <p className="text-xs text-gray-600">Menu opens on hover</p>
                  </div>
                </label>
                <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                  <input type="radio" name="trigger" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Click to Open</p>
                    <p className="text-xs text-gray-600">Menu opens on click/tap</p>
                  </div>
                </label>
              </div>
            </div>

            {/* Mobile Behavior */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center gap-2 mb-4">
                <Smartphone className="w-5 h-5 text-gray-600" />
                <h2 className="text-lg font-semibold text-gray-900">Mobile Behavior</h2>
              </div>
              <div className="space-y-3">
                <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                  <input type="radio" name="mobile" defaultChecked />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Accordion</p>
                    <p className="text-xs text-gray-600">Expandable menu items</p>
                  </div>
                </label>
                <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                  <input type="radio" name="mobile" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Drawer</p>
                    <p className="text-xs text-gray-600">Side slide menu</p>
                  </div>
                </label>
                <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                  <input type="radio" name="mobile" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Full Screen</p>
                    <p className="text-xs text-gray-600">Full screen overlay</p>
                  </div>
                </label>
              </div>
            </div>

            {/* Advanced */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center gap-2 mb-4">
                <Code className="w-5 h-5 text-gray-600" />
                <h2 className="text-lg font-semibold text-gray-900">Advanced</h2>
              </div>
              <div className="space-y-3">
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-sm text-gray-700">Sticky header integration</span>
                  <input type="checkbox" defaultChecked className="w-4 h-4 cursor-pointer" />
                </label>
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-sm text-gray-700">Custom CSS enabled</span>
                  <input type="checkbox" className="w-4 h-4 cursor-pointer" />
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
