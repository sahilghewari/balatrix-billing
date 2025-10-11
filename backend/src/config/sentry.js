/**
 * Sentry Configuration
 * Error tracking and monitoring
 */

const Sentry = require('@sentry/node');
let ProfilingIntegration;
if (process.env.NODE_ENV !== 'test') {
  try {
    ProfilingIntegration = require('@sentry/profiling-node').ProfilingIntegration;
  } catch (error) {
    // Profiling not available (e.g., unsupported Node.js version)
    console.warn('Sentry profiling not available:', error.message);
  }
}
const logger = require('../utils/logger');

/**
 * Initialize Sentry
 */
const initSentry = (app) => {
  if (!process.env.SENTRY_DSN) {
    logger.warn('SENTRY_DSN not configured. Error tracking is disabled.');
    return;
  }

  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || 'development',
    integrations: [
      // Express integration
      new Sentry.Integrations.Http({ tracing: true }),
      new Sentry.Integrations.Express({ app }),
      ...(ProfilingIntegration ? [new ProfilingIntegration()] : []),
    ],
    // Performance Monitoring
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0, // 10% in production, 100% in dev
    // Profiling
    profilesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    // Release tracking
    release: process.env.APP_VERSION || 'development',
    // Additional context
    beforeSend(event, hint) {
      // Don't send events in test environment
      if (process.env.NODE_ENV === 'test') {
        return null;
      }

      // Add custom tags
      event.tags = {
        ...event.tags,
        component: 'backend',
      };

      return event;
    },
  });

  logger.info('Sentry initialized', {
    environment: process.env.NODE_ENV,
    release: process.env.APP_VERSION,
  });
};

/**
 * Request handler middleware (should be first)
 */
const requestHandler = () => {
  return Sentry.Handlers.requestHandler();
};

/**
 * Tracing handler middleware
 */
const tracingHandler = () => {
  return Sentry.Handlers.tracingHandler();
};

/**
 * Error handler middleware (should be last)
 */
const errorHandler = () => {
  return Sentry.Handlers.errorHandler({
    shouldHandleError(error) {
      // Capture all errors with status code >= 500
      if (error.statusCode >= 500) {
        return true;
      }
      // Don't capture 4xx errors (client errors)
      return false;
    },
  });
};

/**
 * Capture exception manually
 */
const captureException = (error, context = {}) => {
  Sentry.captureException(error, {
    tags: context.tags || {},
    extra: context.extra || {},
    user: context.user || {},
    level: context.level || 'error',
  });
};

/**
 * Capture message
 */
const captureMessage = (message, level = 'info', context = {}) => {
  Sentry.captureMessage(message, {
    level,
    tags: context.tags || {},
    extra: context.extra || {},
  });
};

/**
 * Set user context
 */
const setUser = (user) => {
  Sentry.setUser({
    id: user.id,
    email: user.email,
    username: user.username,
  });
};

/**
 * Add breadcrumb
 */
const addBreadcrumb = (breadcrumb) => {
  Sentry.addBreadcrumb({
    message: breadcrumb.message,
    category: breadcrumb.category || 'custom',
    level: breadcrumb.level || 'info',
    data: breadcrumb.data || {},
  });
};

/**
 * Set custom context
 */
const setContext = (name, context) => {
  Sentry.setContext(name, context);
};

/**
 * Start transaction (for performance monitoring)
 */
const startTransaction = (name, op) => {
  return Sentry.startTransaction({
    name,
    op,
  });
};

/**
 * Close Sentry connection (for graceful shutdown)
 */
const close = async (timeout = 2000) => {
  await Sentry.close(timeout);
  logger.info('Sentry connection closed');
};

module.exports = {
  initSentry,
  requestHandler,
  tracingHandler,
  errorHandler,
  captureException,
  captureMessage,
  setUser,
  addBreadcrumb,
  setContext,
  startTransaction,
  close,
};
