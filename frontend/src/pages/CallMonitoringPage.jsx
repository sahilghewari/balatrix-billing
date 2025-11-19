/**
 * Call Monitoring Page
 * Real-time call monitoring dashboard for administrators
 */

import React from 'react';
import MainLayout from '../components/layout/MainLayout';
import CallMonitor from '../components/dashboard/CallMonitor';

const CallMonitoringPage = () => {
  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Call Monitoring</h1>
            <p className="text-gray-600">Real-time monitoring of active calls</p>
          </div>
        </div>

        <CallMonitor />
      </div>
    </MainLayout>
  );
};

export default CallMonitoringPage;