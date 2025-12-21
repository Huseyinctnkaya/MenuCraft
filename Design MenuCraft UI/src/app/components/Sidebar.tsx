import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Menu, 
  Wand2, 
  LayoutTemplate, 
  Palette, 
  Download, 
  BarChart3, 
  HelpCircle, 
  Settings,
  CreditCard,
  LayoutGrid
} from 'lucide-react';
import { cn } from '../lib/utils';

const navItems = [
  { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/analytics', icon: BarChart3, label: 'Analytics' },
  { path: '/menus', icon: Menu, label: 'Mega Menus' },
  { path: '/builder', icon: Wand2, label: 'Menu Builder' },
  { path: '/templates', icon: LayoutTemplate, label: 'Templates' },
  { path: '/install', icon: Download, label: 'Install & Theme Status' },
  { path: '/pricing', icon: CreditCard, label: 'Pricing & Plans' },
  { path: '/appearance', icon: Palette, label: 'Appearance' },
  { path: '/support', icon: HelpCircle, label: 'Support' },
  { path: '/settings', icon: Settings, label: 'Settings' },
];

export default function Sidebar() {
  const location = useLocation();

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-white border-r border-gray-200 overflow-y-auto">
      <div className="p-6">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center">
            <LayoutGrid className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-xl text-gray-900">MenuCraft</h1>
        </div>

        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path || 
                           (item.path === '/builder' && location.pathname.startsWith('/builder'));
            
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors",
                  isActive
                    ? "bg-indigo-50 text-indigo-600"
                    : "text-gray-700 hover:bg-gray-50"
                )}
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