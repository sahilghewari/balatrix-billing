/**
 * Error Handling Utilities
 * Functions for handling and formatting errors
 */

import toast from 'react-hot-toast';
import { HTTP_STATUS } from './constants';

/**
 * API Error class
 */
export class APIError extends Error {
  constructor(message, status, data = null) {
    super(message);
    this.name = 'APIError';
    this.status = status;
    this.data = data;
    this.timestamp = new Date().toISOString();
  }
}

/**
 * Get user-friendly error message
 * @param {Error} error - Error object
 * @returns {string} User-friendly error message
 */
export const getErrorMessage = (error) => {
  // API Error responses
  if (error.response) {
    const { status, data } = error.response;
    
    // Check for specific error messages from API
    if (data?.message) {
      return data.message;
    }
    
    if (data?.error) {
      return data.error;
    }
    
    // Handle common HTTP status codes
    switch (status) {
      case HTTP_STATUS.BAD_REQUEST:
        return 'Invalid request. Please check your input and try again.';
      
      case HTTP_STATUS.UNAUTHORIZED:
        return 'Your session has expired. Please login again.';
      
      case HTTP_STATUS.FORBIDDEN:
        return 'You do not have permission to perform this action.';
      
      case HTTP_STATUS.NOT_FOUND:
        return 'The requested resource was not found.';
      
      case HTTP_STATUS.CONFLICT:
        return 'A conflict occurred. The resource may already exist.';
      
      case HTTP_STATUS.UNPROCESSABLE_ENTITY:
        return 'Validation failed. Please check your input.';
      
      case HTTP_STATUS.TOO_MANY_REQUESTS:
        return 'Too many requests. Please try again later.';
      
      case HTTP_STATUS.INTERNAL_SERVER_ERROR:
        return 'Server error. Please try again later.';
      
      case HTTP_STATUS.SERVICE_UNAVAILABLE:
        return 'Service temporarily unavailable. Please try again later.';
      
      default:
        return 'An error occurred. Please try again.';
    }
  }
  
  // Network errors
  if (error.request) {
    return 'Network error. Please check your internet connection.';
  }
  
  // Other errors
  return error.message || 'An unexpected error occurred.';
};

/**
 * Get validation error messages from API response
 * @param {object} error - Error object with validation errors
 * @returns {object} Object with field-specific error messages
 */
export const getValidationErrors = (error) => {
  if (!error.response?.data?.errors) {
    return {};
  }
  
  const { errors } = error.response.data;
  const fieldErrors = {};
  
  // Handle Laravel-style validation errors
  if (typeof errors === 'object') {
    Object.keys(errors).forEach(field => {
      // Get first error message for each field
      fieldErrors[field] = Array.isArray(errors[field]) 
        ? errors[field][0] 
        : errors[field];
    });
  }
  
  return fieldErrors;
};

/**
 * Show error toast notification
 * @param {Error} error - Error object
 * @param {string} fallbackMessage - Fallback message if error is not specific
 */
export const showErrorToast = (error, fallbackMessage = 'An error occurred') => {
  const message = getErrorMessage(error) || fallbackMessage;
  toast.error(message, {
    duration: 4000,
    position: 'top-right',
  });
};

/**
 * Show success toast notification
 * @param {string} message - Success message
 */
export const showSuccessToast = (message) => {
  toast.success(message, {
    duration: 3000,
    position: 'top-right',
  });
};

/**
 * Show info toast notification
 * @param {string} message - Info message
 */
export const showInfoToast = (message) => {
  toast(message, {
    duration: 3000,
    position: 'top-right',
    icon: 'ℹ️',
  });
};

/**
 * Show warning toast notification
 * @param {string} message - Warning message
 */
export const showWarningToast = (message) => {
  toast(message, {
    duration: 3500,
    position: 'top-right',
    icon: '⚠️',
    style: {
      background: '#f59e0b',
      color: '#fff',
    },
  });
};

/**
 * Handle API error with appropriate response
 * @param {Error} error - Error object
 * @param {Function} errorCallback - Optional callback for specific error handling
 */
export const handleApiError = (error, errorCallback = null) => {
  // Log error in development
  if (import.meta.env.DEV) {
    console.error('API Error:', error);
  }
  
  // Call custom error callback if provided
  if (errorCallback && typeof errorCallback === 'function') {
    errorCallback(error);
  }
  
  // Handle specific error cases
  if (error.response?.status === HTTP_STATUS.UNAUTHORIZED) {
    // Don't show toast for unauthorized - let auth interceptor handle it
    return;
  }
  
  // Show error toast
  showErrorToast(error);
};

/**
 * Log error to external service (e.g., Sentry)
 * @param {Error} error - Error object
 * @param {object} context - Additional context
 */
export const logError = (error, context = {}) => {
  // In development, just log to console
  if (import.meta.env.DEV) {
    console.error('Error logged:', error, context);
    return;
  }
  
  // TODO: Integrate with error tracking service (Sentry, LogRocket, etc.)
  // Example:
  // Sentry.captureException(error, {
  //   contexts: { custom: context }
  // });
};

/**
 * Create error object with consistent structure
 * @param {string} message - Error message
 * @param {number} status - HTTP status code
 * @param {object} data - Additional error data
 * @returns {APIError} Structured error object
 */
export const createError = (message, status = 500, data = null) => {
  return new APIError(message, status, data);
};

/**
 * Check if error is a specific type
 * @param {Error} error - Error to check
 * @param {number} status - HTTP status code to check for
 * @returns {boolean} True if error matches status
 */
export const isErrorType = (error, status) => {
  return error.response?.status === status;
};

/**
 * Check if error is a validation error
 * @param {Error} error - Error to check
 * @returns {boolean} True if validation error
 */
export const isValidationError = (error) => {
  return isErrorType(error, HTTP_STATUS.UNPROCESSABLE_ENTITY);
};

/**
 * Check if error is an authentication error
 * @param {Error} error - Error to check
 * @returns {boolean} True if authentication error
 */
export const isAuthError = (error) => {
  return isErrorType(error, HTTP_STATUS.UNAUTHORIZED);
};

/**
 * Check if error is a network error
 * @param {Error} error - Error to check
 * @returns {boolean} True if network error
 */
export const isNetworkError = (error) => {
  return !error.response && error.request;
};

export default {
  APIError,
  getErrorMessage,
  getValidationErrors,
  showErrorToast,
  showSuccessToast,
  showInfoToast,
  showWarningToast,
  handleApiError,
  logError,
  createError,
  isErrorType,
  isValidationError,
  isAuthError,
  isNetworkError,
};
