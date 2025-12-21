import type { LoaderFunctionArgs } from "@remix-run/node";
import { useNavigate } from '@remix-run/react';
import { Lock } from 'lucide-react';
import { authenticate } from "../shopify.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await authenticate.admin(request);
  return null;
};

export default function Templates() {
  const navigate = useNavigate();
  
  const templates = [
    { id: 1, name: 'Minimal Fashion', category: 'Fashion', pro: false, new: true },
    { id: 2, name: 'Modern E-commerce', category: 'General', pro: true, new: false },
    { id: 3, name: 'Tech Store', category: 'Electronics', pro: true, new: true },
    { id: 4, name: 'Simple Navigation', category: 'Minimal', pro: false, new: false },
    { id: 5, name: 'Mega Store', category: 'Enterprise', pro: true, new: false },
    { id: 6, name: 'Boutique Menu', category: 'Fashion', pro: true, new: true }
  ];

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Template Library</h1>
          <p className="text-gray-600 mt-1">Start with a pre-built template and customize it</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {templates.map((template) => (
            <div
              key={template.id}
              onClick={() => navigate(`/app/templates`)}
              className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group"
            >
              <div className="aspect-video bg-gradient-to-br from-indigo-100 to-purple-100 rounded-t-lg mb-4 relative">
                {template.pro && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-t-lg">
                    <div className="text-center text-white">
                      <Lock className="w-8 h-8 mx-auto mb-2" />
                      <p className="text-sm font-medium">Pro Template</p>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="p-6 space-y-3">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-gray-900">{template.name}</h3>
                  {template.new && (
                    <span className="inline-flex items-center rounded-md bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                      New
                    </span>
                  )}
                  {template.pro && (
                    <span className="inline-flex items-center rounded-md bg-indigo-100 px-2 py-0.5 text-xs font-medium text-indigo-700">
                      Pro
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-600">{template.category}</p>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    template.pro ? navigate('/app/pricing') : navigate(`/app/menu-builder`);
                  }}
                  className={`w-full py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                    template.pro 
                      ? 'border border-gray-300 text-gray-700 hover:bg-gray-50' 
                      : 'bg-indigo-600 text-white hover:bg-indigo-700'
                  }`}
                >
                  {template.pro ? 'Upgrade to Use' : 'Use Template'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
