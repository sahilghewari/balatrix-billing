/**
 * Application Constants
 * Centralized constant definitions
 */

// Application Routes
export const ROUTES = {
  // Public Routes
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  VERIFY_EMAIL: '/verify-email',
  FORGOT_PASSWORD: '/forgot-password',
  RESET_PASSWORD: '/reset-password',
  
  // Dashboard Routes
  DASHBOARD: '/dashboard',
  ANALYTICS: '/dashboard/analytics',
  REPORTS: '/dashboard/reports',
  
  // Subscription Routes
  SUBSCRIPTIONS: '/subscriptions',
  PLANS: '/subscriptions/plans',
  ADDONS: '/subscriptions/addons',
  CURRENT_SUBSCRIPTION: '/subscriptions/current',
  UPGRADE: '/subscriptions/upgrade',
  
  // Billing Routes
  BILLING: '/billing',
  INVOICES: '/billing/invoices',
  PAYMENTS: '/billing/payments',
  PAYMENT_METHODS: '/billing/methods',
  BILLING_HISTORY: '/billing/history',
  
  // Usage Routes
  USAGE: '/usage',
  USAGE_OVERVIEW: '/usage/overview',
  CALL_HISTORY: '/usage/calls',
  USAGE_ANALYTICS: '/usage/analytics',
  USAGE_EXPORT: '/usage/export',
  
  // Account Routes
  ACCOUNT: '/account',
  PROFILE: '/account/profile',
  SECURITY: '/account/security',
  NOTIFICATIONS: '/account/notifications',
  API_KEYS: '/account/api-keys',
  
  // Admin Routes
  ADMIN: '/admin',
  ADMIN_CUSTOMERS: '/admin/customers',
  ADMIN_SUBSCRIPTIONS: '/admin/subscriptions',
  ADMIN_PAYMENTS: '/admin/payments',
  ADMIN_SYSTEM: '/admin/system',
  ADMIN_SETTINGS: '/admin/settings',
  
  // Support Routes
  SUPPORT: '/support',
  HELP: '/support/help',
  CONTACT: '/support/contact',
  DOCUMENTATION: '/support/docs',
};

// User Roles
export const USER_ROLES = {
  ADMIN: 'admin',
  USER: 'user',
  CUSTOMER: 'customer',
};

// Subscription Status
export const SUBSCRIPTION_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  CANCELLED: 'cancelled',
  SUSPENDED: 'suspended',
  TRIAL: 'trial',
  EXPIRED: 'expired',
};

// Payment Status
export const PAYMENT_STATUS = {
  PENDING: 'pending',
  COMPLETED: 'completed',
  FAILED: 'failed',
  REFUNDED: 'refunded',
  CANCELLED: 'cancelled',
};

// Invoice Status
export const INVOICE_STATUS = {
  DRAFT: 'draft',
  PENDING: 'pending',
  PAID: 'paid',
  OVERDUE: 'overdue',
  CANCELLED: 'cancelled',
  REFUNDED: 'refunded',
};

// Billing Cycles
export const BILLING_CYCLES = {
  MONTHLY: 'monthly',
  QUARTERLY: 'quarterly',
  ANNUAL: 'annual',
};

// CDR Call Types
export const CALL_TYPES = {
  INCOMING: 'incoming',
  OUTGOING: 'outgoing',
  INTERNAL: 'internal',
};

// CDR Call Status
export const CALL_STATUS = {
  COMPLETED: 'completed',
  FAILED: 'failed',
  BUSY: 'busy',
  NO_ANSWER: 'no_answer',
  CANCELLED: 'cancelled',
};

// Notification Types
export const NOTIFICATION_TYPES = {
  INFO: 'info',
  SUCCESS: 'success',
  WARNING: 'warning',
  ERROR: 'error',
};

// Date Formats
export const DATE_FORMATS = {
  FULL: 'MMMM dd, yyyy HH:mm:ss',
  DATE_ONLY: 'MMMM dd, yyyy',
  TIME_ONLY: 'HH:mm:ss',
  SHORT: 'MMM dd, yyyy',
  ISO: "yyyy-MM-dd'T'HH:mm:ss",
};

// Pagination
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_PAGE_SIZE: 20,
  PAGE_SIZE_OPTIONS: [10, 20, 50, 100],
};

// Local Storage Keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'auth_token',
  REFRESH_TOKEN: 'refresh_token',
  USER_DATA: 'user_data',
  THEME: 'theme',
  LANGUAGE: 'language',
  REMEMBER_ME: 'remember_me',
};

// API Request Timeout
export const API_TIMEOUT = 10000; // 10 seconds

// HTTP Status Codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  ACCEPTED: 202,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  METHOD_NOT_ALLOWED: 405,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
  GATEWAY_TIMEOUT: 504,
};

// Chart Colors
export const CHART_COLORS = {
  primary: '#3b82f6',
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
  info: '#06b6d4',
  purple: '#8b5cf6',
  pink: '#ec4899',
  orange: '#f97316',
};

// Currency
export const CURRENCY = {
  CODE: 'INR',
  SYMBOL: '₹',
  NAME: 'Indian Rupee',
};

// GST Rates (India)
export const GST_RATE = 18; // 18%

// File Upload
export const FILE_UPLOAD = {
  MAX_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'],
};

// Validation Rules
export const VALIDATION = {
  PASSWORD_MIN_LENGTH: 8,
  PASSWORD_REGEX: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
  EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE_REGEX: /^[6-9]\d{9}$/,
  GST_REGEX: /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/,
};

// Debounce Delays
export const DEBOUNCE_DELAY = {
  SEARCH: 300,
  TYPING: 500,
  SCROLL: 100,
};

// Toast Durations
export const TOAST_DURATION = {
  SHORT: 2000,
  MEDIUM: 3000,
  LONG: 5000,
};

export default {
  ROUTES,
  USER_ROLES,
  SUBSCRIPTION_STATUS,
  PAYMENT_STATUS,
  INVOICE_STATUS,
  BILLING_CYCLES,
  CALL_TYPES,
  CALL_STATUS,
  NOTIFICATION_TYPES,
  DATE_FORMATS,
  PAGINATION,
  STORAGE_KEYS,
  API_TIMEOUT,
  HTTP_STATUS,
  CHART_COLORS,
  CURRENCY,
  GST_RATE,
  FILE_UPLOAD,
  VALIDATION,
  DEBOUNCE_DELAY,
  TOAST_DURATION,
};
