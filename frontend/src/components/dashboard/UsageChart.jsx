import { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, TrendingDown, Calendar } from 'lucide-react';
import usageService from '../../api/usageService';
import toast from 'react-hot-toast';

const UsageChart = ({ subscriptionId }) => {
  const [historyData, setHistoryData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [chartType, setChartType] = useState('minutes'); // 'minutes' or 'calls'

  useEffect(() => {
    if (subscriptionId) {
      fetchUsageHistory();
    }
  }, [subscriptionId]);

  const fetchUsageHistory = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await usageService.getUsageHistory(subscriptionId, 1, 6); // Get last 6 periods
      setHistoryData(data.usageHistory || []);
    } catch (err) {
      console.error('Error fetching usage history:', err);
      setError(err.message || 'Failed to load usage history');
    } finally {
      setLoading(false);
    }
  };

  const getChartData = () => {
    if (chartType === 'minutes') {
      return historyData.map(item => ({
        label: formatPeriodLabel(item.period),
        value: item.minutesUsed,
        max: item.minutesIncluded,
        overage: item.minutesOverage,
      }));
    } else {
      return historyData.map(item => ({
        label: formatPeriodLabel(item.period),
        value: item.totalCalls,
        successful: item.successfulCalls,
        failed: item.failedCalls,
      }));
    }
  };

  const formatPeriodLabel = (period) => {
    if (!period?.start) return 'N/A';
    const date = new Date(period.start);
    return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
  };

  const calculateTrend = () => {
    if (historyData.length < 2) return { value: 0, direction: 'neutral' };
    
    const current = historyData[0]?.minutesUsed || 0;
    const previous = historyData[1]?.minutesUsed || 0;
    
    if (previous === 0) return { value: 0, direction: 'neutral' };
    
    const percentChange = ((current - previous) / previous) * 100;
    return {
      value: Math.abs(percentChange).toFixed(1),
      direction: percentChange > 0 ? 'up' : percentChange < 0 ? 'down' : 'neutral',
    };
  };

  const renderBarChart = () => {
    const data = getChartData();
    if (data.length === 0) return null;

    const maxValue = Math.max(...data.map(d => d.max || d.value || 0));
    const chartHeight = 200;
    const barWidth = 100 / data.length - 2; // Percentage width with gap

    return (
      <div className="relative h-[240px] mt-4">
        {/* Y-axis labels */}
        <div className="absolute left-0 top-0 bottom-8 w-12 flex flex-col justify-between text-xs text-gray-500">
          <span>{maxValue}</span>
          <span>{Math.round(maxValue * 0.75)}</span>
          <span>{Math.round(maxValue * 0.5)}</span>
          <span>{Math.round(maxValue * 0.25)}</span>
          <span>0</span>
        </div>

        {/* Chart area */}
        <div className="absolute left-12 right-0 top-0 bottom-0">
          <div className="relative h-full flex items-end justify-around gap-2 pb-8">
            {data.map((item, index) => {
              const valueHeight = maxValue > 0 ? (item.value / maxValue) * chartHeight : 0;
              const overageHeight = item.overage && maxValue > 0
                ? (item.overage / maxValue) * chartHeight
                : 0;
              const maxHeight = item.max && maxValue > 0
                ? (item.max / maxValue) * chartHeight
                : valueHeight;

              return (
                <div
                  key={index}
                  className="flex flex-col items-center flex-1"
                  style={{ maxWidth: `${barWidth}%` }}
                >
                  {/* Bar */}
                  <div className="relative w-full flex flex-col justify-end" style={{ height: `${chartHeight}px` }}>
                    {/* Max capacity line (if applicable) */}
                    {item.max && (
                      <div
                        className="absolute w-full border-t-2 border-dashed border-gray-300"
                        style={{ bottom: `${maxHeight}px` }}
                      />
                    )}
                    
                    {/* Overage bar (red) */}
                    {overageHeight > 0 && (
                      <div
                        className="w-full bg-red-500 rounded-t transition-all duration-300 hover:bg-red-600"
                        style={{ height: `${overageHeight}px` }}
                        title={`Overage: ${item.overage} min`}
                      />
                    )}
                    
                    {/* Used minutes bar */}
                    <div
                      className={`w-full ${
                        item.overage > 0
                          ? 'bg-yellow-500 hover:bg-yellow-600'
                          : 'bg-blue-500 hover:bg-blue-600'
                      } ${overageHeight > 0 ? '' : 'rounded-t'} transition-all duration-300`}
                      style={{ height: `${valueHeight}px` }}
                      title={`Used: ${item.value} min`}
                    />
                  </div>

                  {/* Label */}
                  <div className="text-xs text-gray-600 mt-2 text-center">
                    {item.label}
                  </div>
                </div>
              );
            })}
          </div>

          {/* X-axis line */}
          <div className="absolute bottom-7 left-0 right-0 h-px bg-gray-300" />
        </div>
      </div>
    );
  };

  const trend = calculateTrend();

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="w-5 h-5 text-gray-400" />
          <h3 className="text-lg font-semibold text-gray-900">Usage Trends</h3>
        </div>
        <div className="animate-pulse">
          <div className="h-48 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="w-5 h-5 text-gray-400" />
          <h3 className="text-lg font-semibold text-gray-900">Usage Trends</h3>
        </div>
        <div className="text-center py-8">
          <p className="text-red-600">{error}</p>
          <button
            onClick={fetchUsageHistory}
            className="mt-4 text-blue-600 hover:text-blue-700 text-sm font-medium"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (historyData.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="w-5 h-5 text-gray-400" />
          <h3 className="text-lg font-semibold text-gray-900">Usage Trends</h3>
        </div>
        <div className="text-center py-8">
          <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-2" />
          <p className="text-gray-500">No usage history available yet</p>
          <p className="text-sm text-gray-400 mt-1">
            Usage data will appear here after your first billing period
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-gray-400" />
          <h3 className="text-lg font-semibold text-gray-900">Usage Trends</h3>
        </div>

        {/* Chart type toggle */}
        <div className="flex gap-2">
          <button
            onClick={() => setChartType('minutes')}
            className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
              chartType === 'minutes'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Minutes
          </button>
          <button
            onClick={() => setChartType('calls')}
            className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
              chartType === 'calls'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Calls
          </button>
        </div>
      </div>

      {/* Trend indicator */}
      {trend.direction !== 'neutral' && (
        <div className="flex items-center gap-2 mb-4">
          {trend.direction === 'up' ? (
            <TrendingUp className="w-4 h-4 text-red-500" />
          ) : (
            <TrendingDown className="w-4 h-4 text-green-500" />
          )}
          <span className={`text-sm font-medium ${
            trend.direction === 'up' ? 'text-red-600' : 'text-green-600'
          }`}>
            {trend.direction === 'up' ? '+' : '-'}{trend.value}% from last period
          </span>
        </div>
      )}

      {/* Chart */}
      {renderBarChart()}

      {/* Legend */}
      {chartType === 'minutes' && (
        <div className="flex items-center justify-center gap-6 mt-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-500 rounded"></div>
            <span className="text-gray-600">Used</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-500 rounded"></div>
            <span className="text-gray-600">Overage</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-dashed border-gray-300 rounded"></div>
            <span className="text-gray-600">Included</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsageChart;
