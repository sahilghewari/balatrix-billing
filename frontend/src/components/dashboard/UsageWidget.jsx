/**
 * Usage Widget Component
 * Displays current subscription usage (minutes, calls, overage)
 */

import { useEffect, useState } from 'react';
import { Phone, Clock, TrendingUp, AlertCircle } from 'lucide-react';
import usageService from '../../api/usageService';
import Card from '../common/Card';

const UsageWidget = ({ subscriptionId }) => {
  const [usage, setUsage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (subscriptionId) {
      fetchUsage();
    }
  }, [subscriptionId]);

  const fetchUsage = async () => {
    try {
      setLoading(true);
      const response = await usageService.getCurrentUsage(subscriptionId);
      setUsage(response);
      setError(null);
    } catch (err) {
      console.error('Error fetching usage:', err);
      setError('Failed to load usage data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-6">
        <div className="text-center text-red-600">
          <AlertCircle className="w-12 h-12 mx-auto mb-2" />
          <p>{error}</p>
        </div>
      </Card>
    );
  }

  if (!usage) {
    return null;
  }

  const { usage: usageData, calls, currentPeriod } = usage;
  const utilizationPercent = parseFloat(usageData.utilizationPercentage) || 0;
  const isOverage = usageData.overageMinutes > 0;
  const isNearLimit = utilizationPercent >= 80 && utilizationPercent < 100;

  return (
    <Card className="p-6">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Usage Overview</h3>
          <span className="text-sm text-gray-500">
            {currentPeriod?.daysRemaining || 0} days remaining
          </span>
        </div>

        {/* Minutes Usage */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center">
              <Clock className="w-5 h-5 text-blue-600 mr-2" />
              <span className="font-medium text-gray-900">Minutes Used</span>
            </div>
            <span className="text-2xl font-bold text-gray-900">
              {usageData.usedMinutes}
              <span className="text-sm text-gray-500 font-normal">
                {' '}/ {usageData.includedMinutes}
              </span>
            </span>
          </div>

          {/* Progress Bar */}
          <div className="relative w-full h-3 bg-gray-200 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${
                isOverage
                  ? 'bg-red-500'
                  : isNearLimit
                  ? 'bg-yellow-500'
                  : 'bg-blue-600'
              }`}
              style={{ width: `${Math.min(utilizationPercent, 100)}%` }}
            />
          </div>

          <div className="mt-2 flex items-center justify-between text-sm">
            <span className="text-gray-600">
              {usageData.remainingMinutes} minutes remaining
            </span>
            <span
              className={`font-medium ${
                isOverage ? 'text-red-600' : isNearLimit ? 'text-yellow-600' : 'text-blue-600'
              }`}
            >
              {utilizationPercent.toFixed(1)}% used
            </span>
          </div>
        </div>

        {/* Overage Alert */}
        {isOverage && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start">
              <AlertCircle className="w-5 h-5 text-red-600 mr-2 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-red-800">Overage Usage</p>
                <p className="text-sm text-red-600 mt-1">
                  You've used {usageData.overageMinutes} extra minutes. Additional charges: ₹
                  {usageData.overageCharges.toFixed(2)} at ₹{usageData.perMinuteRate}/min
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Near Limit Warning */}
        {isNearLimit && !isOverage && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start">
              <TrendingUp className="w-5 h-5 text-yellow-600 mr-2 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-yellow-800">Approaching Limit</p>
                <p className="text-sm text-yellow-600 mt-1">
                  You've used {utilizationPercent.toFixed(1)}% of your included minutes. Additional
                  usage will be charged at ₹{usageData.perMinuteRate}/min.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Call Statistics */}
        <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-200">
          <div className="text-center">
            <Phone className="w-5 h-5 text-gray-400 mx-auto mb-1" />
            <p className="text-2xl font-bold text-gray-900">{calls?.total || 0}</p>
            <p className="text-xs text-gray-500">Total Calls</p>
          </div>
          <div className="text-center">
            <div className="w-5 h-5 bg-green-100 rounded-full mx-auto mb-1 flex items-center justify-center">
              <div className="w-2 h-2 bg-green-600 rounded-full"></div>
            </div>
            <p className="text-2xl font-bold text-green-600">{calls?.successful || 0}</p>
            <p className="text-xs text-gray-500">Successful</p>
          </div>
          <div className="text-center">
            <div className="w-5 h-5 bg-red-100 rounded-full mx-auto mb-1 flex items-center justify-center">
              <div className="w-2 h-2 bg-red-600 rounded-full"></div>
            </div>
            <p className="text-2xl font-bold text-red-600">{calls?.failed || 0}</p>
            <p className="text-xs text-gray-500">Failed</p>
          </div>
        </div>

        {/* Per-Minute Rate Info */}
        <div className="bg-blue-50 rounded-lg p-3">
          <p className="text-xs text-blue-800">
            <span className="font-medium">Per-minute rate:</span> ₹{usageData.perMinuteRate} (after
            free minutes)
          </p>
        </div>
      </div>
    </Card>
  );
};

export default UsageWidget;
