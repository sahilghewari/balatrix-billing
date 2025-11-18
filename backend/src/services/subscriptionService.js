/**
 * Subscription Service
 * Business logic for subscription management
 */

const { sequelize } = require('../config/database');
const { Sequelize } = require('sequelize');
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

  }

  /**
   * Create subscription with payment (Razorpay)
   */
  async createSubscriptionWithPayment({
    userId,
    planId,
    billingCycle,
    addons = [],
    customerData,
    selectedNumbers = [],
  }) {
    const transaction = await sequelize.transaction();
    const crypto = require('crypto');
    const { createOrder } = require('../config/razorpay');

    try {
      // Get plan details
      const RatePlan = require('../models').RatePlan;
      const plan = await RatePlan.findByPk(planId);
      if (!plan) {
        throw new NotFoundError('Plan not found');
      }

      // Calculate pricing
      const pricing = await this.calculateSubscriptionPricing({
        plan,
        billingCycle,
        addons,
        selectedNumbers,
      });

      // Find or create customer
      let customer = await Customer.findOne({
        where: { userId },
        transaction,
      });

      if (!customer && customerData) {
        // Use default tenant for now - in production this should come from user or organization
        const defaultTenantId = '5a98f0ca-b2ef-478a-8d7c-85e6f61aa7ea'; // Default tenant ID
        
        customer = await Customer.create(
          {
            userId,
            tenantId: defaultTenantId,
            companyName: customerData.company || null,
            businessType: customerData.businessType || 'individual',
            billingCountry: customerData.country || 'India',
            status: 'active',
            creditLimit: 0,
            kycStatus: 'pending',
            taxExempt: false,
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
            tenantId: customer.tenantId,
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
      const razorpayOrder = await createOrder({
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
          selectedNumbers: JSON.stringify(selectedNumbers),
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
          tenantId: customer.tenantId,
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
            selectedNumbers: selectedNumbers,
          },
        },
        { transaction }
      );

      await transaction.commit();

      logger.info('Subscription with payment created', {
        subscriptionId: subscription.id,
        userId,
        planId,
        amount: pricing.pricing.totalAmount,
        selectedNumbersCount: selectedNumbers.length,
      });

      return {
        orderId: razorpayOrder.id,
        subscriptionId: subscription.id,
        amount: pricing.pricing.totalAmount,
        currency: pricing.currency,
        key: process.env.RAZORPAY_KEY_ID,
        customer: {
          id: customer.id,
          companyName: customer.companyName,
        },
      };
    } catch (error) {
      await transaction.rollback();
      logger.error('Error creating subscription with payment', {
        userId,
        planId,
        error: error.message,
      });
      throw error;
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
    selectedNumber,
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
        // Use default tenant for now - in production this should come from user or organization
        const defaultTenantId = '5a98f0ca-b2ef-478a-8d7c-85e6f61aa7ea'; // Default tenant ID
        
        customer = await Customer.create(
          {
            userId,
            tenantId: defaultTenantId,
            companyName: customerData.company || null,
            businessType: customerData.businessType || 'individual',
            billingCountry: customerData.country || 'India',
            status: 'active',
            creditLimit: 0,
            kycStatus: 'pending',
            taxExempt: false,
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
            tenantId: customer.tenantId,
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
          tenantId: customer.tenantId,
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
            selectedNumbers: selectedNumbers,
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

      // Assign toll-free numbers if selected
      const selectedNumbers = subscription.metadata?.selectedNumbers || [];
      if (selectedNumbers && selectedNumbers.length > 0) {
        const TollFreeNumber = require('../models').TollFreeNumber;
        
        for (const selectedNumber of selectedNumbers) {
          const tollFreeNumber = await TollFreeNumber.findByPk(selectedNumber.id, { transaction });
          if (tollFreeNumber && tollFreeNumber.status === 'active') {
            await tollFreeNumber.update({
              tenantId: subscription.customer.tenantId,
              status: 'inactive',
              assignedAt: new Date(),
              config: {
                ...tollFreeNumber.config,
                subscriptionId: subscription.id,
                assignedBy: 'subscription_activation',
              },
            }, { transaction });
            
            logger.info('Toll-free number assigned to customer', {
              numberId: selectedNumber.id,
              customerId: subscription.customerId,
              tenantId: subscription.customer.tenantId,
              subscriptionId: subscription.id,
            });
          }
        }
      }

      // Assign extensions based on plan features
      const extensionsCount = planFeatures.extensions || planLimits.extensions || 0;
      if (extensionsCount > 0) {
        const Extension = require('../models').Extension;
        
        // Generate extension numbers (simple sequential for now)
        const existingExtensions = await Extension.count({
          where: { customerId: subscription.customerId },
          transaction,
        });
        
        const extensionsToCreate = [];
        for (let i = 0; i < extensionsCount; i++) {
          const extensionNumber = (existingExtensions + i + 1).toString().padStart(3, '0');
          extensionsToCreate.push({
            customerId: subscription.customerId,
            tenantId: subscription.tenantId,
            extensionNumber,
            displayName: `Extension ${extensionNumber}`,
            status: 'active',
            type: 'sip',
            metadata: {
              subscriptionId: subscription.id,
              assignedBy: 'subscription_activation',
              planName: subscription.plan?.planName,
            },
          });
        }
        
        if (extensionsToCreate.length > 0) {
          await Extension.bulkCreate(extensionsToCreate, { transaction });
          
          logger.info('Extensions assigned to customer', {
            customerId: subscription.customerId,
            extensionsCount: extensionsToCreate.length,
            subscriptionId: subscription.id,
          });
        }
      }

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
   * Calculate subscription pricing
   */
  async calculateSubscriptionPricing({ plan, billingCycle, addons = [], selectedNumbers = [] }) {
    // Base price
    const monthlyPrice = parseFloat(plan.monthlyPrice) || 349;
    let basePrice;

    if (billingCycle === 'monthly') {
      basePrice = monthlyPrice;
    } else if (billingCycle === 'quarterly') {
      basePrice = monthlyPrice * 3;
    } else if (billingCycle === 'annual') {
      basePrice = parseFloat(plan.annualPrice) || (monthlyPrice * 12);
    } else {
      basePrice = monthlyPrice;
    }

    // Addon costs
    const extraTollFreeNumbers = addons.find(a => a.type === 'extraTollFreeNumbers')?.quantity || 0;
    const extraExtensions = addons.find(a => a.type === 'extraExtensions')?.quantity || 0;
    
    const tollFreeAddonCost = extraTollFreeNumbers * 199;
    const extensionAddonCost = extraExtensions * 99;
    const addonsCost = tollFreeAddonCost + extensionAddonCost;

    // Toll-free number costs (included numbers are free, extra are charged)
    const planLimits = plan.limits || {};
    const maxTollFreeNumbers = planLimits.maxTollFreeNumbers || 0;
    const includedNumbers = Math.min(selectedNumbers.length, maxTollFreeNumbers);
    const extraNumbers = Math.max(0, selectedNumbers.length - maxTollFreeNumbers);
    const tollFreeCost = extraNumbers * 199; // Extra numbers cost

    const subtotal = basePrice + addonsCost + tollFreeCost;
    const gstAmount = subtotal * 0.18;
    const totalAmount = subtotal + gstAmount;

    return {
      plan: {
        id: plan.id,
        name: plan.planName,
        type: plan.planType,
      },
      billingCycle,
      pricing: {
        basePrice: Number(basePrice.toFixed(2)),
        addonsCost: Number(addonsCost.toFixed(2)),
        tollFreeCost: Number(tollFreeCost.toFixed(2)),
        subtotal: Number(subtotal.toFixed(2)),
        gstAmount: Number(gstAmount.toFixed(2)),
        totalAmount: Number(totalAmount.toFixed(2)),
      },
      currency: 'INR',
      features: plan.features || {},
      limits: plan.limits || {},
    };
  }
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

  /**
   * Get user's dashboard statistics
   */
  async getUserDashboardStats(userId) {
    const User = require('../models').User;
    const TollFreeNumber = require('../models').TollFreeNumber;
    const Extension = require('../models').Extension;
    const SubscriptionUsage = require('../models').SubscriptionUsage;

    const user = await User.findByPk(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    const customer = await Customer.findOne({
      where: { userId },
    });

    if (!customer) {
      return {
        subscription: null,
        stats: {
          tollFreeNumbers: 0,
          extensions: 0,
          minutesUsed: 0,
          nextBilling: null,
        }
      };
    }

    // Get active subscription
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

    // Get toll-free numbers count - only count numbers assigned to this customer's subscriptions
    const customerSubscriptions = await Subscription.findAll({
      where: { customerId: customer.id },
      attributes: ['id'],
    });
    const subscriptionIds = customerSubscriptions.map(sub => sub.id);
    
    const tollFreeCount = await TollFreeNumber.count({
      where: {
        tenantId: customer.tenantId,
        status: 'inactive',
        config: {
          subscriptionId: {
            [Sequelize.Op.in]: subscriptionIds
          }
        }
      }
    });    // Get extensions count - only count extensions assigned to this customer's subscriptions
    const extensionsCount = await Extension.count({
      where: {
        tenantId: customer.tenantId,
        isActive: true,
        config: {
          subscriptionId: {
            [Sequelize.Op.in]: subscriptionIds
          }
        }
      },
    });

    // Get usage stats
    let minutesUsed = 0;
    if (subscription) {
      const usage = await SubscriptionUsage.findOne({
        where: {
          subscriptionId: subscription.id,
          billingPeriodStart: subscription.currentPeriodStart,
          billingPeriodEnd: subscription.currentPeriodEnd,
        },
      });
      if (usage) {
        minutesUsed = usage.minutesUsed || 0;
      }
    }

    return {
      subscription,
      stats: {
        tollFreeNumbers: tollFreeCount,
        extensions: extensionsCount,
        minutesUsed,
        nextBilling: subscription?.nextBillingDate || null,
      }
    };
  }

  /**
   * Create subscription with payment (Razorpay)
   */
  async createSubscriptionWithPayment({
    userId,
    planId,
    billingCycle,
    addons,
    customerData,
    selectedNumbers,
  }) {
    const transaction = await sequelize.transaction();

    try {
      // Get user and validate
      const User = require('../models').User;
      const user = await User.findByPk(userId);
      if (!user) {
        throw new NotFoundError('User not found');
      }

      // Get or create customer
      let customer = await Customer.findOne({
        where: { userId },
        transaction,
      });

      if (!customer) {
        customer = await Customer.create({
          userId,
          tenantId: '5a98f0ca-b2ef-478a-8d7c-85e6f61aa7ea', // Default tenant
          firstName: customerData.firstName,
          lastName: customerData.lastName,
          email: user.email,
          phone: customerData.phone,
          company: customerData.company,
          address: customerData.address,
          city: customerData.city,
          state: customerData.state,
          country: customerData.country,
          postalCode: customerData.postalCode,
          gstNumber: customerData.gstNumber,
        }, { transaction });
      }

      // Get plan
      const plan = await RatePlan.findByPk(planId);
      if (!plan) {
        throw new NotFoundError('Plan not found');
      }

      // Calculate pricing
      const pricing = await pricingService.calculatePrice({
        planId,
        billingCycle,
        addons: addons || [],
        selectedNumbers: selectedNumbers || [],
      });

      // Create Razorpay order
      const Razorpay = require('razorpay');
      const razorpay = new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET,
      });

      const orderOptions = {
        amount: Math.round(pricing.totalAmount * 100), // Amount in paisa
        currency: 'INR',
        receipt: `sub_${Date.now()}`,
        notes: {
          userId,
          customerId: customer.id,
          planId,
          billingCycle,
          selectedNumbers: JSON.stringify(selectedNumbers || []),
        },
      };

      const order = await razorpay.orders.create(orderOptions);

      // Get or create account for customer
      console.log(`[DEBUG] Looking for account for customer ${customer.id}`);
      let account = await Account.findOne({
        where: { customerId: customer.id },
        transaction,
      });
      console.log(`[DEBUG] Account lookup result: ${account ? 'FOUND' : 'NOT FOUND'}`);

      if (!account) {
        console.log(`[DEBUG] Creating new account for customer ${customer.id}`);
        account = await Account.create({
          customerId: customer.id,
          tenantId: customer.tenantId,
          accountNumber: `ACC-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`,
          accountType: 'postpaid',
          balance: 0.0,
          creditLimit: 0.0,
          currency: 'INR',
        }, { transaction });
      } else {
        console.log(`[DEBUG] Using existing account ${account.id}`);
      }

      // Create subscription record (pending payment)
      const subscription = await Subscription.create({
        customerId: customer.id,
        tenantId: customer.tenantId,
        accountId: account.id,
        planId: planId,
        subscriptionNumber: `SUB-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`,
        billingCycle,
        billingAmount: pricing.totalAmount,
        currency: 'INR',
        status: 'pending',
        startDate: new Date(),
        currentPeriodStart: new Date(),
        currentPeriodEnd: getBillingCycleDates(billingCycle).endDate,
        metadata: {
          selectedNumbers: selectedNumbers || [],
          addons: addons || [],
          pricing,
          razorpayOrderId: order.id,
        },
      }, { transaction });

      await transaction.commit();

      return {
        orderId: order.id,
        subscriptionId: subscription.id,
        amount: order.amount,
        currency: order.currency,
        key: process.env.RAZORPAY_KEY_ID,
        customer: {
          id: customer.id,
          firstName: customer.firstName,
          lastName: customer.lastName,
          email: customer.email,
        },
      };
    } catch (error) {
      await transaction.rollback();
      logger.error('Failed to create subscription with payment', { error: error.message });
      throw error;
    }
  }

  /**
   * Verify payment and activate subscription
   */
  async verifyPaymentAndActivateSubscription({
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
  }) {
    const transaction = await sequelize.transaction();

    try {
      // Verify payment signature using crypto
      const crypto = require('crypto');
      const expectedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest('hex');

      if (expectedSignature !== razorpay_signature) {
        throw new ValidationError('Invalid payment signature');
      }

      // Find subscription by Razorpay order ID
      const subscription = await Subscription.findOne({
        where: {
          'metadata.razorpayOrderId': razorpay_order_id,
        },
        include: [
          { model: require('../models').RatePlan, as: 'plan' },
          { model: require('../models').Customer, as: 'customer' },
          { model: require('../models').Account, as: 'account' },
        ],
        transaction,
      });

      if (!subscription) {
        throw new NotFoundError('Subscription not found for this order');
      }

      if (subscription.status !== 'pending') {
        throw new ValidationError('Subscription is not in pending payment status');
      }

      // Update subscription status
      subscription.status = 'active';
      subscription.metadata = {
        ...subscription.metadata,
        paymentId: razorpay_payment_id,
        paymentVerified: true,
        activatedAt: new Date(),
      };
      await subscription.save({ transaction });

      // Assign toll-free numbers to customer
      const selectedNumbers = subscription.metadata.selectedNumbers || [];
      const numbersArray = Array.isArray(selectedNumbers) ? selectedNumbers : [selectedNumbers];

      // Get plan features to determine included toll-free numbers
      const planFeatures = subscription.plan?.features || {};
      const planLimits = subscription.plan?.limits || {};
      const includedTollFreeNumbers = planFeatures.tollFreeNumbers || planLimits.maxTollFreeNumbers || 0;

      // If no numbers were explicitly selected but plan includes numbers, auto-assign included numbers
      let numbersToAssign = [...numbersArray];
      if (numbersArray.length === 0 && includedTollFreeNumbers > 0) {
        // Auto-assign included numbers from available pool
        const TollFreeNumber = require('../models').TollFreeNumber;
        const availableNumbers = await TollFreeNumber.findAll({
          where: { status: 'active' },
          limit: includedTollFreeNumbers,
          order: [['number', 'ASC']],
          transaction,
        });

        numbersToAssign = availableNumbers.map(num => ({
          id: num.id,
          number: num.number,
          provider: 'balatrix',
          setupCost: 0,
          monthlyCost: planFeatures.perMinuteCharge || '99.99',
          perMinuteCost: '0.0199'
        }));

        // Update subscription metadata with auto-assigned numbers
        subscription.metadata = {
          ...subscription.metadata,
          selectedNumbers: numbersToAssign,
          autoAssignedNumbers: true,
        };
        await subscription.save({ transaction });
      }

      // Only auto-assign numbers if no numbers were explicitly selected
      // If user selected numbers, respect their choice and don't auto-assign additional ones
      if (numbersArray.length === 0 && includedTollFreeNumbers > 0) {
        const additionalNeeded = includedTollFreeNumbers;

        // Auto-assign included numbers from available pool
        const TollFreeNumber = require('../models').TollFreeNumber;
        const availableNumbers = await TollFreeNumber.findAll({
          where: { status: 'active' },
          limit: additionalNeeded,
          order: [['number', 'ASC']],
          transaction,
        });

        const additionalNumbers = availableNumbers.map(num => ({
          id: num.id,
          number: num.number,
          provider: 'balatrix',
          setupCost: 0,
          monthlyCost: planFeatures.perMinuteCharge || '99.99',
          perMinuteCost: '0.0199'
        }));

        numbersToAssign = [...numbersToAssign, ...additionalNumbers];

        // Update subscription metadata with auto-assigned numbers
        subscription.metadata = {
          ...subscription.metadata,
          selectedNumbers: numbersToAssign,
          autoAssignedNumbers: true,
        };
        await subscription.save({ transaction });
      }

      if (numbersToAssign.length > 0) {
        const tollFreeNumberService = require('./tollFreeNumberService');
        for (const numberData of numbersToAssign) {
          if (numberData && numberData.id) {
            await tollFreeNumberService.assignNumberToCustomer(
              subscription.customerId,
              numberData.id,
              subscription.id,
              transaction
            );
          }
        }
      }

      // Auto-assign extensions based on plan
      const includedExtensions = planFeatures.extensions || planLimits.maxExtensions || 0;
      if (includedExtensions > 0) {
        const extensionService = require('./extensionService');
        const extensionResult = await extensionService.autoAssignExtensionsToCustomer(
          subscription.customerId,
          subscription.id,
          transaction
        );

        // Update subscription metadata with auto-assigned extensions
        subscription.metadata = {
          ...subscription.metadata,
          autoAssignedExtensions: true,
          extensionBasePrefix: extensionResult.basePrefix,
          assignedExtensionsCount: extensionResult.totalAssigned,
          assignedExtensions: extensionResult.assignedExtensions,
        };
        await subscription.save({ transaction });

        logger.info('Extensions auto-assigned during subscription activation', {
          subscriptionId: subscription.id,
          customerId: subscription.customerId,
          basePrefix: extensionResult.basePrefix,
          extensionsAssigned: extensionResult.totalAssigned,
        });
      }

      // Create payment record
      const Payment = require('../models').Payment;
      await Payment.create({
        customerId: subscription.customerId,
        subscriptionId: subscription.id,
        accountId: subscription.accountId,
        paymentNumber: `PAY-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`,
        amount: subscription.metadata.pricing.totalAmount,
        currency: 'INR',
        status: 'completed',
        paymentMethod: 'razorpay',
        gateway: 'razorpay',
        gatewayPaymentId: razorpay_payment_id,
        gatewayOrderId: razorpay_order_id,
        gatewaySignature: razorpay_signature,
        paymentType: 'subscription',
        paidAt: new Date(),
        billingPeriodStart: subscription.currentPeriodStart,
        billingPeriodEnd: subscription.currentPeriodEnd,
        metadata: {
          razorpay_order_id,
          razorpay_payment_id,
          razorpay_signature,
        },
      }, { transaction });

      await transaction.commit();

      // Return updated subscription
      return await this.getSubscriptionById(subscription.id);
    } catch (error) {
      await transaction.rollback();
      logger.error('Failed to verify payment and activate subscription', { error: error.message });
      throw error;
    }
  }
}

module.exports = new SubscriptionService();
