/**
 * Card Component
 * Reusable card container component
 */

import React from 'react';
import { cn } from '@utils/helpers';

export const Card = ({
  children,
  title,
  subtitle,
  headerAction,
  footer,
  padding = true,
  hover = false,
  className = '',
  headerClassName = '',
  bodyClassName = '',
  footerClassName = '',
  ...props
}) => {
  return (
    <div
      className={cn(
        'bg-white rounded-lg border border-gray-200 shadow-sm',
        hover && 'transition-shadow duration-200 hover:shadow-md',
        className
      )}
      {...props}
    >
      {(title || subtitle || headerAction) && (
        <div
          className={cn(
            'px-6 py-4 border-b border-gray-200',
            headerClassName
          )}
        >
          <div className="flex items-center justify-between">
            <div>
              {title && (
                <h3 className="text-lg font-semibold text-gray-900">
                  {title}
                </h3>
              )}
              {subtitle && (
                <p className="mt-1 text-sm text-gray-500">
                  {subtitle}
                </p>
              )}
            </div>
            {headerAction && (
              <div>{headerAction}</div>
            )}
          </div>
        </div>
      )}
      
      <div
        className={cn(
          padding && 'px-6 py-4',
          bodyClassName
        )}
      >
        {children}
      </div>
      
      {footer && (
        <div
          className={cn(
            'px-6 py-4 bg-gray-50 border-t border-gray-200 rounded-b-lg',
            footerClassName
          )}
        >
          {footer}
        </div>
      )}
    </div>
  );
};

Card.displayName = 'Card';

export default Card;
