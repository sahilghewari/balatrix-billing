/**
 * Environment Configuration
 * Centralized environment variable access with defaults
 */

export const env = {
  // API Configuration
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api',
  socketUrl: import.meta.env.VITE_SOCKET_URL || 'http://localhost:8000',
  
  // App Configuration
  appName: import.meta.env.VITE_APP_NAME || 'Balatrix Billing',
  appVersion: import.meta.env.VITE_APP_VERSION || '1.0.0',
  environment: import.meta.env.VITE_ENVIRONMENT || 'development',
  
  // Feature Flags
  enableTwoFactor: import.meta.env.VITE_ENABLE_TWO_FACTOR === 'true',
  enableDarkMode: import.meta.env.VITE_ENABLE_DARK_MODE === 'true',
  enableNotifications: import.meta.env.VITE_ENABLE_NOTIFICATIONS === 'true',
  enableAnalytics: import.meta.env.VITE_ENABLE_ANALYTICS === 'true',
  
  // Payment Gateway
  razorpayKeyId: import.meta.env.VITE_RAZORPAY_KEY_ID || '',
  
  // Monitoring
  sentryDsn: import.meta.env.VITE_SENTRY_DSN || '',
  gaTrackingId: import.meta.env.VITE_GA_TRACKING_ID || '',
  
  // API Configuration
  apiTimeout: parseInt(import.meta.env.VITE_API_TIMEOUT) || 10000,
  
  // Pagination
  defaultPageSize: parseInt(import.meta.env.VITE_DEFAULT_PAGE_SIZE) || 20,
  maxPageSize: parseInt(import.meta.env.VITE_MAX_PAGE_SIZE) || 100,
  
  // Helper Methods
  isDevelopment: () => import.meta.env.DEV,
  isProduction: () => import.meta.env.PROD,
};

export default env;
