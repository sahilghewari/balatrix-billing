import { Wallet, Plus, AlertCircle } from 'lucide-react';
import { Card } from '../../ui/Card';
import { Button } from '../../ui/Button';
import { useQuery } from '@tanstack/react-query';
import { billingService } from '../../../services/billing';
import { useNavigate } from 'react-router-dom';

export const BalanceCard = () => {
  const navigate = useNavigate();
  const { data: balance, isLoading } = useQuery({
    queryKey: ['account-balance'],
    queryFn: billingService.getBalance,
    refetchInterval: 30000,
  });

  const isLowBalance = balance?.amount < balance?.threshold;

  if (isLoading) {
    return (
      <Card className="p-6 bg-gradient-to-br from-primary-500 to-primary-700">
        <div className="animate-pulse">
          <div className="h-6 bg-white/20 rounded w-1/2 mb-4"></div>
          <div className="h-10 bg-white/20 rounded w-3/4 mb-4"></div>
          <div className="h-8 bg-white/20 rounded w-32"></div>
        </div>
      </Card>
    );
  }

  return (
    <Card className={`p-6 ${
      isLowBalance 
        ? 'bg-gradient-to-br from-red-500 to-red-700' 
        : 'bg-gradient-to-br from-primary-500 to-primary-700'
    }`}>
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center space-x-2 mb-2">
            <Wallet className="w-5 h-5 text-white" />
            <p className="text-sm font-medium text-white/90">Account Balance</p>
          </div>
          <p className="text-4xl font-bold text-white mb-1">
            {balance?.formatted || '₹0.00'}
          </p>
          {isLowBalance && (
            <div className="flex items-center space-x-1 text-white/90">
              <AlertCircle className="w-4 h-4" />
              <span className="text-xs">Low balance alert</span>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center space-x-3 mt-6">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => navigate('/billing/add-funds')}
          className="flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Add Funds</span>
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/billing/history')}
          className="text-white hover:bg-white/10"
        >
          View History
        </Button>
      </div>

      {balance?.autoRecharge && (
        <div className="mt-4 pt-4 border-t border-white/20">
          <p className="text-xs text-white/80">
            Auto-recharge enabled: ₹{balance.autoRechargeAmount} when balance drops below ₹{balance.autoRechargeThreshold}
          </p>
        </div>
      )}
    </Card>
  );
};
