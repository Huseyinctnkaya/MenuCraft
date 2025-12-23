import { useState } from "react";
import { useLocation, useNavigate } from "@remix-run/react";
import type { LoaderFunctionArgs } from "@remix-run/node";
import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Download,
  Menu,
  Shield,
  Smartphone,
  Star,
} from "lucide-react";
import { authenticate } from "../shopify.server";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await authenticate.admin(request);
  return null;
};

export default function Dashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const withSearch = (path: string) => ({
    pathname: path,
    search: location.search,
  });

  const features = [
    {
      icon: Menu,
      title: "Create Mega Menu",
      description: "Build powerful navigation menus with unlimited depth and customization",
      action: () => navigate(withSearch("/app/menu-builder")),
    },
    {
      icon: Smartphone,
      title: "Mobile Menu",
      description: "Responsive mobile-first menus optimized for all devices",
      badge: "Pro",
      action: () => navigate(withSearch("/app/pricing")),
    },
    {
      icon: Download,
      title: "Import Menu",
      description: "Import existing menus from your Shopify store instantly",
      badge: "Pro",
      action: () => navigate(withSearch("/app/pricing")),
    },
  ];

  const setupSteps = [
    { title: "Create your first menu", completed: false },
    { title: "Add menu block to your theme", completed: false },
    { title: "Publish and go live", completed: false },
  ];

  const faqs = [
    {
      q: "How do I install MenuCraft?",
      a: 'Simply click "Get Started" and follow the installation wizard. MenuCraft integrates seamlessly with your Shopify theme.',
    },
    {
      q: "Can I try MenuCraft for free?",
      a: "Yes! MenuCraft offers a free plan with essential features. Upgrade anytime to unlock Pro features.",
    },
    {
      q: "What themes are supported?",
      a: "MenuCraft works with all Shopify 2.0 themes and most legacy themes. Check our compatibility guide for details.",
    },
    {
      q: "Do I need coding skills?",
      a: "Not at all! MenuCraft features an intuitive visual builder that anyone can use.",
    },
  ];

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="text-center py-8 flex flex-col items-center gap-4">
          <h1 className="!text-[32px] !leading-tight font-semibold text-gray-900">
            Welcome to MenuCraft
          </h1>
          <p className="!text-[18px] !leading-7 text-gray-600 max-w-2xl mx-auto">
            Create stunning mega menus that boost navigation and increase conversions for your Shopify store
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <Card
              key={index}
              className="text-center gap-4 hover:shadow-md transition-shadow cursor-pointer p-6"
              onClick={feature.action}
            >
              <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto">
                <feature.icon className="w-8 h-8 text-indigo-600" />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-center gap-2">
                  <h3 className="text-lg text-gray-900">{feature.title}</h3>
                  {feature.badge && <Badge variant="pro">{feature.badge}</Badge>}
                </div>
                <p className="text-sm text-gray-600">{feature.description}</p>
              </div>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 tracking-tight mb-4">
              App Status
            </h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-500" />
                  <div>
                    <p className="text-sm text-gray-900">Installation Status</p>
                    <p className="text-xs text-gray-600">Theme integration pending</p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate(withSearch("/app/install-status"))}
                >
                  Configure
                </Button>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm text-gray-900">Connected Theme</p>
                  <p className="text-xs text-gray-600">Dawn 10.0.0</p>
                </div>
                <Badge variant="success">Active</Badge>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="text-lg text-gray-900 mb-4">Setup Checklist</h2>
            <div className="space-y-3">
              {setupSteps.map((step, index) => (
                <div key={index} className="flex items-center gap-3">
                  {step.completed ? (
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                  ) : (
                    <div className="w-5 h-5 rounded-full border-2 border-gray-300" />
                  )}
                  <span
                    className={`text-sm ${step.completed ? "text-gray-600 line-through" : "text-gray-900"}`}
                  >
                    {step.title}
                  </span>
                </div>
              ))}
              <Button
                variant="outline"
                size="sm"
                className="w-full mt-4"
                onClick={() => navigate(withSearch("/app/menu-builder"))}
              >
                Continue Setup
              </Button>
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center gap-3 p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
            <div className="w-8 h-8 bg-green-50 rounded-full flex items-center justify-center flex-shrink-0">
              <Shield className="w-4 h-4 text-green-600" />
            </div>
            <p className="text-sm text-gray-700">30-day money back guarantee</p>
          </div>

          <div className="flex items-center gap-3 p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
            <div className="w-8 h-8 bg-indigo-50 rounded-full flex items-center justify-center flex-shrink-0">
              <Star className="w-4 h-4 text-indigo-600" />
            </div>
            <p className="text-sm text-gray-700">Built for Shopify by Shopify Experts</p>
          </div>
        </div>

        <Card className="p-6">
          <h2 className="text-xl text-gray-900 mb-2">Frequently Asked Questions</h2>
          <div className="space-y-3">
            {faqs.map((faq, index) => (
              <div key={index} className="border-b border-gray-200 last:border-0 pb-3">
                <button
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                  className="w-full flex items-center justify-between text-left py-2"
                >
                  <span className="text-sm text-gray-900">{faq.q}</span>
                  {openFaq === index ? (
                    <ChevronUp className="w-5 h-5 text-gray-400" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  )}
                </button>
                {openFaq === index && (
                  <p className="text-sm text-gray-600 mt-2">{faq.a}</p>
                )}
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
