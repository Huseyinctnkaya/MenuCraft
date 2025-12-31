import { useState } from "react";
import type { LoaderFunctionArgs } from "@remix-run/node";
import { useLocation, useNavigate } from "@remix-run/react";
import { ChevronDown, ChevronUp, FileText, Mail, MessageCircle } from "lucide-react";
import { authenticate } from "../shopify.server";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await authenticate.admin(request);
  return null;
};

export default function Support() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  const withSearch = (path: string) => ({ pathname: path, search: location.search });

  const faqs = [
    {
      q: "How do I create my first mega menu?",
      a: "Navigate to the Mega Menus page, click 'Create New Menu', and use the visual editor to add items and configure your layout.",
    },
    {
      q: "Can I use MenuCraft with my custom theme?",
      a: "Yes. MenuCraft works with all Shopify 2.0 themes and most legacy themes. Check the Install & Theme Status page for compatibility.",
    },
    {
      q: "How do I upgrade to Pro?",
      a: "Go to Pricing & Plans and select your desired plan. You can upgrade anytime with a few clicks.",
    },
    {
      q: "Is there a limit on menu items?",
      a: "Free plan allows one menu. Pro and Plus plans include unlimited menus and more advanced styling options.",
    },
    {
      q: "Can I import my existing Shopify menu?",
      a: "Yes. Pro and Plus plans include menu import functionality. Go to the Menu Builder and choose Import.",
    },
  ];

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl text-gray-900">Support & Help</h1>
          <p className="text-gray-600 mt-1">Get help and find answers to common questions</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="text-center space-y-3 p-6">
            <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mx-auto">
              <FileText className="w-6 h-6 text-indigo-600" />
            </div>
            <h3 className="text-sm text-gray-900">Documentation</h3>
            <p className="text-xs text-gray-600">Detailed guides and tutorials</p>
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => navigate(withSearch("/app/documentation"))}
            >
              View Docs
            </Button>
          </Card>

          <Card className="text-center space-y-3 p-6">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <MessageCircle className="w-6 h-6 text-green-600" />
            </div>
            <div className="flex items-center justify-center gap-2">
              <h3 className="text-sm text-gray-900">Live Chat</h3>
              <Badge variant="new">Soon</Badge>
            </div>
            <p className="text-xs text-gray-600">In-app chat is coming soon</p>
            <Button variant="outline" size="sm" className="w-full" disabled>
              Start Chat
            </Button>
          </Card>

          <Card className="text-center space-y-3 p-6">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
              <Mail className="w-6 h-6 text-blue-600" />
            </div>
            <div className="flex items-center justify-center gap-2">
              <h3 className="text-sm text-gray-900">Email Support</h3>
              <Badge variant="new">Soon</Badge>
            </div>
            <p className="text-xs text-gray-600">We will add email support shortly</p>
            <Button variant="outline" size="sm" className="w-full" disabled>
              Send Email
            </Button>
          </Card>
        </div>

        <Card className="p-6">
          <h2 className="text-xl text-gray-900 mb-2">Frequently Asked Questions</h2>
          <div className="space-y-3">
            {faqs.map((faq, index) => (
              <div key={faq.q} className="border-b border-gray-200 last:border-0 pb-3">
                <button
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                  className="w-full flex items-center justify-between text-left py-2"
                >
                  <span className="text-sm text-gray-900">{faq.q}</span>
                  {openFaq === index ? (
                    <ChevronUp className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  )}
                </button>
                {openFaq === index && (
                  <p className="text-sm text-gray-600 mt-2 pr-6">{faq.a}</p>
                )}
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-2">
            <h3 className="text-lg text-gray-900">Need More Help?</h3>
            <Badge variant="new">Coming soon</Badge>
          </div>
          <p className="text-sm text-gray-600 mb-2">
            Our support team is available Monday-Friday, 9am-5pm EST. We typically respond within 24 hours.
          </p>
          <Button variant="primary" disabled>
            Contact Support
          </Button>
        </Card>
      </div>
    </div>
  );
}
