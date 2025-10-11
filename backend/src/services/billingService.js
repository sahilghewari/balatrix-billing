/**
 * Billing Service
 * Generate invoices and handle billing cycles
 */

const { sequelize } = require('../config/database');
const {
  Invoice,
  InvoiceLineItem,
  Customer,
  Subscription,
  SubscriptionUsage,
  RatePlan,
  CDR,
  Payment,
} = require('../models');
const { NotFoundError, BusinessLogicError } = require('../utils/errors');
const logger = require('../utils/logger');
const pricingService = require('./pricingService');
const {
  INVOICE_STATUS,
  TAX_RATES,
  SUBSCRIPTION_PLANS,
} = require('../utils/constants');
const { generateReferenceNumber, getBillingCycleDates } = require('../utils/helpers');
const { addJob } = require('../config/queue');
const { Op } = require('sequelize');

class BillingService {
  /**
   * Generate invoice for subscription
   */
  async generateSubscriptionInvoice(subscriptionId) {
    const transaction = await sequelize.transaction();

    try {
      // Get subscription with related data
      const subscription = await Subscription.findByPk(subscriptionId, {
        include: [
          { model: Customer, as: 'customer' },
          { model: RatePlan, as: 'ratePlan' },
          {
            model: SubscriptionUsage,
            as: 'usageRecords',
            where: {
              periodStart: subscription.currentPeriodStart,
              periodEnd: subscription.currentPeriodEnd,
            },
            required: false,
          },
        ],
        transaction,
      });

      if (!subscription) {
        throw new NotFoundError('Subscription not found');
      }

      const customer = subscription.customer;
      const ratePlan = subscription.ratePlan;
      const usage = subscription.usageRecords?.[0];

      // Calculate subscription cost
      const costBreakdown = pricingService.calculateSubscriptionCost({
        planType: ratePlan.planType,
        billingCycle: subscription.billingCycle,
        usedMinutes: usage?.minutesUsed || 0,
        tollFreeNumbers: usage?.tollFreeNumbers || 0,
        extensions: usage?.extensions || 0,
      });

      // Generate invoice number
      const invoiceNumber = await this.generateInvoiceNumber();

      // Determine if interstate transaction
      const isInterState = this.isInterStateTransaction(
        customer.billingAddress?.state,
        'Karnataka' // Your business state
      );

      // Calculate GST
      const gst = pricingService.calculateGST(
        costBreakdown.breakdown.subtotal,
        isInterState
      );

      // Create invoice
      const invoice = await Invoice.create(
        {
          customerId: customer.id,
          subscriptionId: subscription.id,
          invoiceNumber,
          invoiceDate: new Date(),
          dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // 15 days
          periodStart: subscription.currentPeriodStart,
          periodEnd: subscription.currentPeriodEnd,
          subtotal: costBreakdown.breakdown.subtotal,
          taxAmount: costBreakdown.breakdown.taxAmount,
          totalAmount: costBreakdown.breakdown.total,
          status: INVOICE_STATUS.DRAFT,
          currency: 'INR',
          cgst: gst.cgst,
          sgst: gst.sgst,
          igst: gst.igst,
          customerSnapshot: {
            companyName: customer.companyName,
            gstin: customer.gstin,
            billingAddress: customer.billingAddress,
          },
        },
        { transaction }
      );

      // Create line items
      const lineItems = [];

      // Base subscription
      lineItems.push({
        invoiceId: invoice.id,
        description: `${ratePlan.name} - ${subscription.billingCycle} subscription`,
        quantity: 1,
        unitPrice: costBreakdown.subscription.finalAmount,
        amount: costBreakdown.subscription.finalAmount,
        itemType: 'subscription',
      });

      // Minutes overage
      if (costBreakdown.usage.minutes.overage.overageAmount > 0) {
        lineItems.push({
          invoiceId: invoice.id,
          description: `Minutes overage (${costBreakdown.usage.minutes.overage.overageMinutes} minutes)`,
          quantity: costBreakdown.usage.minutes.overage.overageMinutes,
          unitPrice: ratePlan.overageRatePerMinute,
          amount: costBreakdown.usage.minutes.overage.overageAmount,
          itemType: 'overage',
        });
      }

      // Toll-free addon
      if (costBreakdown.addons.tollFreeNumbers) {
        lineItems.push({
          invoiceId: invoice.id,
          description: `Toll-free numbers (${costBreakdown.addons.tollFreeNumbers.quantity})`,
          quantity: costBreakdown.addons.tollFreeNumbers.quantity,
          unitPrice: costBreakdown.addons.tollFreeNumbers.unitPrice,
          amount: costBreakdown.addons.tollFreeNumbers.totalAmount,
          itemType: 'addon',
        });
      }

      // Extension addon
      if (costBreakdown.addons.extensions) {
        lineItems.push({
          invoiceId: invoice.id,
          description: `Extensions (${costBreakdown.addons.extensions.quantity})`,
          quantity: costBreakdown.addons.extensions.quantity,
          unitPrice: costBreakdown.addons.extensions.unitPrice,
          amount: costBreakdown.addons.extensions.totalAmount,
          itemType: 'addon',
        });
      }

      await InvoiceLineItem.bulkCreate(lineItems, { transaction });

      // Calculate totals (includes tax)
      await invoice.calculateTotals(transaction);

      // Mark as sent
      await invoice.markAsSent(transaction);

      await transaction.commit();

      logger.info('Invoice generated for subscription', {
        invoiceId: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        subscriptionId: subscription.id,
        customerId: customer.id,
        amount: invoice.totalAmount,
      });

      // Schedule payment collection
      await addJob('invoiceGeneration', 'collectInvoicePayment', {
        invoiceId: invoice.id,
      });

      return await this.getInvoiceById(invoice.id);
    } catch (error) {
      await transaction.rollback();
      logger.error('Failed to generate invoice', {
        subscriptionId,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Generate invoice for postpaid account (usage-based)
   */
  async generatePostpaidInvoice(accountId, periodStart, periodEnd) {
    const transaction = await sequelize.transaction();

    try {
      const { Account, Customer } = require('../models');

      const account = await Account.findByPk(accountId, {
        include: [
          { model: Customer, as: 'customer' },
          {
            model: Subscription,
            as: 'subscriptions',
            where: { status: 'active' },
            include: [{ model: RatePlan, as: 'ratePlan' }],
          },
        ],
        transaction,
      });

      if (!account) {
        throw new NotFoundError('Account not found');
      }

      if (account.accountType !== 'postpaid') {
        throw new BusinessLogicError('Account is not postpaid');
      }

      const customer = account.customer;
      const subscription = account.subscriptions?.[0];

      if (!subscription) {
        throw new NotFoundError('No active subscription found for account');
      }

      // Get CDRs for billing period
      const cdrs = await CDR.findAll({
        where: {
          accountId,
          callStartTime: {
            [Op.between]: [periodStart, periodEnd],
          },
          processingStatus: 'processed',
        },
        transaction,
      });

      // Calculate total usage cost
      const totalUsageCost = cdrs.reduce(
        (sum, cdr) => sum + (cdr.calculatedCost || 0),
        0
      );

      const invoiceNumber = await this.generateInvoiceNumber();

      // Determine GST type
      const isInterState = this.isInterStateTransaction(
        customer.billingAddress?.state,
        'Karnataka'
      );

      const gst = pricingService.calculateGST(totalUsageCost, isInterState);

      // Create invoice
      const invoice = await Invoice.create(
        {
          customerId: customer.id,
          subscriptionId: subscription.id,
          invoiceNumber,
          invoiceDate: new Date(),
          dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
          periodStart,
          periodEnd,
          subtotal: totalUsageCost,
          taxAmount: gst.total,
          totalAmount: totalUsageCost + gst.total,
          status: INVOICE_STATUS.DRAFT,
          currency: 'INR',
          cgst: gst.cgst,
          sgst: gst.sgst,
          igst: gst.igst,
          customerSnapshot: {
            companyName: customer.companyName,
            gstin: customer.gstin,
            billingAddress: customer.billingAddress,
          },
        },
        { transaction }
      );

      // Group CDRs by direction for line items
      const inboundCDRs = cdrs.filter((cdr) => cdr.direction === 'inbound');
      const outboundCDRs = cdrs.filter((cdr) => cdr.direction === 'outbound');

      const lineItems = [];

      if (inboundCDRs.length > 0) {
        const inboundCost = inboundCDRs.reduce(
          (sum, cdr) => sum + cdr.calculatedCost,
          0
        );
        const inboundMinutes = inboundCDRs.reduce(
          (sum, cdr) => sum + cdr.calculateBillableMinutes(),
          0
        );

        lineItems.push({
          invoiceId: invoice.id,
          description: `Inbound calls (${inboundCDRs.length} calls)`,
          quantity: inboundMinutes,
          unitPrice: inboundCost / inboundMinutes || 0,
          amount: inboundCost,
          itemType: 'usage',
        });
      }

      if (outboundCDRs.length > 0) {
        const outboundCost = outboundCDRs.reduce(
          (sum, cdr) => sum + cdr.calculatedCost,
          0
        );
        const outboundMinutes = outboundCDRs.reduce(
          (sum, cdr) => sum + cdr.calculateBillableMinutes(),
          0
        );

        lineItems.push({
          invoiceId: invoice.id,
          description: `Outbound calls (${outboundCDRs.length} calls)`,
          quantity: outboundMinutes,
          unitPrice: outboundCost / outboundMinutes || 0,
          amount: outboundCost,
          itemType: 'usage',
        });
      }

      if (lineItems.length > 0) {
        await InvoiceLineItem.bulkCreate(lineItems, { transaction });
      }

      await invoice.calculateTotals(transaction);
      await invoice.markAsSent(transaction);

      await transaction.commit();

      logger.info('Postpaid invoice generated', {
        invoiceId: invoice.id,
        accountId,
        totalCDRs: cdrs.length,
        amount: invoice.totalAmount,
      });

      return await this.getInvoiceById(invoice.id);
    } catch (error) {
      await transaction.rollback();
      logger.error('Failed to generate postpaid invoice', {
        accountId,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Get invoice by ID
   */
  async getInvoiceById(invoiceId) {
    const invoice = await Invoice.findByPk(invoiceId, {
      include: [
        { model: Customer, as: 'customer' },
        { model: Subscription, as: 'subscription' },
        { model: InvoiceLineItem, as: 'lineItems' },
        { model: Payment, as: 'payments' },
      ],
    });

    if (!invoice) {
      throw new NotFoundError('Invoice not found');
    }

    return invoice;
  }

  /**
   * Get all invoices with pagination
   */
  async getAllInvoices(options = {}) {
    const {
      page = 1,
      limit = 20,
      customerId,
      status,
      startDate,
      endDate,
      sortBy = 'invoiceDate',
      sortOrder = 'DESC',
    } = options;

    const offset = (page - 1) * limit;
    const where = {};

    if (customerId) {
      where.customerId = customerId;
    }

    if (status) {
      where.status = status;
    }

    if (startDate && endDate) {
      where.invoiceDate = {
        [Op.between]: [startDate, endDate],
      };
    }

    const { count, rows: invoices } = await Invoice.findAndCountAll({
      where,
      include: [
        {
          model: Customer,
          as: 'customer',
          attributes: ['id', 'companyName', 'displayName'],
        },
      ],
      limit,
      offset,
      order: [[sortBy, sortOrder]],
    });

    return {
      invoices,
      pagination: {
        total: count,
        page,
        limit,
        totalPages: Math.ceil(count / limit),
      },
    };
  }

  /**
   * Mark invoice as paid
   */
  async markInvoiceAsPaid(invoiceId, paymentId) {
    const transaction = await sequelize.transaction();

    try {
      const invoice = await Invoice.findByPk(invoiceId, { transaction });

      if (!invoice) {
        throw new NotFoundError('Invoice not found');
      }

      await invoice.markAsPaid(paymentId, transaction);

      await transaction.commit();

      logger.info('Invoice marked as paid', { invoiceId, paymentId });

      return await this.getInvoiceById(invoiceId);
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Mark invoice as void
   */
  async voidInvoice(invoiceId, reason) {
    const transaction = await sequelize.transaction();

    try {
      const invoice = await Invoice.findByPk(invoiceId, { transaction });

      if (!invoice) {
        throw new NotFoundError('Invoice not found');
      }

      if (invoice.status === INVOICE_STATUS.PAID) {
        throw new BusinessLogicError('Cannot void a paid invoice');
      }

      await invoice.markAsVoid(transaction);

      await transaction.commit();

      logger.info('Invoice voided', { invoiceId, reason });

      return await this.getInvoiceById(invoiceId);
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Get overdue invoices
   */
  async getOverdueInvoices() {
    const now = new Date();

    const invoices = await Invoice.findAll({
      where: {
        status: INVOICE_STATUS.SENT,
        dueDate: {
          [Op.lt]: now,
        },
      },
      include: [{ model: Customer, as: 'customer' }],
    });

    // Update status to overdue
    for (const invoice of invoices) {
      if (!invoice.isOverdue()) continue;

      invoice.status = INVOICE_STATUS.OVERDUE;
      await invoice.save();
    }

    return invoices;
  }

  /**
   * Send invoice reminder
   */
  async sendInvoiceReminder(invoiceId) {
    const invoice = await this.getInvoiceById(invoiceId);

    if (invoice.status === INVOICE_STATUS.PAID) {
      throw new BusinessLogicError('Invoice is already paid');
    }

    // TODO: Send email reminder
    logger.info('Invoice reminder sent', {
      invoiceId,
      customerId: invoice.customerId,
    });

    return { message: 'Invoice reminder sent successfully' };
  }

  /**
   * Generate invoice number
   */
  async generateInvoiceNumber() {
    const prefix = 'INV';
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, '0');

    // Get last invoice for current month
    const lastInvoice = await Invoice.findOne({
      where: {
        invoiceNumber: {
          [Op.like]: `${prefix}-${year}${month}%`,
        },
      },
      order: [['invoiceNumber', 'DESC']],
    });

    let sequence = 1;
    if (lastInvoice) {
      const lastSequence = parseInt(lastInvoice.invoiceNumber.split('-')[2]);
      sequence = lastSequence + 1;
    }

    return `${prefix}-${year}${month}-${String(sequence).padStart(4, '0')}`;
  }

  /**
   * Check if transaction is interstate
   */
  isInterStateTransaction(customerState, businessState) {
    if (!customerState || !businessState) {
      return false;
    }
    return customerState.toLowerCase() !== businessState.toLowerCase();
  }

  /**
   * Process billing cycle for all subscriptions
   */
  async processBillingCycle() {
    const now = new Date();

    // Get subscriptions due for billing
    const subscriptions = await Subscription.findAll({
      where: {
        status: 'active',
        nextBillingDate: {
          [Op.lte]: now,
        },
      },
      include: [{ model: Customer, as: 'customer' }],
    });

    logger.info(`Processing billing cycle for ${subscriptions.length} subscriptions`);

    const results = {
      success: [],
      failed: [],
    };

    for (const subscription of subscriptions) {
      try {
        await this.generateSubscriptionInvoice(subscription.id);
        results.success.push(subscription.id);
      } catch (error) {
        logger.error('Failed to generate invoice for subscription', {
          subscriptionId: subscription.id,
          error: error.message,
        });
        results.failed.push({
          subscriptionId: subscription.id,
          error: error.message,
        });
      }
    }

    logger.info('Billing cycle processing completed', {
      total: subscriptions.length,
      success: results.success.length,
      failed: results.failed.length,
    });

    return results;
  }

  /**
   * Get invoice statistics
   */
  async getInvoiceStatistics(options = {}) {
    const { customerId, startDate, endDate } = options;

    const where = {};

    if (customerId) {
      where.customerId = customerId;
    }

    if (startDate && endDate) {
      where.invoiceDate = {
        [Op.between]: [startDate, endDate],
      };
    }

    const stats = await Invoice.findAll({
      where,
      attributes: [
        [sequelize.fn('COUNT', sequelize.col('id')), 'totalInvoices'],
        [sequelize.fn('SUM', sequelize.col('total_amount')), 'totalAmount'],
        [
          sequelize.fn(
            'COUNT',
            sequelize.literal("CASE WHEN status = 'paid' THEN 1 END")
          ),
          'paidInvoices',
        ],
        [
          sequelize.fn(
            'SUM',
            sequelize.literal("CASE WHEN status = 'paid' THEN total_amount ELSE 0 END")
          ),
          'paidAmount',
        ],
        [
          sequelize.fn(
            'COUNT',
            sequelize.literal("CASE WHEN status = 'overdue' THEN 1 END")
          ),
          'overdueInvoices',
        ],
        [
          sequelize.fn(
            'SUM',
            sequelize.literal("CASE WHEN status = 'overdue' THEN total_amount ELSE 0 END")
          ),
          'overdueAmount',
        ],
      ],
      raw: true,
    });

    return stats[0] || {};
  }

  /**
   * Get customer invoices
   */
  async getCustomerInvoices(customerId, options = {}) {
    return await this.getAllInvoices({
      customerId,
      ...options,
    });
  }
}

module.exports = new BillingService();
