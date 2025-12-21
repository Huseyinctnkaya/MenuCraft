import { useState } from 'react';
import type { LoaderFunctionArgs } from "@remix-run/node";
import { 
  Save, 
  Eye, 
  Smartphone, 
  Monitor, 
  Plus, 
  GripVertical, 
  ChevronRight, 
  ChevronDown,
  X,
  Settings,
  Palette,
  FileText,
  Code,
  Search,
  ShoppingBag,
  Image,
  Tag
} from 'lucide-react';
import { authenticate } from "../shopify.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await authenticate.admin(request);
  return null;
};

type MenuItem = {
  id: string;
  label: string;
  url: string;
  hasSubmenu: boolean;
  expanded?: boolean;
  children?: MenuItem[];
};

type Tab = 'general' | 'design' | 'content' | 'advanced';

export default function MenuBuilder() {
  const [preview, setPreview] = useState<'desktop' | 'mobile'>('desktop');
  const [activeTab, setActiveTab] = useState<Tab>('general');
  const [selectedItemId, setSelectedItemId] = useState<string | null>('1');
  const [menuEnabled, setMenuEnabled] = useState(true);
  
  const [menuItems, setMenuItems] = useState<MenuItem[]>([
    { 
      id: '1', 
      label: 'Shop', 
      url: '/collections/all',
      hasSubmenu: true,
      expanded: true,
      children: [
        { id: '1-1', label: 'New Arrivals', url: '/collections/new', hasSubmenu: false },
        { id: '1-2', label: 'Best Sellers', url: '/collections/bestsellers', hasSubmenu: false },
        { id: '1-3', label: 'Sale', url: '/collections/sale', hasSubmenu: false }
      ]
    },
    { 
      id: '2', 
      label: 'Collections', 
      url: '/collections',
      hasSubmenu: true,
      expanded: false,
      children: [
        { id: '2-1', label: 'Women', url: '/collections/women', hasSubmenu: false },
        { id: '2-2', label: 'Men', url: '/collections/men', hasSubmenu: false }
      ]
    },
    { id: '3', label: 'About', url: '/pages/about', hasSubmenu: false },
    { id: '4', label: 'Blog', url: '/blogs/news', hasSubmenu: false },
    { id: '5', label: 'Contact', url: '/pages/contact', hasSubmenu: false }
  ]);

  const toggleExpand = (id: string) => {
    setMenuItems(items => 
      items.map(item => 
        item.id === id ? { ...item, expanded: !item.expanded } : item
      )
    );
  };

  const renderMenuItem = (item: MenuItem, depth: number = 0) => {
    const isSelected = selectedItemId === item.id;
    
    return (
      <div key={item.id}>
        <div 
          onClick={() => setSelectedItemId(item.id)}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors group ${
            isSelected ? 'bg-indigo-50 text-indigo-600' : 'hover:bg-gray-50 text-gray-900'
          }`}
          style={{ paddingLeft: `${12 + depth * 20}px` }}
        >
          <GripVertical className="w-4 h-4 text-gray-400 flex-shrink-0" />
          
          {item.hasSubmenu && (
            <button 
              onClick={(e) => {
                e.stopPropagation();
                toggleExpand(item.id);
              }}
              className="flex-shrink-0"
            >
              {item.expanded ? (
                <ChevronDown className="w-4 h-4 text-gray-500" />
              ) : (
                <ChevronRight className="w-4 h-4 text-gray-500" />
              )}
            </button>
          )}
          
          <span className="flex-1 text-sm truncate">{item.label}</span>
          
          <button 
            onClick={(e) => e.stopPropagation()}
            className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-200 rounded transition-opacity flex-shrink-0"
          >
            <X className="w-3 h-3 text-gray-600" />
          </button>
        </div>
        
        {item.hasSubmenu && item.expanded && item.children && (
          <div>
            {item.children.map(child => renderMenuItem(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* TOP BAR */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-4">
          <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <ChevronRight className="w-5 h-5 text-gray-700 rotate-180" />
          </button>
          
          <div>
            <h1 className="text-sm font-semibold text-gray-900">Mega Menu #160205</h1>
            <span className="inline-flex items-center rounded-md bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700 mt-1">
              Active
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-lg">
            <span className="text-sm text-gray-600">Enable</span>
            <button
              onClick={() => setMenuEnabled(!menuEnabled)}
              className={`relative w-11 h-6 rounded-full transition-colors ${
                menuEnabled ? 'bg-indigo-600' : 'bg-gray-300'
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                  menuEnabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-lg">
            <button
              onClick={() => setPreview('desktop')}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                preview === 'desktop' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Monitor className="w-4 h-4" />
            </button>
            <button
              onClick={() => setPreview('mobile')}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                preview === 'mobile' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Smartphone className="w-4 h-4" />
            </button>
          </div>

          <button className="px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-lg text-sm border border-gray-200 transition-colors flex items-center gap-2">
            <Eye className="w-4 h-4" />
            Preview
          </button>
          
          <button className="px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-lg text-sm border border-gray-200 transition-colors">
            Save
          </button>
          
          <button className="px-3 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 transition-colors">
            Publish
          </button>
        </div>
      </div>

      {/* MAIN LAYOUT */}
      <div className="flex flex-1 overflow-hidden">
        
        {/* LEFT PANEL */}
        <div className="w-80 bg-white border-r border-gray-200 flex flex-col flex-shrink-0">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-sm font-semibold text-gray-900">Menu Items</h2>
              <button className="p-1 hover:bg-gray-100 rounded transition-colors">
                <Plus className="w-4 h-4 text-gray-600" />
              </button>
            </div>
            <p className="text-xs text-gray-500">Drag to reorder items</p>
          </div>
          
          <div className="flex-1 overflow-y-auto p-3">
            <div className="space-y-1">
              {menuItems.map(item => renderMenuItem(item))}
            </div>
          </div>

          <div className="p-3 border-t border-gray-200">
            <button className="w-full flex items-center justify-center gap-2 py-2 px-3 border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-50 transition-colors">
              <Plus className="w-4 h-4" />
              Add Item
            </button>
          </div>
        </div>

        {/* CENTER - Preview */}
        <div className="flex-1 bg-gray-100 overflow-auto p-8">
          <div className={`mx-auto transition-all ${
            preview === 'mobile' ? 'max-w-[375px]' : 'max-w-full'
          }`}>
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="bg-gray-900 text-white text-center py-2 px-4 text-xs">
                Free shipping on orders over $50
              </div>

              <div className="border-b border-gray-200 px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="text-2xl font-bold">YourStore</div>
                  <div className="flex items-center gap-4">
                    <Search className="w-5 h-5 text-gray-600" />
                    <ShoppingBag className="w-5 h-5 text-gray-600" />
                  </div>
                </div>
              </div>

              <div className="bg-gray-900 text-white">
                <div className="flex items-center justify-center gap-8 px-6 py-3">
                  {menuItems.map((item) => (
                    <div key={item.id} className="relative group">
                      <button 
                        className={`text-sm hover:text-gray-300 transition-colors flex items-center gap-1 ${
                          selectedItemId === item.id ? 'text-white font-medium' : 'text-gray-300'
                        }`}
                      >
                        {item.label}
                        {item.hasSubmenu && (
                          <ChevronDown className="w-3 h-3" />
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-gray-50 h-64 flex items-center justify-center opacity-50">
                <p className="text-sm text-gray-500">Storefront preview</p>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT PANEL - Settings */}
        <div className="w-80 bg-white border-l border-gray-200 flex flex-col flex-shrink-0">
          <div className="border-b border-gray-200 flex">
            {(['general', 'design', 'content', 'advanced'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 px-4 py-3 text-xs text-center transition-colors border-b-2 ${
                  activeTab === tab
                    ? 'border-indigo-600 text-indigo-600 bg-indigo-50/50'
                    : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                {tab === 'general' && <Settings className="w-4 h-4 mx-auto mb-1" />}
                {tab === 'design' && <Palette className="w-4 h-4 mx-auto mb-1" />}
                {tab === 'content' && <FileText className="w-4 h-4 mx-auto mb-1" />}
                {tab === 'advanced' && <Code className="w-4 h-4 mx-auto mb-1" />}
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            {activeTab === 'general' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs text-gray-600 mb-2">Position</label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
                    <option>Automatic</option>
                    <option>Replace navigation</option>
                    <option>Custom CSS selector</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-gray-600 mb-2">Orientation</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button className="px-3 py-2 border-2 border-indigo-600 bg-indigo-50 text-indigo-600 rounded-lg text-sm">
                      Horizontal
                    </button>
                    <button className="px-3 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-50">
                      Vertical
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'design' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs text-gray-600 mb-2">Background color</label>
                  <div className="flex items-center gap-2">
                    <input type="color" defaultValue="#1f2937" className="w-10 h-10 rounded-lg border border-gray-300 cursor-pointer" />
                    <input type="text" defaultValue="#1f2937" className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-gray-600 mb-2">Text color</label>
                  <div className="flex items-center gap-2">
                    <input type="color" defaultValue="#ffffff" className="w-10 h-10 rounded-lg border border-gray-300 cursor-pointer" />
                    <input type="text" defaultValue="#ffffff" className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'content' && (
              <div className="space-y-3">
                <button className="w-full flex items-center gap-3 px-3 py-3 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 transition-colors">
                  <ShoppingBag className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-700">Add Collection</span>
                </button>
                <button className="w-full flex items-center gap-3 px-3 py-3 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 transition-colors">
                  <Tag className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-700">Add Product</span>
                </button>
                <button className="w-full flex items-center gap-3 px-3 py-3 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 transition-colors">
                  <Image className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-700">Add Image</span>
                </button>
              </div>
            )}

            {activeTab === 'advanced' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs text-gray-600 mb-2">Trigger behavior</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button className="px-3 py-2 border-2 border-indigo-600 bg-indigo-50 text-indigo-600 rounded-lg text-sm">
                      Hover
                    </button>
                    <button className="px-3 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-50">
                      Click
                    </button>
                  </div>
                </div>

                <div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" defaultChecked className="w-4 h-4 rounded border-gray-300 text-indigo-600" />
                    <span className="text-sm text-gray-700">Sticky header</span>
                  </label>
                </div>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
