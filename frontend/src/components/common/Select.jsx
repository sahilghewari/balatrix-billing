/**
 * Select Component
 * A styled select dropdown component
 */

import React from 'react';

const Select = React.forwardRef(({
  children,
  className = '',
  error,
  ...props
}, ref) => {
  const baseClasses = 'w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed';

  const errorClasses = error ? 'border-red-500 focus:ring-red-500' : '';

  return (
    <div className="space-y-1">
      <select
        ref={ref}
        className={`${baseClasses} ${errorClasses} ${className}`}
        {...props}
      >
        {children}
      </select>
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
    </div>
  );
});

Select.displayName = 'Select';

export default Select;