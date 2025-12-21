import { CreditCard, User, Globe } from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';

export default function AccountSettings() {
  return (
    <div className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl text-gray-900">Account Settings</h1>
          <p className="text-gray-600 mt-1">Manage your account and preferences</p>
        </div>

        <Card>
          <div className="flex items-start gap-4 mb-6">
            <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center">
              <User className="w-6 h-6 text-indigo-600" />
            </div>
            <div className="flex-1">
              <h2 className="text-lg text-gray-900">Current Plan</h2>
              <div className="flex items-center gap-3 mt-2">
                <Badge variant="pro">Pro Plan</Badge>
                <span className="text-sm text-gray-600">$12/month</span>
              </div>
            </div>
            <Button variant="outline" onClick={() => window.location.href = '/pricing'}>
              Change Plan
            </Button>
          </div>
          
          <div className="pt-6 border-t border-gray-200 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Next billing date</span>
              <span className="text-gray-900">January 17, 2026</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Payment method</span>
              <span className="text-gray-900">•••• 4242</span>
            </div>
          </div>
        </Card>

        <Card>
          <h2 className="text-lg text-gray-900 mb-4 flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Billing
          </h2>
          <div className="space-y-3">
            <Button variant="outline" className="w-full justify-start">
              Update Payment Method
            </Button>
            <Button variant="outline" className="w-full justify-start">
              Download Invoices
            </Button>
          </div>
        </Card>

        <Card>
          <h2 className="text-lg text-gray-900 mb-4 flex items-center gap-2">
            <Globe className="w-5 h-5" />
            Preferences
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-700 mb-2">Language</label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
                <option>English</option>
                <option>Spanish</option>
                <option>French</option>
                <option>German</option>
              </select>
            </div>
            
            <label className="flex items-center justify-between">
              <span className="text-sm text-gray-700">Email notifications</span>
              <input type="checkbox" className="w-4 h-4" defaultChecked />
            </label>
            
            <label className="flex items-center justify-between">
              <span className="text-sm text-gray-700">Marketing emails</span>
              <input type="checkbox" className="w-4 h-4" />
            </label>
          </div>
        </Card>

        <Card>
          <h2 className="text-lg text-gray-900 mb-3">Danger Zone</h2>
          <p className="text-sm text-gray-600 mb-4">
            Uninstalling MenuCraft will remove all menus and settings. This action cannot be undone.
          </p>
          <Button variant="outline" className="text-red-600 border-red-300 hover:bg-red-50">
            Uninstall App
          </Button>
        </Card>
      </div>
    </div>
  );
}
