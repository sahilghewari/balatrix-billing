/**
 * Customer Dashboard Page
 * Main customer interface with overview and management tools
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import {
  CreditCard,
  Calendar,
  Phone,
  Users,
  TrendingUp,
  AlertCircle,
  RefreshCw,
  Settings,
  BarChart3,
  HelpCircle,
  PhoneCall,
  MessageSquare
} from 'lucide-react';
import { MainLayout } from '../components/layout';
import { Card, Button, Spinner } from '../components/common';
import { useAuth } from '../hooks';
import { subscriptionService } from '../api';

const DashboardPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [subscription, setSubscription] = useState(null);
  const [stats, setStats] = useState({
    tollFreeNumbers: 0,
    extensions: 0,
    minutesUsed: 0,
    nextBilling: null,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Get all dashboard data in one API call
      const dashboardResponse = await subscriptionService.getMyDashboard();
      
      setSubscription(dashboardResponse.subscription);
      setStats({
        tollFreeNumbers: dashboardResponse.stats.tollFreeNumbers,
        extensions: dashboardResponse.stats.extensions,
        minutesUsed: dashboardResponse.stats.minutesUsed,
        nextBilling: dashboardResponse.stats.nextBilling,
      });

      // Redirect to plans if no subscription
      if (!dashboardResponse.subscription) {
        navigate('/plans');
        return;
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const quickActions = [
    {
      title: 'Manage Toll-Free Numbers',
      description: 'View and manage your assigned numbers',
      icon: Phone,
      action: () => navigate('/numbers/manage'),
      color: 'bg-blue-500',
    },
    {
      title: 'Manage Extensions',
      description: 'Configure your SIP extensions',
      icon: Users,
      action: () => navigate('/extensions/manage'),
      color: 'bg-green-500',
    },
    {
      title: 'View Usage Reports',
      description: 'Check your call usage and billing',
      icon: BarChart3,
      action: () => navigate('/usage'),
      color: 'bg-purple-500',
    },
    {
      title: 'Update Billing Info',
      description: 'Manage payment methods and billing',
      icon: CreditCard,
      action: () => navigate('/billing'),
      color: 'bg-indigo-500',
    },
    {
      title: 'Call Routing',
      description: 'Configure how calls are routed',
      icon: PhoneCall,
      action: () => navigate('/routing'),
      color: 'bg-teal-500',
    },
    {
      title: 'Support',
      description: 'Get help and contact support',
      icon: HelpCircle,
      action: () => navigate('/support'),
      color: 'bg-orange-500',
    },
  ];

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
        <div className="flex items-center justify-center min-h-96">
          <Spinner size="lg" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="mt-2 text-gray-600">
              Welcome back, {user?.firstName || user?.username}! Manage your telecom services from here.
            </p>
          </div>
          <Button
            onClick={fetchDashboardData}
            variant="outline"
            className="flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <CreditCard className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Current Plan</p>
                <p className="text-2xl font-bold text-gray-900">{subscription?.plan?.planName || 'N/A'}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <Phone className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Toll-Free Numbers</p>
                <p className="text-2xl font-bold text-gray-900">{stats.tollFreeNumbers}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Extensions</p>
                <p className="text-2xl font-bold text-gray-900">{stats.extensions}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Calendar className="w-6 h-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Next Billing</p>
                <p className="text-2xl font-bold text-gray-900">{formatDate(stats.nextBilling)}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {quickActions.map((action, index) => (
              <button
                key={index}
                onClick={action.action}
                className="p-4 border border-gray-200 rounded-lg hover:border-gray-300 hover:shadow-md transition-all duration-200 text-left group"
              >
                <div className={`w-10 h-10 ${action.color} rounded-lg flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-200`}>
                  <action.icon className="w-5 h-5 text-white" />
                </div>
                <h3 className="font-medium text-gray-900 mb-1">{action.title}</h3>
                <p className="text-sm text-gray-600">{action.description}</p>
              </button>
            ))}
          </div>
        </Card>

        {/* Recent Activity */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Activity</h2>
          <div className="space-y-4">
            {subscription ? (
              <div className="flex items-center p-4 bg-green-50 rounded-lg">
                <div className="flex-shrink-0">
                  <AlertCircle className="w-5 h-5 text-green-500" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-900">Subscription Active</p>
                  <p className="text-sm text-gray-600">Your {subscription.ratePlan?.planName} plan is active and running</p>
                </div>
                <div className="ml-auto text-sm text-gray-500">
                  Active
                </div>
              </div>
            ) : (
              <div className="flex items-center p-4 bg-yellow-50 rounded-lg">
                <div className="flex-shrink-0">
                  <AlertCircle className="w-5 h-5 text-yellow-500" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-900">No Active Subscription</p>
                  <p className="text-sm text-gray-600">Please contact support to activate your account</p>
                </div>
                <div className="ml-auto text-sm text-gray-500">
                  Pending
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>
    </MainLayout>
  );
};

export default DashboardPage;