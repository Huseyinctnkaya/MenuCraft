import { useState } from 'react';
import type { LoaderFunctionArgs } from "@remix-run/node";
import { Check, Zap, Rocket, Star, Shield } from 'lucide-react';
import { authenticate } from "../shopify.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await authenticate.admin(request);
  return null;
};

export default function Pricing() {
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly');

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
      disabled: false,
      popular: false
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-gray-900">Plans & Billing</h1>
          <p className="text-lg text-gray-600">Choose the plan that fits your store's needs</p>
          
          {/* Trust Strip */}
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
              className={`px-6 py-2 rounded-md text-sm font-medium transition-all ${
                billingPeriod === 'monthly'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingPeriod('yearly')}
              className={`px-6 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${
                billingPeriod === 'yearly'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Yearly
              {billingPeriod === 'yearly' && (
                <span className="inline-flex items-center rounded-md bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                  Save 20%
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {plans.map((plan) => {
            const Icon = plan.icon;
            const price = billingPeriod === 'monthly' ? plan.priceMonthly : plan.priceYearly;
            
            return (
              <div 
                key={plan.id}
                className={`bg-white rounded-lg border p-6 relative flex flex-col transition-all ${
                  plan.popular ? 'ring-2 ring-indigo-600' : ''
                }`}
              >
                {/* Popular Badge */}
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="inline-flex items-center rounded-md bg-indigo-100 px-3 py-1 text-xs font-medium text-indigo-700 shadow-sm">
                      Most Popular
                    </span>
                  </div>
                )}

                {/* Icon */}
                <div className={`w-14 h-14 ${plan.iconColor} rounded-full flex items-center justify-center mb-4`}>
                  <Icon className="w-7 h-7" />
                </div>

                {/* Plan Info */}
                <div className="space-y-2 mb-4">
                  <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
                  <p className="text-sm text-gray-600">{plan.description}</p>
                </div>

                {/* Price */}
                <div className="mb-6">
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold text-gray-900">{price}</span>
                    <span className="text-gray-600">/ {billingPeriod === 'monthly' ? 'month' : 'year'}</span>
                  </div>
                  {plan.trial && (
                    <p className="text-xs text-gray-600 mt-2">{plan.trial}</p>
                  )}
                </div>

                {/* Features */}
                <ul className="space-y-3 mb-6 flex-1">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA Button */}
                <button
                  disabled={plan.disabled}
                  className={`w-full py-2 px-4 rounded-lg font-medium transition-colors ${
                    plan.disabled
                      ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                      : plan.popular
                      ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                      : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {plan.cta}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
