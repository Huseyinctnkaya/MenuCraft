import { useState } from 'react';
import type { LoaderFunctionArgs } from "@remix-run/node";
import { Plus, MoreVertical, Copy, Trash2, Eye, EyeOff, Edit } from 'lucide-react';
import { useNavigate } from '@remix-run/react';
import { authenticate } from "../shopify.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await authenticate.admin(request);
  return null;
};

export default function MegaMenusList() {
  const navigate = useNavigate();
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  
  const [menus] = useState([
    { id: 1, name: 'Main Navigation', status: 'active', items: 12, views: 1250 },
    { id: 2, name: 'Footer Menu', status: 'draft', items: 8, views: 0 },
    { id: 3, name: 'Mobile Menu', status: 'active', items: 15, views: 890 }
  ]);

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Mega Menus</h1>
            <p className="text-gray-600 mt-1">Manage all your mega menus and dropdowns</p>
          </div>
          <button onClick={() => navigate('/app/menu-builder')} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium text-sm flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Create New Menu
          </button>
        </div>

        {/* Menus Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {menus.map((menu) => (
            <div key={menu.id} className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-gray-900">{menu.name}</h3>
                  <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium mt-2 ${
                    menu.status === 'active' 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    {menu.status === 'active' ? '✓ Active' : '• Draft'}
                  </span>
                </div>
                
                <div className="relative">
                  <button 
                    onClick={() => setOpenMenuId(openMenuId === menu.id ? null : menu.id)}
                    className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <MoreVertical className="w-5 h-5 text-gray-400" />
                  </button>
                  
                  {openMenuId === menu.id && (
                    <div className="absolute right-0 mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                      <button className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center gap-2 text-sm text-gray-700 border-b border-gray-100">
                        <Edit className="w-4 h-4" />
                        Edit
                      </button>
                      <button className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center gap-2 text-sm text-gray-700 border-b border-gray-100">
                        <Copy className="w-4 h-4" />
                        Duplicate
                      </button>
                      <button className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center gap-2 text-sm text-gray-700">
                        <Trash2 className="w-4 h-4 text-red-600" />
                        <span className="text-red-600">Delete</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100">
                <div>
                  <p className="text-xs text-gray-600">Items</p>
                  <p className="text-xl font-bold text-gray-900">{menu.items}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Views</p>
                  <p className="text-xl font-bold text-gray-900">{menu.views}</p>
                </div>
              </div>

              <div className="mt-4 flex gap-2">
                <button onClick={() => navigate('/app/menu-builder')} className="flex-1 px-3 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 transition-colors">
                  Edit
                </button>
                <button className="flex-1 px-3 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-50 transition-colors">
                  Preview
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {menus.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-600 mb-4">No menus created yet</p>
            <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
              Create Your First Menu
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
