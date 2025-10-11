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
      await SubscriptionUsage.create(
        {
          subscriptionId: subscription.id,
          periodStart: billingStart,
          periodEnd: billingEnd,
          minutesUsed: 0,
          tollFreeNumbers: 0,
          extensions: 0,
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
          as: 'ratePlan',
        },
        {
          model: Account,
          as: 'account',
        },
        {
          model: SubscriptionUsage,
          as: 'usageRecords',
          order: [['periodStart', 'DESC']],
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
          as: 'ratePlan',
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
          { model: RatePlan, as: 'ratePlan' },
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

      const oldPlan = subscription.ratePlan;

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
        subscription.ratePlanId = newRatePlanId;
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
      where.periodStart = { [Op.gte]: periodStart };
      where.periodEnd = { [Op.lte]: periodEnd };
    } else {
      // Get current period usage
      where.periodStart = subscription.currentPeriodStart;
      where.periodEnd = subscription.currentPeriodEnd;
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
        periodStart: subscription.currentPeriodStart,
        periodEnd: subscription.currentPeriodEnd,
      },
    });

    if (!usage) {
      usage = await SubscriptionUsage.create({
        subscriptionId,
        periodStart: subscription.currentPeriodStart,
        periodEnd: subscription.currentPeriodEnd,
        minutesUsed: 0,
        tollFreeNumbers: 0,
        extensions: 0,
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
        include: [{ model: RatePlan, as: 'ratePlan' }],
        transaction,
      });

      if (!subscription) {
        throw new NotFoundError('Subscription not found');
      }

      // Update billing period
      await subscription.updateBillingPeriod(transaction);

      // Create new usage record for next period
      await SubscriptionUsage.create(
        {
          subscriptionId: subscription.id,
          periodStart: subscription.currentPeriodStart,
          periodEnd: subscription.currentPeriodEnd,
          minutesUsed: 0,
          tollFreeNumbers: 0,
          extensions: 0,
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
        subscription.ratePlan.planType,
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
        { model: RatePlan, as: 'ratePlan' },
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
        { model: RatePlan, as: 'ratePlan' },
        { model: Account, as: 'account' },
      ],
      order: [['createdAt', 'DESC']],
    });

    return subscriptions;
  }
}

module.exports = new SubscriptionService();
