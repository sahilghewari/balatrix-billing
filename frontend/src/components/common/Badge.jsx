/**
 * Badge Component
 * A styled badge component for status indicators
 */

import React from 'react';

const Badge = React.forwardRef(({
  children,
  variant = 'default',
  className = '',
  ...props
}, ref) => {
  const variants = {
    default: 'bg-gray-100 text-gray-800',
    success: 'bg-green-100 text-green-800',
    danger: 'bg-red-100 text-red-800',
    warning: 'bg-yellow-100 text-yellow-800',
    info: 'bg-blue-100 text-blue-800',
    secondary: 'bg-gray-200 text-gray-600',
  };

  return (
    <span
      ref={ref}
      className={`
        inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
        ${variants[variant] || variants.default}
        ${className}
      `}
      {...props}
    >
      {children}
    </span>
  );
});

Badge.displayName = 'Badge';

export default Badge;