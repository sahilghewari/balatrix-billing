/**
 * Skeleton Component
 * Loading skeleton component for placeholder content
 */

import React from 'react';
import { cn } from '@utils/helpers';

export const Skeleton = ({
  variant = 'text',
  width,
  height,
  count = 1,
  circle = false,
  className = '',
  ...props
}) => {
  const baseStyles = 'animate-pulse bg-gray-200 rounded';
  
  const variantStyles = {
    text: 'h-4 w-full',
    title: 'h-6 w-3/4',
    avatar: 'h-12 w-12 rounded-full',
    button: 'h-10 w-24',
    card: 'h-48 w-full',
  };

  const variantClass = variantStyles[variant] || variantStyles.text;

  const style = {
    ...(width && { width }),
    ...(height && { height }),
  };

  if (count > 1) {
    return (
      <div className="space-y-2">
        {Array.from({ length: count }).map((_, index) => (
          <div
            key={index}
            className={cn(
              baseStyles,
              variantClass,
              circle && 'rounded-full',
              className
            )}
            style={style}
            {...props}
          />
        ))}
      </div>
    );
  }

  return (
    <div
      className={cn(
        baseStyles,
        variantClass,
        circle && 'rounded-full',
        className
      )}
      style={style}
      {...props}
    />
  );
};

Skeleton.displayName = 'Skeleton';

export default Skeleton;
