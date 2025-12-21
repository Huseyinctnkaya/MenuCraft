import { useState } from 'react';
import type { LoaderFunctionArgs } from "@remix-run/node";
import { Calendar, TrendingUp, BarChart3, MousePointer, Eye } from 'lucide-react';
import { authenticate } from "../shopify.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await authenticate.admin(request);
  return null;
};

export default function Analytics() {
  const [dateRange, setDateRange] = useState('Last 7 days');

  const stats = [
    { label: 'Total Clicks', value: '1,234', change: '+12%', icon: MousePointer },
    { label: 'Total Views', value: '5,678', change: '+8%', icon: Eye },
    { label: 'Click-Through Rate', value: '21.7%', change: '+3%', icon: TrendingUp }
  ];

  const topMenus = [
    { name: 'Main Navigation', clicks: 892, ctr: '27.5%' },
    { name: 'Shop Mega Menu', clicks: 745, ctr: '24.3%' },
    { name: 'Footer Menu', clicks: 234, ctr: '12.4%' },
    { name: 'Mobile Menu', clicks: 189, ctr: '18.9%' },
    { name: 'Sidebar Menu', clicks: 108, ctr: '15.2%' }
  ];

  const topLinks = [
    { label: 'Shop All', clicks: 423, type: 'Collection' },
    { label: 'New Arrivals', clicks: 312, type: 'Collection' },
    { label: 'Sale', clicks: 289, type: 'Collection' },
    { label: 'Best Sellers', clicks: 234, type: 'Product' },
    { label: 'About Us', clicks: 156, type: 'Page' }
  ];

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
            <p className="text-gray-600 mt-1">Track how MenuCraft impacts navigation engagement</p>
          </div>
          <div className="relative">
            <select 
              className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-10 text-sm text-gray-900 cursor-pointer hover:border-gray-400 transition-colors"
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
            >
              <option>Last 7 days</option>
              <option>Last 30 days</option>
              <option>Last 90 days</option>
            </select>
            <Calendar className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div key={index} className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-gray-600">{stat.label}</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">{stat.value}</p>
                    <p className="text-xs text-green-600 mt-1">{stat.change} from last period</p>
                  </div>
                  <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                    <Icon className="w-5 h-5 text-indigo-600" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Top Performing Menus & Links */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Menus */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Top Performing Menus</h2>
            <div className="space-y-3">
              {topMenus.map((menu, index) => (
                <div key={index} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{menu.name}</p>
                    <p className="text-xs text-gray-600">{menu.clicks} clicks</p>
                  </div>
                  <span className="text-sm font-semibold text-indigo-600">{menu.ctr}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Top Links */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Top Links</h2>
            <div className="space-y-3">
              {topLinks.map((link, index) => (
                <div key={index} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{link.label}</p>
                    <p className="text-xs text-gray-600">{link.type}</p>
                  </div>
                  <span className="text-sm font-semibold text-green-600">{link.clicks}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
