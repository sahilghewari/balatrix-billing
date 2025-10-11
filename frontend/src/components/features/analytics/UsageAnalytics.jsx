import { Card } from '../../ui/Card';
import { Select } from '../../ui/Select';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { usageService } from '../../../services/usage';
import { PieChart, Pie, Cell, BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export const UsageAnalytics = () => {
  const [period, setPeriod] = useState('30d');

  const { data: analytics, isLoading } = useQuery({
    queryKey: ['usage-analytics', period],
    queryFn: () => usageService.getAnalytics(period),
  });

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="p-6 animate-pulse">
            <div className="h-64 bg-gray-200 rounded"></div>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Period Selector */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Usage Analytics
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Detailed insights into your calling patterns
          </p>
        </div>
        <Select
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          className="w-40"
        >
          <option value="7d">Last 7 days</option>
          <option value="30d">Last 30 days</option>
          <option value="90d">Last 90 days</option>
          <option value="12m">Last 12 months</option>
        </Select>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Call Volume Over Time */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Call Volume Trend
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={analytics?.volumeOverTime}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="date" stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#fff', 
                  border: '1px solid #e5e7eb', 
                  borderRadius: '8px' 
                }} 
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="calls" 
                stroke="#3b82f6" 
                strokeWidth={2} 
                dot={{ r: 4 }} 
                name="Total Calls"
              />
              <Line 
                type="monotone" 
                dataKey="completed" 
                stroke="#10b981" 
                strokeWidth={2} 
                dot={{ r: 4 }}
                name="Completed"
              />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        {/* Cost by Destination */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Cost by Destination
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={analytics?.costByDestination}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="destination" stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#fff', 
                  border: '1px solid #e5e7eb', 
                  borderRadius: '8px' 
                }} 
              />
              <Bar dataKey="cost" fill="#3b82f6" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Call Type Distribution */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Call Type Distribution
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={analytics?.callTypeDistribution}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {analytics?.callTypeDistribution?.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        {/* Peak Hours */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Peak Call Hours
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={analytics?.peakHours}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="hour" stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#fff', 
                  border: '1px solid #e5e7eb', 
                  borderRadius: '8px' 
                }} 
              />
              <Bar dataKey="calls" fill="#10b981" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-6">
          <p className="text-sm text-gray-600 dark:text-gray-400">Average Call Duration</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
            {analytics?.stats?.avgDuration || 0} min
          </p>
        </Card>
        <Card className="p-6">
          <p className="text-sm text-gray-600 dark:text-gray-400">Success Rate</p>
          <p className="text-3xl font-bold text-green-600 mt-2">
            {analytics?.stats?.successRate || 0}%
          </p>
        </Card>
        <Card className="p-6">
          <p className="text-sm text-gray-600 dark:text-gray-400">Total Minutes</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
            {analytics?.stats?.totalMinutes?.toLocaleString() || 0}
          </p>
        </Card>
        <Card className="p-6">
          <p className="text-sm text-gray-600 dark:text-gray-400">Total Cost</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
            ₹{analytics?.stats?.totalCost?.toLocaleString() || 0}
          </p>
        </Card>
      </div>
    </div>
  );
};
