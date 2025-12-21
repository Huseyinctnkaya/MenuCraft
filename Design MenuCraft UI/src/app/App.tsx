import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Pricing from './pages/Pricing';
import PlanSelection from './pages/PlanSelection';
import Dashboard from './pages/Dashboard';
import MegaMenusList from './pages/MegaMenusList';
import MenuBuilder from './pages/MenuBuilder';
import Templates from './pages/Templates';
import DesignSettings from './pages/DesignSettings';
import InstallStatus from './pages/InstallStatus';
import Analytics from './pages/Analytics';
import Support from './pages/Support';
import AccountSettings from './pages/AccountSettings';
import Changelog from './pages/Changelog';
import TemplateDetail from './pages/TemplateDetail';
import BillingSettings from './pages/BillingSettings';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Standalone page without sidebar */}
        <Route path="/plan-selection" element={<PlanSelection />} />
        
        {/* Pages with sidebar */}
        <Route path="*" element={
          <div className="flex min-h-screen bg-gray-50">
            <Sidebar />
            <main className="flex-1 ml-64">
              <Routes>
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="/pricing" element={<Pricing />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/menus" element={<MegaMenusList />} />
                <Route path="/builder/:id?" element={<MenuBuilder />} />
                <Route path="/templates" element={<Templates />} />
                <Route path="/templates/:id" element={<TemplateDetail />} />
                <Route path="/appearance" element={<DesignSettings />} />
                <Route path="/install" element={<InstallStatus />} />
                <Route path="/analytics" element={<Analytics />} />
                <Route path="/support" element={<Support />} />
                <Route path="/settings" element={<AccountSettings />} />
                <Route path="/billing" element={<BillingSettings />} />
                <Route path="/changelog" element={<Changelog />} />
              </Routes>
            </main>
          </div>
        } />
      </Routes>
    </BrowserRouter>
  );
}