/**
 * Plan Card Component
 * Displays individual subscription plan with features and pricing
 */

import { useState } from 'react';
import { Check } from 'lucide-react';
import Button from '../common/Button';
import Card from '../common/Card';

const PlanCard = ({ plan, billingCycle, onSelect, isPopular = false, disabled = false }) => {
  const [isHovered, setIsHovered] = useState(false);

  // Validate plan data
  if (!plan || !plan.monthlyPrice) {
    console.error('Invalid plan data:', plan);
    return null;
  }

  // Parse metadata if it's a string
  let metadata = plan.metadata;
  if (typeof metadata === 'string') {
    try {
      metadata = JSON.parse(metadata);
    } catch (e) {
      console.error('Failed to parse metadata:', e);
      metadata = {};
    }
  }

  // Parse features from metadata if features/limits are not available
  let parsedFeatures = {};
  if (Array.isArray(metadata?.features)) {
    metadata.features.forEach(feature => {
      if (feature.includes('Toll-Free Number')) {
        const match = feature.match(/(\d+)/);
        if (match) parsedFeatures.tollFreeNumbers = parseInt(match[1]);
      } else if (feature.includes('Free Calling Credit')) {
        const match = feature.match(/₹(\d+)/);
        if (match) parsedFeatures.freeCredit = parseInt(match[1]);
      } else if (feature.includes('Extension')) {
        const match = feature.match(/(\d+)/);
        if (match) parsedFeatures.extensions = parseInt(match[1]);
      } else if (feature.includes('/minute')) {
        const match = feature.match(/₹(\d+\.?\d*)/);
        if (match) parsedFeatures.perMinuteCharge = parseFloat(match[1]);
      }
    });
  }

  // Parse features if it's a string (handle both JSON string and object)
  let features = plan.features;
  if (typeof features === 'string') {
    try {
      features = JSON.parse(features);
    } catch (e) {
      console.error('Failed to parse features:', e);
      features = {};
    }
  }

  // Set features based on plan name as fallback
  if (plan.planName === 'Starter') {
    features = { tollFreeNumbers: 1, freeCredit: 199, extensions: 1, perMinuteCharge: 1.99 };
  } else if (plan.planName === 'Professional') {
    features = { tollFreeNumbers: 2, freeCredit: 700, extensions: 2, perMinuteCharge: 1.60 };
  } else if (plan.planName === 'Call Center') {
    features = { tollFreeNumbers: 5, freeCredit: 3500, extensions: 10, perMinuteCharge: 1.45 };
  }

  // Use parsed features from metadata if available
  if (Object.keys(parsedFeatures).length > 0) {
    features = { ...features, ...parsedFeatures };
  }

  // Parse limits if it's a string (handle both JSON string and object)
  let limits = plan.limits;
  if (typeof limits === 'string') {
    try {
      limits = JSON.parse(limits);
    } catch (e) {
      console.error('Failed to parse limits:', e);
      limits = {};
    }
  }

  // Get price based on billing cycle
  const getPrice = () => {
    switch (billingCycle) {
      case 'monthly':
        return plan.monthlyPrice || 0;
      case 'quarterly':
        return (plan.monthlyPrice || 0) * 3;
      case 'annual':
        return plan.annualPrice || (plan.monthlyPrice || 0) * 12 * 0.8; // 20% discount
      default:
        return plan.monthlyPrice || 0;
    }
  };

  // Get monthly equivalent price
  const getMonthlyEquivalent = () => {
    const price = getPrice();
    switch (billingCycle) {
      case 'quarterly':
        return (price / 3).toFixed(2);
      case 'annual':
        return (price / 12).toFixed(2);
      default:
        return price;
    }
  };

  // Get savings text
  const getSavings = () => {
    if (billingCycle === 'annual' && plan.annualPrice) {
      const monthlyTotal = plan.monthlyPrice * 12;
      const savings = monthlyTotal - plan.annualPrice;
      const percentage = ((savings / monthlyTotal) * 100).toFixed(0);
      return `Save ${percentage}% (₹${savings.toLocaleString('en-IN')})`;
    }
    if (billingCycle === 'annual' && !plan.annualPrice) {
      return 'Save 20%'; // Default discount when annual price not set
    }
    if (billingCycle === 'quarterly') {
      return 'No setup charges';
    }
    return null;
  };

  const price = getPrice();
  const monthlyEquivalent = getMonthlyEquivalent();
  const savings = getSavings();

  return (
    <div
      className={`relative ${isPopular ? 'z-10 scale-105' : 'z-0'}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {isPopular && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-blue-600 to-blue-500 text-white px-4 py-1 rounded-full text-sm font-semibold shadow-lg">
          Most Popular
        </div>
      )}
      
      <Card
        className={`h-full flex flex-col transition-all duration-300 ${
          isPopular
            ? 'border-2 border-blue-500 shadow-xl'
            : isHovered
            ? 'border-gray-300 shadow-lg'
            : 'border-gray-200'
        }`}
      >
        {/* Plan Header */}
        <div className="text-center pb-6 border-b border-gray-200">
          <h3 className="text-2xl font-bold text-gray-900 mb-2">
            {plan.planName}
          </h3>
          
          {/* Price */}
          <div className="mt-4">
            <div className="flex items-baseline justify-center gap-2">
              <span className="text-4xl font-bold text-gray-900">
                ₹{price.toLocaleString('en-IN')}
              </span>
              <span className="text-gray-600">
                /{billingCycle === 'annual' ? 'year' : billingCycle === 'quarterly' ? 'quarter' : 'month'}
              </span>
            </div>
            
            {billingCycle !== 'monthly' && (
              <p className="text-sm text-gray-600 mt-2">
                ₹{monthlyEquivalent}/month equivalent
              </p>
            )}
            
            {savings && (
              <div className="mt-2">
                <span className="inline-block bg-green-100 text-green-800 text-xs font-semibold px-3 py-1 rounded-full">
                  {savings}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Features */}
        <div className="flex-1 py-6">
          {/* Check metadata.features first (array of strings), then fall back to features or description */}
          {Array.isArray(metadata?.features) && metadata.features.length > 0 ? (
            <ul className="space-y-4">
              {metadata.features.map((feature, index) => (
                <li key={index} className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700 text-sm">{feature}</span>
                </li>
              ))}
            </ul>
          ) : Array.isArray(features) && features.length > 0 ? (
            <ul className="space-y-4">
              {features.map((feature, index) => (
                <li key={index} className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700 text-sm">{feature}</span>
                </li>
              ))}
            </ul>
          ) : plan.description ? (
            <p className="text-gray-700 text-sm">{plan.description}</p>
          ) : (
            <p className="text-gray-500 text-sm italic">No features listed</p>
          )}

          {/* Plan Details */}
          <div className="mt-6 pt-6 border-t border-gray-200">
              <h4 className="text-sm font-semibold text-gray-900 mb-3">Plan Details</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex justify-between">
                  <span>Toll-Free Numbers:</span>
                  <span className="font-semibold text-gray-900">
                    {limits?.maxTollFreeNumbers || features?.tollFreeNumbers || 'N/A'}
                  </span>
                </li>
                <li className="flex justify-between">
                  <span>Included Credit:</span>
                  <span className="font-semibold text-gray-900">
                    ₹{(limits?.monthlyCreditAllowance || features?.freeCredit || 0).toLocaleString('en-IN')}
                  </span>
                </li>
                <li className="flex justify-between">
                  <span>Extensions:</span>
                  <span className="font-semibold text-gray-900">
                    {limits?.maxExtensions || features?.extensions || 'N/A'}
                  </span>
                </li>
                <li className="flex justify-between">
                  <span>Per Minute Rate:</span>
                  <span className="font-semibold text-gray-900">
                    ₹{features?.perMinuteCharge || 'N/A'}
                  </span>
                </li>
              </ul>
          </div>
        </div>

        {/* Select Button */}
        <div className="pt-6 border-t border-gray-200">
          <Button
            variant={isPopular ? 'primary' : 'outline'}
            fullWidth
            onClick={() => onSelect(plan)}
            disabled={disabled}
            className={isPopular ? 'shadow-lg' : ''}
          >
            {disabled ? 'Current Plan' : 'Select Plan'}
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default PlanCard;
