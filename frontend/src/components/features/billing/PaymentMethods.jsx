import { useState } from 'react';
import { Card } from '../../ui/Card';
import { Button } from '../../ui/Button';
import { Badge } from '../../ui/Badge';
import { CreditCard, Plus, Trash2, Check } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { billingService } from '../../../services/billing';
import toast from 'react-hot-toast';

export const PaymentMethods = () => {
  const queryClient = useQueryClient();
  const [showAddForm, setShowAddForm] = useState(false);

  const { data: paymentMethods, isLoading } = useQuery({
    queryKey: ['payment-methods'],
    queryFn: billingService.getPaymentMethods,
  });

  const setDefaultMutation = useMutation({
    mutationFn: (methodId) => billingService.setDefaultPaymentMethod(methodId),
    onSuccess: () => {
      queryClient.invalidateQueries(['payment-methods']);
      toast.success('Default payment method updated');
    },
  });

  const removeMutation = useMutation({
    mutationFn: (methodId) => billingService.removePaymentMethod(methodId),
    onSuccess: () => {
      queryClient.invalidateQueries(['payment-methods']);
      toast.success('Payment method removed');
    },
  });

  const handleAddPaymentMethod = () => {
    // This would typically open Razorpay or Stripe modal
    // For now, we'll just show a placeholder
    setShowAddForm(true);
    toast.success('Payment method form would open here');
  };

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="h-24 bg-gray-200 rounded"></div>
          ))}
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Payment Methods
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage your saved payment methods
          </p>
        </div>
        <Button onClick={handleAddPaymentMethod}>
          <Plus className="w-4 h-4 mr-2" />
          Add Payment Method
        </Button>
      </div>

      {paymentMethods?.length === 0 ? (
        <Card className="p-12 text-center">
          <CreditCard className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            No payment methods
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Add a payment method to enable automatic billing
          </p>
          <Button onClick={handleAddPaymentMethod}>
            <Plus className="w-4 h-4 mr-2" />
            Add Your First Payment Method
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {paymentMethods?.map((method) => (
            <Card
              key={method.id}
              className={`p-6 relative ${
                method.isDefault ? 'ring-2 ring-primary-500' : ''
              }`}
            >
              {method.isDefault && (
                <Badge
                  variant="success"
                  className="absolute -top-2 -right-2"
                >
                  <Check className="w-3 h-3 mr-1" />
                  Default
                </Badge>
              )}

              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center">
                  <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-lg mr-4">
                    <CreditCard className="w-6 h-6 text-gray-600 dark:text-gray-400" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {method.brand} •••• {method.last4}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Expires {method.expMonth}/{method.expYear}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                {!method.isDefault && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setDefaultMutation.mutate(method.id)}
                    isLoading={setDefaultMutation.isLoading}
                  >
                    Set as Default
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    if (confirm('Are you sure you want to remove this payment method?')) {
                      removeMutation.mutate(method.id);
                    }
                  }}
                  isLoading={removeMutation.isLoading}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Add Payment Method Info */}
      <Card className="p-4 bg-blue-50 dark:bg-blue-900/20">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              Your payment information is securely stored and encrypted. We never store your full card details.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};
