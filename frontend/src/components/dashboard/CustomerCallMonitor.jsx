/**
 * Customer Call Monitor Component
 * Real-time call monitoring for customer's toll-free numbers
 */

import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import callMonitoringService from '../../api/callMonitoringService';
import Badge from '../common/Badge';
import Spinner from '../common/Spinner';
import Alert from '../common/Alert';

const CustomerCallMonitor = () => {
  const [calls, setCalls] = useState([]);
  const [activeCount, setActiveCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [wsConnected, setWsConnected] = useState(false);
  const [fsConnected, setFsConnected] = useState(false);
  const socketRef = useRef(null);

  // Initialize WebSocket connection and load initial data
  useEffect(() => {
    loadInitialData();
    setupWebSocket();

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('Making API call to call monitoring...');
      // Load initial call data
      const response = await callMonitoringService.getCalls();
      console.log('API call successful');
      console.log('API Response:', response); // Debug log
      setCalls(response.active_calls || []);
      setActiveCount(response.active_call_count || 0);
      setFsConnected(response.freeswitch_connected || false);
    } catch (err) {
      console.error('API call failed');
      console.error('Failed to load call data:', err);
      console.error('Error response:', err.response); // Debug log
      console.error('Error message:', err.message);
      console.error('Error code:', err.code);
      setError(`Failed to load call monitoring data: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const setupWebSocket = () => {
    try {
      // Connect to WebSocket server
      socketRef.current = io('http://localhost:3000', {
        path: '/socket.io/call-monitoring',
        transports: ['websocket', 'polling'],
        timeout: 5000,
      });

      socketRef.current.on('connect', () => {
        console.log('WebSocket connected');
        setWsConnected(true);
      });

      socketRef.current.on('disconnect', () => {
        console.log('WebSocket disconnected');
        setWsConnected(false);
      });

      socketRef.current.on('call-update', (data) => {
        console.log('Call update received:', data);
        setCalls(data.active_calls || []);
        setActiveCount(data.active_call_count || 0);
        setFsConnected(data.freeswitch_connected || false);
      });

      socketRef.current.on('connect_error', (error) => {
        console.error('WebSocket connection error:', error);
        setWsConnected(false);
      });
    } catch (err) {
      console.error('Failed to setup WebSocket:', err);
      setError('Failed to connect to real-time updates');
    }
  };

  const formatDuration = (createdAt) => {
    if (!createdAt) return '00:00';

    const start = new Date(createdAt);
    const now = new Date();
    const diff = Math.floor((now - start) / 1000);

    const minutes = Math.floor(diff / 60);
    const seconds = diff % 60;

    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const getCallStatusColor = (state) => {
    const stateLower = (state || '').toLowerCase();

    if (stateLower.includes('ringing') || stateLower.includes('early')) {
      return 'warning';
    }
    if (stateLower.includes('active') || stateLower.includes('answered')) {
      return 'success';
    }
    if (stateLower.includes('hangup') || stateLower.includes('destroy')) {
      return 'danger';
    }

    return 'secondary';
  };

  const getCallStatusText = (state) => {
    const stateLower = (state || '').toLowerCase();

    if (stateLower.includes('ringing') || stateLower.includes('early')) {
      return 'Ringing';
    }
    if (stateLower.includes('active') || stateLower.includes('answered')) {
      return 'Connected';
    }
    if (stateLower.includes('hangup') || stateLower.includes('destroy')) {
      return 'Ended';
    }

    return state || 'Unknown';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Spinner size="lg" />
        <span className="ml-2 text-gray-600">Loading call monitoring...</span>
      </div>
    );
  }

  if (error) {
    return (
      <Alert type="error" className="m-4">
        {error}
      </Alert>
    );
  }

  return (
    <div className="customer-call-monitor">
      {/* Header */}
      <div className="call-monitor-header mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Call Monitoring</h2>
            <p className="text-gray-600">Monitor calls to your toll-free numbers</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <div className="text-2xl font-bold text-gray-900">{activeCount}</div>
              <div className="text-sm text-gray-600">Active Calls</div>
            </div>
          </div>
        </div>

        {/* Connection Status */}
        <div className="connection-status mt-4 flex items-center space-x-4">
          <div className="status-item flex items-center">
            <div className={`w-2 h-2 rounded-full mr-2 ${wsConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="text-sm text-gray-600">
              {wsConnected ? 'Real-time Connected' : 'Real-time Disconnected'}
            </span>
          </div>
          <div className="status-item flex items-center">
            <div className={`w-2 h-2 rounded-full mr-2 ${fsConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="text-sm text-gray-600">
              {fsConnected ? 'FreeSWITCH Connected' : 'FreeSWITCH Disconnected'}
            </span>
          </div>
        </div>
      </div>

      {/* Calls List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {calls.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <div className="text-4xl mb-2">📞</div>
            <p>No active calls at the moment</p>
            <p className="text-sm mt-1">Calls to your toll-free numbers will appear here</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {calls.map((call) => (
              <div key={call.uuid} className="p-4 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0">
                        <Badge variant={getCallStatusColor(call.state)}>
                          {getCallStatusText(call.state)}
                        </Badge>
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-medium text-gray-900">
                            {call.caller || 'Unknown'}
                          </span>
                          <span className="text-gray-400">→</span>
                          <span className="font-medium text-gray-900">
                            {call.callee || 'Unknown'}
                          </span>
                        </div>
                        <div className="text-sm text-gray-600 mt-1">
                          Duration: {formatDuration(call.created_at)}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-500">
                      {call.direction || 'inbound'}
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      {call.uuid?.substring(0, 8)}...
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="mt-4 text-center text-sm text-gray-500">
        Real-time call monitoring for your toll-free numbers
      </div>
    </div>
  );
};

export default CustomerCallMonitor;