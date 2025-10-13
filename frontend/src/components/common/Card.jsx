/**
 * Card Component
 * Reusable card container
 */

import React from 'react';

const Card = ({
  children,
  title,
  subtitle,
  footer,
  className = '',
  padding = true,
  shadow = true,
  hoverable = false,
  ...props
}) => {
  const baseStyles = 'bg-white rounded-lg border border-gray-200';
  const shadowStyles = shadow ? 'shadow-md' : '';
  const hoverStyles = hoverable ? 'hover:shadow-lg transition-shadow duration-200' : '';
  const paddingStyles = padding ? 'p-6' : '';
  
  return (
    <div
      className={`${baseStyles} ${shadowStyles} ${hoverStyles} ${className}`}
      {...props}
    >
      {(title || subtitle) && (
        <div className={`${padding ? 'pb-4 border-b border-gray-200' : ''}`}>
          {title && (
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          )}
          {subtitle && (
            <p className="mt-1 text-sm text-gray-500">{subtitle}</p>
          )}
        </div>
      )}
      
      <div className={`${title || subtitle ? (padding ? 'pt-4' : '') : ''} ${paddingStyles}`}>
        {children}
      </div>
      
      {footer && (
        <div className={`${padding ? 'pt-4 border-t border-gray-200' : ''}`}>
          {footer}
        </div>
      )}
    </div>
  );
};

export default Card;
