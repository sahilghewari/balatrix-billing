/**
 * Billing History Page
 * View complete payment history
 */

import { Card } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { useQuery } from '@tanstack/react-query';
import { billingService } from '../../../services/billing';
import { format } from 'date-fns';
import { CheckCircle, XCircle, Clock } from 'lucide-react';

export const History = () => {
  const { data: history, isLoading } = useQuery({
    queryKey: ['payment-history'],
    queryFn: billingService.getPaymentHistory,
  });

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Clock className="w-5 h-5 text-yellow-500" />;
    }
  };

  const getStatusBadge = (status) => {
    const variants = {
      completed: 'success',
      failed: 'danger',
      pending: 'warning',
      refunded: 'info',
    };
    return <Badge variant={variants[status]}>{status.toUpperCase()}</Badge>;
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="p-6 animate-pulse">
            <div className="h-16 bg-gray-200 rounded"></div>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Payment History
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Complete record of all your transactions
        </p>
      </div>

      <div className="space-y-4">
        {history?.map((transaction) => (
          <Card key={transaction.id} className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-start space-x-4">
                {getStatusIcon(transaction.status)}
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    {transaction.description}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {format(new Date(transaction.date), 'MMMM dd, yyyy HH:mm')}
                  </p>
                  {transaction.method && (
                    <p className="text-xs text-gray-500 mt-1">
                      Payment Method: {transaction.method}
                    </p>
                  )}
                </div>
              </div>
              <div className="text-right">
                <p className="text-xl font-bold text-gray-900 dark:text-white">
                  {transaction.amount}
                </p>
                <div className="mt-2">{getStatusBadge(transaction.status)}</div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default History;
