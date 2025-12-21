import { useState } from 'react';
import { Check, Zap, Rocket, LayoutGrid } from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';

export default function PlanSelection() {
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly');

  const plans = [
    {
      name: 'Free',
      icon: Zap,
      description: 'Perfect for testing and small stores',
      price: billingPeriod === 'monthly' ? 0 : 0,
      features: [
        '1 mega menu',
        'Basic styling',
        'Basic support'
      ]
    },
    {
      name: 'Pro',
      icon: Rocket,
      description: 'Best for growing stores',
      price: billingPeriod === 'monthly' ? 19.99 : 199,
      popular: true,
      features: [
        'Includes free',
        'Unlimited mega menus',
        'Template library access',
        'Design settings (colors, spacing)',
        'Mobile menu features',
        'Priority support'
      ]
    },
    {
      name: 'Plus',
      icon: LayoutGrid,
      description: 'Advanced / Agencies',
      price: billingPeriod === 'monthly' ? 49.99 : 499,
      features: [
        'Everything in Pro',
        'Multi-store / client-friendly management',
        'Advanced template packs',
        'Variant-level / menu targeting rules',
        'Dedicated support / onboarding'
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center">
              <LayoutGrid className="w-6 h-6 text-white" />
            </div>
            <span className="text-lg text-gray-900">MenuCraft</span>
          </div>
          
          <div className="flex items-center gap-6">
            <a href="#" className="text-sm text-gray-700 hover:text-gray-900">Dashboard</a>
            <a href="#" className="text-sm text-gray-700 hover:text-gray-900">Templates</a>
            <a href="#" className="text-sm text-gray-700 hover:text-gray-900">Support</a>
            <Button variant="primary" size="sm">Get Started</Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-6 py-12">
        {/* Hero */}
        <div className="text-center mb-8">
          <h1 className="text-4xl text-gray-900 mb-3">Plans & Billing</h1>
          <p className="text-lg text-gray-600 mb-6">Choose the plan that fits your store's needs</p>
          
          {/* Trial Info */}
          <div className="inline-flex items-center gap-2 text-sm text-green-700 bg-green-50 px-4 py-2 rounded-lg border border-green-200">
            <Check className="w-4 h-4" />
            <span>14-day free trial • No credit card required • Cancel anytime</span>
          </div>
        </div>

        {/* Billing Toggle */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <button
            onClick={() => setBillingPeriod('monthly')}
            className={`px-6 py-2 rounded-lg transition-colors ${
              billingPeriod === 'monthly'
                ? 'bg-indigo-600 text-white'
                : 'bg-white text-gray-700 border border-gray-200'
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setBillingPeriod('yearly')}
            className={`px-6 py-2 rounded-lg transition-colors ${
              billingPeriod === 'yearly'
                ? 'bg-indigo-600 text-white'
                : 'bg-white text-gray-700 border border-gray-200'
            }`}
          >
            Yearly
          </button>
        </div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {plans.map((plan, index) => (
            <Card
              key={index}
              className={`relative ${
                plan.popular ? 'border-2 border-indigo-600 shadow-lg' : ''
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge variant="primary" className="bg-indigo-600 text-white px-4 py-1">
                    Most Popular
                  </Badge>
                </div>
              )}

              <div className="text-center mb-6">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3 ${
                  plan.popular ? 'bg-indigo-100' : 'bg-gray-100'
                }`}>
                  <plan.icon className={`w-6 h-6 ${
                    plan.popular ? 'text-indigo-600' : 'text-gray-600'
                  }`} />
                </div>
                <h3 className="text-xl text-gray-900 mb-1">{plan.name}</h3>
                <p className="text-sm text-gray-600">{plan.description}</p>
              </div>

              <div className="text-center mb-6">
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-sm text-gray-600">€</span>
                  <span className="text-4xl text-gray-900">
                    {billingPeriod === 'monthly' ? plan.price.toFixed(2) : plan.price}
                  </span>
                  <span className="text-sm text-gray-600">
                    /{billingPeriod === 'monthly' ? 'month' : 'year'}
                  </span>
                </div>
              </div>

              <ul className="space-y-3 mb-6">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>

              <Button
                variant={plan.popular ? 'primary' : 'outline'}
                className="w-full"
              >
                {plan.name === 'Free' ? 'Start Free' : `Upgrade to ${plan.name}`}
              </Button>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}