/**
 * API Endpoints Configuration
 * Centralized API endpoint definitions
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

export const API_ENDPOINTS = {
  // Authentication
  AUTH: {
    REGISTER: '/auth/register',
    LOGIN: '/auth/login',
    LOGOUT: '/auth/logout',
    REFRESH_TOKEN: '/auth/refresh',
    FORGOT_PASSWORD: '/auth/forgot-password',
    RESET_PASSWORD: '/auth/reset-password',
    VERIFY_EMAIL: '/auth/verify-email',
    CHANGE_PASSWORD: '/auth/change-password',
    ME: '/auth/me',
  },

  // Customers
  CUSTOMERS: {
    BASE: '/customers',
    BY_ID: (id) => `/customers/${id}`,
    SEARCH: '/customers/search',
  },

  // Subscriptions
  SUBSCRIPTIONS: {
    BASE: '/subscriptions',
    BY_ID: (id) => `/subscriptions/${id}`,
    BY_CUSTOMER: (customerId) => `/subscriptions/customer/${customerId}`,
  },

  // Invoices
  INVOICES: {
    BASE: '/invoices',
    BY_ID: (id) => `/invoices/${id}`,
    BY_CUSTOMER: (customerId) => `/invoices/customer/${customerId}`,
  },

  // Payments
  PAYMENTS: {
    BASE: '/payments',
    BY_ID: (id) => `/payments/${id}`,
    BY_CUSTOMER: (customerId) => `/payments/customer/${customerId}`,
  },

  // CDRs
  CDRS: {
    BASE: '/cdrs',
    BY_ID: (id) => `/cdrs/${id}`,
    BY_ACCOUNT: (accountId) => `/cdrs/account/${accountId}`,
  },

  // Rate Plans
  RATE_PLANS: {
    BASE: '/rate-plans',
    BY_ID: (id) => `/rate-plans/${id}`,
    ACTIVE: '/rate-plans/active',
  },

  // Dashboard
  DASHBOARD: {
    STATS: '/dashboard/stats',
    REVENUE: '/dashboard/revenue',
  },

  // Toll-Free Numbers
  TOLL_FREE: {
    BASE: '/toll-free',
    BY_ID: (id) => `/toll-free/${id}`,
    BY_CUSTOMER: (customerId) => `/toll-free/customer/${customerId}`,
    AVAILABLE: '/toll-free/available',
    PURCHASE: '/toll-free/purchase',
    ACTIVATE: (id) => `/toll-free/${id}/activate`,
    DEACTIVATE: (id) => `/toll-free/${id}/deactivate`,
    SETTINGS: (id) => `/toll-free/${id}/settings`,
  },

  // Extensions
  EXTENSIONS: {
    BASE: '/extensions',
    BY_ID: (id) => `/extensions/${id}`,
    BY_TOLL_FREE: (tollFreeId) => `/toll-free/${tollFreeId}/extensions`,
    BY_CUSTOMER: (customerId) => `/extensions/customer/${customerId}`,
    REGISTER_STATUS: (id) => `/extensions/${id}/register-status`,
    CALL_STATUS: (id) => `/extensions/${id}/call-status`,
    RESET_PASSWORD: (id) => `/extensions/${id}/reset-password`,
  },

  // IVR Menus
  IVR: {
    MENUS: {
      BASE: '/ivr/menus',
      BY_ID: (id) => `/ivr/menus/${id}`,
      BY_TOLL_FREE: (tollFreeId) => `/toll-free/${tollFreeId}/ivr-menus`,
      CLONE: (id) => `/ivr/menus/${id}/clone`,
    },
    OPTIONS: {
      BASE: (menuId) => `/ivr/menus/${menuId}/options`,
      BY_ID: (menuId, optionId) => `/ivr/menus/${menuId}/options/${optionId}`,
      REORDER: (menuId) => `/ivr/menus/${menuId}/options/reorder`,
    },
    AUDIO: {
      BASE: '/ivr/audio',
      BY_ID: (id) => `/ivr/audio/${id}`,
      UPLOAD: '/ivr/audio/upload',
      TTS: '/ivr/audio/tts',
      BY_CUSTOMER: (customerId) => `/ivr/audio/customer/${customerId}`,
    },
  },

  // Call Routing
  ROUTING: {
    RULES: {
      BASE: '/routing/rules',
      BY_ID: (id) => `/routing/rules/${id}`,
      BY_TOLL_FREE: (tollFreeId) => `/toll-free/${tollFreeId}/routing-rules`,
      REORDER: (tollFreeId) => `/toll-free/${tollFreeId}/routing-rules/reorder`,
    },
    BUSINESS_HOURS: {
      BASE: '/routing/business-hours',
      BY_CUSTOMER: (customerId) => `/routing/business-hours/customer/${customerId}`,
      BULK_UPDATE: '/routing/business-hours/bulk-update',
    },
    HOLIDAYS: {
      BASE: '/routing/holidays',
      BY_ID: (id) => `/routing/holidays/${id}`,
      BY_CUSTOMER: (customerId) => `/routing/holidays/customer/${customerId}`,
    },
  },

  // Call Management
  CALLS: {
    ACTIVE: '/calls/active',
    BY_CUSTOMER: (customerId) => `/calls/active/customer/${customerId}`,
    TRANSFER: (callUuid) => `/calls/${callUuid}/transfer`,
    HANGUP: (callUuid) => `/calls/${callUuid}/hangup`,
    HOLD: (callUuid) => `/calls/${callUuid}/hold`,
    UNHOLD: (callUuid) => `/calls/${callUuid}/unhold`,
    RECORD: (callUuid) => `/calls/${callUuid}/record`,
    STOP_RECORD: (callUuid) => `/calls/${callUuid}/stop-record`,
  },

  // Call Recordings
  RECORDINGS: {
    BASE: '/recordings',
    BY_ID: (id) => `/recordings/${id}`,
    BY_CUSTOMER: (customerId) => `/recordings/customer/${customerId}`,
    BY_TOLL_FREE: (tollFreeId) => `/toll-free/${tollFreeId}/recordings`,
    DOWNLOAD: (id) => `/recordings/${id}/download`,
    DELETE: (id) => `/recordings/${id}`,
  },

  // Voicemail
  VOICEMAIL: {
    BASE: '/voicemail',
    BY_ID: (id) => `/voicemail/${id}`,
    BY_EXTENSION: (extensionId) => `/extensions/${extensionId}/voicemail`,
    BY_CUSTOMER: (customerId) => `/voicemail/customer/${customerId}`,
    MARK_READ: (id) => `/voicemail/${id}/mark-read`,
    DOWNLOAD: (id) => `/voicemail/${id}/download`,
    DELETE: (id) => `/voicemail/${id}`,
  },

  // Call Queues
  QUEUES: {
    BASE: '/queues',
    BY_ID: (id) => `/queues/${id}`,
    BY_CUSTOMER: (customerId) => `/queues/customer/${customerId}`,
    MEMBERS: {
      BASE: (queueId) => `/queues/${queueId}/members`,
      ADD: (queueId) => `/queues/${queueId}/members`,
      REMOVE: (queueId, memberId) => `/queues/${queueId}/members/${memberId}`,
      STATUS: (queueId, memberId) => `/queues/${queueId}/members/${memberId}/status`,
    },
    STATS: (queueId) => `/queues/${queueId}/stats`,
  },

  // FreeSWITCH Integration (Internal/Webhook endpoints)
  FREESWITCH: {
    DIRECTORY: '/freeswitch/directory',
    DIALPLAN: '/freeswitch/dialplan',
    CDR: '/freeswitch/cdr',
    EVENT: '/freeswitch/event',
    HEALTH: '/freeswitch/health',
  },

  // WebSocket for real-time updates
  WEBSOCKET: {
    CONNECT: '/ws',
    CALLS: '/ws/calls',
    CALL_MONITORING: '/socket.io/call-monitoring',
  },

  // Analytics & Reports
  ANALYTICS: {
    CALL_VOLUME: '/analytics/call-volume',
    PEAK_HOURS: '/analytics/peak-hours',
    AVERAGE_DURATION: '/analytics/average-duration',
    TOP_DESTINATIONS: '/analytics/top-destinations',
    EXTENSION_USAGE: '/analytics/extension-usage',
    IVR_FLOW: '/analytics/ivr-flow',
  },
};

export { API_BASE_URL };
