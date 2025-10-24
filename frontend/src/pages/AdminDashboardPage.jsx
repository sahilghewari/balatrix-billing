/**
 * Admin Dashboard Page
 * Main admin interface with overview and navigation
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import {
  Users,
  Phone,
  Building,
  TrendingUp,
  AlertCircle,
  Plus,
  Settings,
  BarChart3
} from 'lucide-react';
import MainLayout from '../components/layout/MainLayout';
import { Card, Button, Spinner } from '../components/common';
import { useAuth } from '../hooks';
import { tenantService } from '../api';

const AdminDashboardPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalTenants: 0,
    totalExtensions: 0,
    activeExtensions: 0,
    totalCalls: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);

      // Get tenants
      const tenantsResponse = await tenantService.getTenants();
      const tenants = tenantsResponse.tenants || [];

      // Calculate stats
      let totalExtensions = 0;
      let activeExtensions = 0;

      // Get extensions for each tenant
      for (const tenant of tenants) {
        try {
          const extensionsResponse = await tenantService.getTenantExtensions(tenant.id);
          const extensions = extensionsResponse.extensions || [];
          totalExtensions += extensions.length;
          activeExtensions += extensions.filter(ext => ext.isActive).length;
        } catch (error) {
          console.warn(`Failed to fetch extensions for tenant ${tenant.id}:`, error);
        }
      }

      setStats({
        totalTenants: tenants.length,
        totalExtensions,
        activeExtensions,
        totalCalls: 0, // TODO: Implement call stats
      });
    } catch (error) {
      console.error('Error fetching admin stats:', error);
      toast.error('Failed to load dashboard statistics');
    } finally {
      setLoading(false);
    }
  };

  const quickActions = [
    {
      title: 'Add Tenant',
      description: 'Create a new tenant organization',
      icon: Building,
      action: () => navigate('/admin/tenants/new'),
      color: 'bg-blue-500',
    },
    {
      title: 'Add Extension',
      description: 'Create a new SIP extension',
      icon: Phone,
      action: () => navigate('/admin/extensions/new'),
      color: 'bg-green-500',
    },
    {
      title: 'Manage Tenants',
      description: 'View and manage all tenants',
      icon: Building,
      action: () => navigate('/admin/tenants'),
      color: 'bg-indigo-500',
    },
    {
      title: 'Manage Extensions',
      description: 'View and manage all extensions',
      icon: Phone,
      action: () => navigate('/admin/extensions'),
      color: 'bg-teal-500',
    },
    {
      title: 'View Reports',
      description: 'Check system usage and analytics',
      icon: BarChart3,
      action: () => navigate('/admin/reports'),
      color: 'bg-purple-500',
    },
    {
      title: 'System Settings',
      description: 'Configure system parameters',
      icon: Settings,
      action: () => navigate('/admin/settings'),
      color: 'bg-gray-500',
    },
  ];

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
            <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="mt-2 text-gray-600">
              Welcome back, {user?.email}. Manage your telecom system from here.
            </p>
          </div>
          <Button
            onClick={fetchStats}
            variant="outline"
            className="flex items-center gap-2"
          >
            <TrendingUp className="w-4 h-4" />
            Refresh Stats
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Building className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Tenants</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalTenants}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <Phone className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Extensions</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalExtensions}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Users className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Extensions</p>
                <p className="text-2xl font-bold text-gray-900">{stats.activeExtensions}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Calls</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalCalls}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
            <div className="flex items-center p-4 bg-gray-50 rounded-lg">
              <div className="flex-shrink-0">
                <AlertCircle className="w-5 h-5 text-blue-500" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900">System initialized</p>
                <p className="text-sm text-gray-600">All services are running normally</p>
              </div>
              <div className="ml-auto text-sm text-gray-500">
                Just now
              </div>
            </div>
          </div>
        </Card>
      </div>
    </MainLayout>
  );
};

export default AdminDashboardPage;