import { useLocation, useNavigate, useParams } from "@remix-run/react";
import type { LoaderFunctionArgs } from "@remix-run/node";
import { ArrowLeft, Check } from "lucide-react";
import { authenticate } from "../shopify.server";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await authenticate.admin(request);
  return null;
};

export default function TemplateDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const withSearch = (path: string, extra?: Record<string, string>) => {
    const search = new URLSearchParams(location.search);
    if (extra) {
      Object.entries(extra).forEach(([key, value]) => {
        if (value) {
          search.set(key, value);
        } else {
          search.delete(key);
        }
      });
    }
    const output = search.toString();
    return { pathname: path, search: output ? `?${output}` : "" };
  };

  const template = {
    name: "Minimal Fashion",
    category: "Fashion",
    description: "Clean and elegant mega menu design perfect for fashion and lifestyle brands",
    features: [
      "Responsive grid layout",
      "Featured product displays",
      "Image-heavy navigation",
      "Hover animations",
      "Mobile-optimized",
    ],
    useCases: ["Fashion boutiques", "Lifestyle brands", "Luxury retailers", "Apparel stores"],
    pro: false,
  };

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        <Button variant="ghost" onClick={() => navigate(withSearch("/app/templates"))}>
          <ArrowLeft className="w-4 h-4" />
          Back to Templates
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card padding="none" className="overflow-hidden">
              <div className="aspect-video bg-gradient-to-br from-indigo-100 to-purple-100" />
            </Card>

            <Card className="p-6">
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
            <Card className="p-6">
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
                  onClick={() =>
                    navigate(
                      withSearch("/app/menu-builder", {
                        template: id ?? "",
                        returnTo: location.pathname,
                      })
                    )
                  }
                >
                  Use This Template
                </Button>

                {template.pro && (
                  <p className="text-xs text-gray-600 text-center">Requires Pro or Plus plan</p>
                )}
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="text-sm text-gray-900 mb-3">Perfect For</h3>
              <div className="flex flex-wrap gap-2">
                {template.useCases.map((useCase, index) => (
                  <Badge key={index} variant="default">
                    {useCase}
                  </Badge>
                ))}
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="text-sm text-gray-900 mb-3">Support</h3>
              <p className="text-xs text-gray-600 mb-3">Need help customizing this template?</p>
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
