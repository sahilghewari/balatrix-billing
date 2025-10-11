/**
 * Input Component
 * Reusable text input component with label and error support
 */

import React from 'react';
import { cn } from '@utils/helpers';

export const Input = React.forwardRef(({
  label,
  id,
  type = 'text',
  placeholder,
  error,
  helperText,
  disabled = false,
  required = false,
  leftIcon,
  rightIcon,
  className = '',
  inputClassName = '',
  labelClassName = '',
  containerClassName = '',
  ...props
}, ref) => {
  const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;

  const baseInputStyles = 'block w-full px-3 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-0 transition-colors duration-200';
  
  const stateStyles = error
    ? 'border-error-500 text-error-900 placeholder-error-300 focus:ring-error-500 focus:border-error-500'
    : 'border-gray-300 text-gray-900 placeholder-gray-400 focus:ring-primary-500 focus:border-primary-500';
  
  const disabledStyles = disabled
    ? 'bg-gray-100 cursor-not-allowed opacity-60'
    : 'bg-white';

  const iconPaddingLeft = leftIcon ? 'pl-10' : '';
  const iconPaddingRight = rightIcon ? 'pr-10' : '';

  return (
    <div className={cn('w-full', containerClassName)}>
      {label && (
        <label
          htmlFor={inputId}
          className={cn(
            'block text-sm font-medium text-gray-700 mb-1',
            labelClassName
          )}
        >
          {label}
          {required && <span className="text-error-500 ml-1">*</span>}
        </label>
      )}
      
      <div className="relative">
        {leftIcon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <span className="text-gray-400">{leftIcon}</span>
          </div>
        )}
        
        <input
          ref={ref}
          id={inputId}
          type={type}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined}
          className={cn(
            baseInputStyles,
            stateStyles,
            disabledStyles,
            iconPaddingLeft,
            iconPaddingRight,
            inputClassName,
            className
          )}
          {...props}
        />
        
        {rightIcon && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <span className={error ? 'text-error-500' : 'text-gray-400'}>
              {rightIcon}
            </span>
          </div>
        )}
      </div>
      
      {error && (
        <p
          id={`${inputId}-error`}
          className="mt-1 text-sm text-error-600"
          role="alert"
        >
          {error}
        </p>
      )}
      
      {!error && helperText && (
        <p
          id={`${inputId}-helper`}
          className="mt-1 text-sm text-gray-500"
        >
          {helperText}
        </p>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;
