/**
 * API Connection Test Page
 * Simple page to test backend connection
 */

import { useState } from 'react';
import { Card } from '@components/ui/Card';
import { Button } from '@components/ui/Button';
import { Alert } from '@components/ui/Alert';
import { api } from '@services/api';

export const ConnectionTest = () => {
  const [testing, setTesting] = useState(false);
  const [results, setResults] = useState(null);

  const runTests = async () => {
    setTesting(true);
    const testResults = {
      health: { status: 'pending', message: '' },
      api: { status: 'pending', message: '' },
      auth: { status: 'pending', message: '' },
    };

    try {
      // Test 1: Health Check
      try {
        const healthResponse = await fetch('http://localhost:3000/health');
        const healthData = await healthResponse.json();
        testResults.health = {
          status: healthData.success ? 'success' : 'error',
          message: healthData.message || 'Health check passed',
          data: healthData,
        };
      } catch (error) {
        testResults.health = {
          status: 'error',
          message: `Health check failed: ${error.message}`,
        };
      }

      // Test 2: API Base (Should return 404 or API info)
      try {
        const apiResponse = await fetch('http://localhost:3000/api');
        const apiData = await apiResponse.json();
        testResults.api = {
          status: apiResponse.ok ? 'success' : 'warning',
          message: 'API base endpoint accessible',
          data: apiData,
        };
      } catch (error) {
        testResults.api = {
          status: 'error',
          message: `API check failed: ${error.message}`,
        };
      }

      // Test 3: Auth endpoint (Should fail with validation error, but confirms connection)
      try {
        await api.post('/auth/login', {});
      } catch (error) {
        // We expect this to fail, but if we get a response, connection works
        if (error.response) {
          testResults.auth = {
            status: 'success',
            message: 'Auth endpoint accessible (validation error expected)',
            data: error.response.data,
          };
        } else {
          testResults.auth = {
            status: 'error',
            message: `Auth endpoint unreachable: ${error.message}`,
          };
        }
      }

      setResults(testResults);
    } catch (error) {
      console.error('Test error:', error);
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          API Connection Test
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Test the connection between frontend and backend
        </p>
      </div>

      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Connection Details</h2>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Frontend URL:</span>
            <span className="font-mono">http://localhost:5173</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Backend URL:</span>
            <span className="font-mono">http://localhost:3000</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">API Base:</span>
            <span className="font-mono">http://localhost:3000/api</span>
          </div>
        </div>

        <Button
          onClick={runTests}
          loading={testing}
          className="mt-6 w-full"
        >
          Run Connection Tests
        </Button>
      </Card>

      {results && (
        <div className="space-y-4">
          {/* Health Check Result */}
          <Card className="p-6">
            <h3 className="font-semibold mb-3">1. Health Check</h3>
            <Alert
              variant={
                results.health.status === 'success'
                  ? 'success'
                  : results.health.status === 'error'
                  ? 'error'
                  : 'info'
              }
            >
              <div>
                <p className="font-medium">{results.health.message}</p>
                {results.health.data && (
                  <pre className="mt-2 text-xs overflow-auto">
                    {JSON.stringify(results.health.data, null, 2)}
                  </pre>
                )}
              </div>
            </Alert>
          </Card>

          {/* API Base Result */}
          <Card className="p-6">
            <h3 className="font-semibold mb-3">2. API Base Endpoint</h3>
            <Alert
              variant={
                results.api.status === 'success'
                  ? 'success'
                  : results.api.status === 'error'
                  ? 'error'
                  : 'warning'
              }
            >
              <div>
                <p className="font-medium">{results.api.message}</p>
                {results.api.data && (
                  <pre className="mt-2 text-xs overflow-auto">
                    {JSON.stringify(results.api.data, null, 2)}
                  </pre>
                )}
              </div>
            </Alert>
          </Card>

          {/* Auth Endpoint Result */}
          <Card className="p-6">
            <h3 className="font-semibold mb-3">3. Auth Endpoint</h3>
            <Alert
              variant={
                results.auth.status === 'success'
                  ? 'success'
                  : results.auth.status === 'error'
                  ? 'error'
                  : 'warning'
              }
            >
              <div>
                <p className="font-medium">{results.auth.message}</p>
                {results.auth.data && (
                  <pre className="mt-2 text-xs overflow-auto">
                    {JSON.stringify(results.auth.data, null, 2)}
                  </pre>
                )}
              </div>
            </Alert>
          </Card>

          {/* Overall Status */}
          <Card className="p-6 bg-primary-50 dark:bg-primary-900/20">
            <h3 className="font-semibold mb-3">Overall Status</h3>
            {results.health.status === 'success' &&
            results.api.status !== 'error' &&
            results.auth.status === 'success' ? (
              <Alert variant="success">
                <p className="font-semibold">✅ All Tests Passed!</p>
                <p className="text-sm mt-1">
                  Your frontend is successfully connected to the backend. You can now:
                </p>
                <ul className="list-disc list-inside text-sm mt-2 space-y-1">
                  <li>Test the login functionality</li>
                  <li>Navigate to the dashboard</li>
                  <li>Make API calls from components</li>
                </ul>
              </Alert>
            ) : (
              <Alert variant="error">
                <p className="font-semibold">❌ Some Tests Failed</p>
                <p className="text-sm mt-1">
                  Check the individual test results above. Common issues:
                </p>
                <ul className="list-disc list-inside text-sm mt-2 space-y-1">
                  <li>Backend server not running</li>
                  <li>Wrong port configuration</li>
                  <li>CORS issues</li>
                  <li>Network/firewall blocking</li>
                </ul>
              </Alert>
            )}
          </Card>
        </div>
      )}

      <Card className="p-6 bg-gray-50 dark:bg-gray-800">
        <h3 className="font-semibold mb-3">Troubleshooting</h3>
        <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
          <li>• Make sure backend is running: <code className="bg-white dark:bg-gray-900 px-2 py-1 rounded">cd backend && npm run dev</code></li>
          <li>• Check backend terminal for errors</li>
          <li>• Verify .env file has correct API_BASE_URL</li>
          <li>• Open browser console (F12) and check for errors</li>
          <li>• Check Network tab for failed requests</li>
        </ul>
      </Card>
    </div>
  );
};

export default ConnectionTest;
