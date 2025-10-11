/**
 * Data Formatters
 * Utility functions for formatting data for display
 */

import { format, formatDistance, formatRelative } from 'date-fns';
import { CURRENCY, DATE_FORMATS } from './constants';

/**
 * Format currency amount
 * @param {number} amount - The amount to format
 * @param {string} currency - Currency code (default: INR)
 * @returns {string} Formatted currency string
 */
export const formatCurrency = (amount, currency = CURRENCY.CODE) => {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return `${CURRENCY.SYMBOL}0.00`;
  }

  const formatter = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return formatter.format(amount);
};

/**
 * Format number with thousand separators
 * @param {number} number - The number to format
 * @returns {string} Formatted number string
 */
export const formatNumber = (number) => {
  if (number === null || number === undefined || isNaN(number)) {
    return '0';
  }

  return new Intl.NumberFormat('en-IN').format(number);
};

/**
 * Format date
 * @param {Date|string|number} date - The date to format
 * @param {string} formatString - Format string (default: DATE_FORMATS.SHORT)
 * @returns {string} Formatted date string
 */
export const formatDate = (date, formatString = DATE_FORMATS.SHORT) => {
  if (!date) return '';
  
  try {
    const dateObj = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
    return format(dateObj, formatString);
  } catch (error) {
    console.error('Error formatting date:', error);
    return '';
  }
};

/**
 * Format date as relative time (e.g., "2 hours ago")
 * @param {Date|string|number} date - The date to format
 * @returns {string} Relative time string
 */
export const formatRelativeTime = (date) => {
  if (!date) return '';
  
  try {
    const dateObj = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
    return formatDistance(dateObj, new Date(), { addSuffix: true });
  } catch (error) {
    console.error('Error formatting relative time:', error);
    return '';
  }
};

/**
 * Format date as relative description (e.g., "today at 2:30 PM")
 * @param {Date|string|number} date - The date to format
 * @returns {string} Relative description string
 */
export const formatRelativeDate = (date) => {
  if (!date) return '';
  
  try {
    const dateObj = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
    return formatRelative(dateObj, new Date());
  } catch (error) {
    console.error('Error formatting relative date:', error);
    return '';
  }
};

/**
 * Format phone number
 * @param {string} phone - Phone number to format
 * @returns {string} Formatted phone number
 */
export const formatPhone = (phone) => {
  if (!phone) return '';
  
  // Remove all non-digit characters
  const cleaned = phone.replace(/\D/g, '');
  
  // Format as Indian phone number (e.g., +91 98765 43210)
  if (cleaned.length === 10) {
    return `+91 ${cleaned.slice(0, 5)} ${cleaned.slice(5)}`;
  }
  
  return phone;
};

/**
 * Format duration in seconds to human-readable format
 * @param {number} seconds - Duration in seconds
 * @returns {string} Formatted duration (e.g., "2h 30m 45s")
 */
export const formatDuration = (seconds) => {
  if (!seconds || seconds < 0) return '0s';
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  const parts = [];
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (secs > 0 || parts.length === 0) parts.push(`${secs}s`);
  
  return parts.join(' ');
};

/**
 * Format file size
 * @param {number} bytes - File size in bytes
 * @returns {string} Formatted file size (e.g., "1.5 MB")
 */
export const formatFileSize = (bytes) => {
  if (!bytes || bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

/**
 * Format percentage
 * @param {number} value - Value to format as percentage
 * @param {number} decimals - Number of decimal places (default: 1)
 * @returns {string} Formatted percentage (e.g., "75.5%")
 */
export const formatPercentage = (value, decimals = 1) => {
  if (value === null || value === undefined || isNaN(value)) {
    return '0%';
  }
  
  return `${value.toFixed(decimals)}%`;
};

/**
 * Truncate text to specified length
 * @param {string} text - Text to truncate
 * @param {number} maxLength - Maximum length
 * @returns {string} Truncated text
 */
export const truncateText = (text, maxLength = 50) => {
  if (!text || text.length <= maxLength) return text;
  return `${text.substring(0, maxLength)}...`;
};

/**
 * Format GST number
 * @param {string} gst - GST number to format
 * @returns {string} Formatted GST number
 */
export const formatGST = (gst) => {
  if (!gst) return '';
  
  // Format as: 12ABCDE3456F1Z5
  const cleaned = gst.replace(/\s/g, '').toUpperCase();
  
  if (cleaned.length === 15) {
    return `${cleaned.slice(0, 2)} ${cleaned.slice(2, 7)} ${cleaned.slice(7, 11)} ${cleaned.slice(11, 12)} ${cleaned.slice(12, 13)} ${cleaned.slice(13, 14)} ${cleaned.slice(14)}`;
  }
  
  return gst;
};

/**
 * Format subscription status for display
 * @param {string} status - Subscription status
 * @returns {object} Object with label and color class
 */
export const formatSubscriptionStatus = (status) => {
  const statusMap = {
    active: { label: 'Active', color: 'success' },
    inactive: { label: 'Inactive', color: 'gray' },
    cancelled: { label: 'Cancelled', color: 'error' },
    suspended: { label: 'Suspended', color: 'warning' },
    trial: { label: 'Trial', color: 'info' },
    expired: { label: 'Expired', color: 'error' },
  };
  
  return statusMap[status] || { label: status, color: 'gray' };
};

/**
 * Format payment status for display
 * @param {string} status - Payment status
 * @returns {object} Object with label and color class
 */
export const formatPaymentStatus = (status) => {
  const statusMap = {
    pending: { label: 'Pending', color: 'warning' },
    completed: { label: 'Completed', color: 'success' },
    failed: { label: 'Failed', color: 'error' },
    refunded: { label: 'Refunded', color: 'info' },
    cancelled: { label: 'Cancelled', color: 'gray' },
  };
  
  return statusMap[status] || { label: status, color: 'gray' };
};

/**
 * Format invoice status for display
 * @param {string} status - Invoice status
 * @returns {object} Object with label and color class
 */
export const formatInvoiceStatus = (status) => {
  const statusMap = {
    draft: { label: 'Draft', color: 'gray' },
    pending: { label: 'Pending', color: 'warning' },
    paid: { label: 'Paid', color: 'success' },
    overdue: { label: 'Overdue', color: 'error' },
    cancelled: { label: 'Cancelled', color: 'gray' },
    refunded: { label: 'Refunded', color: 'info' },
  };
  
  return statusMap[status] || { label: status, color: 'gray' };
};

export default {
  formatCurrency,
  formatNumber,
  formatDate,
  formatRelativeTime,
  formatRelativeDate,
  formatPhone,
  formatDuration,
  formatFileSize,
  formatPercentage,
  truncateText,
  formatGST,
  formatSubscriptionStatus,
  formatPaymentStatus,
  formatInvoiceStatus,
};
