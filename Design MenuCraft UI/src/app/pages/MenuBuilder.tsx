import { useState } from 'react';
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
  Menu,
  ArrowLeft,
  Power,
  Settings,
  Palette,
  FileText,
  Code,
  Search,
  ShoppingBag,
  Image,
  Tag,
  Home,
  Newspaper,
  Info
} from 'lucide-react';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';

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
      {/* TOP BAR - Editor Controls */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-4">
          <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </button>
          
          <div className="flex items-center gap-3">
            <h1 className="text-gray-900">Mega Menu #160205</h1>
            <Badge variant={menuEnabled ? 'success' : 'default'}>
              {menuEnabled ? 'Active' : 'Draft'}
            </Badge>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Enable/Disable Toggle */}
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

          {/* Preview Toggle */}
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

          <Button variant="outline" size="sm">
            <Eye className="w-4 h-4" />
            Preview
          </Button>
          
          <Button variant="outline" size="sm">
            Save
          </Button>
          
          <Button variant="primary" size="sm">
            Publish
          </Button>
        </div>
      </div>

      {/* MAIN 3-PANEL LAYOUT */}
      <div className="flex flex-1 overflow-hidden">
        
        {/* LEFT PANEL - Menu Structure Tree */}
        <div className="w-80 bg-white border-r border-gray-200 flex flex-col flex-shrink-0">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-sm text-gray-900">Menu Items</h2>
              <Button size="sm" variant="ghost">
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-xs text-gray-500">Drag to reorder items</p>
          </div>
          
          <div className="flex-1 overflow-y-auto p-3">
            <div className="space-y-1">
              {menuItems.map(item => renderMenuItem(item))}
            </div>
          </div>

          <div className="p-3 border-t border-gray-200">
            <Button variant="outline" size="sm" className="w-full">
              <Plus className="w-4 h-4" />
              Add Menu Item
            </Button>
          </div>
        </div>

        {/* CENTER - Live Preview Canvas */}
        <div className="flex-1 bg-gray-100 overflow-auto p-8">
          <div className={`mx-auto transition-all ${
            preview === 'mobile' ? 'max-w-[375px]' : 'max-w-full'
          }`}>
            {/* Simulated Storefront Header */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              {/* Top announcement bar */}
              <div className="bg-gray-900 text-white text-center py-2 px-4">
                <p className="text-xs">Free shipping on orders over $50</p>
              </div>

              {/* Header */}
              <div className="border-b border-gray-200 px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="text-2xl">YourStore</div>
                  <div className="flex items-center gap-4">
                    <Search className="w-5 h-5 text-gray-600" />
                    <ShoppingBag className="w-5 h-5 text-gray-600" />
                  </div>
                </div>
              </div>

              {/* Navigation Bar - The actual menu preview */}
              <div className="bg-gray-900 text-white">
                <div className="flex items-center justify-center gap-8 px-6 py-3">
                  {menuItems.map((item, index) => (
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
                      
                      {/* Mega Menu Dropdown Preview - shown on hover for selected item */}
                      {item.hasSubmenu && selectedItemId === item.id && (
                        <div className="absolute top-full left-0 mt-0 w-[600px] bg-white text-gray-900 shadow-xl rounded-b-lg border border-gray-200">
                          <div className="p-6">
                            <div className="grid grid-cols-3 gap-6">
                              {/* Column 1 */}
                              <div>
                                <h3 className="text-sm text-gray-900 mb-3">Categories</h3>
                                <ul className="space-y-2">
                                  {item.children?.map(child => (
                                    <li key={child.id}>
                                      <a className="text-sm text-gray-600 hover:text-indigo-600">
                                        {child.label}
                                      </a>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                              
                              {/* Column 2 */}
                              <div>
                                <h3 className="text-sm text-gray-900 mb-3">Featured</h3>
                                <div className="space-y-3">
                                  <div className="aspect-square bg-gray-100 rounded-lg" />
                                  <p className="text-xs text-gray-600">Featured Collection</p>
                                </div>
                              </div>
                              
                              {/* Column 3 */}
                              <div>
                                <h3 className="text-sm text-gray-900 mb-3">Trending</h3>
                                <div className="space-y-3">
                                  <div className="aspect-square bg-gray-100 rounded-lg" />
                                  <p className="text-xs text-gray-600">New Arrivals</p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Hero area - dimmed to focus on menu */}
              <div className="bg-gray-50 h-64 flex items-center justify-center opacity-50">
                <p className="text-sm text-gray-500">Storefront preview area</p>
              </div>
            </div>

            {/* Mobile Preview */}
            {preview === 'mobile' && (
              <div className="mt-4 text-center">
                <p className="text-xs text-gray-500">Mobile Preview (375px)</p>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT PANEL - Settings (Tabbed) */}
        <div className="w-80 bg-white border-l border-gray-200 flex flex-col flex-shrink-0">
          {/* Tabs */}
          <div className="border-b border-gray-200 flex">
            <button
              onClick={() => setActiveTab('general')}
              className={`flex-1 px-4 py-3 text-xs transition-colors border-b-2 ${
                activeTab === 'general'
                  ? 'border-indigo-600 text-indigo-600 bg-indigo-50/50'
                  : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <Settings className="w-4 h-4 mx-auto mb-1" />
              General
            </button>
            <button
              onClick={() => setActiveTab('design')}
              className={`flex-1 px-4 py-3 text-xs transition-colors border-b-2 ${
                activeTab === 'design'
                  ? 'border-indigo-600 text-indigo-600 bg-indigo-50/50'
                  : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <Palette className="w-4 h-4 mx-auto mb-1" />
              Design
            </button>
            <button
              onClick={() => setActiveTab('content')}
              className={`flex-1 px-4 py-3 text-xs transition-colors border-b-2 ${
                activeTab === 'content'
                  ? 'border-indigo-600 text-indigo-600 bg-indigo-50/50'
                  : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <FileText className="w-4 h-4 mx-auto mb-1" />
              Content
            </button>
            <button
              onClick={() => setActiveTab('advanced')}
              className={`flex-1 px-4 py-3 text-xs transition-colors border-b-2 ${
                activeTab === 'advanced'
                  ? 'border-indigo-600 text-indigo-600 bg-indigo-50/50'
                  : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <Code className="w-4 h-4 mx-auto mb-1" />
              Advanced
            </button>
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-y-auto p-4">
            
            {/* GENERAL TAB */}
            {activeTab === 'general' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm text-gray-900 mb-4">General Settings</h3>
                  
                  <div className="space-y-4">
                    {/* Position */}
                    <div>
                      <label className="block text-xs text-gray-600 mb-2">Position</label>
                      <select className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
                        <option>Automatic</option>
                        <option>Replace navigation</option>
                        <option>Custom CSS selector</option>
                      </select>
                      <p className="text-xs text-gray-500 mt-1">Where the menu appears on your store</p>
                    </div>

                    {/* Orientation */}
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

                    {/* Alignment */}
                    <div>
                      <label className="block text-xs text-gray-600 mb-2">Alignment</label>
                      <div className="grid grid-cols-3 gap-2">
                        <button className="px-3 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-50">
                          Left
                        </button>
                        <button className="px-3 py-2 border-2 border-indigo-600 bg-indigo-50 text-indigo-600 rounded-lg text-sm">
                          Center
                        </button>
                        <button className="px-3 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-50">
                          Right
                        </button>
                      </div>
                    </div>

                    {/* Max Width */}
                    <div>
                      <label className="block text-xs text-gray-600 mb-2">Max menu width</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                          placeholder="1200"
                          defaultValue="1200"
                        />
                        <span className="text-sm text-gray-500">px</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Elements Section */}
                <div>
                  <h3 className="text-sm text-gray-900 mb-4">Elements</h3>
                  
                  <div className="space-y-3">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" defaultChecked />
                      <span className="text-sm text-gray-700">Show search box</span>
                    </label>
                    
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" defaultChecked />
                      <span className="text-sm text-gray-700">Show divider on desktop</span>
                    </label>
                    
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                      <span className="text-sm text-gray-700">Show divider on mobile</span>
                    </label>
                    
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" defaultChecked />
                      <span className="text-sm text-gray-700">Show dropdown indicators</span>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* DESIGN TAB */}
            {activeTab === 'design' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm text-gray-900 mb-4">Design Settings</h3>
                  
                  <div className="space-y-4">
                    {/* Background Color */}
                    <div>
                      <label className="block text-xs text-gray-600 mb-2">Background color</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          className="w-10 h-10 rounded-lg border border-gray-300 cursor-pointer"
                          defaultValue="#1f2937"
                        />
                        <input
                          type="text"
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                          defaultValue="#1f2937"
                        />
                      </div>
                    </div>

                    {/* Text Color */}
                    <div>
                      <label className="block text-xs text-gray-600 mb-2">Text color</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          className="w-10 h-10 rounded-lg border border-gray-300 cursor-pointer"
                          defaultValue="#ffffff"
                        />
                        <input
                          type="text"
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                          defaultValue="#ffffff"
                        />
                      </div>
                    </div>

                    {/* Hover Color */}
                    <div>
                      <label className="block text-xs text-gray-600 mb-2">Hover color</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          className="w-10 h-10 rounded-lg border border-gray-300 cursor-pointer"
                          defaultValue="#4f46e5"
                        />
                        <input
                          type="text"
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                          defaultValue="#4f46e5"
                        />
                      </div>
                    </div>

                    {/* Layout Style */}
                    <div>
                      <label className="block text-xs text-gray-600 mb-2">Layout style</label>
                      <div className="grid grid-cols-2 gap-2">
                        <button className="px-3 py-2 border-2 border-indigo-600 bg-indigo-50 text-indigo-600 rounded-lg text-sm">
                          Full width
                        </button>
                        <button className="px-3 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-50">
                          Boxed
                        </button>
                      </div>
                    </div>

                    {/* Spacing */}
                    <div>
                      <label className="block text-xs text-gray-600 mb-2">Vertical spacing</label>
                      <input
                        type="range"
                        min="0"
                        max="40"
                        defaultValue="12"
                        className="w-full"
                      />
                      <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>Compact</span>
                        <span>12px</span>
                        <span>Spacious</span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs text-gray-600 mb-2">Horizontal spacing</label>
                      <input
                        type="range"
                        min="0"
                        max="60"
                        defaultValue="32"
                        className="w-full"
                      />
                      <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>Compact</span>
                        <span>32px</span>
                        <span>Spacious</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* CONTENT TAB */}
            {activeTab === 'content' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm text-gray-900 mb-4">Content Settings</h3>
                  
                  <div className="space-y-4">
                    {/* Link List Selector */}
                    <div>
                      <label className="block text-xs text-gray-600 mb-2">Link list</label>
                      <select className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
                        <option>Main menu</option>
                        <option>Footer menu</option>
                        <option>Custom menu</option>
                      </select>
                      <p className="text-xs text-gray-500 mt-1">Select which Shopify menu to display</p>
                    </div>

                    {/* Featured Content */}
                    <div>
                      <label className="block text-xs text-gray-600 mb-4">Featured content</label>
                      
                      <div className="space-y-2">
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
                        
                        <button className="w-full flex items-center gap-3 px-3 py-3 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 transition-colors">
                          <Tag className="w-4 h-4 text-gray-500" />
                          <span className="text-gray-700">Add Badge/Label</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ADVANCED TAB */}
            {activeTab === 'advanced' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm text-gray-900 mb-4">Advanced Settings</h3>
                  
                  <div className="space-y-4">
                    {/* Trigger */}
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
                      <p className="text-xs text-gray-500 mt-1">How dropdowns are opened</p>
                    </div>

                    {/* Mobile Behavior */}
                    <div>
                      <label className="block text-xs text-gray-600 mb-2">Mobile behavior</label>
                      <select className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
                        <option>Accordion</option>
                        <option>Drawer</option>
                        <option>Full screen</option>
                      </select>
                    </div>

                    {/* Sticky Header */}
                    <div>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" defaultChecked />
                        <span className="text-sm text-gray-700">Sticky header integration</span>
                      </label>
                      <p className="text-xs text-gray-500 mt-1 ml-6">Menu stays visible on scroll</p>
                    </div>

                    {/* Replace or Append */}
                    <div>
                      <label className="block text-xs text-gray-600 mb-2">Menu placement</label>
                      <div className="space-y-2">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input type="radio" name="placement" className="w-4 h-4 border-gray-300 text-indigo-600 focus:ring-indigo-500" defaultChecked />
                          <span className="text-sm text-gray-700">Replace existing menu</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input type="radio" name="placement" className="w-4 h-4 border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                          <span className="text-sm text-gray-700">Append to existing menu</span>
                        </label>
                      </div>
                    </div>

                    {/* Developer Note */}
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                      <p className="text-xs text-gray-600">
                        <Code className="w-3 h-3 inline mr-1" />
                        <strong>Developer hint:</strong> For custom CSS selectors, use standard DOM selectors like <code className="bg-white px-1 rounded">#header-nav</code> or <code className="bg-white px-1 rounded">.site-navigation</code>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
