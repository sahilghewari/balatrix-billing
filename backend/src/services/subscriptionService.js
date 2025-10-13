/**
 * Subscription Service
 * Business logic for subscription management
 */

const { sequelize } = require('../config/database');
const {
  Subscription,
  SubscriptionUsage,
  RatePlan,
  Customer,
  Account,
  Payment,
} = require('../models');
const {
  NotFoundError,
  ValidationError,
  BusinessLogicError,
} = require('../utils/errors');
const logger = require('../utils/logger');
const pricingService = require('./pricingService');
const {
  SUBSCRIPTION_STATUS,
  BILLING_CYCLE,
  SUBSCRIPTION_PLANS,
} = require('../utils/constants');
const { getBillingCycleDates } = require('../utils/helpers');
const { addJob } = require('../config/queue');
const { Op } = require('sequelize');

class SubscriptionService {
  /**
   * Create a new subscription
   */
  async createSubscription(subscriptionData) {
    const transaction = await sequelize.transaction();

    try {
      const { customerId, ratePlanId, billingCycle, autoRenew, trialDays } =
        subscriptionData;

      // Validate customer
      const customer = await Customer.findByPk(customerId);
      if (!customer) {
        throw new NotFoundError('Customer not found');
      }

      if (!customer.isActive()) {
        throw new BusinessLogicError('Customer account is not active');
      }

      // Validate rate plan
      const ratePlan = await RatePlan.findByPk(ratePlanId);
      if (!ratePlan) {
        throw new NotFoundError('Rate plan not found');
      }

      if (!ratePlan.isActive) {
        throw new BusinessLogicError('Rate plan is not active');
      }

      // Get customer's account
      const account = await Account.findOne({
        where: { customerId, status: 'active' },
        transaction,
      });

      if (!account) {
        throw new NotFoundError('No active account found for customer');
      }

      // Calculate billing dates
      const startDate = new Date();
      const { startDate: billingStart, endDate: billingEnd } =
        getBillingCycleDates(startDate, billingCycle);

      // Calculate next billing date
      let nextBillingDate = new Date(billingEnd);
      nextBillingDate.setDate(nextBillingDate.getDate() + 1);

      // If trial period, adjust next billing date
      if (trialDays && trialDays > 0) {
        nextBillingDate = new Date(startDate);
        nextBillingDate.setDate(nextBillingDate.getDate() + trialDays);
      }

      // Calculate subscription amount
      const pricing = pricingService.getSubscriptionPrice(
        ratePlan.planType,
        billingCycle
      );

      // Create subscription
      const subscription = await Subscription.create(
        {
          customerId,
          accountId: account.id,
          ratePlanId,
          status: SUBSCRIPTION_STATUS.ACTIVE,
          billingCycle,
          currentPeriodStart: billingStart,
          currentPeriodEnd: billingEnd,
          nextBillingDate,
          autoRenew: autoRenew !== undefined ? autoRenew : true,
          trialEnd: trialDays ? nextBillingDate : null,
        },
        { transaction }
      );

      // Create initial usage record
      const planFeatures = ratePlan.features || {};
      const planLimits = ratePlan.limits || {};
      
      await SubscriptionUsage.create(
        {
          subscriptionId: subscription.id,
          billingPeriodStart: billingStart,
          billingPeriodEnd: billingEnd,
          minutesIncluded: planLimits.monthlyMinuteAllowance || planFeatures.freeMinutes || 0,
          minutesUsed: 0,
          minutesOverage: 0,
          overageCost: 0,
          localCalls: 0,
          stdCalls: 0,
          isdCalls: 0,
          mobileCalls: 0,
          metadata: {
            perMinuteRate: planFeatures.perMinuteCharge || 0,
          },
        },
        { transaction }
      );

      await transaction.commit();

      logger.info('Subscription created', {
        subscriptionId: subscription.id,
        customerId,
        ratePlanId,
        billingCycle,
        amount: pricing.finalAmount,
      });

      // Schedule initial payment (if not trial)
      if (!trialDays || trialDays === 0) {
        await addJob('billing', 'processSubscriptionPayment', {
          subscriptionId: subscription.id,
          amount: pricing.finalAmount,
          billingCycle,
        });
      }

      return await this.getSubscriptionById(subscription.id);
    } catch (error) {
      await transaction.rollback();
      logger.error('Failed to create subscription', { error: error.message });
      throw error;
    }
  }

  /**
   * Get subscription by ID
   */
  async getSubscriptionById(subscriptionId) {
    const subscription = await Subscription.findByPk(subscriptionId, {
      include: [
        {
          model: Customer,
          as: 'customer',
        },
        {
          model: RatePlan,
          as: 'plan',
        },
        {
          model: Account,
          as: 'account',
        },
        {
          model: SubscriptionUsage,
          as: 'usageRecords',
          order: [['billingPeriodStart', 'DESC']],
          limit: 1,
        },
      ],
    });

    if (!subscription) {
      throw new NotFoundError('Subscription not found');
    }

    return subscription;
  }

  /**
   * Get all subscriptions with pagination
   */
  async getAllSubscriptions(options = {}) {
    const {
      page = 1,
      limit = 20,
      status,
      customerId,
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

    const { count, rows: subscriptions } = await Subscription.findAndCountAll({
      where,
      include: [
        {
          model: Customer,
          as: 'customer',
          attributes: ['id', 'companyName', 'displayName'],
        },
        {
          model: RatePlan,
          as: 'plan',
        },
      ],
      limit,
      offset,
      order: [[sortBy, sortOrder]],
    });

    return {
      subscriptions,
      pagination: {
        total: count,
        page,
        limit,
        totalPages: Math.ceil(count / limit),
      },
    };
  }

  /**
   * Update subscription
   */
  async updateSubscription(subscriptionId, updateData) {
    const subscription = await Subscription.findByPk(subscriptionId);

    if (!subscription) {
      throw new NotFoundError('Subscription not found');
    }

    // Validate status transitions
    if (updateData.status && updateData.status !== subscription.status) {
      this.validateStatusTransition(subscription.status, updateData.status);
    }

    await subscription.update(updateData);

    logger.info('Subscription updated', {
      subscriptionId,
      updatedFields: Object.keys(updateData),
    });

    return await this.getSubscriptionById(subscriptionId);
  }

  /**
   * Change subscription plan
   */
  async changeSubscriptionPlan(subscriptionId, newRatePlanId, effective = 'now') {
    const transaction = await sequelize.transaction();

    try {
      const subscription = await Subscription.findByPk(subscriptionId, {
        include: [
          { model: RatePlan, as: 'plan' },
          { model: Account, as: 'account' },
        ],
        transaction,
      });

      if (!subscription) {
        throw new NotFoundError('Subscription not found');
      }

      if (subscription.status !== SUBSCRIPTION_STATUS.ACTIVE) {
        throw new BusinessLogicError(
          'Can only change plan for active subscriptions'
        );
      }

      const newRatePlan = await RatePlan.findByPk(newRatePlanId, { transaction });
      if (!newRatePlan) {
        throw new NotFoundError('New rate plan not found');
      }

      const oldPlan = subscription.plan;

      if (effective === 'now') {
        // Calculate prorated amount
        const currentDate = new Date();
        const totalDays = Math.ceil(
          (subscription.currentPeriodEnd - subscription.currentPeriodStart) /
            (1000 * 60 * 60 * 24)
        );
        const daysRemaining = Math.ceil(
          (subscription.currentPeriodEnd - currentDate) / (1000 * 60 * 60 * 24)
        );

        const oldPlanPricing = pricingService.getSubscriptionPrice(
          oldPlan.planType,
          subscription.billingCycle
        );
        const newPlanPricing = pricingService.getSubscriptionPrice(
          newRatePlan.planType,
          subscription.billingCycle
        );

        const prorated = pricingService.calculateProratedAmount({
          currentPlanAmount: oldPlanPricing.finalAmount,
          newPlanAmount: newPlanPricing.finalAmount,
          daysRemaining,
          totalDaysInCycle: totalDays,
        });

        // Update subscription
        subscription.planId = newRatePlanId;
        await subscription.save({ transaction });

        // Handle prorated charge/credit
        if (prorated.difference !== 0) {
          if (prorated.isCharge) {
            // Charge the difference
            await addJob('billing', 'processProrationCharge', {
              subscriptionId: subscription.id,
              amount: prorated.difference,
              description: `Plan change from ${oldPlan.name} to ${newRatePlan.name}`,
            });
          } else {
            // Apply credit to account
            await subscription.account.addBalance(
              Math.abs(prorated.difference),
              transaction
            );
          }
        }

        logger.info('Subscription plan changed immediately', {
          subscriptionId,
          oldPlanId: oldPlan.id,
          newPlanId: newRatePlanId,
          proratedAmount: prorated.difference,
        });
      } else if (effective === 'next_cycle') {
        // Schedule plan change for next billing cycle
        subscription.scheduledRatePlanId = newRatePlanId;
        await subscription.save({ transaction });

        logger.info('Subscription plan change scheduled', {
          subscriptionId,
          oldPlanId: oldPlan.id,
          newPlanId: newRatePlanId,
          effectiveDate: subscription.nextBillingDate,
        });
      }

      await transaction.commit();
      return await this.getSubscriptionById(subscriptionId);
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Cancel subscription
   */
  async cancelSubscription(subscriptionId, immediate = false, reason = null) {
    const transaction = await sequelize.transaction();

    try {
      const subscription = await Subscription.findByPk(subscriptionId, {
        transaction,
      });

      if (!subscription) {
        throw new NotFoundError('Subscription not found');
      }

      if (immediate) {
        await subscription.cancel(reason, transaction);

        logger.info('Subscription cancelled immediately', {
          subscriptionId,
          reason,
        });
      } else {
        // Cancel at end of billing period
        subscription.cancelAtPeriodEnd = true;
        subscription.cancellationReason = reason;
        await subscription.save({ transaction });

        logger.info('Subscription scheduled for cancellation', {
          subscriptionId,
          effectiveDate: subscription.currentPeriodEnd,
          reason,
        });
      }

      await transaction.commit();
      return await this.getSubscriptionById(subscriptionId);
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Suspend subscription
   */
  async suspendSubscription(subscriptionId, reason) {
    const subscription = await this.getSubscriptionById(subscriptionId);

    if (subscription.status !== SUBSCRIPTION_STATUS.ACTIVE) {
      throw new BusinessLogicError('Can only suspend active subscriptions');
    }

    await subscription.suspend(reason);

    logger.warn('Subscription suspended', { subscriptionId, reason });

    return await this.getSubscriptionById(subscriptionId);
  }

  /**
   * Activate subscription
   */
  async activateSubscription(subscriptionId) {
    const subscription = await this.getSubscriptionById(subscriptionId);

    if (subscription.status !== SUBSCRIPTION_STATUS.SUSPENDED) {
      throw new BusinessLogicError('Can only activate suspended subscriptions');
    }

    await subscription.activate();

    logger.info('Subscription activated', { subscriptionId });

    return await this.getSubscriptionById(subscriptionId);
  }

  /**
   * Get subscription usage
   */
  async getSubscriptionUsage(subscriptionId, periodStart = null, periodEnd = null) {
    const subscription = await Subscription.findByPk(subscriptionId);

    if (!subscription) {
      throw new NotFoundError('Subscription not found');
    }

    const where = { subscriptionId };

    if (periodStart && periodEnd) {
      where.billingPeriodStart = { [Op.gte]: periodStart };
      where.billingPeriodEnd = { [Op.lte]: periodEnd };
    } else {
      // Get current period usage
      where.billingPeriodStart = subscription.currentPeriodStart;
      where.billingPeriodEnd = subscription.currentPeriodEnd;
    }

    const usage = await SubscriptionUsage.findOne({ where });

    return usage;
  }

  /**
   * Update subscription usage
   */
  async updateSubscriptionUsage(subscriptionId, usageData) {
    const subscription = await Subscription.findByPk(subscriptionId);

    if (!subscription) {
      throw new NotFoundError('Subscription not found');
    }

    // Find or create usage record for current period
    let usage = await SubscriptionUsage.findOne({
      where: {
        subscriptionId,
        billingPeriodStart: subscription.currentPeriodStart,
        billingPeriodEnd: subscription.currentPeriodEnd,
      },
    });

    if (!usage) {
      const planFeatures = subscription.plan?.features || {};
      const planLimits = subscription.plan?.limits || {};
      
      usage = await SubscriptionUsage.create({
        subscriptionId,
        billingPeriodStart: subscription.currentPeriodStart,
        billingPeriodEnd: subscription.currentPeriodEnd,
        minutesIncluded: planLimits.monthlyMinuteAllowance || planFeatures.freeMinutes || 0,
        minutesUsed: 0,
        minutesOverage: 0,
        overageCost: 0,
        localCalls: 0,
        stdCalls: 0,
        isdCalls: 0,
        mobileCalls: 0,
        metadata: {
          perMinuteRate: planFeatures.perMinuteCharge || 0,
        },
      });
    }

    // Update usage
    await usage.update(usageData);

    logger.info('Subscription usage updated', {
      subscriptionId,
      usageData,
    });

    return usage;
  }

  /**
   * Renew subscription
   */
  async renewSubscription(subscriptionId) {
    const transaction = await sequelize.transaction();

    try {
      const subscription = await Subscription.findByPk(subscriptionId, {
        include: [{ model: RatePlan, as: 'plan' }],
        transaction,
      });

      if (!subscription) {
        throw new NotFoundError('Subscription not found');
      }

      // Update billing period
      await subscription.updateBillingPeriod(transaction);

      // Create new usage record for next period
      const planFeatures = subscription.plan?.features || {};
      const planLimits = subscription.plan?.limits || {};
      
      await SubscriptionUsage.create(
        {
          subscriptionId: subscription.id,
          billingPeriodStart: subscription.currentPeriodStart,
          billingPeriodEnd: subscription.currentPeriodEnd,
          minutesIncluded: planLimits.monthlyMinuteAllowance || planFeatures.freeMinutes || 0,
          minutesUsed: 0,
          minutesOverage: 0,
          overageCost: 0,
          localCalls: 0,
          stdCalls: 0,
          isdCalls: 0,
          mobileCalls: 0,
          metadata: {
            perMinuteRate: planFeatures.perMinuteCharge || 0,
          },
        },
        { transaction }
      );

      await transaction.commit();

      logger.info('Subscription renewed', {
        subscriptionId,
        newPeriodStart: subscription.currentPeriodStart,
        newPeriodEnd: subscription.currentPeriodEnd,
      });

      // Schedule payment for renewal
      const pricing = pricingService.getSubscriptionPrice(
        subscription.plan.planType,
        subscription.billingCycle
      );

      await addJob('billing', 'processSubscriptionRenewal', {
        subscriptionId: subscription.id,
        amount: pricing.finalAmount,
      });

      return await this.getSubscriptionById(subscriptionId);
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Get subscriptions due for renewal
   */
  async getSubscriptionsDueForRenewal() {
    const now = new Date();

    const subscriptions = await Subscription.findAll({
      where: {
        status: SUBSCRIPTION_STATUS.ACTIVE,
        autoRenew: true,
        nextBillingDate: {
          [Op.lte]: now,
        },
      },
      include: [
        { model: Customer, as: 'customer' },
        { model: RatePlan, as: 'plan' },
      ],
    });

    return subscriptions;
  }

  /**
   * Validate status transition
   */
  validateStatusTransition(currentStatus, newStatus) {
    const validTransitions = {
      [SUBSCRIPTION_STATUS.ACTIVE]: [
        SUBSCRIPTION_STATUS.SUSPENDED,
        SUBSCRIPTION_STATUS.CANCELLED,
      ],
      [SUBSCRIPTION_STATUS.SUSPENDED]: [
        SUBSCRIPTION_STATUS.ACTIVE,
        SUBSCRIPTION_STATUS.CANCELLED,
      ],
      [SUBSCRIPTION_STATUS.CANCELLED]: [], // Cannot transition from cancelled
      [SUBSCRIPTION_STATUS.EXPIRED]: [], // Cannot transition from expired
    };

    if (!validTransitions[currentStatus]?.includes(newStatus)) {
      throw new ValidationError(
        `Invalid status transition from ${currentStatus} to ${newStatus}`
      );
    }
  }

  /**
   * Get customer subscriptions
   */
  async getCustomerSubscriptions(customerId) {
    const subscriptions = await Subscription.findAll({
      where: { customerId },
      include: [
        { model: RatePlan, as: 'plan' },
        { model: Account, as: 'account' },
      ],
      order: [['createdAt', 'DESC']],
    });

    return subscriptions;
  }

  /**
   * Create subscription with Razorpay payment
   */
  async createSubscriptionWithPayment({
    userId,
    planId,
    billingCycle,
    addons = {},
    customerData,
  }) {
    const transaction = await sequelize.transaction();
    const crypto = require('crypto');
    const { razorpayInstance, createOrder: createRazorpayOrder } = require('../config/razorpay');
    const ratePlanService = require('./ratePlanService');
    const User = require('../models').User;

    try {
      // Get user
      const user = await User.findByPk(userId);
      if (!user) {
        throw new NotFoundError('User not found');
      }

      // Calculate pricing
      const pricing = await ratePlanService.calculateSubscriptionPrice({
        planId,
        billingCycle,
        addons,
      });

      // Create or get customer
      let customer = await Customer.findOne({
        where: { userId },
        transaction,
      });

      if (!customer && customerData) {
        customer = await Customer.create(
          {
            userId,
            firstName: customerData.firstName || user.username,
            lastName: customerData.lastName || '',
            email: user.email,
            phone: customerData.phone || '',
            company: customerData.company || '',
            address: customerData.address || '',
            city: customerData.city || '',
            state: customerData.state || '',
            country: customerData.country || 'IN',
            postalCode: customerData.postalCode || '',
            gstNumber: customerData.gstNumber || '',
            status: 'active',
          },
          { transaction }
        );
      } else if (!customer) {
        throw new ValidationError(
          'Customer data required for first subscription'
        );
      }

      // Create or get account
      let account = await Account.findOne({
        where: { customerId: customer.id, status: 'active' },
        transaction,
      });

      if (!account) {
        account = await Account.create(
          {
            customerId: customer.id,
            accountNumber: `ACC-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            status: 'active',
            balance: 0,
            creditLimit: 0,
            currency: pricing.currency,
          },
          { transaction }
        );
      }

      // Create Razorpay order
      const receiptId = `rcpt_${Date.now()}`;
      const razorpayOrder = await createRazorpayOrder({
        amount: pricing.pricing.totalAmount, // Amount in rupees (will be converted to paise in createOrder)
        currency: pricing.currency,
        receipt: receiptId,
        notes: {
          userId: user.id,
          customerId: customer.id,
          planId: pricing.plan.id,
          planName: pricing.plan.name,
          billingCycle,
          addons: JSON.stringify(addons),
        },
      });

      // Generate subscription number
      const subscriptionNumber = `SUB-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
      
      // Calculate billing dates
      const startDate = new Date();
      const billingDates = getBillingCycleDates(startDate, billingCycle);

      // Create pending subscription record
      const subscription = await Subscription.create(
        {
          customerId: customer.id,
          accountId: account.id,
          planId: planId, // Use planId, not ratePlanId
          subscriptionNumber: subscriptionNumber,
          status: 'pending',
          billingCycle,
          billingAmount: pricing.pricing.totalAmount,
          currency: pricing.currency,
          startDate: startDate,
          currentPeriodStart: billingDates.periodStart,
          currentPeriodEnd: billingDates.periodEnd,
          nextBillingDate: billingDates.nextBillingDate,
          autoRenew: true,
          metadata: {
            razorpayOrderId: razorpayOrder.id,
            pricing: pricing,
            addons: addons,
          },
        },
        { transaction }
      );

      await transaction.commit();

      logger.info('Razorpay order created', {
        orderId: razorpayOrder.id,
        subscriptionId: subscription.id,
        amount: pricing.totalWithGst,
      });

      return {
        orderId: razorpayOrder.id,
        subscriptionId: subscription.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        key: process.env.RAZORPAY_KEY_ID,
        pricing,
        customer: {
          id: customer.id,
          name: `${customer.firstName} ${customer.lastName}`,
          email: customer.email,
          contact: customer.phone,
        },
      };
    } catch (error) {
      await transaction.rollback();
      logger.error('Error creating subscription with payment', { error });
      throw error;
    }
  }

  /**
   * Verify Razorpay payment and activate subscription
   */
  async verifyPaymentAndActivateSubscription({
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
    subscriptionId,
  }) {
    const transaction = await sequelize.transaction();
    const crypto = require('crypto');

    try {
      // Verify signature
      const body = razorpay_order_id + '|' + razorpay_payment_id;
      const expectedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
        .update(body.toString())
        .digest('hex');

      if (expectedSignature !== razorpay_signature) {
        throw new ValidationError('Invalid payment signature');
      }

      // Get subscription
      const subscription = await Subscription.findByPk(subscriptionId, {
        include: [
          { model: RatePlan, as: 'plan' },
          { model: Customer, as: 'customer' },
          { model: Account, as: 'account' },
        ],
        transaction,
      });

      if (!subscription) {
        throw new NotFoundError('Subscription not found');
      }

      if (subscription.status !== 'pending') {
        throw new BusinessLogicError('Subscription is not in pending state');
      }

      // Calculate billing dates
      const startDate = new Date();
      const { startDate: billingStart, endDate: billingEnd } =
        getBillingCycleDates(startDate, subscription.billingCycle);

      let nextBillingDate = new Date(billingEnd);
      nextBillingDate.setDate(nextBillingDate.getDate() + 1);

      // Update subscription to active
      await subscription.update(
        {
          status: 'active',
          startDate,
          currentPeriodStart: billingStart,
          currentPeriodEnd: billingEnd,
          nextBillingDate,
          activatedAt: new Date(),
        },
        { transaction }
      );

      // Get pricing from subscription metadata
      const pricing = subscription.metadata.pricing;
      
      // Initialize subscription usage tracking
      const planFeatures = subscription.plan?.features || pricing.features || {};
      const planLimits = subscription.plan?.limits || pricing.limits || {};
      
      // Determine free minutes - try multiple sources
      let freeMinutes = 0;
      if (planLimits.monthlyMinuteAllowance) {
        freeMinutes = parseInt(planLimits.monthlyMinuteAllowance);
      } else if (planFeatures.freeMinutes) {
        freeMinutes = parseInt(planFeatures.freeMinutes);
      } else if (pricing.freeMinutes) {
        freeMinutes = parseInt(pricing.freeMinutes);
      }
      
      // Fallback defaults based on price
      if (freeMinutes === 0) {
        const basePrice = subscription.plan?.basePrice || 0;
        if (basePrice <= 500) freeMinutes = 100;
        else if (basePrice <= 1500) freeMinutes = 500;
        else freeMinutes = 1500;
      }
      
      logger.info('Creating subscription usage', {
        subscriptionId: subscription.id,
        planName: subscription.plan?.planName,
        freeMinutes,
        planFeatures,
        planLimits,
      });
      
      await SubscriptionUsage.create(
        {
          subscriptionId: subscription.id,
          billingPeriodStart: billingStart,
          billingPeriodEnd: billingEnd,
          // Free minutes from plan
          minutesIncluded: freeMinutes,
          minutesUsed: 0,
          minutesOverage: 0,
          overageCost: 0.0,
          // Call types
          localCalls: 0,
          stdCalls: 0,
          isdCalls: 0,
          mobileCalls: 0,
          metadata: {
            perMinuteRate: planFeatures.perMinuteCharge || 1.99,
            billingCycle: subscription.billingCycle,
            planName: subscription.plan?.planName || pricing.plan?.name,
          },
        },
        { transaction }
      );

      // Create payment record
      const totalAmount = pricing.pricing?.totalAmount || pricing.totalAmount;
      
      // Generate payment number
      const paymentNumber = `PAY-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
      
      const payment = await Payment.create(
        {
          customerId: subscription.customerId,
          accountId: subscription.accountId,
          subscriptionId: subscription.id,
          invoiceId: null, // Can link to invoice if needed
          paymentNumber: paymentNumber,
          amount: totalAmount,
          currency: pricing.currency || 'INR',
          status: 'completed',
          paymentMethod: 'razorpay',
          paymentType: 'subscription',
          gateway: 'razorpay',
          gatewayPaymentId: razorpay_payment_id,
          gatewayOrderId: razorpay_order_id,
          gatewaySignature: razorpay_signature,
          paidAt: new Date(),
          metadata: {
            orderId: razorpay_order_id,
            paymentId: razorpay_payment_id,
            signature: razorpay_signature,
          },
        },
        { transaction }
      );

      // Update account balance if needed
      await subscription.account.update(
        {
          balance: sequelize.literal(`balance + ${totalAmount}`),
        },
        { transaction }
      );

      await transaction.commit();

      logger.info('Subscription activated successfully', {
        subscriptionId: subscription.id,
        paymentId: payment.id,
      });

      // Fetch updated subscription data after commit
      const updatedSubscription = await this.getSubscriptionById(subscription.id);

      return {
        subscription: updatedSubscription,
        payment: {
          id: payment.id,
          amount: payment.amount,
          currency: payment.currency,
          status: payment.status,
          gatewayPaymentId: payment.gatewayPaymentId,
        },
      };
    } catch (error) {
      // Only rollback if transaction is still active
      if (!transaction.finished) {
        await transaction.rollback();
      }
      logger.error('Error verifying payment and activating subscription', {
        error,
      });
      throw error;
    }
  }

  /**
   * Get user's active subscription
   */
  async getUserActiveSubscription(userId) {
    const User = require('../models').User;
    
    const user = await User.findByPk(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    const customer = await Customer.findOne({
      where: { userId },
    });

    if (!customer) {
      return null;
    }

    const subscription = await Subscription.findOne({
      where: {
        customerId: customer.id,
        status: 'active',
      },
      include: [
        { model: RatePlan, as: 'plan' },
        { model: Account, as: 'account' },
        { model: Customer, as: 'customer' },
      ],
      order: [['createdAt', 'DESC']],
    });

    return subscription;
  }
}

module.exports = new SubscriptionService();
