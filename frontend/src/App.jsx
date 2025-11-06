/**
 * Main App Component
 * Sets up routing and global providers
 */

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts';
import PrivateRoute from './components/PrivateRoute';
import PublicRoute from './components/PublicRoute';
import AdminRoute from './components/AdminRoute';
import {
  LoginPage,
  RegisterPage,
  ForgotPasswordPage,
  ResetPasswordPage,
  DashboardPage,
} from './pages';
import PlansPage from './pages/PlansPage';
import CheckoutPage from './pages/CheckoutPage';
import TollFreeNumberSelectionPage from './pages/TollFreeNumberSelectionPage';
import TollFreeNumberManagementPage from './pages/TollFreeNumberManagementPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import TenantsPage from './pages/TenantsPage';
import ExtensionsPage from './pages/ExtensionsPage';
import TenantForm from './pages/TenantForm';
import ExtensionForm from './pages/ExtensionForm';
import ExtensionManagementPage from './pages/ExtensionManagementPage';
import './App.css';

function App() {
  return (
    <Router>
      <AuthProvider>
        {/* Toast Notifications */}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#363636',
              color: '#fff',
            },
            success: {
              duration: 3000,
              iconTheme: {
                primary: '#10B981',
                secondary: '#fff',
              },
            },
            error: {
              duration: 4000,
              iconTheme: {
                primary: '#EF4444',
                secondary: '#fff',
              },
            },
          }}
        />

        {/* Routes */}
        <Routes>
          {/* Default redirect */}
          <Route path="/" element={<Navigate to="/plans" replace />} />

          {/* Public Routes */}
          <Route
            path="/login"
            element={
              <PublicRoute>
                <LoginPage />
              </PublicRoute>
            }
          />
          <Route
            path="/register"
            element={
              <PublicRoute>
                <RegisterPage />
              </PublicRoute>
            }
          />
          <Route
            path="/forgot-password"
            element={
              <PublicRoute>
                <ForgotPasswordPage />
              </PublicRoute>
            }
          />
          <Route
            path="/reset-password"
            element={
              <PublicRoute>
                <ResetPasswordPage />
              </PublicRoute>
            }
          />

          {/* Private Routes */}
          <Route
            path="/dashboard"
            element={
              <PrivateRoute>
                <DashboardPage />
              </PrivateRoute>
            }
          />

          {/* Plans Page - Public (browsing), Private (selecting) */}
          <Route path="/plans" element={<PlansPage />} />
          
          {/* Toll-Free Number Selection - Private */}
          <Route
            path="/select-number"
            element={
              <PrivateRoute>
                <TollFreeNumberSelectionPage />
              </PrivateRoute>
            }
          />
          
          {/* Toll-Free Number Management - Private */}
          <Route
            path="/numbers/manage"
            element={
              <PrivateRoute>
                <TollFreeNumberManagementPage />
              </PrivateRoute>
            }
          />
          
          {/* Extension Management - Private */}
          <Route
            path="/extensions/manage"
            element={
              <PrivateRoute>
                <ExtensionManagementPage />
              </PrivateRoute>
            }
          />
          
          {/* Checkout Page - Private */}
          <Route
            path="/checkout"
            element={
              <PrivateRoute>
                <CheckoutPage />
              </PrivateRoute>
            }
          />

          {/* Admin Routes */}
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <AdminDashboardPage />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/dashboard"
            element={
              <AdminRoute>
                <AdminDashboardPage />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/tenants"
            element={
              <AdminRoute>
                <TenantsPage />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/tenants/new"
            element={
              <AdminRoute>
                <TenantForm />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/tenants/:id/edit"
            element={
              <AdminRoute>
                <TenantForm />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/tenants/:id"
            element={
              <AdminRoute>
                <TenantsPage />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/extensions"
            element={
              <AdminRoute>
                <ExtensionsPage />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/extensions/new"
            element={
              <AdminRoute>
                <ExtensionForm />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/extensions/:id/edit"
            element={
              <AdminRoute>
                <ExtensionForm />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/extensions/:id"
            element={
              <AdminRoute>
                <ExtensionsPage />
              </AdminRoute>
            }
          />

          {/* 404 Not Found */}
          <Route
            path="*"
            element={
              <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                  <h1 className="text-6xl font-bold text-gray-900">404</h1>
                  <p className="mt-4 text-xl text-gray-600">Page not found</p>
                  <a
                    href="/dashboard"
                    className="mt-6 inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Go to Dashboard
                  </a>
                </div>
              </div>
            }
          />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
