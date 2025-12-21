import { Calendar, Plus, Zap, Bug } from 'lucide-react';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';

export default function Changelog() {
  const updates = [
    {
      version: '2.1.0',
      date: 'December 15, 2024',
      changes: [
        { type: 'new', text: 'Added mobile menu builder with advanced customization' },
        { type: 'new', text: 'Template library with 10+ pre-built designs' },
        { type: 'improvement', text: 'Improved menu loading performance by 40%' },
        { type: 'fix', text: 'Fixed dropdown alignment issues on Safari' }
      ]
    },
    {
      version: '2.0.0',
      date: 'November 20, 2024',
      changes: [
        { type: 'new', text: 'Complete UI redesign with modern interface' },
        { type: 'new', text: 'Analytics dashboard for tracking menu engagement' },
        { type: 'new', text: 'Advanced design settings for Pro users' },
        { type: 'improvement', text: 'Enhanced drag-and-drop menu builder' }
      ]
    },
    {
      version: '1.5.2',
      date: 'October 10, 2024',
      changes: [
        { type: 'improvement', text: 'Better compatibility with Online Store 2.0 themes' },
        { type: 'fix', text: 'Resolved issues with multi-language stores' },
        { type: 'fix', text: 'Fixed menu positioning on sticky headers' }
      ]
    }
  ];

  const getIcon = (type: string) => {
    switch (type) {
      case 'new':
        return <Plus className="w-4 h-4 text-green-600" />;
      case 'improvement':
        return <Zap className="w-4 h-4 text-blue-600" />;
      case 'fix':
        return <Bug className="w-4 h-4 text-amber-600" />;
      default:
        return null;
    }
  };

  const getBadgeVariant = (type: string) => {
    switch (type) {
      case 'new':
        return 'success' as const;
      case 'improvement':
        return 'new' as const;
      case 'fix':
        return 'warning' as const;
      default:
        return 'default' as const;
    }
  };

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl text-gray-900">What's New</h1>
          <p className="text-gray-600 mt-1">See what we've been working on</p>
        </div>

        <div className="space-y-6">
          {updates.map((update, index) => (
            <Card key={index}>
              <div className="flex items-start gap-4 mb-4">
                <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Calendar className="w-5 h-5 text-indigo-600" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h2 className="text-lg text-gray-900">Version {update.version}</h2>
                    {index === 0 && <Badge variant="new">Latest</Badge>}
                  </div>
                  <p className="text-sm text-gray-600">{update.date}</p>
                </div>
              </div>

              <div className="space-y-3 ml-14">
                {update.changes.map((change, changeIndex) => (
                  <div key={changeIndex} className="flex items-start gap-3">
                    <div className="mt-0.5">{getIcon(change.type)}</div>
                    <div className="flex-1">
                      <div className="flex items-start gap-2">
                        <Badge variant={getBadgeVariant(change.type)} className="capitalize">
                          {change.type}
                        </Badge>
                        <p className="text-sm text-gray-700 flex-1">{change.text}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
