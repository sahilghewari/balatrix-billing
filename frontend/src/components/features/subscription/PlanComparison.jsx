import { Check, X } from 'lucide-react';
import { Card } from '../../ui/Card';
import { Button } from '../../ui/Button';
import { Badge } from '../../ui/Badge';

export const PlanComparison = ({ plans, currentPlan, onSelectPlan }) => {
  const features = [
    'Monthly Call Minutes',
    'SMS Credits',
    'International Calling',
    'API Access',
    'Priority Support',
    'Custom Integrations',
    'SLA Guarantee',
    'Dedicated Account Manager',
  ];

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
          Choose Your Plan
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Select the perfect plan for your business needs
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans?.map((plan) => {
          const isCurrent = currentPlan?.id === plan.id;
          const isRecommended = plan.recommended;

          return (
            <Card
              key={plan.id}
              className={`relative p-6 ${
                isRecommended
                  ? 'ring-2 ring-primary-500 shadow-xl'
                  : ''
              }`}
            >
              {isRecommended && (
                <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  Recommended
                </Badge>
              )}

              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {plan.name}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mt-2">
                  {plan.description}
                </p>
                <div className="mt-6">
                  <span className="text-5xl font-bold text-gray-900 dark:text-white">
                    ₹{plan.price}
                  </span>
                  <span className="text-gray-600 dark:text-gray-400">
                    /month
                  </span>
                </div>
                {plan.annualDiscount && (
                  <p className="text-sm text-green-600 mt-2">
                    Save {plan.annualDiscount}% on annual billing
                  </p>
                )}
              </div>

              <ul className="space-y-3 mb-6">
                {plan.features?.map((feature, idx) => (
                  <li key={idx} className="flex items-start">
                    <Check className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700 dark:text-gray-300">
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>

              <Button
                variant={isRecommended ? 'primary' : 'outline'}
                fullWidth
                onClick={() => onSelectPlan(plan)}
                disabled={isCurrent}
              >
                {isCurrent ? 'Current Plan' : 'Select Plan'}
              </Button>

              {plan.limits && (
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                    {plan.limits}
                  </p>
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {/* Feature Comparison Table */}
      <Card className="p-6 mt-8">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
          Detailed Comparison
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">
                  Feature
                </th>
                {plans?.map((plan) => (
                  <th
                    key={plan.id}
                    className="text-center py-3 px-4 font-semibold text-gray-900 dark:text-white"
                  >
                    {plan.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {features.map((feature, idx) => (
                <tr
                  key={idx}
                  className="border-b border-gray-100 dark:border-gray-800"
                >
                  <td className="py-3 px-4 text-gray-700 dark:text-gray-300">
                    {feature}
                  </td>
                  {plans?.map((plan) => {
                    const hasFeature = plan.detailedFeatures?.[feature];
                    return (
                      <td key={plan.id} className="text-center py-3 px-4">
                        {typeof hasFeature === 'boolean' ? (
                          hasFeature ? (
                            <Check className="w-5 h-5 text-green-500 mx-auto" />
                          ) : (
                            <X className="w-5 h-5 text-gray-300 mx-auto" />
                          )
                        ) : (
                          <span className="text-gray-700 dark:text-gray-300">
                            {hasFeature || '-'}
                          </span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
