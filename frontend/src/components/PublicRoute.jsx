/**
 * Public Route Component
 * Redirects to dashboard if user is already authenticated
 */

import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks';
import { Spinner } from '../components/common';

const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return <Spinner fullScreen text="Loading..." />;
  }
  
  if (isAuthenticated) {
    // Redirect to dashboard if already logged in
    return <Navigate to="/dashboard" replace />;
  }
  
  return children;
};

export default PublicRoute;
