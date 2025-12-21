import type { LoaderFunctionArgs } from "@remix-run/node";
import { CheckCircle2, AlertCircle, ExternalLink } from 'lucide-react';
import { authenticate } from "../shopify.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await authenticate.admin(request);
  return null;
};

export default function InstallStatus() {
  const checks = [
    { label: 'Shopify Online Store 2.0', status: 'success', message: 'Theme is compatible' },
    { label: 'App Block Added', status: 'warning', message: 'Action required' },
    { label: 'App Embed Enabled', status: 'warning', message: 'Action required' }
  ];

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Install & Theme Status</h1>
          <p className="text-gray-600 mt-1">Ensure MenuCraft is properly integrated with your theme</p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="space-y-4">
            {checks.map((check, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  {check.status === 'success' ? (
                    <CheckCircle2 className="w-6 h-6 text-green-600" />
                  ) : (
                    <AlertCircle className="w-6 h-6 text-amber-500" />
                  )}
                  <div>
                    <p className="text-sm font-medium text-gray-900">{check.label}</p>
                    <p className="text-xs text-gray-600">{check.message}</p>
                  </div>
                </div>
                <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${
                  check.status === 'success'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-yellow-100 text-yellow-700'
                }`}>
                  {check.status === 'success' ? 'Complete' : 'Pending'}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Setup Instructions</h2>
          <div className="space-y-4">
            <div className="p-4 border border-gray-200 rounded-lg">
              <h3 className="text-sm font-semibold text-gray-900 mb-2">Step 1: Add App Block</h3>
              <p className="text-sm text-gray-600 mb-3">
                Open your theme editor and add the MenuCraft block to your header section
              </p>
              <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-50 transition-colors flex items-center gap-2">
                <ExternalLink className="w-4 h-4" />
                Open Theme Editor
              </button>
            </div>

            <div className="p-4 border border-gray-200 rounded-lg">
              <h3 className="text-sm font-semibold text-gray-900 mb-2">Step 2: Enable App Embed</h3>
              <p className="text-sm text-gray-600 mb-3">
                In theme settings, enable the MenuCraft app embed under Theme Extensions
              </p>
              <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-50 transition-colors flex items-center gap-2">
                <ExternalLink className="w-4 h-4" />
                Theme Settings
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Theme Information</h2>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between pb-3 border-b border-gray-200">
              <span className="text-gray-600">Current Theme:</span>
              <span className="font-medium text-gray-900">Dawn</span>
            </div>
            <div className="flex justify-between pb-3 border-b border-gray-200">
              <span className="text-gray-600">Version:</span>
              <span className="font-medium text-gray-900">10.0.0</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">OS 2.0 Compatible:</span>
              <span className="inline-flex items-center rounded-md bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                Yes
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
