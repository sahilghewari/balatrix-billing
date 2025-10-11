/**
 * Select Component
 * Dropdown select component
 */

import React from 'react';
import { cn } from '@utils/helpers';
import { ChevronDown } from 'lucide-react';

export const Select = React.forwardRef(({
  label,
  id,
  options = [],
  placeholder = 'Select an option',
  error,
  helperText,
  disabled = false,
  required = false,
  className = '',
  selectClassName = '',
  labelClassName = '',
  containerClassName = '',
  ...props
}, ref) => {
  const selectId = id || `select-${Math.random().toString(36).substr(2, 9)}`;

  const baseSelectStyles = 'block w-full px-3 py-2 pr-10 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-0 transition-colors duration-200 appearance-none';
  
  const stateStyles = error
    ? 'border-error-500 text-error-900 focus:ring-error-500 focus:border-error-500'
    : 'border-gray-300 text-gray-900 focus:ring-primary-500 focus:border-primary-500';
  
  const disabledStyles = disabled
    ? 'bg-gray-100 cursor-not-allowed opacity-60'
    : 'bg-white cursor-pointer';

  return (
    <div className={cn('w-full', containerClassName)}>
      {label && (
        <label
          htmlFor={selectId}
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
        <select
          ref={ref}
          id={selectId}
          disabled={disabled}
          required={required}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={error ? `${selectId}-error` : helperText ? `${selectId}-helper` : undefined}
          className={cn(
            baseSelectStyles,
            stateStyles,
            disabledStyles,
            selectClassName,
            className
          )}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          
          {options.map((option) => (
            <option
              key={option.value}
              value={option.value}
              disabled={option.disabled}
            >
              {option.label}
            </option>
          ))}
        </select>
        
        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
          <ChevronDown className={cn(
            'h-5 w-5',
            error ? 'text-error-500' : 'text-gray-400'
          )} />
        </div>
      </div>
      
      {error && (
        <p
          id={`${selectId}-error`}
          className="mt-1 text-sm text-error-600"
          role="alert"
        >
          {error}
        </p>
      )}
      
      {!error && helperText && (
        <p
          id={`${selectId}-helper`}
          className="mt-1 text-sm text-gray-500"
        >
          {helperText}
        </p>
      )}
    </div>
  );
});

Select.displayName = 'Select';

export default Select;
