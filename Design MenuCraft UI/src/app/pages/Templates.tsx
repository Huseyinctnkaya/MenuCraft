import { useNavigate } from 'react-router-dom';
import { Lock } from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';

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
    <div className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl text-gray-900">Template Library</h1>
          <p className="text-gray-600 mt-1">Start with a pre-built template and customize it</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {templates.map((template) => (
            <Card 
              key={template.id} 
              className="group cursor-pointer hover:shadow-lg transition-shadow relative overflow-hidden"
              onClick={() => navigate(`/templates/${template.id}`)}
            >
              <div className="aspect-video bg-gradient-to-br from-indigo-100 to-purple-100 rounded-lg mb-4 relative">
                {template.pro && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <div className="text-center text-white">
                      <Lock className="w-8 h-8 mx-auto mb-2" />
                      <p className="text-sm">Pro Template</p>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm text-gray-900">{template.name}</h3>
                  {template.new && <Badge variant="new">New</Badge>}
                  {template.pro && <Badge variant="pro">Pro</Badge>}
                </div>
                <p className="text-xs text-gray-600">{template.category}</p>
                <Button 
                  variant={template.pro ? 'outline' : 'primary'} 
                  size="sm" 
                  className="w-full"
                  onClick={(e) => {
                    e.stopPropagation();
                    template.pro ? navigate('/pricing') : navigate(`/builder?template=${template.id}`);
                  }}
                >
                  {template.pro ? 'Upgrade to Use' : 'Use Template'}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
