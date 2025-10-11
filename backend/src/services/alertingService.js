/**
 * Alerting Service
 * Monitor critical metrics and send alerts
 */

const logger = require('../utils/logger');
const { captureMessage } = require('../config/sentry');

/**
 * Alert levels
 */
const ALERT_LEVELS = {
  INFO: 'info',
  WARNING: 'warning',
  CRITICAL: 'critical',
};

/**
 * Alert channels
 */
const ALERT_CHANNELS = {
  LOG: 'log',
  SENTRY: 'sentry',
  EMAIL: 'email',
  WEBHOOK: 'webhook',
};

/**
 * Alert thresholds
 */
const THRESHOLDS = {
  // Database connection pool
  DB_POOL_UTILIZATION: 0.8, // 80% pool usage
  
  // Payment failures
  PAYMENT_FAILURE_RATE: 0.1, // 10% failure rate
  
  // CDR processing
  CDR_PROCESSING_FAILURE_RATE: 0.05, // 5% failure rate
  CDR_PROCESSING_DELAY: 60, // 60 seconds
  
  // API response time
  API_RESPONSE_TIME: 5, // 5 seconds
  
  // Job processing
  JOB_FAILURE_RATE: 0.1, // 10% failure rate
  JOB_PROCESSING_DELAY: 300, // 5 minutes
  
  // Account balance
  LOW_BALANCE_THRESHOLD: 100, // ₹100
  CRITICAL_BALANCE_THRESHOLD: 10, // ₹10
  
  // System resources
  MEMORY_USAGE: 0.9, // 90% memory usage
  CPU_USAGE: 0.9, // 90% CPU usage
};

/**
 * Send alert
 */
const sendAlert = async (level, title, message, data = {}, channels = [ALERT_CHANNELS.LOG, ALERT_CHANNELS.SENTRY]) => {
  const alert = {
    level,
    title,
    message,
    data,
    timestamp: new Date().toISOString(),
  };

  // Log alert
  if (channels.includes(ALERT_CHANNELS.LOG)) {
    const logLevel = level === ALERT_LEVELS.CRITICAL ? 'error' : level === ALERT_LEVELS.WARNING ? 'warn' : 'info';
    logger[logLevel](`ALERT: ${title}`, { message, data });
  }

  // Send to Sentry
  if (channels.includes(ALERT_CHANNELS.SENTRY)) {
    captureMessage(`[${level.toUpperCase()}] ${title}: ${message}`, level === ALERT_LEVELS.CRITICAL ? 'error' : level, {
      tags: { alert_type: title },
      extra: data,
    });
  }

  // Send email (TODO: implement email alerting)
  if (channels.includes(ALERT_CHANNELS.EMAIL)) {
    // TODO: Send email via nodemailer
    logger.info('Email alert would be sent here', alert);
  }

  // Send webhook (TODO: implement webhook alerting)
  if (channels.includes(ALERT_CHANNELS.WEBHOOK)) {
    // TODO: Send webhook notification
    logger.info('Webhook alert would be sent here', alert);
  }
};

/**
 * Check database connection pool utilization
 */
const checkDatabasePoolUtilization = async (sequelize) => {
  try {
    const pool = sequelize.connectionManager.pool;
    if (!pool) return;

    const utilization = pool.size / pool.max;

    if (utilization >= THRESHOLDS.DB_POOL_UTILIZATION) {
      await sendAlert(
        ALERT_LEVELS.WARNING,
        'High Database Pool Utilization',
        `Database connection pool is ${(utilization * 100).toFixed(1)}% utilized`,
        {
          active: pool.size,
          max: pool.max,
          idle: pool.available,
          pending: pool.pending,
        }
      );
    }
  } catch (error) {
    logger.error('Error checking database pool utilization', { error: error.message });
  }
};

/**
 * Check payment failure rate
 */
const checkPaymentFailureRate = async () => {
  try {
    const { Payment } = require('../models');
    const { Op } = require('sequelize');

    // Check last 1 hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

    const [total, failed] = await Promise.all([
      Payment.count({ where: { createdAt: { [Op.gte]: oneHourAgo } } }),
      Payment.count({
        where: {
          createdAt: { [Op.gte]: oneHourAgo },
          status: 'failed',
        },
      }),
    ]);

    if (total > 0) {
      const failureRate = failed / total;

      if (failureRate >= THRESHOLDS.PAYMENT_FAILURE_RATE) {
        await sendAlert(
          ALERT_LEVELS.CRITICAL,
          'High Payment Failure Rate',
          `Payment failure rate is ${(failureRate * 100).toFixed(1)}% in the last hour`,
          { total, failed, failureRate }
        );
      }
    }
  } catch (error) {
    logger.error('Error checking payment failure rate', { error: error.message });
  }
};

/**
 * Check CDR processing failure rate
 */
const checkCDRProcessingFailureRate = async () => {
  try {
    const { CDR } = require('../models');
    const { Op } = require('sequelize');

    // Check last 1 hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

    const [total, failed] = await Promise.all([
      CDR.count({ where: { createdAt: { [Op.gte]: oneHourAgo } } }),
      CDR.count({
        where: {
          createdAt: { [Op.gte]: oneHourAgo },
          processingStatus: 'failed',
        },
      }),
    ]);

    if (total > 0) {
      const failureRate = failed / total;

      if (failureRate >= THRESHOLDS.CDR_PROCESSING_FAILURE_RATE) {
        await sendAlert(
          ALERT_LEVELS.WARNING,
          'High CDR Processing Failure Rate',
          `CDR processing failure rate is ${(failureRate * 100).toFixed(1)}% in the last hour`,
          { total, failed, failureRate }
        );
      }
    }
  } catch (error) {
    logger.error('Error checking CDR processing failure rate', { error: error.message });
  }
};

/**
 * Check for overdue invoices
 */
const checkOverdueInvoices = async () => {
  try {
    const { Invoice } = require('../models');
    const { Op } = require('sequelize');

    const overdueCount = await Invoice.count({
      where: {
        status: 'overdue',
        dueDate: { [Op.lt]: new Date() },
      },
    });

    const criticallyOverdue = await Invoice.count({
      where: {
        status: 'overdue',
        dueDate: { [Op.lt]: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }, // 30 days overdue
      },
    });

    if (criticallyOverdue > 0) {
      await sendAlert(
        ALERT_LEVELS.CRITICAL,
        'Critically Overdue Invoices',
        `${criticallyOverdue} invoices are more than 30 days overdue`,
        { overdueCount, criticallyOverdue }
      );
    } else if (overdueCount > 50) {
      await sendAlert(
        ALERT_LEVELS.WARNING,
        'High Number of Overdue Invoices',
        `${overdueCount} invoices are currently overdue`,
        { overdueCount }
      );
    }
  } catch (error) {
    logger.error('Error checking overdue invoices', { error: error.message });
  }
};

/**
 * Check for low balance accounts
 */
const checkLowBalanceAccounts = async () => {
  try {
    const { Account } = require('../models');
    const { Op } = require('sequelize');

    const [lowBalance, criticalBalance] = await Promise.all([
      Account.count({
        where: {
          accountType: 'prepaid',
          balance: {
            [Op.lt]: THRESHOLDS.LOW_BALANCE_THRESHOLD,
            [Op.gte]: THRESHOLDS.CRITICAL_BALANCE_THRESHOLD,
          },
        },
      }),
      Account.count({
        where: {
          accountType: 'prepaid',
          balance: { [Op.lt]: THRESHOLDS.CRITICAL_BALANCE_THRESHOLD },
        },
      }),
    ]);

    if (criticalBalance > 10) {
      await sendAlert(
        ALERT_LEVELS.WARNING,
        'Multiple Critical Balance Accounts',
        `${criticalBalance} prepaid accounts have critical low balance (<₹${THRESHOLDS.CRITICAL_BALANCE_THRESHOLD})`,
        { lowBalance, criticalBalance }
      );
    }
  } catch (error) {
    logger.error('Error checking low balance accounts', { error: error.message });
  }
};

/**
 * Check system memory usage
 */
const checkMemoryUsage = () => {
  try {
    const memUsage = process.memoryUsage();
    const totalMemory = memUsage.heapTotal;
    const usedMemory = memUsage.heapUsed;
    const utilization = usedMemory / totalMemory;

    if (utilization >= THRESHOLDS.MEMORY_USAGE) {
      sendAlert(
        ALERT_LEVELS.CRITICAL,
        'High Memory Usage',
        `Memory usage is ${(utilization * 100).toFixed(1)}%`,
        {
          heapUsed: `${(usedMemory / 1024 / 1024).toFixed(2)} MB`,
          heapTotal: `${(totalMemory / 1024 / 1024).toFixed(2)} MB`,
          rss: `${(memUsage.rss / 1024 / 1024).toFixed(2)} MB`,
        }
      );
    }
  } catch (error) {
    logger.error('Error checking memory usage', { error: error.message });
  }
};

/**
 * Check for failed background jobs
 */
const checkFailedJobs = async (queue) => {
  try {
    const failedCount = await queue.getFailedCount();

    if (failedCount > 100) {
      await sendAlert(
        ALERT_LEVELS.WARNING,
        `High Failed Job Count: ${queue.name}`,
        `Queue "${queue.name}" has ${failedCount} failed jobs`,
        { queue: queue.name, failedCount }
      );
    }
  } catch (error) {
    logger.error('Error checking failed jobs', { error: error.message, queue: queue.name });
  }
};

/**
 * Check for stuck jobs
 */
const checkStuckJobs = async (queue) => {
  try {
    const stuckJobs = await queue.getActive();
    const now = Date.now();

    for (const job of stuckJobs) {
      const processingTime = now - job.processedOn;

      // If job has been processing for more than threshold
      if (processingTime > THRESHOLDS.JOB_PROCESSING_DELAY * 1000) {
        await sendAlert(
          ALERT_LEVELS.WARNING,
          'Stuck Job Detected',
          `Job ${job.name} (ID: ${job.id}) has been processing for ${(processingTime / 1000 / 60).toFixed(1)} minutes`,
          {
            queue: queue.name,
            jobId: job.id,
            jobName: job.name,
            processingTime: `${(processingTime / 1000).toFixed(0)}s`,
          }
        );
      }
    }
  } catch (error) {
    logger.error('Error checking stuck jobs', { error: error.message, queue: queue.name });
  }
};

/**
 * Run all health checks
 */
const runAllHealthChecks = async (sequelize, queues = []) => {
  try {
    logger.info('Running health checks...');

    await Promise.all([
      checkDatabasePoolUtilization(sequelize),
      checkPaymentFailureRate(),
      checkCDRProcessingFailureRate(),
      checkOverdueInvoices(),
      checkLowBalanceAccounts(),
      checkMemoryUsage(),
      ...queues.map((queue) => checkFailedJobs(queue)),
      ...queues.map((queue) => checkStuckJobs(queue)),
    ]);

    logger.info('Health checks completed');
  } catch (error) {
    logger.error('Error running health checks', { error: error.message });
  }
};

module.exports = {
  ALERT_LEVELS,
  ALERT_CHANNELS,
  THRESHOLDS,
  sendAlert,
  checkDatabasePoolUtilization,
  checkPaymentFailureRate,
  checkCDRProcessingFailureRate,
  checkOverdueInvoices,
  checkLowBalanceAccounts,
  checkMemoryUsage,
  checkFailedJobs,
  checkStuckJobs,
  runAllHealthChecks,
};
