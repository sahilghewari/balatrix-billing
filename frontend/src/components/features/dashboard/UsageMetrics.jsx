import { Card } from '../../ui/Card';
import { useQuery } from '@tanstack/react-query';
import { usageService } from '../../../services/usage';

export const UsageMetrics = () => {
  const { data: usage, isLoading } = useQuery({
    queryKey: ['usage-metrics'],
    queryFn: usageService.getCurrentUsage,
    refetchInterval: 30000,
  });

  const metrics = [
    {
      label: 'Calls This Month',
      value: usage?.callsCount || 0,
      limit: usage?.callsLimit || 1000,
      unit: 'calls',
    },
    {
      label: 'Minutes Used',
      value: usage?.minutesUsed || 0,
      limit: usage?.minutesLimit || 5000,
      unit: 'min',
    },
    {
      label: 'Data Transfer',
      value: usage?.dataUsed || 0,
      limit: usage?.dataLimit || 100,
      unit: 'GB',
    },
  ];

  if (isLoading) {
    return (
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Usage Overview
        </h3>
        <div className="space-y-6 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div key={i}>
              <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
              <div className="h-2 bg-gray-200 rounded w-full"></div>
            </div>
          ))}
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Usage Overview
      </h3>
      <div className="space-y-6">
        {metrics.map((metric, index) => {
          const percentage = (metric.value / metric.limit) * 100;
          const isNearLimit = percentage > 80;
          const isOverLimit = percentage > 100;

          return (
            <div key={index}>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {metric.label}
                </span>
                <span className="text-sm font-semibold text-gray-900 dark:text-white">
                  {metric.value.toLocaleString()} / {metric.limit.toLocaleString()} {metric.unit}
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    isOverLimit
                      ? 'bg-red-500'
                      : isNearLimit
                      ? 'bg-yellow-500'
                      : 'bg-primary-500'
                  }`}
                  style={{ width: `${Math.min(percentage, 100)}%` }}
                ></div>
              </div>
              {isNearLimit && (
                <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">
                  {isOverLimit ? 'Limit exceeded!' : 'Approaching limit'}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
};
