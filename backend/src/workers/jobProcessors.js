/**
 * Job Processors
 * Process background jobs using Bull queues
 */

const {
  cdrProcessingQueue,
  billingQueue,
  invoiceGenerationQueue,
  paymentRetryQueue,
  notificationsQueue,
  reportsQueue,
  cleanupQueue,
  backupQueue,
} = require('../config/queue');
const logger = require('../utils/logger');
const { trackJobProcessing, trackCDRProcessing, trackRevenue, trackPaymentSuccess, trackPaymentFailure, trackInvoiceGeneration } = require('../services/monitoringService');

// Services
const cdrProcessorService = require('../services/cdrProcessorService');
const billingService = require('../services/billingService');
const paymentService = require('../services/paymentService');
const subscriptionService = require('../services/subscriptionService');

/**
 * CDR Processing Queue Jobs
 */
cdrProcessingQueue.process('processCDR', async (job) => {
  const { cdrData } = job.data;
  const startTime = Date.now();
  logger.info('Processing CDR job', { jobId: job.id, uuid: cdrData.uuid });

  try {
    const cdr = await cdrProcessorService.processCDR(cdrData);
    const duration = (Date.now() - startTime) / 1000;
    trackCDRProcessing('success', cdrData.callType || 'unknown', duration);
    trackJobProcessing('cdrProcessing', 'processCDR', 'completed', duration);
    return { success: true, cdrId: cdr.id };
  } catch (error) {
    const duration = (Date.now() - startTime) / 1000;
    trackCDRProcessing('failed', cdrData.callType || 'unknown', duration);
    trackJobProcessing('cdrProcessing', 'processCDR', 'failed', duration);
    logger.error('CDR processing job failed', { jobId: job.id, error: error.message });
    throw error;
  }
});

cdrProcessingQueue.process('updateSubscriptionUsage', async (job) => {
  const { subscriptionId, minutes, callType = 'local' } = job.data;
  logger.info('Updating subscription usage', { jobId: job.id, subscriptionId, minutes, callType });

  try {
    const usageService = require('../services/usageService');
    const result = await usageService.addMinutesUsed(subscriptionId, minutes, callType);

    logger.info('Subscription usage updated successfully', {
      jobId: job.id,
      subscriptionId,
      result,
    });

    return { success: true, usage: result };
  } catch (error) {
    logger.error('Update subscription usage job failed', {
      jobId: job.id,
      error: error.message,
    });
    throw error;
  }
});

cdrProcessingQueue.process('retryFailedCDRs', async (job) => {
  logger.info('Retrying failed CDRs', { jobId: job.id });

  try {
    const failedCDRs = await cdrProcessorService.getFailedCDRs(50);
    const results = { success: 0, failed: 0 };

    for (const cdr of failedCDRs) {
      try {
        await cdrProcessorService.retryFailedCDR(cdr.id);
        results.success++;
      } catch (error) {
        results.failed++;
      }
    }

    logger.info('Failed CDRs retry completed', results);
    return results;
  } catch (error) {
    logger.error('Retry failed CDRs job failed', { jobId: job.id, error: error.message });
    throw error;
  }
});

/**
 * Billing Queue Jobs
 */
billingQueue.process('processSubscriptionPayment', async (job) => {
  const { subscriptionId, amount, billingCycle } = job.data;
  const startTime = Date.now();
  logger.info('Processing subscription payment', { jobId: job.id, subscriptionId });

  try {
    const subscription = await subscriptionService.getSubscriptionById(subscriptionId);

    // Create payment for subscription
    const paymentService = require('../services/paymentService');
    const payment = await paymentService.createPayment({
      customerId: subscription.customerId,
      subscriptionId: subscription.id,
      amount,
      description: `${subscription.ratePlan.name} - ${billingCycle} subscription`,
    });

    const duration = (Date.now() - startTime) / 1000;
    trackRevenue(amount, 'subscription');
    trackJobProcessing('billing', 'processSubscriptionPayment', 'completed', duration);
    return { success: true, paymentId: payment.payment.id };
  } catch (error) {
    const duration = (Date.now() - startTime) / 1000;
    trackJobProcessing('billing', 'processSubscriptionPayment', 'failed', duration);
    logger.error('Subscription payment job failed', {
      jobId: job.id,
      error: error.message,
    });
    throw error;
  }
});

billingQueue.process('processProrationCharge', async (job) => {
  const { subscriptionId, amount, description } = job.data;
  logger.info('Processing proration charge', { jobId: job.id, subscriptionId });

  try {
    const subscription = await subscriptionService.getSubscriptionById(subscriptionId);
    const paymentService = require('../services/paymentService');

    const payment = await paymentService.createPayment({
      customerId: subscription.customerId,
      subscriptionId: subscription.id,
      amount,
      description: description || 'Proration charge',
    });

    return { success: true, paymentId: payment.payment.id };
  } catch (error) {
    logger.error('Proration charge job failed', { jobId: job.id, error: error.message });
    throw error;
  }
});

billingQueue.process('processSubscriptionRenewal', async (job) => {
  const { subscriptionId, amount } = job.data;
  logger.info('Processing subscription renewal', { jobId: job.id, subscriptionId });

  try {
    const subscription = await subscriptionService.getSubscriptionById(subscriptionId);
    const paymentService = require('../services/paymentService');

    const payment = await paymentService.createPayment({
      customerId: subscription.customerId,
      subscriptionId: subscription.id,
      amount,
      description: `Subscription renewal - ${subscription.ratePlan.name}`,
    });

    return { success: true, paymentId: payment.payment.id };
  } catch (error) {
    logger.error('Subscription renewal job failed', {
      jobId: job.id,
      error: error.message,
    });
    throw error;
  }
});

billingQueue.process('processBillingCycle', async (job) => {
  logger.info('Processing billing cycle', { jobId: job.id });

  try {
    const results = await billingService.processBillingCycle();
    logger.info('Billing cycle processed', results);
    return results;
  } catch (error) {
    logger.error('Billing cycle job failed', { jobId: job.id, error: error.message });
    throw error;
  }
});

/**
 * Invoice Generation Queue Jobs
 */
invoiceGenerationQueue.process('generateSubscriptionInvoice', async (job) => {
  const { subscriptionId } = job.data;
  const startTime = Date.now();
  logger.info('Generating subscription invoice', { jobId: job.id, subscriptionId });

  try {
    const invoice = await billingService.generateSubscriptionInvoice(subscriptionId);
    const duration = (Date.now() - startTime) / 1000;
    trackInvoiceGeneration('subscription', invoice.status);
    trackJobProcessing('invoiceGeneration', 'generateSubscriptionInvoice', 'completed', duration);
    return { success: true, invoiceId: invoice.id };
  } catch (error) {
    const duration = (Date.now() - startTime) / 1000;
    trackJobProcessing('invoiceGeneration', 'generateSubscriptionInvoice', 'failed', duration);
    logger.error('Invoice generation job failed', {
      jobId: job.id,
      error: error.message,
    });
    throw error;
  }
});

invoiceGenerationQueue.process('generatePostpaidInvoice', async (job) => {
  const { accountId, periodStart, periodEnd } = job.data;
  const startTime = Date.now();
  logger.info('Generating postpaid invoice', { jobId: job.id, accountId });

  try {
    const invoice = await billingService.generatePostpaidInvoice(
      accountId,
      new Date(periodStart),
      new Date(periodEnd)
    );
    const duration = (Date.now() - startTime) / 1000;
    trackInvoiceGeneration('postpaid', invoice.status);
    trackJobProcessing('invoiceGeneration', 'generatePostpaidInvoice', 'completed', duration);
    return { success: true, invoiceId: invoice.id };
  } catch (error) {
    const duration = (Date.now() - startTime) / 1000;
    trackJobProcessing('invoiceGeneration', 'generatePostpaidInvoice', 'failed', duration);
    logger.error('Postpaid invoice generation job failed', {
      jobId: job.id,
      error: error.message,
    });
    throw error;
  }
});

invoiceGenerationQueue.process('collectInvoicePayment', async (job) => {
  const { invoiceId } = job.data;
  logger.info('Collecting invoice payment', { jobId: job.id, invoiceId });

  try {
    const invoice = await billingService.getInvoiceById(invoiceId);

    if (invoice.status === 'paid') {
      logger.info('Invoice already paid', { invoiceId });
      return { success: true, message: 'Invoice already paid' };
    }

    // Create payment for invoice
    const paymentService = require('../services/paymentService');
    const payment = await paymentService.createPayment({
      customerId: invoice.customerId,
      subscriptionId: invoice.subscriptionId,
      invoiceId: invoice.id,
      amount: invoice.totalAmount,
      description: `Payment for invoice ${invoice.invoiceNumber}`,
    });

    return { success: true, paymentId: payment.payment.id };
  } catch (error) {
    logger.error('Collect invoice payment job failed', {
      jobId: job.id,
      error: error.message,
    });
    throw error;
  }
});

invoiceGenerationQueue.process('sendOverdueReminders', async (job) => {
  logger.info('Sending overdue invoice reminders', { jobId: job.id });

  try {
    const overdueInvoices = await billingService.getOverdueInvoices();
    let sent = 0;

    for (const invoice of overdueInvoices) {
      try {
        await billingService.sendInvoiceReminder(invoice.id);
        sent++;
      } catch (error) {
        logger.error('Failed to send reminder', {
          invoiceId: invoice.id,
          error: error.message,
        });
      }
    }

    logger.info('Overdue reminders sent', { total: overdueInvoices.length, sent });
    return { success: true, total: overdueInvoices.length, sent };
  } catch (error) {
    logger.error('Send overdue reminders job failed', {
      jobId: job.id,
      error: error.message,
    });
    throw error;
  }
});

/**
 * Payment Retry Queue Jobs
 */
paymentRetryQueue.process('retryFailedPayment', async (job) => {
  const { paymentId } = job.data;
  logger.info('Retrying failed payment', { jobId: job.id, paymentId });

  try {
    const result = await paymentService.retryPayment(paymentId);
    return { success: true, result };
  } catch (error) {
    logger.error('Payment retry job failed', { jobId: job.id, error: error.message });
    throw error;
  }
});

/**
 * Notifications Queue Jobs
 */
notificationsQueue.process('sendEmail', async (job) => {
  const { to, subject, template, data } = job.data;
  logger.info('Sending email', { jobId: job.id, to, subject });

  try {
    // TODO: Implement email sending
    // await emailService.sendEmail({ to, subject, template, data });
    logger.info('Email sent successfully', { to, subject });
    return { success: true };
  } catch (error) {
    logger.error('Send email job failed', { jobId: job.id, error: error.message });
    throw error;
  }
});

notificationsQueue.process('sendSMS', async (job) => {
  const { to, message } = job.data;
  logger.info('Sending SMS', { jobId: job.id, to });

  try {
    // TODO: Implement SMS sending
    // await smsService.sendSMS({ to, message });
    logger.info('SMS sent successfully', { to });
    return { success: true };
  } catch (error) {
    logger.error('Send SMS job failed', { jobId: job.id, error: error.message });
    throw error;
  }
});

notificationsQueue.process('sendWebhook', async (job) => {
  const { url, payload } = job.data;
  logger.info('Sending webhook', { jobId: job.id, url });

  try {
    // TODO: Implement webhook sending
    // await webhookService.send({ url, payload });
    logger.info('Webhook sent successfully', { url });
    return { success: true };
  } catch (error) {
    logger.error('Send webhook job failed', { jobId: job.id, error: error.message });
    throw error;
  }
});

/**
 * Reports Queue Jobs
 */
reportsQueue.process('generateMonthlyReport', async (job) => {
  const { customerId, month, year } = job.data;
  logger.info('Generating monthly report', { jobId: job.id, customerId, month, year });

  try {
    // TODO: Implement report generation
    logger.info('Monthly report generated', { customerId, month, year });
    return { success: true };
  } catch (error) {
    logger.error('Generate monthly report job failed', {
      jobId: job.id,
      error: error.message,
    });
    throw error;
  }
});

reportsQueue.process('generateUsageReport', async (job) => {
  const { accountId, startDate, endDate } = job.data;
  logger.info('Generating usage report', { jobId: job.id, accountId });

  try {
    // TODO: Implement usage report generation
    logger.info('Usage report generated', { accountId });
    return { success: true };
  } catch (error) {
    logger.error('Generate usage report job failed', {
      jobId: job.id,
      error: error.message,
    });
    throw error;
  }
});

/**
 * Cleanup Queue Jobs
 */
cleanupQueue.process('cleanupOldCDRs', async (job) => {
  const { retentionDays = 90 } = job.data;
  logger.info('Cleaning up old CDRs', { jobId: job.id, retentionDays });

  try {
    const { CDR } = require('../models');
    const { Op } = require('sequelize');

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    const deleted = await CDR.destroy({
      where: {
        callStartTime: {
          [Op.lt]: cutoffDate,
        },
      },
    });

    logger.info('Old CDRs cleaned up', { deleted, retentionDays });
    return { success: true, deleted };
  } catch (error) {
    logger.error('Cleanup old CDRs job failed', { jobId: job.id, error: error.message });
    throw error;
  }
});

cleanupQueue.process('cleanupExpiredSessions', async (job) => {
  logger.info('Cleaning up expired sessions', { jobId: job.id });

  try {
    const { RefreshToken } = require('../models');
    const { Op } = require('sequelize');

    const deleted = await RefreshToken.destroy({
      where: {
        expiresAt: {
          [Op.lt]: new Date(),
        },
      },
    });

    logger.info('Expired sessions cleaned up', { deleted });
    return { success: true, deleted };
  } catch (error) {
    logger.error('Cleanup expired sessions job failed', {
      jobId: job.id,
      error: error.message,
    });
    throw error;
  }
});

/**
 * Backup Queue Jobs
 */
backupQueue.process('backupDatabase', async (job) => {
  logger.info('Starting database backup', { jobId: job.id });

  try {
    // TODO: Implement database backup
    logger.info('Database backup completed');
    return { success: true };
  } catch (error) {
    logger.error('Database backup job failed', { jobId: job.id, error: error.message });
    throw error;
  }
});

/**
 * Global job event handlers
 */
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

queues.forEach((queue) => {
  queue.on('completed', (job, result) => {
    logger.info(`Job completed: ${job.queue.name}:${job.id}`, { result });
  });

  queue.on('failed', (job, err) => {
    logger.error(`Job failed: ${job.queue.name}:${job.id}`, { error: err.message });
  });

  queue.on('stalled', (job) => {
    logger.warn(`Job stalled: ${job.queue.name}:${job.id}`);
  });
});

logger.info('Job processors initialized');

module.exports = {
  cdrProcessingQueue,
  billingQueue,
  invoiceGenerationQueue,
  paymentRetryQueue,
  notificationsQueue,
  reportsQueue,
  cleanupQueue,
  backupQueue,
};
