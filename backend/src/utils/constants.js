/**
 * Constants and Configuration Values
 * Centralized constants for the entire application
 */

// Subscription Plans with exact pricing structure
const SUBSCRIPTION_PLANS = {
  starter: {
    id: 'starter',
    name: 'Starter Plan',
    monthlyPrice: 349, // INR
    annualPrice: 3348, // 20% discount applied (349 * 12 * 0.8)
    features: {
      tollFreeNumbers: 1,
      freeMinutes: 100,
      extensions: 2,
      perMinuteCharge: 1.99,
    },
    limits: {
      maxTollFreeNumbers: 1,
      maxExtensions: 2,
      monthlyMinuteAllowance: 100,
    },
  },
  professional: {
    id: 'professional',
    name: 'Professional Plan',
    monthlyPrice: 999,
    annualPrice: 9590.4, // 20% discount applied
    features: {
      tollFreeNumbers: 2,
      freeMinutes: 500,
      extensions: 10,
      perMinuteCharge: 1.6,
    },
    limits: {
      maxTollFreeNumbers: 2,
      maxExtensions: 10,
      monthlyMinuteAllowance: 500,
    },
  },
  callCenter: {
    id: 'callCenter',
    name: 'Call Center Plan',
    monthlyPrice: 4999,
    annualPrice: 47990.4, // 20% discount applied
    features: {
      tollFreeNumbers: 5,
      freeMinutes: 1500,
      extensions: 50,
      perMinuteCharge: 1.45,
    },
    limits: {
      maxTollFreeNumbers: 5,
      maxExtensions: 50,
      monthlyMinuteAllowance: 1500,
    },
  },
};

// Add-on Pricing
const ADDON_PRICING = {
  tollFreeNumber: {
    payAsYouGo: 1, // ₹1 per use
    oneTimeCharge: 199, // ₹199 OTC (waived for quarterly customers)
  },
  extension: {
    payAsYouGo: 1, // ₹1 per use
    oneTimeCharge: 99, // ₹99 OTC (waived for quarterly customers)
  },
  perMinuteOverage: 1.99, // Default overage rate
};

// Billing Cycles
const BILLING_CYCLES = {
  MONTHLY: 'monthly',
  QUARTERLY: 'quarterly',
  ANNUAL: 'annual',
};

// Subscription Status
const SUBSCRIPTION_STATUS = {
  ACTIVE: 'active',
  SUSPENDED: 'suspended',
  CANCELLED: 'cancelled',
  PENDING: 'pending',
  EXPIRED: 'expired',
};

// Payment Status
const PAYMENT_STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  SUCCESS: 'success',
  FAILED: 'failed',
  REFUNDED: 'refunded',
  CANCELLED: 'cancelled',
};

// Payment Methods
const PAYMENT_METHODS = {
  RAZORPAY: 'razorpay',
  STRIPE: 'stripe',
  CARD: 'card',
  UPI: 'upi',
  NET_BANKING: 'net_banking',
  WALLET: 'wallet',
};

// Invoice Status
const INVOICE_STATUS = {
  DRAFT: 'draft',
  SENT: 'sent',
  PAID: 'paid',
  OVERDUE: 'overdue',
  VOID: 'void',
  PARTIALLY_PAID: 'partially_paid',
};

// CDR Status
const CDR_STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  PROCESSED: 'processed',
  FAILED: 'failed',
  DISPUTED: 'disputed',
};

// Call Status
const CALL_STATUS = {
  ANSWERED: 'NORMAL_CLEARING',
  BUSY: 'USER_BUSY',
  NO_ANSWER: 'NO_ANSWER',
  REJECTED: 'CALL_REJECTED',
  INVALID_NUMBER: 'INVALID_NUMBER_FORMAT',
  INSUFFICIENT_BALANCE: 'INSUFFICIENT_FUNDS',
};

// User Roles
const USER_ROLES = {
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin',
  SUPPORT: 'support',
  CUSTOMER: 'customer',
  RESELLER: 'reseller',
};

// Account Types
const ACCOUNT_TYPES = {
  PREPAID: 'prepaid',
  POSTPAID: 'postpaid',
};

// DID Status
const DID_STATUS = {
  AVAILABLE: 'available',
  ASSIGNED: 'assigned',
  RESERVED: 'reserved',
  SUSPENDED: 'suspended',
};

// Notification Types
const NOTIFICATION_TYPES = {
  EMAIL: 'email',
  SMS: 'sms',
  PUSH: 'push',
  WEBHOOK: 'webhook',
};

// Security Constants
const SECURITY = {
  JWT_ACCESS_EXPIRY: '15m',
  JWT_REFRESH_EXPIRY: '7d',
  MAX_LOGIN_ATTEMPTS: 5,
  LOCKOUT_DURATION: 15 * 60 * 1000, // 15 minutes
  PASSWORD_MIN_LENGTH: 12,
  PASSWORD_REGEX: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{12,}$/,
  MFA_WINDOW: 1, // TOTP window
  MFA_STEP: 30, // TOTP step in seconds
  RATE_LIMIT_WINDOW: 15 * 60 * 1000, // 15 minutes
  RATE_LIMIT_MAX: 100, // requests
};

// Tax Configuration (India)
const TAX_CONFIG = {
  GST_RATE: 0.18, // 18% GST
  CGST_RATE: 0.09, // 9% CGST
  SGST_RATE: 0.09, // 9% SGST
  IGST_RATE: 0.18, // 18% IGST
};

// Currency Configuration
const CURRENCY = {
  CODE: 'INR',
  SYMBOL: '₹',
  DECIMAL_PLACES: 2,
};

// Queue Names
const QUEUE_NAMES = {
  CDR_PROCESSING: 'cdr-processing',
  BILLING: 'billing',
  INVOICE_GENERATION: 'invoice-generation',
  PAYMENT_RETRY: 'payment-retry',
  NOTIFICATIONS: 'notifications',
  REPORTS: 'reports',
  CLEANUP: 'cleanup',
  BACKUP: 'backup',
};

// Queue Job Priorities
const QUEUE_PRIORITIES = {
  CRITICAL: 1,
  HIGH: 3,
  NORMAL: 5,
  LOW: 7,
};

// System Events
const SYSTEM_EVENTS = {
  USER_REGISTERED: 'user.registered',
  USER_LOGIN: 'user.login',
  USER_LOGOUT: 'user.logout',
  SUBSCRIPTION_CREATED: 'subscription.created',
  SUBSCRIPTION_UPDATED: 'subscription.updated',
  SUBSCRIPTION_CANCELLED: 'subscription.cancelled',
  PAYMENT_SUCCESS: 'payment.success',
  PAYMENT_FAILED: 'payment.failed',
  INVOICE_GENERATED: 'invoice.generated',
  LOW_BALANCE: 'balance.low',
  CDR_PROCESSED: 'cdr.processed',
  CALL_AUTHORIZED: 'call.authorized',
  CALL_REJECTED: 'call.rejected',
};

// Log Levels
const LOG_LEVELS = {
  ERROR: 'error',
  WARN: 'warn',
  INFO: 'info',
  HTTP: 'http',
  DEBUG: 'debug',
};

// HTTP Status Codes
const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
};

// Error Codes
const ERROR_CODES = {
  // Authentication Errors
  AUTH_INVALID_CREDENTIALS: 'AUTH_001',
  AUTH_ACCOUNT_LOCKED: 'AUTH_002',
  AUTH_TOKEN_EXPIRED: 'AUTH_003',
  AUTH_TOKEN_INVALID: 'AUTH_004',
  AUTH_MFA_REQUIRED: 'AUTH_005',
  AUTH_MFA_INVALID: 'AUTH_006',

  // Authorization Errors
  AUTHZ_INSUFFICIENT_PERMISSIONS: 'AUTHZ_001',
  AUTHZ_RESOURCE_FORBIDDEN: 'AUTHZ_002',

  // Validation Errors
  VAL_INVALID_INPUT: 'VAL_001',
  VAL_MISSING_FIELD: 'VAL_002',
  VAL_INVALID_FORMAT: 'VAL_003',

  // Business Logic Errors
  BIZ_INSUFFICIENT_BALANCE: 'BIZ_001',
  BIZ_PLAN_LIMIT_EXCEEDED: 'BIZ_002',
  BIZ_SUBSCRIPTION_INACTIVE: 'BIZ_003',
  BIZ_DUPLICATE_RESOURCE: 'BIZ_004',

  // Payment Errors
  PAY_GATEWAY_ERROR: 'PAY_001',
  PAY_TRANSACTION_FAILED: 'PAY_002',
  PAY_INVALID_AMOUNT: 'PAY_003',

  // CDR Processing Errors
  CDR_INVALID_FORMAT: 'CDR_001',
  CDR_DUPLICATE: 'CDR_002',
  CDR_CUSTOMER_NOT_FOUND: 'CDR_003',

  // System Errors
  SYS_DATABASE_ERROR: 'SYS_001',
  SYS_EXTERNAL_SERVICE_ERROR: 'SYS_002',
  SYS_INTERNAL_ERROR: 'SYS_003',
};

// Regex Patterns
const REGEX_PATTERNS = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE_E164: /^\+[1-9]\d{1,14}$/,
  PHONE_INDIAN: /^[6-9]\d{9}$/,
  UUID: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
  ALPHANUMERIC: /^[a-zA-Z0-9]+$/,
  GSTIN: /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/,
  PAN: /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/,
};

// Pagination Defaults
const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
};

// CDR Fields Required
const CDR_REQUIRED_FIELDS = [
  'uuid',
  'callingNumber',
  'calledNumber',
  'startTime',
  'endTime',
  'duration',
  'billsec',
  'hangupCause',
];

// Monitoring Thresholds
const MONITORING_THRESHOLDS = {
  ERROR_RATE: 0.05, // 5%
  RESPONSE_TIME_MS: 200,
  DATABASE_QUERY_MS: 100,
  LOW_BALANCE_INR: 100,
  HIGH_CPU_PERCENT: 70,
  HIGH_MEMORY_PERCENT: 80,
};

module.exports = {
  SUBSCRIPTION_PLANS,
  ADDON_PRICING,
  BILLING_CYCLES,
  SUBSCRIPTION_STATUS,
  PAYMENT_STATUS,
  PAYMENT_METHODS,
  INVOICE_STATUS,
  CDR_STATUS,
  CALL_STATUS,
  USER_ROLES,
  ACCOUNT_TYPES,
  DID_STATUS,
  NOTIFICATION_TYPES,
  SECURITY,
  TAX_CONFIG,
  CURRENCY,
  QUEUE_NAMES,
  QUEUE_PRIORITIES,
  SYSTEM_EVENTS,
  LOG_LEVELS,
  HTTP_STATUS,
  ERROR_CODES,
  REGEX_PATTERNS,
  PAGINATION,
  CDR_REQUIRED_FIELDS,
  MONITORING_THRESHOLDS,
};
