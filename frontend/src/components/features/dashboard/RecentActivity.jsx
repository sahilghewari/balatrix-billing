import { Phone, CreditCard, CheckCircle, AlertCircle } from 'lucide-react';
import { Card } from '../../ui/Card';
import { Badge } from '../../ui/Badge';
import { useQuery } from '@tanstack/react-query';
import { usageService } from '../../../services/usage';
import { formatDistanceToNow } from 'date-fns';

export const RecentActivity = () => {
  const { data: activities, isLoading } = useQuery({
    queryKey: ['recent-activity'],
    queryFn: usageService.getRecentActivity,
    refetchInterval: 60000, // Refetch every minute
  });

  const getActivityIcon = (type) => {
    switch (type) {
      case 'call':
        return Phone;
      case 'payment':
        return CreditCard;
      case 'success':
        return CheckCircle;
      default:
        return AlertCircle;
    }
  };

  const getActivityColor = (type) => {
    switch (type) {
      case 'call':
        return 'primary';
      case 'payment':
        return 'success';
      case 'success':
        return 'success';
      case 'error':
        return 'danger';
      default:
        return 'gray';
    }
  };

  if (isLoading) {
    return (
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Recent Activity
        </h3>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse flex items-start space-x-3">
              <div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Recent Activity
      </h3>
      <div className="space-y-4">
        {activities?.length === 0 ? (
          <div className="text-center py-8">
            <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500">No recent activity</p>
          </div>
        ) : (
          activities?.map((activity, index) => {
            const Icon = getActivityIcon(activity.type);
            const color = getActivityColor(activity.type);
            
            return (
              <div
                key={index}
                className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <div className={`p-2 rounded-lg bg-${color}-100 dark:bg-${color}-900/20`}>
                  <Icon className={`w-5 h-5 text-${color}-600 dark:text-${color}-400`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {activity.title}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {activity.description}
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                    {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                  </p>
                </div>
                {activity.amount && (
                  <Badge variant={color}>{activity.amount}</Badge>
                )}
              </div>
            );
          })
        )}
      </div>
    </Card>
  );
};
