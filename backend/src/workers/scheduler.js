/**
 * Job Scheduler
 * Schedule recurring background jobs
 */

require('dotenv').config();
const cron = require('node-cron');
const logger = require('../utils/logger');
const { addJob, cdrProcessingQueue, billingQueue, invoiceGenerationQueue, paymentRetryQueue, notificationsQueue, reportsQueue, cleanupQueue, backupQueue } = require('../config/queue');
const sequelize = require('../config/database');
const { runAllHealthChecks } = require('../services/alertingService');

logger.info('Job scheduler started');

/**
 * Schedule billing cycle processing
 * Runs daily at 2:00 AM
 */
cron.schedule('0 2 * * *', async () => {
  logger.info('Scheduled job: Processing billing cycle');
  try {
    await addJob('billing', 'processBillingCycle', {});
    logger.info('Billing cycle job scheduled successfully');
  } catch (error) {
    logger.error('Failed to schedule billing cycle job', { error: error.message });
  }
});

/**
 * Schedule overdue invoice reminders
 * Runs daily at 9:00 AM
 */
cron.schedule('0 9 * * *', async () => {
  logger.info('Scheduled job: Sending overdue invoice reminders');
  try {
    await addJob('invoiceGeneration', 'sendOverdueReminders', {});
    logger.info('Overdue reminders job scheduled successfully');
  } catch (error) {
    logger.error('Failed to schedule overdue reminders job', { error: error.message });
  }
});

/**
 * Schedule failed CDR retry
 * Runs every 6 hours
 */
cron.schedule('0 */6 * * *', async () => {
  logger.info('Scheduled job: Retrying failed CDRs');
  try {
    await addJob('cdrProcessing', 'retryFailedCDRs', {});
    logger.info('Failed CDRs retry job scheduled successfully');
  } catch (error) {
    logger.error('Failed to schedule CDR retry job', { error: error.message });
  }
});

/**
 * Schedule session cleanup
 * Runs daily at 3:00 AM
 */
cron.schedule('0 3 * * *', async () => {
  logger.info('Scheduled job: Cleaning up expired sessions');
  try {
    await addJob('cleanup', 'cleanupExpiredSessions', {});
    logger.info('Session cleanup job scheduled successfully');
  } catch (error) {
    logger.error('Failed to schedule session cleanup job', { error: error.message });
  }
});

/**
 * Schedule CDR cleanup
 * Runs monthly on the 1st at 4:00 AM
 */
cron.schedule('0 4 1 * *', async () => {
  logger.info('Scheduled job: Cleaning up old CDRs');
  try {
    await addJob('cleanup', 'cleanupOldCDRs', {
      retentionDays: 90, // Keep CDRs for 90 days
    });
    logger.info('CDR cleanup job scheduled successfully');
  } catch (error) {
    logger.error('Failed to schedule CDR cleanup job', { error: error.message });
  }
});

/**
 * Schedule database backup
 * Runs daily at 1:00 AM
 */
cron.schedule('0 1 * * *', async () => {
  logger.info('Scheduled job: Database backup');
  try {
    await addJob('backup', 'backupDatabase', {
      timestamp: new Date().toISOString(),
    });
    logger.info('Database backup job scheduled successfully');
  } catch (error) {
    logger.error('Failed to schedule database backup job', { error: error.message });
  }
});

/**
 * Schedule subscription renewals check
 * Runs every hour
 */
cron.schedule('0 * * * *', async () => {
  logger.info('Scheduled job: Checking subscription renewals');
  try {
    const subscriptionService = require('../services/subscriptionService');
    const subscriptions = await subscriptionService.getSubscriptionsDueForRenewal();

    logger.info(`Found ${subscriptions.length} subscriptions due for renewal`);

    for (const subscription of subscriptions) {
      await addJob('billing', 'processSubscriptionRenewal', {
        subscriptionId: subscription.id,
        amount: subscription.ratePlan.monthlyPrice,
      });
    }

    logger.info('Subscription renewal checks completed');
  } catch (error) {
    logger.error('Failed to process subscription renewals', { error: error.message });
  }
});

/**
 * Schedule monthly reports generation
 * Runs on the 1st of each month at 6:00 AM
 */
cron.schedule('0 6 1 * *', async () => {
  logger.info('Scheduled job: Generating monthly reports');
  try {
    const { Customer } = require('../models');
    const customers = await Customer.findAll({ where: { status: 'active' } });

    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    const month = lastMonth.getMonth() + 1;
    const year = lastMonth.getFullYear();

    for (const customer of customers) {
      await addJob('reports', 'generateMonthlyReport', {
        customerId: customer.id,
        month,
        year,
      });
    }

    logger.info(`Monthly report jobs scheduled for ${customers.length} customers`);
  } catch (error) {
    logger.error('Failed to schedule monthly reports', { error: error.message });
  }
});

/**
 * Health check - Log scheduler status every hour
 */
cron.schedule('0 * * * *', () => {
  logger.info('Job scheduler is running', {
    uptime: process.uptime(),
    memory: process.memoryUsage(),
  });
});

/**
 * Run alerting health checks every 15 minutes
 */
cron.schedule('*/15 * * * *', async () => {
  logger.info('Scheduled job: Running health checks');
  try {
    const queues = [
      cdrProcessingQueue,
      billingQueue,
      invoiceGenerationQueue,
      paymentRetryQueue,
      notificationsQueue,
      reportsQueue,
      cleanupQueue,
      backupQueue,
    ];
    await runAllHealthChecks(sequelize, queues);
    logger.info('Health checks completed successfully');
  } catch (error) {
    logger.error('Failed to run health checks', { error: error.message });
  }
});

logger.info('All cron jobs scheduled successfully');

/**
 * Graceful shutdown
 */
const gracefulShutdown = (signal) => {
  logger.info(`Scheduler: ${signal} received. Shutting down gracefully...`);
  
  // Stop all cron jobs
  cron.getTasks().forEach((task) => task.stop());
  
  logger.info('Scheduler: All cron jobs stopped');
  process.exit(0);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Scheduler: Uncaught Exception:', error);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Scheduler: Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});
