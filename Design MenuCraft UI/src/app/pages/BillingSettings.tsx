import { useState } from 'react';
import { Check, Zap, Rocket, Star, Shield, CreditCard, ArrowRight, Download } from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';

export default function BillingSettings() {
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly');
  const currentPlan = 'free'; // This would come from app state/context

  const plans = [
    {
      id: 'free',
      name: 'Free',
      icon: Zap,
      iconColor: 'bg-gray-100 text-gray-600',
      description: 'Perfect for testing and small stores',
      priceMonthly: '€0',
      priceYearly: '€0',
      features: [
        '1 mega menu',
        'Basic styling',
        'Basic support'
      ],
      cta: 'Current Plan',
      ctaVariant: 'outline' as const,
      disabled: true,
      popular: false
    },
    {
      id: 'pro',
      name: 'Pro',
      icon: Star,
      iconColor: 'bg-indigo-100 text-indigo-600',
      description: 'Best for growing stores',
      priceMonthly: '€19.99',
      priceYearly: '€15.99',
      features: [
        'Unlimited mega menus',
        'Template library access',
        'Design settings (colors, spacing)',
        'Mobile menu features',
        'Priority support'
      ],
      cta: 'Upgrade to Pro',
      ctaVariant: 'primary' as const,
      disabled: false,
      popular: true,
      trial: 'Includes 14-day trial'
    },
    {
      id: 'plus',
      name: 'Plus',
      icon: Rocket,
      iconColor: 'bg-purple-100 text-purple-600',
      description: 'Advanced / Agencies',
      priceMonthly: '€49.99',
      priceYearly: '€39.99',
      features: [
        'Everything in Pro',
        'Multi-store / client-friendly management',
        'Advanced template packs',
        'Variant-level / menu targeting rules',
        'Dedicated support / onboarding'
      ],
      cta: 'Upgrade to Plus',
      ctaVariant: 'primary' as const,
      disabled: false,
      popular: false
    }
  ];

  const comparisonFeatures = [
    { name: 'Mega Menus', free: '1', pro: 'Unlimited', plus: 'Unlimited' },
    { name: 'Template Library', free: false, pro: true, plus: true },
    { name: 'Design Settings', free: false, pro: true, plus: true },
    { name: 'Mobile Menu', free: false, pro: true, plus: true },
    { name: 'Advanced Templates', free: false, pro: false, plus: true },
    { name: 'Multi-store Management', free: false, pro: false, plus: true },
    { name: 'Support Level', free: 'Basic', pro: 'Priority', plus: 'Dedicated' }
  ];

  const getCurrentPlanName = () => {
    const plan = plans.find(p => p.id === currentPlan);
    return plan?.name || 'Free';
  };

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header with Current Plan */}
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <h1 className="text-3xl text-gray-900">Billing & Subscription</h1>
            <p className="text-gray-600">Manage your plan and billing information</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm text-gray-600">Current Plan</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-lg text-gray-900">{getCurrentPlanName()}</span>
                <Badge variant={currentPlan === 'free' ? 'default' : 'pro'}>
                  {getCurrentPlanName()}
                </Badge>
              </div>
            </div>
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4" />
              Download Invoice
            </Button>
          </div>
        </div>

        {/* Current Subscription Info */}
        <Card className="bg-gradient-to-br from-indigo-50 to-purple-50 border-indigo-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm">
                <CreditCard className="w-6 h-6 text-indigo-600" />
              </div>
              <div>
                <h3 className="text-lg text-gray-900">Your Subscription</h3>
                <p className="text-sm text-gray-600">
                  {currentPlan === 'free' 
                    ? 'You are currently on the Free plan' 
                    : `Renews on January 17, 2026 • €${billingPeriod === 'monthly' ? '19.99' : '15.99'}/month`}
                </p>
              </div>
            </div>
            {currentPlan !== 'free' && (
              <Button variant="outline">Manage Subscription</Button>
            )}
          </div>
        </Card>

        {/* Trust Strip */}
        <div className="flex justify-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-50 border border-green-200 rounded-full">
            <Shield className="w-4 h-4 text-green-600" />
            <span className="text-sm text-green-700">
              14-day free trial • No credit card required • Cancel anytime
            </span>
          </div>
        </div>

        {/* Billing Toggle */}
        <div className="flex justify-center">
          <div className="inline-flex items-center gap-3 p-1 bg-white border border-gray-200 rounded-lg shadow-sm">
            <button
              onClick={() => setBillingPeriod('monthly')}
              className={`px-6 py-2 rounded-md text-sm transition-all ${
                billingPeriod === 'monthly'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingPeriod('yearly')}
              className={`px-6 py-2 rounded-md text-sm transition-all flex items-center gap-2 ${
                billingPeriod === 'yearly'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Yearly
              {billingPeriod === 'yearly' && (
                <Badge variant="success" className="text-xs">Save 20%</Badge>
              )}
            </button>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {plans.map((plan) => {
            const Icon = plan.icon;
            const price = billingPeriod === 'monthly' ? plan.priceMonthly : plan.priceYearly;
            const isCurrent = plan.id === currentPlan;
            
            return (
              <Card 
                key={plan.id}
                className={`relative flex flex-col ${
                  plan.popular ? 'ring-2 ring-indigo-600' : ''
                } ${isCurrent ? 'bg-gray-50' : ''}`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge variant="pro" className="shadow-sm">Most Popular</Badge>
                  </div>
                )}

                {isCurrent && (
                  <div className="absolute -top-3 right-4">
                    <Badge variant="success" className="shadow-sm">Active</Badge>
                  </div>
                )}

                <div className={`w-14 h-14 ${plan.iconColor} rounded-full flex items-center justify-center mb-4`}>
                  <Icon className="w-7 h-7" />
                </div>

                <div className="space-y-2 mb-4">
                  <h3 className="text-xl text-gray-900">{plan.name}</h3>
                  <p className="text-sm text-gray-600">{plan.description}</p>
                </div>

                <div className="mb-6">
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl text-gray-900">{price}</span>
                    <span className="text-gray-600">/ {billingPeriod === 'monthly' ? 'month' : 'year'}</span>
                  </div>
                  {plan.trial && !isCurrent && (
                    <p className="text-xs text-gray-600 mt-2">{plan.trial}</p>
                  )}
                </div>

                <ul className="space-y-3 mb-6 flex-1">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button 
                  variant={plan.ctaVariant}
                  className="w-full"
                  disabled={isCurrent}
                >
                  {isCurrent ? 'Current Plan' : plan.cta}
                </Button>
              </Card>
            );
          })}
        </div>

        {/* Feature Comparison */}
        <Card>
          <h2 className="text-xl text-gray-900 mb-6 text-center">Feature Comparison</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm text-gray-600"></th>
                  <th className="text-center py-3 px-4 text-sm text-gray-900">Free</th>
                  <th className="text-center py-3 px-4 text-sm text-gray-900">
                    <div className="flex items-center justify-center gap-2">
                      Pro
                      <Badge variant="pro" className="text-xs">Popular</Badge>
                    </div>
                  </th>
                  <th className="text-center py-3 px-4 text-sm text-gray-900">Plus</th>
                </tr>
              </thead>
              <tbody>
                {comparisonFeatures.map((feature, index) => (
                  <tr key={index} className="border-b border-gray-100 last:border-0">
                    <td className="py-3 px-4 text-sm text-gray-700">{feature.name}</td>
                    <td className="py-3 px-4 text-center text-sm">
                      {typeof feature.free === 'boolean' ? (
                        feature.free ? (
                          <Check className="w-5 h-5 text-green-600 mx-auto" />
                        ) : (
                          <span className="text-gray-400">—</span>
                        )
                      ) : (
                        <span className="text-gray-700">{feature.free}</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center text-sm bg-indigo-50">
                      {typeof feature.pro === 'boolean' ? (
                        feature.pro ? (
                          <Check className="w-5 h-5 text-green-600 mx-auto" />
                        ) : (
                          <span className="text-gray-400">—</span>
                        )
                      ) : (
                        <span className="text-gray-700">{feature.pro}</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center text-sm">
                      {typeof feature.plus === 'boolean' ? (
                        feature.plus ? (
                          <Check className="w-5 h-5 text-green-600 mx-auto" />
                        ) : (
                          <span className="text-gray-400">—</span>
                        )
                      ) : (
                        <span className="text-gray-700">{feature.plus}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* How Plan Selection Works */}
        <Card className="bg-blue-50 border-blue-200">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
              <CreditCard className="w-6 h-6 text-blue-600" />
            </div>
            <div className="flex-1 space-y-4">
              <div>
                <h3 className="text-lg text-gray-900 mb-2">How plan selection works</h3>
                <p className="text-sm text-gray-600">
                  Choose a plan to unlock features. After selecting a plan, you'll be redirected to your Dashboard.
                </p>
              </div>

              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center text-sm">
                    1
                  </div>
                  <span className="text-sm text-gray-700">Select plan</span>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-400" />
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center text-sm">
                    2
                  </div>
                  <span className="text-sm text-gray-700">Confirm billing</span>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-400" />
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center text-sm">
                    3
                  </div>
                  <span className="text-sm text-gray-700">Go to Dashboard</span>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
