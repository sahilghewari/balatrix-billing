/**
 * Usage Analytics Page
 * Detailed usage analytics and charts
 */

import { UsageAnalytics as UsageAnalyticsComponent } from '../../../components/features/analytics/UsageAnalytics';

export const Analytics = () => {
  return (
    <div className="space-y-6">
      <UsageAnalyticsComponent />
    </div>
  );
};

export default Analytics;
