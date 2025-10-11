import { useState } from 'react';
import { Card } from '../../ui/Card';
import { Button } from '../../ui/Button';
import { Badge } from '../../ui/Badge';
import { Modal } from '../../ui/Modal';
import { AlertCircle, Check } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { subscriptionService } from '../../../services/subscription';
import toast from 'react-hot-toast';

export const PlanUpgrade = ({ currentPlan, targetPlan, onClose }) => {
  const [billingCycle, setBillingCycle] = useState('monthly');
  const [confirmUpgrade, setConfirmUpgrade] = useState(false);
  const queryClient = useQueryClient();

  const upgradeMutation = useMutation({
    mutationFn: (data) => subscriptionService.changePlan(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['subscription']);
      toast.success('Plan upgraded successfully!');
      onClose();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to upgrade plan');
    },
  });

  const calculateCost = () => {
    const basePrice = targetPlan.price;
    const discount = billingCycle === 'annual' ? targetPlan.annualDiscount || 0 : 0;
    const multiplier = billingCycle === 'annual' ? 12 : billingCycle === 'quarterly' ? 3 : 1;
    
    const total = basePrice * multiplier;
    const discountAmount = (total * discount) / 100;
    const finalPrice = total - discountAmount;

    return {
      basePrice,
      total,
      discount,
      discountAmount,
      finalPrice,
      monthlyEquivalent: finalPrice / multiplier,
    };
  };

  const cost = calculateCost();
  const priceDifference = cost.monthlyEquivalent - currentPlan.price;

  const handleUpgrade = () => {
    if (!confirmUpgrade) {
      setConfirmUpgrade(true);
      return;
    }

    upgradeMutation.mutate({
      planId: targetPlan.id,
      billingCycle,
    });
  };

  return (
    <Modal open={true} onClose={onClose} title="Upgrade Your Plan">
      <div className="space-y-6">
        {/* Current vs New Plan */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              Current Plan
            </p>
            <Card className="p-4">
              <h4 className="font-semibold text-gray-900 dark:text-white">
                {currentPlan.name}
              </h4>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                ₹{currentPlan.price}/mo
              </p>
            </Card>
          </div>
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              New Plan
            </p>
            <Card className="p-4 ring-2 ring-primary-500">
              <h4 className="font-semibold text-gray-900 dark:text-white">
                {targetPlan.name}
              </h4>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                ₹{cost.monthlyEquivalent.toFixed(0)}/mo
              </p>
              <Badge variant="success" className="mt-2">
                +₹{priceDifference.toFixed(0)}/mo
              </Badge>
            </Card>
          </div>
        </div>

        {/* Billing Cycle Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Billing Cycle
          </label>
          <div className="grid grid-cols-3 gap-3">
            {[
              { value: 'monthly', label: 'Monthly', discount: 0 },
              { value: 'quarterly', label: 'Quarterly', discount: 5 },
              { value: 'annual', label: 'Annual', discount: targetPlan.annualDiscount || 20 },
            ].map((option) => (
              <button
                key={option.value}
                onClick={() => setBillingCycle(option.value)}
                className={`p-4 rounded-lg border-2 transition-all ${
                  billingCycle === option.value
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                }`}
              >
                <p className="font-semibold text-gray-900 dark:text-white">
                  {option.label}
                </p>
                {option.discount > 0 && (
                  <Badge variant="success" className="mt-2">
                    Save {option.discount}%
                  </Badge>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Cost Breakdown */}
        <Card className="p-4 bg-gray-50 dark:bg-gray-800">
          <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
            Cost Breakdown
          </h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Base Price</span>
              <span className="text-gray-900 dark:text-white">₹{cost.total.toFixed(2)}</span>
            </div>
            {cost.discount > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Discount ({cost.discount}%)</span>
                <span>-₹{cost.discountAmount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-lg pt-2 border-t border-gray-200 dark:border-gray-700">
              <span className="text-gray-900 dark:text-white">Total</span>
              <span className="text-gray-900 dark:text-white">₹{cost.finalPrice.toFixed(2)}</span>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 pt-1">
              Billed {billingCycle === 'annual' ? 'annually' : billingCycle === 'quarterly' ? 'quarterly' : 'monthly'}
            </p>
          </div>
        </Card>

        {/* New Features */}
        <div>
          <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
            New Features You'll Get
          </h4>
          <ul className="space-y-2">
            {targetPlan.features
              ?.filter((f) => !currentPlan.features?.includes(f))
              .map((feature, idx) => (
                <li key={idx} className="flex items-start">
                  <Check className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700 dark:text-gray-300">{feature}</span>
                </li>
              ))}
          </ul>
        </div>

        {/* Confirmation Alert */}
        {confirmUpgrade && (
          <div className="flex items-start p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
            <AlertCircle className="w-5 h-5 text-yellow-600 mr-3 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-yellow-800 dark:text-yellow-200">
              <p className="font-semibold mb-1">Confirm Upgrade</p>
              <p>
                You will be charged ₹{cost.finalPrice.toFixed(2)} immediately. 
                Your current plan benefits will be prorated.
              </p>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex space-x-3">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={upgradeMutation.isLoading}
            fullWidth
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleUpgrade}
            isLoading={upgradeMutation.isLoading}
            fullWidth
          >
            {confirmUpgrade ? 'Confirm & Pay' : 'Continue'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
