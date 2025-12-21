import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import { Palette, Layout, Smartphone, MousePointer, Zap, Code } from 'lucide-react';

export default function DesignSettings() {
  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl text-gray-900">Appearance</h1>
              <Badge variant="pro">Pro</Badge>
            </div>
            <p className="text-gray-600 mt-1">Customize how your menus look and behave</p>
          </div>
          <Button>Save Changes</Button>
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* LEFT COLUMN */}
          <div className="space-y-6">
            {/* Colors */}
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Palette className="w-5 h-5 text-gray-600" />
                <h2 className="text-lg text-gray-900">Colors</h2>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-700 mb-2">Background Color</label>
                  <div className="flex gap-2">
                    <input type="color" className="w-12 h-10 rounded border border-gray-300 cursor-pointer" defaultValue="#ffffff" />
                    <input type="text" className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm" defaultValue="#ffffff" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-2">Text Color</label>
                  <div className="flex gap-2">
                    <input type="color" className="w-12 h-10 rounded border border-gray-300 cursor-pointer" defaultValue="#111827" />
                    <input type="text" className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm" defaultValue="#111827" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-2">Hover Color</label>
                  <div className="flex gap-2">
                    <input type="color" className="w-12 h-10 rounded border border-gray-300 cursor-pointer" defaultValue="#4f46e5" />
                    <input type="text" className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm" defaultValue="#4f46e5" />
                  </div>
                </div>
              </div>
            </Card>

            {/* Layout */}
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Layout className="w-5 h-5 text-gray-600" />
                <h2 className="text-lg text-gray-900">Layout</h2>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-700 mb-2">Menu Width</label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" name="width" defaultChecked />
                      <span className="text-sm">Full Width</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" name="width" />
                      <span className="text-sm">Boxed</span>
                    </label>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm text-gray-700 mb-2">Spacing (px)</label>
                  <input type="range" min="0" max="40" defaultValue="20" className="w-full cursor-pointer" />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>0</span>
                    <span>20</span>
                    <span>40</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-gray-700 mb-2">Menu Orientation</label>
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
            </Card>

            {/* Effects */}
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Zap className="w-5 h-5 text-gray-600" />
                <h2 className="text-lg text-gray-900">Effects</h2>
              </div>
              <div className="space-y-3">
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-sm text-gray-700">Enable hover animations</span>
                  <input type="checkbox" className="w-4 h-4 cursor-pointer" defaultChecked />
                </label>
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-sm text-gray-700">Show dropdown shadows</span>
                  <input type="checkbox" className="w-4 h-4 cursor-pointer" defaultChecked />
                </label>
              </div>
            </Card>
          </div>

          {/* RIGHT COLUMN */}
          <div className="space-y-6">
            {/* Trigger Behavior */}
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <MousePointer className="w-5 h-5 text-gray-600" />
                <h2 className="text-lg text-gray-900">Trigger Behavior</h2>
              </div>
              <div className="space-y-3">
                <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                  <input type="radio" name="trigger" defaultChecked />
                  <div>
                    <p className="text-sm text-gray-900">Hover to Open</p>
                    <p className="text-xs text-gray-600">Menu opens when mouse hovers over</p>
                  </div>
                </label>
                <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                  <input type="radio" name="trigger" />
                  <div>
                    <p className="text-sm text-gray-900">Click to Open</p>
                    <p className="text-xs text-gray-600">Menu opens on click/tap</p>
                  </div>
                </label>
              </div>
            </Card>

            {/* Mobile Behavior */}
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Smartphone className="w-5 h-5 text-gray-600" />
                <h2 className="text-lg text-gray-900">Mobile Behavior</h2>
              </div>
              <div className="space-y-4">
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-sm text-gray-700">Enable sticky header on mobile</span>
                  <input type="checkbox" className="w-4 h-4 cursor-pointer" />
                </label>
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-sm text-gray-700">Show mobile menu icon</span>
                  <input type="checkbox" className="w-4 h-4 cursor-pointer" defaultChecked />
                </label>
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-sm text-gray-700">Auto-collapse on mobile</span>
                  <input type="checkbox" className="w-4 h-4 cursor-pointer" defaultChecked />
                </label>
              </div>
            </Card>

            {/* Integration Mode */}
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Code className="w-5 h-5 text-gray-600" />
                <h2 className="text-lg text-gray-900">Integration Mode</h2>
              </div>
              <div className="space-y-3">
                <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                  <input type="radio" name="mode" defaultChecked />
                  <div>
                    <p className="text-sm text-gray-900">Replace Theme Menu</p>
                    <p className="text-xs text-gray-600">Replace existing navigation</p>
                  </div>
                </label>
                <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                  <input type="radio" name="mode" />
                  <div>
                    <p className="text-sm text-gray-900">Append to Theme Menu</p>
                    <p className="text-xs text-gray-600">Add alongside existing menu</p>
                  </div>
                </label>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}