/**
 * Customer Call Monitoring Page
 * Real-time call monitoring for customer's toll-free numbers
 */

import React from 'react';
import MainLayout from '../components/layout/MainLayout';
import CustomerCallMonitor from '../components/dashboard/CustomerCallMonitor';

const CustomerCallMonitoringPage = () => {
  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Call Monitoring</h1>
            <p className="text-gray-600">Monitor calls to your toll-free numbers in real-time</p>
          </div>
        </div>

        <CustomerCallMonitor />
      </div>
    </MainLayout>
  );
};

export default CustomerCallMonitoringPage;