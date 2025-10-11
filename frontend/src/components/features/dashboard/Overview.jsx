import { DollarSign, Users, Phone, Wallet } from 'lucide-react';
import { MetricsCard } from './MetricsCard';
import { useQuery } from '@tanstack/react-query';
import { usageService } from '../../../services/usage';

export const Overview = () => {
  const { data: metrics, isLoading } = useQuery({
    queryKey: ['dashboard-metrics'],
    queryFn: usageService.getMetrics,
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  const metricsData = [
    {
      title: 'Total Revenue',
      value: metrics?.revenue || '₹0',
      change: metrics?.revenueChange || 0,
      trend: metrics?.revenueChange >= 0 ? 'up' : 'down',
      icon: DollarSign,
    },
    {
      title: 'Active Subscriptions',
      value: metrics?.activeSubscriptions || '0',
      change: metrics?.subscriptionsChange || 0,
      trend: metrics?.subscriptionsChange >= 0 ? 'up' : 'down',
      icon: Users,
    },
    {
      title: 'Call Volume',
      value: metrics?.callVolume || '0',
      change: metrics?.callVolumeChange || 0,
      trend: metrics?.callVolumeChange >= 0 ? 'up' : 'down',
      icon: Phone,
    },
    {
      title: 'Account Balance',
      value: metrics?.balance || '₹0',
      change: metrics?.balanceChange || 0,
      trend: metrics?.balanceChange >= 0 ? 'up' : 'down',
      icon: Wallet,
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {metricsData.map((metric, index) => (
        <MetricsCard key={index} {...metric} loading={isLoading} />
      ))}
    </div>
  );
};
