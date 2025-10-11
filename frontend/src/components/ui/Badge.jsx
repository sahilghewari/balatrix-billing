/**
 * Badge Component
 * Reusable badge/pill component for status indicators
 */

import React from 'react';
import { cn } from '@utils/helpers';

const badgeVariants = {
  success: 'bg-success-100 text-success-800 border-success-200',
  warning: 'bg-warning-100 text-warning-800 border-warning-200',
  error: 'bg-error-100 text-error-800 border-error-200',
  info: 'bg-info-100 text-info-800 border-info-200',
  primary: 'bg-primary-100 text-primary-800 border-primary-200',
  gray: 'bg-gray-100 text-gray-800 border-gray-200',
};

const badgeSizes = {
  sm: 'text-xs px-2 py-0.5',
  md: 'text-sm px-2.5 py-0.5',
  lg: 'text-base px-3 py-1',
};

export const Badge = ({
  children,
  variant = 'gray',
  size = 'md',
  dot = false,
  icon,
  className = '',
  ...props
}) => {
  const baseStyles = 'inline-flex items-center font-medium rounded-full border';
  const variantClass = badgeVariants[variant] || badgeVariants.gray;
  const sizeClass = badgeSizes[size] || badgeSizes.md;

  return (
    <span
      className={cn(
        baseStyles,
        variantClass,
        sizeClass,
        className
      )}
      {...props}
    >
      {dot && (
        <span className={cn(
          'w-1.5 h-1.5 rounded-full mr-1.5',
          variant === 'success' && 'bg-success-500',
          variant === 'warning' && 'bg-warning-500',
          variant === 'error' && 'bg-error-500',
          variant === 'info' && 'bg-info-500',
          variant === 'primary' && 'bg-primary-500',
          variant === 'gray' && 'bg-gray-500',
        )} />
      )}
      
      {icon && (
        <span className="mr-1">{icon}</span>
      )}
      
      {children}
    </span>
  );
};

Badge.displayName = 'Badge';

export default Badge;
