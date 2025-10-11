import { useState } from 'react';
import { Card } from '../../ui/Card';
import { Button } from '../../ui/Button';
import { Input } from '../../ui/Input';
import { Badge } from '../../ui/Badge';
import { Phone, Download, Search, Filter, Calendar } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { usageService } from '../../../services/usage';
import { format } from 'date-fns';

export const CDRTable = () => {
  const [search, setSearch] = useState('');
  const [dateRange, setDateRange] = useState('7d');
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const { data, isLoading } = useQuery({
    queryKey: ['cdr', search, dateRange, page],
    queryFn: () => usageService.getCDRs({ search, dateRange, page, pageSize }),
  });

  const handleExport = async () => {
    try {
      const blob = await usageService.exportCDRs({ search, dateRange });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `cdr-export-${format(new Date(), 'yyyy-MM-dd')}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  const getCallTypeBadge = (type) => {
    const variants = {
      inbound: 'info',
      outbound: 'primary',
      internal: 'gray',
    };
    return <Badge variant={variants[type]} size="sm">{type}</Badge>;
  };

  const getStatusBadge = (status) => {
    const variants = {
      completed: 'success',
      failed: 'danger',
      busy: 'warning',
      'no-answer': 'gray',
    };
    return <Badge variant={variants[status]} size="sm">{status}</Badge>;
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-16 bg-gray-200 rounded"></div>
          ))}
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters and Actions */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row gap-4 items-center">
          <div className="flex-1">
            <Input
              placeholder="Search by number, destination..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              leftIcon={<Search className="w-4 h-4" />}
            />
          </div>
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="today">Today</option>
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="custom">Custom Range</option>
          </select>
          <Button onClick={handleExport} variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </Card>

      {/* CDR Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">Total Calls</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
            {data?.stats?.totalCalls || 0}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">Total Duration</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
            {data?.stats?.totalMinutes || 0} min
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">Total Cost</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
            ₹{data?.stats?.totalCost || 0}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">Success Rate</p>
          <p className="text-2xl font-bold text-green-600 mt-1">
            {data?.stats?.successRate || 0}%
          </p>
        </Card>
      </div>

      {/* CDR Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Date & Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  From
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  To
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Duration
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Cost
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
              {data?.records?.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-8 text-center">
                    <Phone className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-500">No call records found</p>
                  </td>
                </tr>
              ) : (
                data?.records?.map((record) => (
                  <tr key={record.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">
                        {format(new Date(record.timestamp), 'MMM dd, yyyy')}
                      </div>
                      <div className="text-sm text-gray-500">
                        {format(new Date(record.timestamp), 'HH:mm:ss')}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {record.from}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {record.to}
                      </div>
                      {record.destination && (
                        <div className="text-xs text-gray-500">
                          {record.destination}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getCallTypeBadge(record.type)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">
                        {formatDuration(record.duration)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(record.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        ₹{record.cost}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {data?.totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-800 flex items-center justify-between">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Showing {((page - 1) * pageSize) + 1} to {Math.min(page * pageSize, data?.totalRecords)} of {data?.totalRecords} records
            </div>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.min(data?.totalPages, p + 1))}
                disabled={page === data?.totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};
