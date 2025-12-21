import { Mail, MessageCircle, FileText, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';

export default function Support() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const faqs = [
    { 
      q: 'How do I create my first mega menu?', 
      a: 'Navigate to the Menu Builder, click "Create New Menu", and use the visual editor to add items and configure your layout.' 
    },
    { 
      q: 'Can I use MenuCraft with my custom theme?', 
      a: 'Yes! MenuCraft works with all Shopify 2.0 themes and most legacy themes. Check our compatibility guide for details.' 
    },
    { 
      q: 'How do I upgrade to Pro?', 
      a: 'Go to Settings > Pricing and select your desired plan. You can upgrade anytime with just a few clicks.' 
    },
    { 
      q: 'Is there a limit on menu items?', 
      a: 'Free plan allows up to 10 items per menu. Pro and Plus plans have unlimited items.' 
    },
    { 
      q: 'Can I import my existing Shopify menu?', 
      a: 'Yes! Pro and Plus plans include menu import functionality. Go to Menu Builder > Import to get started.' 
    }
  ];

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl text-gray-900">Support & Help</h1>
          <p className="text-gray-600 mt-1">Get help and find answers to common questions</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="text-center space-y-3">
            <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mx-auto">
              <FileText className="w-6 h-6 text-indigo-600" />
            </div>
            <h3 className="text-sm text-gray-900">Documentation</h3>
            <p className="text-xs text-gray-600">Detailed guides and tutorials</p>
            <Button variant="outline" size="sm" className="w-full">View Docs</Button>
          </Card>

          <Card className="text-center space-y-3">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <MessageCircle className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="text-sm text-gray-900">Live Chat</h3>
            <p className="text-xs text-gray-600">Chat with our support team</p>
            <Button variant="outline" size="sm" className="w-full">Start Chat</Button>
          </Card>

          <Card className="text-center space-y-3">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
              <Mail className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-sm text-gray-900">Email Support</h3>
            <p className="text-xs text-gray-600">Get help via email</p>
            <Button variant="outline" size="sm" className="w-full">Send Email</Button>
          </Card>
        </div>

        <Card>
          <h2 className="text-xl text-gray-900 mb-6">Frequently Asked Questions</h2>
          <div className="space-y-3">
            {faqs.map((faq, index) => (
              <div key={index} className="border-b border-gray-200 last:border-0 pb-3">
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

        <Card>
          <h3 className="text-lg text-gray-900 mb-3">Need More Help?</h3>
          <p className="text-sm text-gray-600 mb-4">
            Our support team is available Monday-Friday, 9am-5pm EST. We typically respond within 24 hours.
          </p>
          <Button variant="primary">Contact Support</Button>
        </Card>
      </div>
    </div>
  );
}
