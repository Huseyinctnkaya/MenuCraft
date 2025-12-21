import { useParams, useNavigate } from 'react-router-dom';
import { Check, ArrowLeft } from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';

export default function TemplateDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const template = {
    name: 'Minimal Fashion',
    category: 'Fashion',
    description: 'Clean and elegant mega menu design perfect for fashion and lifestyle brands',
    features: [
      'Responsive grid layout',
      'Featured product displays',
      'Image-heavy navigation',
      'Hover animations',
      'Mobile-optimized'
    ],
    useCases: [
      'Fashion boutiques',
      'Lifestyle brands',
      'Luxury retailers',
      'Apparel stores'
    ],
    pro: false
  };

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        <Button variant="ghost" onClick={() => navigate('/templates')}>
          <ArrowLeft className="w-4 h-4" />
          Back to Templates
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card padding="none" className="overflow-hidden">
              <div className="aspect-video bg-gradient-to-br from-indigo-100 to-purple-100" />
            </Card>

            <Card>
              <h2 className="text-xl text-gray-900 mb-3">About This Template</h2>
              <p className="text-sm text-gray-600 mb-6">{template.description}</p>

              <h3 className="text-sm text-gray-900 mb-3">Key Features</h3>
              <ul className="space-y-2">
                {template.features.map((feature, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm text-gray-700">
                    <Check className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                    {feature}
                  </li>
                ))}
              </ul>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <h1 className="text-2xl text-gray-900">{template.name}</h1>
                    {template.pro && <Badge variant="pro">Pro</Badge>}
                  </div>
                  <p className="text-sm text-gray-600">{template.category}</p>
                </div>

                <Button 
                  className="w-full" 
                  onClick={() => navigate(`/builder?template=${id}`)}
                >
                  Use This Template
                </Button>

                {template.pro && (
                  <p className="text-xs text-gray-600 text-center">
                    Requires Pro or Plus plan
                  </p>
                )}
              </div>
            </Card>

            <Card>
              <h3 className="text-sm text-gray-900 mb-3">Perfect For</h3>
              <div className="flex flex-wrap gap-2">
                {template.useCases.map((useCase, index) => (
                  <Badge key={index} variant="default">
                    {useCase}
                  </Badge>
                ))}
              </div>
            </Card>

            <Card>
              <h3 className="text-sm text-gray-900 mb-3">Support</h3>
              <p className="text-xs text-gray-600 mb-3">
                Need help customizing this template?
              </p>
              <Button variant="outline" size="sm" className="w-full">
                Contact Support
              </Button>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
