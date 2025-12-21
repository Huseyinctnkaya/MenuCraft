import { CheckCircle2, AlertCircle, ExternalLink } from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';

export default function InstallStatus() {
  const checks = [
    { label: 'Shopify Online Store 2.0', status: 'success', message: 'Theme is compatible' },
    { label: 'App Block Added', status: 'warning', message: 'Action required' },
    { label: 'App Embed Enabled', status: 'warning', message: 'Action required' }
  ];

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl text-gray-900">Install & Theme Status</h1>
          <p className="text-gray-600 mt-1">Ensure MenuCraft is properly integrated with your theme</p>
        </div>

        <Card>
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
                    <p className="text-sm text-gray-900">{check.label}</p>
                    <p className="text-xs text-gray-600">{check.message}</p>
                  </div>
                </div>
                <Badge variant={check.status === 'success' ? 'success' : 'warning'}>
                  {check.status === 'success' ? 'Complete' : 'Pending'}
                </Badge>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <h2 className="text-lg text-gray-900 mb-4">Setup Instructions</h2>
          <div className="space-y-4">
            <div className="p-4 border border-gray-200 rounded-lg">
              <h3 className="text-sm text-gray-900 mb-2">Step 1: Add App Block</h3>
              <p className="text-sm text-gray-600 mb-3">
                Open your theme editor and add the MenuCraft block to your header section
              </p>
              <Button variant="outline" size="sm">
                <ExternalLink className="w-4 h-4" />
                Open Theme Editor
              </Button>
            </div>

            <div className="p-4 border border-gray-200 rounded-lg">
              <h3 className="text-sm text-gray-900 mb-2">Step 2: Enable App Embed</h3>
              <p className="text-sm text-gray-600 mb-3">
                In theme settings, enable the MenuCraft app embed under Theme Extensions
              </p>
              <Button variant="outline" size="sm">
                <ExternalLink className="w-4 h-4" />
                Theme Settings
              </Button>
            </div>
          </div>
        </Card>

        <Card>
          <h2 className="text-lg text-gray-900 mb-3">Theme Information</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Current Theme:</span>
              <span className="text-gray-900">Dawn</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Version:</span>
              <span className="text-gray-900">10.0.0</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">OS 2.0 Compatible:</span>
              <Badge variant="success">Yes</Badge>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
