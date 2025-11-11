/**
 * Monitoring Service
 * Prometheus metrics and health checks
 */

const client = require('prom-client');
const logger = require('../utils/logger');

// Create a Registry to register the metrics
const register = new client.Registry();

// Add default metrics (memory, CPU, GC, etc.)
client.collectDefaultMetrics({
  register,
  prefix: 'telecom_billing_',
  gcDurationBuckets: [0.001, 0.01, 0.1, 1, 2, 5],
});

// Custom metrics

/**
 * HTTP Request Duration (Histogram)
 * Tracks response time of HTTP requests
 */
const httpRequestDuration = new client.Histogram({
  name: 'telecom_billing_http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.001, 0.005, 0.015, 0.05, 0.1, 0.5, 1, 5],
  registers: [register],
});

/**
 * HTTP Request Counter
 * Total number of HTTP requests
 */
const httpRequestCounter = new client.Counter({
  name: 'telecom_billing_http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register],
});

/**
 * CDR Processing Rate (Counter)
 * Total CDRs processed
 */
const cdrProcessingCounter = new client.Counter({
  name: 'telecom_billing_cdr_processed_total',
  help: 'Total number of CDRs processed',
  labelNames: ['status', 'call_type'],
  registers: [register],
});

/**
 * CDR Processing Duration (Histogram)
 * Time taken to process a CDR
 */
const cdrProcessingDuration = new client.Histogram({
  name: 'telecom_billing_cdr_processing_duration_seconds',
  help: 'Duration of CDR processing in seconds',
  labelNames: ['status'],
  buckets: [0.1, 0.5, 1, 2, 5, 10],
  registers: [register],
});

/**
 * Active Subscriptions (Gauge)
 * Current number of active subscriptions
 */
const activeSubscriptions = new client.Gauge({
  name: 'telecom_billing_active_subscriptions',
  help: 'Current number of active subscriptions',
  labelNames: ['plan'],
  registers: [register],
});

/**
 * Revenue Generated (Counter)
 * Total revenue in INR
 */
const revenueGenerated = new client.Counter({
  name: 'telecom_billing_revenue_total_inr',
  help: 'Total revenue generated in INR',
  labelNames: ['type'], // subscription, usage, addon
  registers: [register],
});

/**
 * Payment Success Rate (Counter)
 */
const paymentSuccessCounter = new client.Counter({
  name: 'telecom_billing_payment_success_total',
  help: 'Total number of successful payments',
  labelNames: ['gateway'],
  registers: [register],
});

/**
 * Payment Failure Rate (Counter)
 */
const paymentFailureCounter = new client.Counter({
  name: 'telecom_billing_payment_failure_total',
  help: 'Total number of failed payments',
  labelNames: ['gateway', 'reason'],
  registers: [register],
});

/**
 * Job Processing Time (Histogram)
 * Time taken to process background jobs
 */
const jobProcessingDuration = new client.Histogram({
  name: 'telecom_billing_job_processing_duration_seconds',
  help: 'Duration of background job processing in seconds',
  labelNames: ['queue', 'job_name', 'status'],
  buckets: [1, 5, 15, 30, 60, 120, 300],
  registers: [register],
});

/**
 * Job Counter
 */
const jobCounter = new client.Counter({
  name: 'telecom_billing_jobs_total',
  help: 'Total number of background jobs processed',
  labelNames: ['queue', 'job_name', 'status'],
  registers: [register],
});

/**
 * Database Connection Pool (Gauge)
 */
const dbConnectionPool = new client.Gauge({
  name: 'telecom_billing_db_connection_pool',
  help: 'Database connection pool status',
  labelNames: ['status'], // idle, active, waiting
  registers: [register],
});

/**
 * Invoice Generation Counter
 */
const invoiceCounter = new client.Counter({
  name: 'telecom_billing_invoices_generated_total',
  help: 'Total number of invoices generated',
  labelNames: ['type', 'status'], // subscription/postpaid, draft/finalized/paid/overdue
  registers: [register],
});

/**
 * Customer Counter
 */
const customerGauge = new client.Gauge({
  name: 'telecom_billing_customers_total',
  help: 'Total number of customers',
  labelNames: ['status'], // active, suspended, pending
  registers: [register],
});

/**
 * Middleware to track HTTP metrics
 */
const metricsMiddleware = (req, res, next) => {
  const start = Date.now();

  // Track when response finishes
  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000; // Convert to seconds
    const route = req.route ? req.route.path : req.path;

    httpRequestDuration.observe(
      {
        method: req.method,
        route,
        status_code: res.statusCode,
      },
      duration
    );

    httpRequestCounter.inc({
      method: req.method,
      route,
      status_code: res.statusCode,
    });
  });

  next();
};

/**
 * Track CDR processing
 */
const trackCDRProcessing = (status, callType, duration) => {
  cdrProcessingCounter.inc({ status, call_type: callType });
  cdrProcessingDuration.observe({ status }, duration);
};

/**
 * Update active subscriptions count
 */
const updateActiveSubscriptions = async () => {
  try {
    const { Subscription, RatePlan } = require('../models');
    const subscriptions = await Subscription.findAll({
      where: { status: 'active' },
      include: [{ model: RatePlan, as: 'plan', attributes: ['planName'] }],
    });

    // Group by plan
    const planCounts = {};
    subscriptions.forEach((sub) => {
      const planName = sub.ratePlan?.planName || 'unknown';
      planCounts[planName] = (planCounts[planName] || 0) + 1;
    });

    // Update gauge for each plan
    Object.entries(planCounts).forEach(([plan, count]) => {
      activeSubscriptions.set({ plan }, count);
    });

    logger.debug('Updated active subscriptions metrics', { planCounts });
  } catch (error) {
    logger.error('Failed to update active subscriptions metrics', { error: error.message });
  }
};

/**
 * Track revenue
 */
const trackRevenue = (amount, type) => {
  revenueGenerated.inc({ type }, amount);
};

/**
 * Track payment success
 */
const trackPaymentSuccess = (gateway) => {
  paymentSuccessCounter.inc({ gateway });
};

/**
 * Track payment failure
 */
const trackPaymentFailure = (gateway, reason) => {
  paymentFailureCounter.inc({ gateway, reason });
};

/**
 * Track background job processing
 */
const trackJobProcessing = (queue, jobName, status, duration) => {
  jobCounter.inc({ queue, job_name: jobName, status });
  jobProcessingDuration.observe({ queue, job_name: jobName, status }, duration);
};

/**
 * Update database connection pool metrics
 */
const updateDBPoolMetrics = (sequelize) => {
  try {
    const pool = sequelize.connectionManager.pool;
    if (pool) {
      // Only set metrics if values are valid numbers
      if (typeof pool.size === 'number') {
        dbConnectionPool.set({ status: 'active' }, pool.size);
      }
      if (typeof pool.available === 'number') {
        dbConnectionPool.set({ status: 'idle' }, pool.available);
      }
      if (typeof pool.pending === 'number') {
        dbConnectionPool.set({ status: 'waiting' }, pool.pending);
      }
    }
  } catch (error) {
    logger.error('Failed to update DB pool metrics', { error: error.message });
  }
};

/**
 * Track invoice generation
 */
const trackInvoiceGeneration = (type, status) => {
  invoiceCounter.inc({ type, status });
};

/**
 * Update customer counts
 */
const updateCustomerMetrics = async () => {
  try {
    const { Customer } = require('../models');
    const { Op } = require('sequelize');

    const [active, suspended, pending] = await Promise.all([
      Customer.count({ where: { status: 'active' } }),
      Customer.count({ where: { status: 'suspended' } }),
      Customer.count({ where: { status: 'pending' } }),
    ]);

    customerGauge.set({ status: 'active' }, active);
    customerGauge.set({ status: 'suspended' }, suspended);
    customerGauge.set({ status: 'pending' }, pending);

    logger.debug('Updated customer metrics', { active, suspended, pending });
  } catch (error) {
    logger.error('Failed to update customer metrics', { error: error.message });
  }
};

/**
 * Get all metrics
 */
const getMetrics = async () => {
  return await register.metrics();
};

/**
 * Get metrics in JSON format
 */
const getMetricsJSON = async () => {
  return await register.getMetricsAsJSON();
};

/**
 * Health check
 */
const healthCheck = async (sequelize, redisClient) => {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    services: {
      database: 'unknown',
      redis: 'unknown',
    },
    memory: process.memoryUsage(),
    cpu: process.cpuUsage(),
  };

  // Check database
  try {
    await sequelize.authenticate();
    health.services.database = 'healthy';
  } catch (error) {
    health.services.database = 'unhealthy';
    health.status = 'degraded';
    logger.error('Database health check failed', { error: error.message });
  }

  // Check Redis
  /*
  try {
    await redisClient.ping();
    health.services.redis = 'healthy';
  } catch (error) {
    health.services.redis = 'unhealthy';
    health.status = 'degraded';
    logger.error('Redis health check failed', { error: error.message });
  }
  */

  return health;
};

/**
 * Readiness check (for Kubernetes)
 */
const readinessCheck = async (sequelize) => {
  try {
    await sequelize.authenticate();
    return {
      status: 'ready',
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    logger.error('Readiness check failed', { error: error.message });
    throw error;
  }
};

/**
 * Liveness check (for Kubernetes)
 */
const livenessCheck = () => {
  return {
    status: 'alive',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  };
};

/**
 * Update all metrics (called periodically)
 */
const updateAllMetrics = async (sequelize) => {
  try {
    await Promise.all([
      updateActiveSubscriptions(),
      updateCustomerMetrics(),
      updateDBPoolMetrics(sequelize),
    ]);
    logger.debug('All metrics updated successfully');
  } catch (error) {
    logger.error('Failed to update all metrics', { error: error.message });
  }
};

module.exports = {
  register,
  metricsMiddleware,
  trackCDRProcessing,
  updateActiveSubscriptions,
  trackRevenue,
  trackPaymentSuccess,
  trackPaymentFailure,
  trackJobProcessing,
  updateDBPoolMetrics,
  trackInvoiceGeneration,
  updateCustomerMetrics,
  getMetrics,
  getMetricsJSON,
  healthCheck,
  readinessCheck,
  livenessCheck,
  updateAllMetrics,
};
