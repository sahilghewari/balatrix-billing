/**
 * Usage Overview Page
 * Overview of usage statistics
 */

import { CDRTable } from '../../../components/tables/CDRTable';
import { UsageChart } from '../../../components/charts/UsageChart';
import { Card } from '../../../components/ui/Card';
import { useQuery } from '@tanstack/react-query';
import { usageService } from '../../../services/usage';

export const Overview = () => {
  const { data: stats } = useQuery({
    queryKey: ['usage-stats'],
    queryFn: usageService.getUsageStats,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Usage Overview
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Monitor your service usage and costs
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-6">
          <p className="text-sm text-gray-600 dark:text-gray-400">Total Calls</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
            {stats?.totalCalls?.toLocaleString() || 0}
          </p>
        </Card>
        <Card className="p-6">
          <p className="text-sm text-gray-600 dark:text-gray-400">Total Minutes</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
            {stats?.totalMinutes?.toLocaleString() || 0}
          </p>
        </Card>
        <Card className="p-6">
          <p className="text-sm text-gray-600 dark:text-gray-400">Total Cost</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
            ₹{stats?.totalCost?.toLocaleString() || 0}
          </p>
        </Card>
        <Card className="p-6">
          <p className="text-sm text-gray-600 dark:text-gray-400">Avg. Duration</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
            {stats?.avgDuration || 0} min
          </p>
        </Card>
      </div>

      {/* Usage Chart */}
      <UsageChart type="line" />

      {/* Recent Calls */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Recent Calls
        </h2>
        <CDRTable />
      </div>
    </div>
  );
};

export default Overview;
