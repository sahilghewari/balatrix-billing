/**
 * Payment Service
 * Business logic for payment processing with Razorpay and Stripe
 */

const { sequelize } = require('../config/database');
const {
  Payment,
  PaymentMethod,
  Customer,
  Subscription,
  Invoice,
  Account,
} = require('../models');
const razorpayService = require('../config/razorpay');
const stripeService = require('../config/stripe');
const {
  NotFoundError,
  PaymentError,
  ValidationError,
} = require('../utils/errors');
const logger = require('../utils/logger');
const { PAYMENT_STATUS, PAYMENT_GATEWAY } = require('../utils/constants');
const { generateReferenceNumber } = require('../utils/helpers');
const { addJob } = require('../config/queue');
const { Op } = require('sequelize');

class PaymentService {
  /**
   * Create a new payment
   */
  async createPayment(paymentData) {
    const transaction = await sequelize.transaction();

    try {
      const {
        customerId,
        amount,
        currency = 'INR',
        gateway,
        paymentMethodId,
        subscriptionId,
        invoiceId,
        description,
      } = paymentData;

      // Validate customer
      const customer = await Customer.findByPk(customerId, { transaction });
      if (!customer) {
        throw new NotFoundError('Customer not found');
      }

      // Determine gateway to use
      const paymentGateway =
        gateway || customer.preferredPaymentGateway || PAYMENT_GATEWAY.RAZORPAY;

      // Generate reference number
      const referenceNumber = generateReferenceNumber('PAY');

      // Create payment record
      const payment = await Payment.create(
        {
          customerId,
          subscriptionId,
          invoiceId,
          amount,
          currency,
          gateway: paymentGateway,
          status: PAYMENT_STATUS.PENDING,
          referenceNumber,
          paymentMethodId,
          description,
          retryCount: 0,
        },
        { transaction }
      );

      await transaction.commit();

      logger.info('Payment created', {
        paymentId: payment.id,
        customerId,
        amount,
        gateway: paymentGateway,
        referenceNumber,
      });

      // Initiate payment with gateway
      const paymentIntent = await this.initiatePayment(payment.id, paymentGateway);

      return {
        payment,
        paymentIntent,
      };
    } catch (error) {
      await transaction.rollback();
      logger.error('Failed to create payment', { error: error.message });
      throw error;
    }
  }

  /**
   * Initiate payment with gateway
   */
  async initiatePayment(paymentId, gateway) {
    const payment = await Payment.findByPk(paymentId, {
      include: [{ model: Customer, as: 'customer' }],
    });

    if (!payment) {
      throw new NotFoundError('Payment not found');
    }

    try {
      let paymentIntent;

      if (gateway === PAYMENT_GATEWAY.RAZORPAY) {
        // Create Razorpay order
        const order = await razorpayService.createOrder({
          amount: payment.amount * 100, // Convert to paise
          currency: payment.currency,
          receipt: payment.referenceNumber,
          notes: {
            paymentId: payment.id,
            customerId: payment.customerId,
          },
        });

        payment.gatewayOrderId = order.id;
        await payment.save();

        paymentIntent = {
          orderId: order.id,
          amount: order.amount,
          currency: order.currency,
          gateway: PAYMENT_GATEWAY.RAZORPAY,
        };
      } else if (gateway === PAYMENT_GATEWAY.STRIPE) {
        // Create Stripe payment intent
        const intent = await stripeService.createPaymentIntent({
          amount: payment.amount * 100, // Convert to paise/cents
          currency: payment.currency.toLowerCase(),
          customer: payment.customer.stripeCustomerId,
          metadata: {
            paymentId: payment.id,
            customerId: payment.customerId,
          },
          description: payment.description,
        });

        payment.gatewayPaymentId = intent.id;
        await payment.save();

        paymentIntent = {
          clientSecret: intent.client_secret,
          paymentIntentId: intent.id,
          amount: intent.amount,
          currency: intent.currency,
          gateway: PAYMENT_GATEWAY.STRIPE,
        };
      }

      logger.info('Payment initiated with gateway', {
        paymentId: payment.id,
        gateway,
        gatewayOrderId: payment.gatewayOrderId,
      });

      return paymentIntent;
    } catch (error) {
      logger.error('Failed to initiate payment with gateway', {
        paymentId,
        gateway,
        error: error.message,
      });
      throw new PaymentError(`Failed to initiate payment: ${error.message}`);
    }
  }

  /**
   * Verify and confirm payment
   */
  async verifyPayment(paymentId, verificationData) {
    const transaction = await sequelize.transaction();

    try {
      const payment = await Payment.findByPk(paymentId, {
        include: [
          { model: Customer, as: 'customer' },
          { model: Account, as: 'account', required: false },
        ],
        transaction,
      });

      if (!payment) {
        throw new NotFoundError('Payment not found');
      }

      let isValid = false;

      if (payment.gateway === PAYMENT_GATEWAY.RAZORPAY) {
        // Verify Razorpay payment signature
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
          verificationData;

        isValid = razorpayService.verifyPaymentSignature({
          order_id: razorpay_order_id,
          payment_id: razorpay_payment_id,
          signature: razorpay_signature,
        });

        if (isValid) {
          payment.gatewayPaymentId = razorpay_payment_id;
        }
      } else if (payment.gateway === PAYMENT_GATEWAY.STRIPE) {
        // Verify Stripe payment intent
        const paymentIntent = await stripeService.retrievePaymentIntent(
          payment.gatewayPaymentId
        );

        isValid = paymentIntent.status === 'succeeded';
      }

      if (isValid) {
        await payment.markSuccess(transaction);

        // Update invoice if associated
        if (payment.invoiceId) {
          const invoice = await Invoice.findByPk(payment.invoiceId, { transaction });
          if (invoice) {
            await invoice.markAsPaid(payment.id, transaction);
          }
        }

        // Credit account balance if prepaid
        if (payment.account && payment.account.accountType === 'prepaid') {
          await payment.account.addBalance(payment.amount, transaction);
          logger.info('Account balance credited', {
            accountId: payment.account.id,
            amount: payment.amount,
            paymentId: payment.id,
          });
        }

        await transaction.commit();

        logger.info('Payment verified and confirmed', {
          paymentId: payment.id,
          amount: payment.amount,
          gateway: payment.gateway,
        });

        return payment;
      } else {
        await payment.markFailed('Payment verification failed', transaction);
        await transaction.commit();

        throw new PaymentError('Payment verification failed');
      }
    } catch (error) {
      await transaction.rollback();
      logger.error('Payment verification failed', {
        paymentId,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Process webhook from payment gateway
   */
  async processWebhook(gateway, payload, signature) {
    try {
      let event;

      if (gateway === PAYMENT_GATEWAY.RAZORPAY) {
        // Verify Razorpay webhook signature
        const isValid = razorpayService.verifyWebhookSignature(payload, signature);
        if (!isValid) {
          throw new PaymentError('Invalid webhook signature');
        }

        event = JSON.parse(payload);
      } else if (gateway === PAYMENT_GATEWAY.STRIPE) {
        // Verify Stripe webhook signature
        event = stripeService.constructWebhookEvent(payload, signature);
      }

      // Process event based on type
      await this.handleWebhookEvent(gateway, event);

      logger.info('Webhook processed successfully', {
        gateway,
        eventType: event.event || event.type,
      });

      return { received: true };
    } catch (error) {
      logger.error('Webhook processing failed', {
        gateway,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Handle webhook event
   */
  async handleWebhookEvent(gateway, event) {
    const eventType = event.event || event.type;

    logger.info('Processing webhook event', { gateway, eventType });

    if (gateway === PAYMENT_GATEWAY.RAZORPAY) {
      switch (eventType) {
        case 'payment.captured':
          await this.handlePaymentCaptured(event.payload.payment.entity);
          break;
        case 'payment.failed':
          await this.handlePaymentFailed(event.payload.payment.entity);
          break;
        case 'subscription.charged':
          await this.handleSubscriptionCharged(event.payload.subscription.entity);
          break;
        // Add more event handlers as needed
      }
    } else if (gateway === PAYMENT_GATEWAY.STRIPE) {
      switch (eventType) {
        case 'payment_intent.succeeded':
          await this.handlePaymentCaptured(event.data.object);
          break;
        case 'payment_intent.payment_failed':
          await this.handlePaymentFailed(event.data.object);
          break;
        // Add more event handlers as needed
      }
    }
  }

  /**
   * Handle payment captured event
   */
  async handlePaymentCaptured(paymentData) {
    const payment = await Payment.findOne({
      where: {
        [Op.or]: [
          { gatewayPaymentId: paymentData.id },
          { gatewayOrderId: paymentData.order_id },
        ],
      },
    });

    if (payment && payment.status !== PAYMENT_STATUS.SUCCESS) {
      const transaction = await sequelize.transaction();
      try {
        await payment.markSuccess(transaction);
        await transaction.commit();
        logger.info('Payment marked as successful from webhook', {
          paymentId: payment.id,
        });
      } catch (error) {
        await transaction.rollback();
        throw error;
      }
    }
  }

  /**
   * Handle payment failed event
   */
  async handlePaymentFailed(paymentData) {
    const payment = await Payment.findOne({
      where: {
        [Op.or]: [
          { gatewayPaymentId: paymentData.id },
          { gatewayOrderId: paymentData.order_id },
        ],
      },
    });

    if (payment && payment.status === PAYMENT_STATUS.PENDING) {
      const transaction = await sequelize.transaction();
      try {
        await payment.markFailed(
          paymentData.error_description || 'Payment failed',
          transaction
        );
        await transaction.commit();

        // Schedule retry if eligible
        if (payment.retryCount < 3) {
          await this.schedulePaymentRetry(payment.id);
        }

        logger.warn('Payment marked as failed from webhook', {
          paymentId: payment.id,
          reason: paymentData.error_description,
        });
      } catch (error) {
        await transaction.rollback();
        throw error;
      }
    }
  }

  /**
   * Handle subscription charged event
   */
  async handleSubscriptionCharged(subscriptionData) {
    // TODO: Handle subscription recurring payment
    logger.info('Subscription charged event received', {
      subscriptionId: subscriptionData.id,
    });
  }

  /**
   * Retry failed payment
   */
  async retryPayment(paymentId) {
    const payment = await Payment.findByPk(paymentId);

    if (!payment) {
      throw new NotFoundError('Payment not found');
    }

    if (payment.status === PAYMENT_STATUS.SUCCESS) {
      throw new ValidationError('Payment already successful');
    }

    if (payment.retryCount >= 3) {
      throw new ValidationError('Maximum retry attempts exceeded');
    }

    // Increment retry count
    payment.retryCount += 1;
    await payment.save();

    logger.info('Retrying payment', {
      paymentId,
      retryCount: payment.retryCount,
    });

    // Initiate payment again
    return await this.initiatePayment(paymentId, payment.gateway);
  }

  /**
   * Schedule payment retry
   */
  async schedulePaymentRetry(paymentId) {
    const payment = await Payment.findByPk(paymentId);

    if (!payment) {
      throw new NotFoundError('Payment not found');
    }

    await payment.scheduleRetry();

    // Add to retry queue with delay
    const delayMinutes = Math.pow(2, payment.retryCount) * 60; // Exponential backoff
    await addJob(
      'paymentRetry',
      'retryFailedPayment',
      { paymentId },
      {
        delay: delayMinutes * 60 * 1000, // Convert to milliseconds
      }
    );

    logger.info('Payment retry scheduled', {
      paymentId,
      retryCount: payment.retryCount,
      delayMinutes,
    });
  }

  /**
   * Refund payment
   */
  async refundPayment(paymentId, amount = null, reason = null) {
    const transaction = await sequelize.transaction();

    try {
      const payment = await Payment.findByPk(paymentId, { transaction });

      if (!payment) {
        throw new NotFoundError('Payment not found');
      }

      if (payment.status !== PAYMENT_STATUS.SUCCESS) {
        throw new ValidationError('Can only refund successful payments');
      }

      const refundAmount = amount || payment.amount;

      if (refundAmount > payment.amount) {
        throw new ValidationError('Refund amount cannot exceed payment amount');
      }

      // Process refund with gateway
      let refund;

      if (payment.gateway === PAYMENT_GATEWAY.RAZORPAY) {
        refund = await razorpayService.refundPayment(
          payment.gatewayPaymentId,
          refundAmount * 100 // Convert to paise
        );
      } else if (payment.gateway === PAYMENT_GATEWAY.STRIPE) {
        refund = await stripeService.refundPayment(
          payment.gatewayPaymentId,
          refundAmount * 100 // Convert to cents
        );
      }

      // Update payment record
      await payment.markRefunded(refundAmount, refund.id, transaction);

      await transaction.commit();

      logger.info('Payment refunded', {
        paymentId,
        refundAmount,
        refundId: refund.id,
        reason,
      });

      return payment;
    } catch (error) {
      await transaction.rollback();
      logger.error('Refund failed', { paymentId, error: error.message });
      throw error;
    }
  }

  /**
   * Get payment by ID
   */
  async getPaymentById(paymentId) {
    const payment = await Payment.findByPk(paymentId, {
      include: [
        { model: Customer, as: 'customer' },
        { model: Subscription, as: 'subscription' },
        { model: Invoice, as: 'invoice' },
      ],
    });

    if (!payment) {
      throw new NotFoundError('Payment not found');
    }

    return payment;
  }

  /**
   * Get all payments with pagination
   */
  async getAllPayments(options = {}) {
    const {
      page = 1,
      limit = 20,
      status,
      customerId,
      gateway,
      startDate,
      endDate,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
    } = options;

    const offset = (page - 1) * limit;
    const where = {};

    if (status) {
      where.status = status;
    }

    if (customerId) {
      where.customerId = customerId;
    }

    if (gateway) {
      where.gateway = gateway;
    }

    if (startDate && endDate) {
      where.createdAt = {
        [Op.between]: [startDate, endDate],
      };
    }

    const { count, rows: payments } = await Payment.findAndCountAll({
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
      payments,
      pagination: {
        total: count,
        page,
        limit,
        totalPages: Math.ceil(count / limit),
      },
    };
  }

  /**
   * Get customer payment history
   */
  async getCustomerPayments(customerId, options = {}) {
    const { page = 1, limit = 20 } = options;

    return await this.getAllPayments({
      customerId,
      page,
      limit,
    });
  }

  /**
   * Get payment statistics
   */
  async getPaymentStatistics(options = {}) {
    const { startDate, endDate, customerId } = options;

    const where = {};

    if (customerId) {
      where.customerId = customerId;
    }

    if (startDate && endDate) {
      where.createdAt = {
        [Op.between]: [startDate, endDate],
      };
    }

    const stats = await Payment.findAll({
      where,
      attributes: [
        [sequelize.fn('COUNT', sequelize.col('id')), 'totalPayments'],
        [sequelize.fn('SUM', sequelize.col('amount')), 'totalAmount'],
        [
          sequelize.fn(
            'COUNT',
            sequelize.literal("CASE WHEN status = 'success' THEN 1 END")
          ),
          'successfulPayments',
        ],
        [
          sequelize.fn(
            'SUM',
            sequelize.literal("CASE WHEN status = 'success' THEN amount ELSE 0 END")
          ),
          'successfulAmount',
        ],
        [
          sequelize.fn(
            'COUNT',
            sequelize.literal("CASE WHEN status = 'failed' THEN 1 END")
          ),
          'failedPayments',
        ],
        [sequelize.literal('gateway'), 'gateway'],
      ],
      group: ['gateway'],
      raw: true,
    });

    return stats;
  }

  /**
   * Save payment method
   */
  async savePaymentMethod(customerId, paymentMethodData) {
    const customer = await Customer.findByPk(customerId);

    if (!customer) {
      throw new NotFoundError('Customer not found');
    }

    const paymentMethod = await PaymentMethod.create({
      customerId,
      ...paymentMethodData,
    });

    logger.info('Payment method saved', {
      customerId,
      paymentMethodId: paymentMethod.id,
      type: paymentMethod.type,
    });

    return paymentMethod;
  }

  /**
   * Get customer payment methods
   */
  async getCustomerPaymentMethods(customerId) {
    const paymentMethods = await PaymentMethod.findAll({
      where: { customerId, isActive: true },
      order: [['isDefault', 'DESC'], ['createdAt', 'DESC']],
    });

    return paymentMethods;
  }

  /**
   * Delete payment method
   */
  async deletePaymentMethod(paymentMethodId, customerId) {
    const paymentMethod = await PaymentMethod.findOne({
      where: { id: paymentMethodId, customerId },
    });

    if (!paymentMethod) {
      throw new NotFoundError('Payment method not found');
    }

    paymentMethod.isActive = false;
    await paymentMethod.save();

    logger.info('Payment method deleted', {
      paymentMethodId,
      customerId,
    });

    return { message: 'Payment method deleted successfully' };
  }
}

module.exports = new PaymentService();
