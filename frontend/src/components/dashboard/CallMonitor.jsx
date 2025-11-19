/**
 * Call Monitor Component
 * Real-time call monitoring dashboard
 */

import React, { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { API_BASE_URL, API_ENDPOINTS } from '../../constants/apiEndpoints';
import './CallMonitor.css';

const CallMonitor = () => {
  const [calls, setCalls] = useState([]);
  const [activeCount, setActiveCount] = useState(0);
  const [connectionStatus, setConnectionStatus] = useState('connecting'); // 'connecting', 'connected', 'disconnected'
  const [freeswitchConnected, setFreeswitchConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    // Connect to WebSocket
    const socketUrl = API_BASE_URL.replace('/api', '');
    const newSocket = io(socketUrl, {
      path: API_ENDPOINTS.WEBSOCKET.CALL_MONITORING,
      transports: ['websocket', 'polling']
    });

    newSocket.on('connect', () => {
      console.log('Connected to call monitoring WebSocket');
      setConnectionStatus('connected');
    });

    newSocket.on('disconnect', () => {
      console.log('Disconnected from call monitoring WebSocket');
      setConnectionStatus('disconnected');
      setFreeswitchConnected(false);
    });

    newSocket.on('snapshot', (data) => {
      console.log('Received call snapshot:', data);
      setCalls(data.active_calls || []);
      setActiveCount(data.active_call_count || 0);
      setFreeswitchConnected(data.freeswitch_connected || false);
      setLastUpdate(new Date());
    });

    newSocket.on('error', (error) => {
      console.error('Socket error:', error);
    });

    setSocket(newSocket);

    // Cleanup on unmount
    return () => {
      if (newSocket) {
        newSocket.disconnect();
      }
    };
  }, []);

  const formatDuration = (createdAt) => {
    if (!createdAt) return 'N/A';
    const start = new Date(createdAt);
    const now = new Date();
    const diff = Math.floor((now - start) / 1000);
    const minutes = Math.floor(diff / 60);
    const seconds = diff % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const getStateColor = (state) => {
    switch (state?.toLowerCase()) {
      case 'active':
        return 'state-active';
      case 'ringing':
        return 'state-ringing';
      case 'early':
        return 'state-early';
      default:
        return 'state-other';
    }
  };

  return (
    <div className="call-monitor">
      <div className="call-monitor-header">
        <h2>Real-Time Call Monitoring</h2>
        <div className="connection-status">
          <div className="status-item">
            <span className={`status-indicator ${connectionStatus}`}></span>
            <span>WebSocket: {connectionStatus}</span>
          </div>
          <div className="status-item">
            <span className={`status-indicator ${freeswitchConnected ? 'connected' : 'disconnected'}`}></span>
            <span>FreeSWITCH: {freeswitchConnected ? 'connected' : 'disconnected'}</span>
          </div>
        </div>
      </div>

      <div className="call-stats">
        <div className="stat-card">
          <h3>Active Calls</h3>
          <div className="stat-value">{activeCount}</div>
        </div>
        <div className="stat-card">
          <h3>Last Update</h3>
          <div className="stat-value">
            {lastUpdate ? lastUpdate.toLocaleTimeString() : 'Never'}
          </div>
        </div>
      </div>

      <div className="calls-table-container">
        <table className="calls-table">
          <thead>
            <tr>
              <th>Caller</th>
              <th>Callee</th>
              <th>Direction</th>
              <th>State</th>
              <th>Duration</th>
              <th>UUID</th>
            </tr>
          </thead>
          <tbody>
            {!freeswitchConnected ? (
              <tr>
                <td colSpan="6" className="no-calls">
                  <div className="connection-message">
                    <div className="connection-icon">⚠️</div>
                    <div>
                      <strong>FreeSWITCH Not Connected</strong>
                      <p>Unable to monitor calls. Please ensure FreeSWITCH is running and accessible.</p>
                    </div>
                  </div>
                </td>
              </tr>
            ) : calls.length === 0 ? (
              <tr>
                <td colSpan="6" className="no-calls">
                  No active calls
                </td>
              </tr>
            ) : (
              calls.map((call) => (
                <tr key={call.uuid}>
                  <td>{call.caller || 'Unknown'}</td>
                  <td>{call.callee || 'Unknown'}</td>
                  <td>{call.direction || 'Unknown'}</td>
                  <td>
                    <span className={`call-state ${getStateColor(call.state)}`}>
                      {call.state || 'Unknown'}
                    </span>
                  </td>
                  <td>{formatDuration(call.created_at)}</td>
                  <td className="uuid-cell">{call.uuid}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CallMonitor;