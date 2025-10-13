/**
 * Addon Selector Component
 * Allows users to select extra toll-free numbers and extensions
 */

import { useState, useEffect } from 'react';
import { Plus, Minus, Info } from 'lucide-react';
import Card from '../common/Card';

const AddonSelector = ({ plan, billingCycle, addons, onChange }) => {
  // Debug: Log plan data on mount
  useEffect(() => {
    console.log('AddonSelector - Plan data:', {
      planName: plan?.planName,
      metadata: plan?.metadata,
      billingCycle,
    });
  }, [plan, billingCycle]);

  const getAddonPrice = (addonType) => {
    // Default pricing if metadata is not available
    const defaultPricing = {
      tfnCharge: { oneTime: 199, payAsYouGo: 1 },
      extensionCharge: { oneTime: 99, payAsYouGo: 1 },
    };
    
    // Backend stores addons with lowercase 'a'
    let metadata = plan?.metadata || {};
    
    // If metadata is a string (JSON), parse it
    if (typeof metadata === 'string') {
      try {
        metadata = JSON.parse(metadata);
      } catch (e) {
        console.error('Failed to parse metadata:', e);
        metadata = {};
      }
    }
    
    const addonsPricing = metadata.addons || defaultPricing;
    
    let pricing;
    if (addonType === 'extraTollFreeNumbers') {
      pricing = addonsPricing.tfnCharge || defaultPricing.tfnCharge;
    } else if (addonType === 'extraExtensions') {
      pricing = addonsPricing.extensionCharge || defaultPricing.extensionCharge;
    }
    
    if (!pricing) {
      console.warn(`No pricing found for ${addonType}, using defaults`);
      pricing = addonType === 'extraTollFreeNumbers' ? defaultPricing.tfnCharge : defaultPricing.extensionCharge;
    }

    // Monthly uses one-time charge, quarterly/annual uses pay-as-you-go
    if (billingCycle === 'monthly') {
      return pricing.oneTime || 0;
    } else {
      // PAYG rate is per month
      return pricing.payAsYouGo || 0;
    }
  };

  const handleQuantityChange = (addonType, delta) => {
    const currentValue = addons[addonType] || 0;
    const newValue = Math.max(0, Math.min(10, currentValue + delta)); // Max 10 of each addon
    
    onChange({
      ...addons,
      [addonType]: newValue,
    });
  };

  const tfnPrice = getAddonPrice('extraTollFreeNumbers');
  const extPrice = getAddonPrice('extraExtensions');
  const tfnQty = addons.extraTollFreeNumbers || 0;
  const extQty = addons.extraExtensions || 0;

  return (
    <Card className="p-6">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Add-ons</h3>
          <p className="text-sm text-gray-600 mt-1">
            Customize your plan with additional resources
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
          <Info className="w-4 h-4" />
          {billingCycle === 'monthly' ? 'One-time charge' : 'Pay-as-you-go rate'}
        </div>
      </div>

      <div className="space-y-6">
        {/* Extra Toll-Free Numbers */}
        <div className="border border-gray-200 rounded-lg p-4">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h4 className="font-semibold text-gray-900">Extra Toll-Free Numbers</h4>
              <p className="text-sm text-gray-600 mt-1">
                Add more toll-free numbers to your account
              </p>
              <p className="text-sm font-semibold text-gray-900 mt-2">
                ₹{tfnPrice.toLocaleString('en-IN')} each
                {billingCycle !== 'monthly' && tfnPrice > 0 && ` (₹${tfnPrice}/month)`}
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <button
                onClick={() => handleQuantityChange('extraTollFreeNumbers', -1)}
                disabled={tfnQty === 0}
                className="w-8 h-8 flex items-center justify-center rounded-full border border-gray-300 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Minus className="w-4 h-4" />
              </button>
              
              <span className="w-12 text-center font-semibold text-gray-900">
                {tfnQty}
              </span>
              
              <button
                onClick={() => handleQuantityChange('extraTollFreeNumbers', 1)}
                disabled={tfnQty >= 10}
                className="w-8 h-8 flex items-center justify-center rounded-full border border-gray-300 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>
          
          {tfnQty > 0 && (
            <div className="bg-gray-50 rounded p-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal:</span>
                <span className="font-semibold text-gray-900">
                  ₹{(tfnPrice * tfnQty).toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Extra Extensions */}
        <div className="border border-gray-200 rounded-lg p-4">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h4 className="font-semibold text-gray-900">Extra Extensions</h4>
              <p className="text-sm text-gray-600 mt-1">
                Add more extensions for your team
              </p>
              <p className="text-sm font-semibold text-gray-900 mt-2">
                ₹{extPrice.toLocaleString('en-IN')} each
                {billingCycle !== 'monthly' && extPrice > 0 && ` (₹${extPrice}/month)`}
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <button
                onClick={() => handleQuantityChange('extraExtensions', -1)}
                disabled={extQty === 0}
                className="w-8 h-8 flex items-center justify-center rounded-full border border-gray-300 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Minus className="w-4 h-4" />
              </button>
              
              <span className="w-12 text-center font-semibold text-gray-900">
                {extQty}
              </span>
              
              <button
                onClick={() => handleQuantityChange('extraExtensions', 1)}
                disabled={extQty >= 10}
                className="w-8 h-8 flex items-center justify-center rounded-full border border-gray-300 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>
          
          {extQty > 0 && (
            <div className="bg-gray-50 rounded p-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal:</span>
                <span className="font-semibold text-gray-900">
                  ₹{(extPrice * extQty).toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Total Add-ons Cost */}
      {(tfnQty > 0 || extQty > 0) && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="flex justify-between items-center">
            <span className="text-lg font-semibold text-gray-900">
              Total Add-ons Cost:
            </span>
            <span className="text-2xl font-bold text-blue-600">
              ₹{((tfnPrice * tfnQty) + (extPrice * extQty)).toLocaleString('en-IN')}
            </span>
          </div>
        </div>
      )}
    </Card>
  );
};

export default AddonSelector;
