/**
 * Dashboard Page
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { CreditCard, Calendar, Phone, Users, TrendingUp, AlertCircle } from 'lucide-react';
import { MainLayout } from '../components/layout';
import { Card, Button, Spinner } from '../components/common';
import { useAuth } from '../hooks';
import { subscriptionService } from '../api';
import UsageWidget from '../components/dashboard/UsageWidget';
import UsageChart from '../components/dashboard/UsageChart';

const DashboardPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSubscription();
  }, []);

  const fetchSubscription = async () => {
    try {
      setLoading(true);
      const response = await subscriptionService.getMySubscription();
      setSubscription(response);
    } catch (error) {
      console.error('Error fetching subscription:', error);
      // User doesn't have subscription yet
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Spinner size="large" />
        </div>
      </MainLayout>
    );
  }
  
  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="mt-2 text-gray-600">
            Welcome back, {user?.firstName || user?.username}! Here's what's happening today.
          </p>
        </div>

        {/* No Subscription - Show CTA */}
        {!subscription && (
          <Card className="p-8 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200">
            <div className="text-center max-w-2xl mx-auto">
              <AlertCircle className="w-16 h-16 text-blue-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                No Active Subscription
              </h2>
              <p className="text-gray-600 mb-6">
                Start your journey with Balatrix Telecom. Choose a plan that fits your business needs.
              </p>
              <Button
                variant="primary"
                size="large"
                onClick={() => navigate('/plans')}
                className="shadow-lg"
              >
                View Plans & Get Started
              </Button>
            </div>
          </Card>
        )}

        {/* Active Subscription */}
        {subscription && (
          <>
            {/* Subscription Overview Card */}
            <Card className="p-6 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-3 bg-green-500 rounded-lg">
                      <CreditCard className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">
                        {subscription.ratePlan?.planName}
                      </h2>
                      <p className="text-sm text-gray-600 capitalize">
                        {subscription.billingCycle} Billing • {subscription.status}
                      </p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Current Period</p>
                      <p className="font-semibold text-gray-900">
                        {formatDate(subscription.currentPeriodStart)}
                      </p>
                      <p className="text-sm text-gray-600">to {formatDate(subscription.currentPeriodEnd)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Next Billing</p>
                      <p className="font-semibold text-gray-900">
                        {formatDate(subscription.nextBillingDate)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Auto Renew</p>
                      <p className="font-semibold text-gray-900">
                        {subscription.autoRenew ? 'Enabled' : 'Disabled'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Started On</p>
                      <p className="font-semibold text-gray-900">
                        {formatDate(subscription.startDate)}
                      </p>
                    </div>
                  </div>
                </div>
                
                <Button
                  variant="outline"
                  onClick={() => navigate('/plans')}
                  className="ml-4"
                >
                  Upgrade Plan
                </Button>
              </div>
            </Card>

            {/* Usage Widget */}
            <UsageWidget subscriptionId={subscription.id} />

            {/* Usage Chart */}
            <UsageChart subscriptionId={subscription.id} />

            {/* Usage Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Toll-Free Numbers</p>
                    <p className="mt-2 text-3xl font-semibold text-gray-900">
                      {subscription.ratePlan?.limits?.tollFreeNumbers || 0}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">Allocated</p>
                  </div>
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <Phone className="h-8 w-8 text-blue-600" />
                  </div>
                </div>
              </Card>
              
              <Card>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Included Minutes</p>
                    <p className="mt-2 text-3xl font-semibold text-gray-900">
                      {subscription.ratePlan?.limits?.includedMinutes || 0}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">Per billing cycle</p>
                  </div>
                  <div className="p-3 bg-green-100 rounded-lg">
                    <TrendingUp className="h-8 w-8 text-green-600" />
                  </div>
                </div>
              </Card>
              
              <Card>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Extensions</p>
                    <p className="mt-2 text-3xl font-semibold text-gray-900">
                      {subscription.ratePlan?.limits?.extensions || 0}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">Available</p>
                  </div>
                  <div className="p-3 bg-purple-100 rounded-lg">
                    <Users className="h-8 w-8 text-purple-600" />
                  </div>
                </div>
              </Card>
              
              <Card>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Per Minute Rate</p>
                    <p className="mt-2 text-3xl font-semibold text-gray-900">
                      ₹{subscription.ratePlan?.limits?.pricePerMinute || 0}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">After included minutes</p>
                  </div>
                  <div className="p-3 bg-yellow-100 rounded-lg">
                    <Calendar className="h-8 w-8 text-yellow-600" />
                  </div>
                </div>
              </Card>
            </div>

            {/* Plan Features */}
            {subscription.ratePlan?.features && (
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Plan Features</h3>
                <div className="grid md:grid-cols-2 gap-3">
                  {subscription.ratePlan.features.map((feature, idx) => (
                    <div key={idx} className="flex items-start gap-2">
                      <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <svg className="w-3 h-3 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <span className="text-sm text-gray-700">{feature}</span>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </>
        )}
        
        <Card title="Recent Activity">
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No activity yet</h3>
            <p className="mt-1 text-sm text-gray-500">
              {subscription ? 'Activity will appear here as you use the system.' : 'Get started by selecting a subscription plan.'}
            </p>
          </div>
        </Card>
      </div>
    </MainLayout>
  );
};

export default DashboardPage;
