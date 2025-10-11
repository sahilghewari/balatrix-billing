/**
 * Current Subscription Page
 * View current subscription details
 */

import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { useQuery } from '@tanstack/react-query';
import { subscriptionService } from '../../../services/subscription';
import { format } from 'date-fns';
import { CheckCircle, Calendar, CreditCard, Package } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const Current = () => {
  const navigate = useNavigate();
  
  const { data: subscription, isLoading } = useQuery({
    queryKey: ['current-subscription'],
    queryFn: subscriptionService.getCurrentSubscription,
  });

  if (isLoading) {
    return (
      <Card className="p-8 animate-pulse">
        <div className="space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-24 bg-gray-200 rounded"></div>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Current Subscription
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Manage your subscription plan and billing
        </p>
      </div>

      {/* Current Plan Card */}
      <Card className="p-8">
        <div className="flex items-start justify-between mb-6">
          <div>
            <div className="flex items-center space-x-3">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {subscription?.plan?.name}
              </h2>
              <Badge variant="success">Active</Badge>
            </div>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              {subscription?.plan?.description}
            </p>
          </div>
          <div className="text-right">
            <p className="text-4xl font-bold text-gray-900 dark:text-white">
              ₹{subscription?.plan?.price}
            </p>
            <p className="text-gray-600 dark:text-gray-400">per month</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="flex items-start space-x-3">
            <Calendar className="w-5 h-5 text-primary-600 mt-1" />
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Next Billing Date</p>
              <p className="font-semibold text-gray-900 dark:text-white">
                {format(new Date(subscription?.nextBillingDate), 'MMMM dd, yyyy')}
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <CreditCard className="w-5 h-5 text-primary-600 mt-1" />
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Billing Cycle</p>
              <p className="font-semibold text-gray-900 dark:text-white capitalize">
                {subscription?.billingCycle}
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <Package className="w-5 h-5 text-primary-600 mt-1" />
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Active Add-ons</p>
              <p className="font-semibold text-gray-900 dark:text-white">
                {subscription?.addons?.length || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
            Plan Features
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {subscription?.plan?.features?.map((feature, idx) => (
              <div key={idx} className="flex items-start">
                <CheckCircle className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                <span className="text-gray-700 dark:text-gray-300">{feature}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex space-x-3 mt-6">
          <Button onClick={() => navigate('/subscriptions/plans')}>
            Upgrade Plan
          </Button>
          <Button variant="outline" onClick={() => navigate('/subscriptions/addons')}>
            Manage Add-ons
          </Button>
          <Button variant="ghost" className="text-red-600 hover:text-red-700">
            Cancel Subscription
          </Button>
        </div>
      </Card>

      {/* Active Add-ons */}
      {subscription?.addons?.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Active Add-ons
          </h3>
          <div className="space-y-3">
            {subscription.addons.map((addon) => (
              <div
                key={addon.id}
                className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg"
              >
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {addon.name}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {addon.description}
                  </p>
                </div>
                <p className="font-semibold text-gray-900 dark:text-white">
                  ₹{addon.price}/mo
                </p>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};

export default Current;
