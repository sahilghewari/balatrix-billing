/**
 * API Configuration
 * Defines all API endpoints and configurations
 */

import { env } from './env';

export const API_CONFIG = {
  baseURL: env.apiBaseUrl,
  timeout: env.apiTimeout,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
};

// API Endpoints (matching backend routes)
export const API_ENDPOINTS = {
  // Authentication
  auth: {
    login: '/auth/login',
    register: '/auth/register',
    logout: '/auth/logout',
    logoutAll: '/auth/logout-all',
    refresh: '/auth/refresh',
    me: '/auth/me',
    changePassword: '/auth/change-password',
    forgotPassword: '/auth/forgot-password',
    resetPassword: '/auth/reset-password',
    verifyEmail: (token) => `/auth/verify-email/${token}`,
    mfaSetup: '/auth/mfa/setup',
    mfaVerify: '/auth/mfa/verify',
    mfaDisable: '/auth/mfa/disable',
    sessions: '/auth/sessions',
    revokeSession: (id) => `/auth/sessions/${id}`,
  },

  // Subscriptions
  subscriptions: {
    list: '/subscriptions',
    create: '/subscriptions',
    getById: (id) => `/subscriptions/${id}`,
    update: (id) => `/subscriptions/${id}`,
    changePlan: (id) => `/subscriptions/${id}/change-plan`,
    cancel: (id) => `/subscriptions/${id}/cancel`,
    suspend: (id) => `/subscriptions/${id}/suspend`,
    activate: (id) => `/subscriptions/${id}/activate`,
    usage: (id) => `/subscriptions/${id}/usage`,
    updateUsage: (id) => `/subscriptions/${id}/usage`,
    renew: (id) => `/subscriptions/${id}/renew`,
  },

  // Invoices
  invoices: {
    list: '/invoices',
    getById: (id) => `/invoices/${id}`,
    overdue: '/invoices/overdue',
    statistics: '/invoices/statistics',
    generateSubscription: (id) => `/invoices/generate/subscription/${id}`,
    generatePostpaid: (id) => `/invoices/generate/postpaid/${id}`,
    markPaid: (id) => `/invoices/${id}/mark-paid`,
    void: (id) => `/invoices/${id}/void`,
    reminder: (id) => `/invoices/${id}/reminder`,
    processBillingCycle: '/invoices/process-billing-cycle',
  },
  
  // Payments
  payments: {
    create: '/payments',
    verify: (id) => `/payments/${id}/verify`,
    retry: (id) => `/payments/${id}/retry`,
    refund: (id) => `/payments/${id}/refund`,
    getById: (id) => `/payments/${id}`,
    list: '/payments',
    statistics: '/payments/statistics',
    webhooks: {
      razorpay: '/payments/webhooks/razorpay',
      stripe: '/payments/webhooks/stripe',
    },
  },

  // CDRs
  cdrs: {
    submit: '/cdrs',
    batch: '/cdrs/batch',
    list: '/cdrs',
    getById: (id) => `/cdrs/${id}`,
    statistics: '/cdrs/statistics',
    analytics: '/cdrs/analytics',
    topDestinations: '/cdrs/top-destinations',
    export: '/cdrs/export',
    retry: (id) => `/cdrs/${id}/retry`,
  },

  // Customers
  customers: {
    create: '/customers',
    list: '/customers',
    search: '/customers/search',
    me: '/customers/me',
    getById: (id) => `/customers/${id}`,
    update: (id) => `/customers/${id}`,
    delete: (id) => `/customers/${id}`,
    suspend: (id) => `/customers/${id}/suspend`,
    activate: (id) => `/customers/${id}/activate`,
    statistics: (id) => `/customers/${id}/statistics`,
    accounts: (id) => `/customers/${id}/accounts`,
    createAccount: (id) => `/customers/${id}/accounts`,
  },

  // Monitoring
  monitoring: {
    health: '/health',
    healthReady: '/health/ready',
    healthLive: '/health/live',
    metrics: '/metrics',
    metricsJson: '/metrics/json',
  },

  // Dashboard
  dashboard: {
    overview: '/dashboard/overview',
    metrics: '/dashboard/metrics',
    recentActivity: '/dashboard/recent-activity',
    quickActions: '/dashboard/quick-actions',
  },

  // Support
  support: {
    tickets: '/support/tickets',
    createTicket: '/support/tickets',
    ticket: (id) => `/support/tickets/${id}`,
    documentation: '/support/documentation',
  },
};

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
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
};

export default { API_CONFIG, API_ENDPOINTS, HTTP_STATUS };
