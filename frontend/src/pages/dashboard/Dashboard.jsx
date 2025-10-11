/**
 * Dashboard Page
 * Main dashboard overview with real-time metrics
 */

import { Overview } from '../../components/features/dashboard/Overview';
import { QuickActions } from '../../components/features/dashboard/QuickActions';
import { RecentActivity } from '../../components/features/dashboard/RecentActivity';
import { UsageMetrics } from '../../components/features/dashboard/UsageMetrics';
import { BalanceCard } from '../../components/features/dashboard/BalanceCard';
import { UsageChart } from '../../components/charts/UsageChart';

export const Dashboard = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Welcome back! Here's an overview of your telecom services.
        </p>
      </div>

      {/* Key Metrics */}
      <Overview />

      {/* Balance Card and Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <QuickActions />
        </div>
        <div>
          <BalanceCard />
        </div>
      </div>

      {/* Usage Chart */}
      <UsageChart type="area" />

      {/* Usage Metrics and Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <UsageMetrics />
        <RecentActivity />
      </div>
    </div>
  );
};

export default Dashboard;
