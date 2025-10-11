/**
 * Switch Component
 * Toggle switch component
 */

import React from 'react';
import { cn } from '@utils/helpers';

export const Switch = React.forwardRef(({
  checked = false,
  onChange,
  disabled = false,
  label,
  description,
  size = 'md',
  className = '',
  ...props
}, ref) => {
  const switchSizes = {
    sm: {
      track: 'h-5 w-9',
      thumb: 'h-4 w-4',
      translate: 'translate-x-4',
    },
    md: {
      track: 'h-6 w-11',
      thumb: 'h-5 w-5',
      translate: 'translate-x-5',
    },
    lg: {
      track: 'h-7 w-14',
      thumb: 'h-6 w-6',
      translate: 'translate-x-7',
    },
  };

  const sizeConfig = switchSizes[size] || switchSizes.md;

  return (
    <div className={cn('flex items-center', className)}>
      <button
        ref={ref}
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange && onChange(!checked)}
        className={cn(
          'relative inline-flex flex-shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
          sizeConfig.track,
          checked ? 'bg-primary-600' : 'bg-gray-200',
          disabled && 'opacity-50 cursor-not-allowed',
          !disabled && 'cursor-pointer'
        )}
        {...props}
      >
        <span
          className={cn(
            'pointer-events-none inline-block rounded-full bg-white shadow transform ring-0 transition duration-200 ease-in-out',
            sizeConfig.thumb,
            checked ? sizeConfig.translate : 'translate-x-0'
          )}
        />
      </button>
      
      {(label || description) && (
        <div className="ml-3">
          {label && (
            <span className="text-sm font-medium text-gray-900">
              {label}
            </span>
          )}
          {description && (
            <p className="text-sm text-gray-500">
              {description}
            </p>
          )}
        </div>
      )}
    </div>
  );
});

Switch.displayName = 'Switch';

export default Switch;
