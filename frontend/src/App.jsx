/**
 * Main App Component
 * Root component with routing and providers
 */

import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { ErrorBoundary } from '@components/common/ErrorBoundary';
import { ProtectedRoute } from '@components/common/ProtectedRoute';
import { LoadingPage } from '@components/common/LoadingPage';
import { Layout } from '@components/layout/Layout';
import { ROUTES } from '@utils/constants';
import { useTheme } from '@hooks/useTheme';

// Lazy load pages for code splitting
const Login = lazy(() => import('@pages/auth/Login'));
const Register = lazy(() => import('@pages/auth/Register'));
const Dashboard = lazy(() => import('@pages/dashboard/Dashboard'));
const ConnectionTest = lazy(() => import('@pages/ConnectionTest'));
const NotFound = lazy(() => import('@pages/NotFound'));

// Create QueryClient instance
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

function AppContent() {
  const { initTheme } = useTheme();

  // Initialize theme on mount
  React.useEffect(() => {
    initTheme();
  }, [initTheme]);

  return (
    <ErrorBoundary>
      <Router>
        <Suspense fallback={<LoadingPage />}>
          <Routes>
            {/* Public Routes */}
            <Route path={ROUTES.LOGIN} element={<Login />} />
            <Route path={ROUTES.REGISTER} element={<Register />} />
            <Route path="/connection-test" element={<ConnectionTest />} />
            
            {/* Protected Routes */}
            <Route
              path={ROUTES.DASHBOARD}
              element={
                <ProtectedRoute>
                  <Layout>
                    <Dashboard />
                  </Layout>
                </ProtectedRoute>
              }
            />

            {/* Redirect root to dashboard */}
            <Route path="/" element={<Navigate to={ROUTES.DASHBOARD} replace />} />

            {/* 404 Not Found */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>

        {/* Toast Notifications */}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: {
              background: '#fff',
              color: '#374151',
            },
            success: {
              iconTheme: {
                primary: '#10b981',
                secondary: '#fff',
              },
            },
            error: {
              iconTheme: {
                primary: '#ef4444',
                secondary: '#fff',
              },
            },
          }}
        />
      </Router>
    </ErrorBoundary>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppContent />
    </QueryClientProvider>
  );
}

export default App;
