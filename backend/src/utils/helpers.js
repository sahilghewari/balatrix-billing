/**
 * Helper Utilities
 * Common utility functions used throughout the application
 */

const crypto = require('crypto');
const { REGEX_PATTERNS, CURRENCY } = require('./constants');

/**
 * Format currency amount
 * @param {number} amount - Amount to format
 * @param {string} currency - Currency code (default: INR)
 * @returns {string} Formatted currency string
 */
const formatCurrency = (amount, currency = CURRENCY.CODE) => {
  const formatted = parseFloat(amount).toFixed(CURRENCY.DECIMAL_PLACES);
  return `${CURRENCY.SYMBOL}${formatted}`;
};

/**
 * Calculate percentage
 * @param {number} value - Value to calculate percentage of
 * @param {number} percentage - Percentage (e.g., 18 for 18%)
 * @returns {number} Calculated percentage amount
 */
const calculatePercentage = (value, percentage) => {
  return (value * percentage) / 100;
};

/**
 * Generate random string
 * @param {number} length - Length of random string
 * @returns {string} Random string
 */
const generateRandomString = (length = 32) => {
  return crypto.randomBytes(length).toString('hex');
};

/**
 * Generate unique reference number
 * @param {string} prefix - Prefix for reference number
 * @returns {string} Unique reference number
 */
const generateReferenceNumber = (prefix = 'REF') => {
  const timestamp = Date.now();
  const random = crypto.randomBytes(4).toString('hex').toUpperCase();
  return `${prefix}${timestamp}${random}`;
};

/**
 * Generate invoice number
 * @param {number} invoiceId - Invoice database ID
 * @returns {string} Formatted invoice number
 */
const generateInvoiceNumber = (invoiceId) => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const paddedId = String(invoiceId).padStart(6, '0');
  return `INV-${year}${month}-${paddedId}`;
};

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} True if valid
 */
const isValidEmail = (email) => {
  return REGEX_PATTERNS.EMAIL.test(email);
};

/**
 * Validate phone number (E.164 format)
 * @param {string} phone - Phone number to validate
 * @returns {boolean} True if valid
 */
const isValidPhone = (phone) => {
  return REGEX_PATTERNS.PHONE_E164.test(phone);
};

/**
 * Validate Indian phone number
 * @param {string} phone - Phone number to validate
 * @returns {boolean} True if valid
 */
const isValidIndianPhone = (phone) => {
  return REGEX_PATTERNS.PHONE_INDIAN.test(phone);
};

/**
 * Validate UUID format
 * @param {string} uuid - UUID to validate
 * @returns {boolean} True if valid
 */
const isValidUUID = (uuid) => {
  return REGEX_PATTERNS.UUID.test(uuid);
};

/**
 * Mask sensitive data
 * @param {string} data - Data to mask
 * @param {number} visibleChars - Number of visible characters at start and end
 * @returns {string} Masked data
 */
const maskSensitiveData = (data, visibleChars = 4) => {
  if (!data || data.length <= visibleChars * 2) return data;
  const start = data.substring(0, visibleChars);
  const end = data.substring(data.length - visibleChars);
  const masked = '*'.repeat(data.length - visibleChars * 2);
  return `${start}${masked}${end}`;
};

/**
 * Mask email address
 * @param {string} email - Email to mask
 * @returns {string} Masked email
 */
const maskEmail = (email) => {
  if (!email) return '';
  const [username, domain] = email.split('@');
  const maskedUsername = username.charAt(0) + '*'.repeat(username.length - 2) + username.charAt(username.length - 1);
  return `${maskedUsername}@${domain}`;
};

/**
 * Mask phone number
 * @param {string} phone - Phone to mask
 * @returns {string} Masked phone
 */
const maskPhone = (phone) => {
  if (!phone) return '';
  return phone.substring(0, 3) + '*'.repeat(phone.length - 6) + phone.substring(phone.length - 3);
};

/**
 * Sleep/delay utility
 * @param {number} ms - Milliseconds to sleep
 * @returns {Promise} Promise that resolves after delay
 */
const sleep = (ms) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

/**
 * Retry function with exponential backoff
 * @param {Function} fn - Function to retry
 * @param {number} maxRetries - Maximum number of retries
 * @param {number} baseDelay - Base delay in ms
 * @returns {Promise} Result of function
 */
const retryWithBackoff = async (fn, maxRetries = 3, baseDelay = 1000) => {
  let lastError;

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (i < maxRetries - 1) {
        const delay = baseDelay * Math.pow(2, i);
        await sleep(delay);
      }
    }
  }

  throw lastError;
};

/**
 * Paginate array
 * @param {Array} array - Array to paginate
 * @param {number} page - Page number
 * @param {number} limit - Items per page
 * @returns {Object} Paginated result
 */
const paginateArray = (array, page = 1, limit = 20) => {
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const items = array.slice(startIndex, endIndex);
  const total = array.length;
  const pages = Math.ceil(total / limit);

  return {
    items,
    pagination: {
      page,
      limit,
      total,
      pages,
      hasNext: page < pages,
      hasPrev: page > 1,
    },
  };
};

/**
 * Calculate pagination metadata
 * @param {number} total - Total number of items
 * @param {number} page - Current page
 * @param {number} limit - Items per page
 * @returns {Object} Pagination metadata
 */
const calculatePagination = (total, page = 1, limit = 20) => {
  const pages = Math.ceil(total / limit);

  return {
    page: parseInt(page, 10),
    limit: parseInt(limit, 10),
    total,
    pages,
    hasNext: page < pages,
    hasPrev: page > 1,
  };
};

/**
 * Deep clone object
 * @param {Object} obj - Object to clone
 * @returns {Object} Cloned object
 */
const deepClone = (obj) => {
  return JSON.parse(JSON.stringify(obj));
};

/**
 * Check if object is empty
 * @param {Object} obj - Object to check
 * @returns {boolean} True if empty
 */
const isEmpty = (obj) => {
  return Object.keys(obj).length === 0;
};

/**
 * Remove null/undefined values from object
 * @param {Object} obj - Object to clean
 * @returns {Object} Cleaned object
 */
const removeNullValues = (obj) => {
  return Object.fromEntries(Object.entries(obj).filter(([_, v]) => v != null));
};

/**
 * Generate hash from string
 * @param {string} data - Data to hash
 * @param {string} algorithm - Hash algorithm (default: sha256)
 * @returns {string} Hash
 */
const generateHash = (data, algorithm = 'sha256') => {
  return crypto.createHash(algorithm).update(data).digest('hex');
};

/**
 * Compare hash with data
 * @param {string} data - Original data
 * @param {string} hash - Hash to compare
 * @param {string} algorithm - Hash algorithm
 * @returns {boolean} True if match
 */
const verifyHash = (data, hash, algorithm = 'sha256') => {
  const dataHash = generateHash(data, algorithm);
  return dataHash === hash;
};

/**
 * Format phone to E.164
 * @param {string} phone - Phone number
 * @param {string} countryCode - Country code (default: +91 for India)
 * @returns {string} E.164 formatted phone
 */
const formatPhoneE164 = (phone, countryCode = '+91') => {
  // Remove all non-numeric characters
  const cleaned = phone.replace(/\D/g, '');

  // If already has country code, return as is
  if (cleaned.length > 10) {
    return `+${cleaned}`;
  }

  // Add country code
  return `${countryCode}${cleaned}`;
};

/**
 * Calculate duration in minutes from seconds
 * @param {number} seconds - Duration in seconds
 * @returns {number} Duration in minutes (rounded up)
 */
const secondsToMinutes = (seconds) => {
  return Math.ceil(seconds / 60);
};

/**
 * Format duration
 * @param {number} seconds - Duration in seconds
 * @returns {string} Formatted duration (HH:MM:SS)
 */
const formatDuration = (seconds) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  return [hours, minutes, secs].map((v) => String(v).padStart(2, '0')).join(':');
};

/**
 * Calculate overage minutes
 * @param {number} totalMinutes - Total minutes used
 * @param {number} includedMinutes - Included minutes in plan
 * @returns {number} Overage minutes
 */
const calculateOverageMinutes = (totalMinutes, includedMinutes) => {
  return Math.max(0, totalMinutes - includedMinutes);
};

/**
 * Generate device fingerprint
 * @param {Object} req - Express request object or plain object with ip and userAgent
 * @returns {string} Device fingerprint
 */
const generateDeviceFingerprint = (req) => {
  // Handle Express request object
  if (req.get && typeof req.get === 'function') {
    const userAgent = req.get('user-agent') || '';
    const acceptLanguage = req.get('accept-language') || '';
    const ip = req.ip || '';
    const data = `${userAgent}|${acceptLanguage}|${ip}`;
    return generateHash(data);
  }
  
  // Handle plain object with ip and headers
  const userAgent = req.headers?.['user-agent'] || req.userAgent || '';
  const acceptLanguage = req.headers?.['accept-language'] || '';
  const ip = req.ip || '';
  const data = `${userAgent}|${acceptLanguage}|${ip}`;
  return generateHash(data);
};

/**
 * Sanitize filename
 * @param {string} filename - Filename to sanitize
 * @returns {string} Sanitized filename
 */
const sanitizeFilename = (filename) => {
  return filename.replace(/[^a-zA-Z0-9.-]/g, '_');
};

/**
 * Get date range for billing cycle
 * @param {Date} date - Reference date
 * @returns {Object} Start and end dates
 */
const getBillingCycleDates = (date = new Date()) => {
  const startDate = new Date(date.getFullYear(), date.getMonth(), 1);
  const endDate = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);

  return { startDate, endDate };
};

/**
 * Check if date is in current billing cycle
 * @param {Date} date - Date to check
 * @returns {boolean} True if in current cycle
 */
const isInCurrentBillingCycle = (date) => {
  const { startDate, endDate } = getBillingCycleDates();
  const checkDate = new Date(date);

  return checkDate >= startDate && checkDate <= endDate;
};

/**
 * Truncate string
 * @param {string} str - String to truncate
 * @param {number} length - Max length
 * @param {string} ending - Ending string (default: ...)
 * @returns {string} Truncated string
 */
const truncate = (str, length = 100, ending = '...') => {
  if (str.length <= length) return str;
  return str.substring(0, length - ending.length) + ending;
};

/**
 * Capitalize first letter
 * @param {string} str - String to capitalize
 * @returns {string} Capitalized string
 */
const capitalize = (str) => {
  return str.charAt(0).toUpperCase() + str.slice(1);
};

/**
 * Convert to title case
 * @param {string} str - String to convert
 * @returns {string} Title cased string
 */
const toTitleCase = (str) => {
  return str.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
};

module.exports = {
  formatCurrency,
  calculatePercentage,
  generateRandomString,
  generateReferenceNumber,
  generateInvoiceNumber,
  isValidEmail,
  isValidPhone,
  isValidIndianPhone,
  isValidUUID,
  maskSensitiveData,
  maskEmail,
  maskPhone,
  sleep,
  retryWithBackoff,
  paginateArray,
  calculatePagination,
  deepClone,
  isEmpty,
  removeNullValues,
  generateHash,
  verifyHash,
  formatPhoneE164,
  secondsToMinutes,
  formatDuration,
  calculateOverageMinutes,
  generateDeviceFingerprint,
  sanitizeFilename,
  getBillingCycleDates,
  isInCurrentBillingCycle,
  truncate,
  capitalize,
  toTitleCase,
};
