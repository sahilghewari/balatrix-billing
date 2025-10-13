/**
 * Auth Layout Component
 * Layout wrapper for authentication pages
 */

import React from 'react';

const AuthLayout = ({ children }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-blue-600 mb-2">
            Balatrix Billing
          </h1>
          <p className="text-gray-600">Telecom Billing Management System</p>
        </div>
      </div>
      
      <div className="mt-8 sm:mx-auto sm:w-full">
        {children}
      </div>
      
      <footer className="mt-8 text-center text-sm text-gray-500">
        <p>&copy; 2025 Balatrix Billing. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default AuthLayout;
