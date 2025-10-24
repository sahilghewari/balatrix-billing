/**
 * Main Express Application
 * Entry point for the Telecom Billing Backend API
 */

// Load environment variables first
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const compression = require('compression');
const corsOptions = require('./config/cors');
const logger = require('./utils/logger');
const { sequelize, testConnection, syncDatabase } = require('./config/database');
const { redisClient } = require('./config/redis');
const sentry = require('./config/sentry');

// Middleware
const { requestLogger } = require('./middleware/logging');
const {
  securityHeaders,
  addSecurityContext,
  sanitizeInput,
  preventParameterPollution,
  detectSuspiciousActivity,
  validateContentType,
} = require('./middleware/security');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');
const { apiLimiter } = require('./middleware/rateLimiting');
const { metricsMiddleware, updateAllMetrics } = require('./services/monitoringService');

// Routes
const authRoutes = require('./routes/auth');
const customerRoutes = require('./routes/customers');
const subscriptionRoutes = require('./routes/subscriptions');
const ratePlanRoutes = require('./routes/ratePlans');
const paymentRoutes = require('./routes/payments');
const cdrRoutes = require('./routes/cdrs');
const invoiceRoutes = require('./routes/invoices');
const monitoringRoutes = require('./routes/monitoring');
const tenantRoutes = require('./routes/tenants');
const extensionRoutes = require('./routes/extensions');

// Initialize Express app
const app = express();

/**
 * Initialize Sentry (must be first)
 */
sentry.initSentry(app);
app.use(sentry.requestHandler());
app.use(sentry.tracingHandler());

/**
 * Trust proxy - important for getting correct client IP behind reverse proxy
 */
app.set('trust proxy', 1);

/**
 * Monitoring Middleware (before other middleware to track all requests)
 */
app.use(metricsMiddleware);

/**
 * Security Middleware
 */
app.use(securityHeaders);
app.use(addSecurityContext);

/**
 * Body parsing middleware
 */
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

/**
 * Compression middleware
 */
app.use(compression());

/**
 * CORS middleware
 */
app.use(cors(corsOptions));

/**
 * Request logging
 */
if (process.env.NODE_ENV !== 'test') {
  app.use(requestLogger);
}

/**
 * Security middleware
 */
app.use(sanitizeInput);
app.use(preventParameterPollution);
app.use(detectSuspiciousActivity);
app.use(validateContentType);

/**
 * Rate limiting
 */
app.use('/api/', apiLimiter);

/**
 * Health check endpoint
 */
app.get('/health', async (req, res) => {
  try {
    // Check database connection
    await sequelize.authenticate();

    // Check Redis connection
    await redisClient.ping();

    res.status(200).json({
      success: true,
      message: 'Service is healthy',
      data: {
        status: 'up',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        database: 'connected',
        redis: 'connected',
        environment: process.env.NODE_ENV || 'development',
      },
    });
  } catch (error) {
    logger.error('Health check failed:', error);
    res.status(503).json({
      success: false,
      message: 'Service is unhealthy',
      data: {
        status: 'down',
        timestamp: new Date().toISOString(),
        error: error.message,
      },
    });
  }
});

/**
 * Monitoring Routes (no /api prefix for Prometheus)
 */
app.use('/', monitoringRoutes);

/**
 * API Routes
 */
app.use('/api/auth', authRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/rate-plans', ratePlanRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/cdrs', cdrRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/tenants', tenantRoutes);
app.use('/api/extensions', extensionRoutes);
// TODO: Add more routes
// app.use('/api/reports', reportRoutes);
// app.use('/api/dids', didRoutes);

/**
 * Welcome route
 */
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Balatrix Telecom Billing API',
    version: '1.0.0',
    documentation: '/api/docs',
    endpoints: {
      health: '/health',
      metrics: '/metrics',
      auth: '/api/auth',
      customers: '/api/customers',
      subscriptions: '/api/subscriptions',
      payments: '/api/payments',
      cdrs: '/api/cdrs',
      invoices: '/api/invoices',
      tenants: '/api/tenants',
      extensions: '/api/extensions',
    },
  });
});

/**
 * 404 handler - must be after all other routes
 */
app.use(notFoundHandler);

/**
 * Sentry error handler - must be before custom error handler
 */
app.use(sentry.errorHandler());

/**
 * Global error handler - must be last
 */
app.use(errorHandler);

/**
 * Initialize database connection
 */
const initializeDatabase = async () => {
  try {
    logger.info('Starting database initialization...');
    await testConnection();
    logger.info('Database connection test passed');

    if (process.env.NODE_ENV === 'development') {
      // Sync models in development (use migrations in production)
      logger.info('Syncing database models...');
      await syncDatabase();
      logger.info('Database models synced');
    }

    // Initialize Kamailio database tables
    logger.info('Initializing Kamailio database tables...');
    const kamailioService = require('./services/kamailioService');
    const kamailioResult = await kamailioService.initializeTables();
    if (kamailioResult.success) {
      logger.info('Kamailio database tables initialized');
    } else if (kamailioResult.skipped) {
      logger.warn('Kamailio database initialization skipped:', kamailioResult.reason);
    } else {
      logger.error('Kamailio database initialization failed:', kamailioResult.error);
    }

    logger.info('Database initialized successfully');
  } catch (error) {
    logger.error('Database initialization failed:', error);
    logger.error('Error stack:', error.stack);
    throw error; // Re-throw to be caught by startServer
  }
};

/**
 * Graceful shutdown
 */
const gracefulShutdown = async (signal) => {
  logger.info(`${signal} received. Starting graceful shutdown...`);

  // Close server to stop accepting new connections
  if (server) {
    server.close(() => {
      logger.info('HTTP server closed');
    });
  }

  try {
    // Close Sentry connection
    await sentry.close();

    // Close database connection
    await sequelize.close();
    logger.info('Database connection closed');

    // Close Redis connection
    await redisClient.quit();
    logger.info('Redis connection closed');

    logger.info('Graceful shutdown completed');
    process.exit(0);
  } catch (error) {
    logger.error('Error during graceful shutdown:', error);
    process.exit(1);
  }
};

// Handle shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  logger.error('Exception message:', error.message);
  logger.error('Exception stack:', error.stack);
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  console.error('Unhandled Rejection:', reason);
  if (reason && reason.stack) {
    logger.error('Rejection stack:', reason.stack);
    console.error('Rejection stack:', reason.stack);
  }
  process.exit(1);
});

/**
 * Start server
 */
let server;
const PORT = process.env.PORT || 3000;

const startServer = async () => {
  try {
    logger.info('Starting server initialization...');
    
    // Initialize database
    logger.info('Step 1: Initializing database...');
    await initializeDatabase();
    logger.info('Database initialization complete');

    // Start periodic metrics update (every 30 seconds)
    logger.info('Step 2: Setting up metrics monitoring...');
    setInterval(() => {
      updateAllMetrics(sequelize);
    }, 30000);

    // Initial metrics update
    await updateAllMetrics(sequelize);
    logger.info('Monitoring metrics initialized');

    // Start Express server
    logger.info(`Step 3: Starting Express server on port ${PORT}...`);
    server = app.listen(PORT, () => {
      logger.info(`✅ Server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
      logger.info(`✅ Health check: http://localhost:${PORT}/health`);
      logger.info(`✅ Metrics endpoint: http://localhost:${PORT}/metrics`);
      logger.info(`✅ API base URL: http://localhost:${PORT}/api`);
      logger.info(`🚀 Server is ready to accept connections!`);
    });
  } catch (error) {
    logger.error('❌ Failed to start server:', error);
    logger.error('Error details:', error.message);
    logger.error('Error stack:', error.stack);
    process.exit(1);
  }
};

// Start server if not in test environment
if (process.env.NODE_ENV !== 'test') {
  logger.info('🚀 About to call startServer()...');
  console.log('🚀 About to call startServer()...');
  startServer().catch((error) => {
    logger.error('Unhandled error in startServer:', error);
    logger.error('Error message:', error.message);
    logger.error('Error stack:', error.stack);
    process.exit(1);
  });
  logger.info('✅ startServer() call initiated');
  console.log('✅ startServer() call initiated');
}

// Export app for testing
module.exports = app;
