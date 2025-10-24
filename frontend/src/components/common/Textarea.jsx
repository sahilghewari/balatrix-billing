/**
 * Textarea Component
 * A styled textarea component
 */

import React from 'react';

const Textarea = React.forwardRef(({
  className = '',
  error,
  ...props
}, ref) => {
  const baseClasses = 'w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed resize-vertical';

  const errorClasses = error ? 'border-red-500 focus:ring-red-500' : '';

  return (
    <div className="space-y-1">
      <textarea
        ref={ref}
        className={`${baseClasses} ${errorClasses} ${className}`}
        {...props}
      />
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
    </div>
  );
});

Textarea.displayName = 'Textarea';

export default Textarea;