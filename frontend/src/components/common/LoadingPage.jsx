/**
 * Loading Page Component
 * Full page loading indicator
 */

import React from 'react';
import { Spinner } from '@components/ui';

export const LoadingPage = ({ message = 'Loading...' }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
      <Spinner size="lg" />
      <p className="mt-4 text-gray-600">{message}</p>
    </div>
  );
};

export default LoadingPage;
