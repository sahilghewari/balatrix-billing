/**
 * Usage Service
 * Business logic for subscription usage tracking
 */

const { sequelize } = require('../config/database');
const {
  Subscription,
  SubscriptionUsage,
  RatePlan,
  Customer,
} = require('../models');
const { ResourceNotFoundError } = require('../utils/errors');
const logger = require('../utils/logger');
const { Op } = require('sequelize');

class UsageService {
  /**
   * Get current usage for a subscription
   */
  async getCurrentUsage(subscriptionId, userId) {
    // Verify subscription belongs to user
    const subscription = await Subscription.findOne({
      where: { id: subscriptionId },
      include: [
        {
          model: Customer,
          as: 'customer',
          where: { userId },
          attributes: ['id', 'companyName'],
        },
        {
          model: RatePlan,
          as: 'plan',
          attributes: ['id', 'planName', 'features', 'limits'],
        },
      ],
    });

    if (!subscription) {
      throw new ResourceNotFoundError('Subscription not found or access denied');
    }

    // Get current period usage
    const now = new Date();
    const usage = await SubscriptionUsage.findOne({
      where: {
        subscriptionId,
        billingPeriodStart: { [Op.lte]: now },
        billingPeriodEnd: { [Op.gte]: now },
      },
      order: [['createdAt', 'DESC']],
    });

    if (!usage) {
      // No usage record yet, return defaults
      const planFeatures = subscription.plan?.features || {};
      const planLimits = subscription.plan?.limits || {};

      return {
        subscription: {
          id: subscription.id,
          planName: subscription.plan?.planName,
          billingCycle: subscription.billingCycle,
          status: subscription.status,
        },
        currentPeriod: {
          start: subscription.currentPeriodStart,
          end: subscription.currentPeriodEnd,
        },
        usage: {
          minutesIncluded: planLimits.monthlyMinuteAllowance || planFeatures.freeMinutes || 0,
          minutesUsed: 0,
          remainingMinutes: planLimits.monthlyMinuteAllowance || planFeatures.freeMinutes || 0,
          minutesOverage: 0,
          overageCost: 0.0,
          perMinuteRate: planFeatures.perMinuteCharge || 0,
          utilizationPercentage: 0,
        },
        calls: {
          total: 0,
          successful: 0,
          failed: 0,
        },
      };
    }

    // Calculate remaining minutes
    const remainingMinutes = Math.max(0, usage.minutesIncluded - usage.minutesUsed);
    const utilizationPercentage = usage.minutesIncluded > 0
      ? Math.min(100, (usage.minutesUsed / usage.minutesIncluded) * 100)
      : 0;

    return {
      subscription: {
        id: subscription.id,
        planName: subscription.plan?.planName,
        billingCycle: subscription.billingCycle,
        status: subscription.status,
      },
      currentPeriod: {
        start: usage.billingPeriodStart,
        end: usage.billingPeriodEnd,
        daysRemaining: Math.ceil((new Date(usage.billingPeriodEnd) - now) / (1000 * 60 * 60 * 24)),
      },
      usage: {
        minutesIncluded: usage.minutesIncluded,
        minutesUsed: usage.minutesUsed,
        remainingMinutes: remainingMinutes,
        minutesOverage: usage.minutesOverage,
        overageCost: parseFloat(usage.overageCost),
        perMinuteRate: usage.metadata?.perMinuteRate || 0,
        utilizationPercentage: utilizationPercentage.toFixed(2),
      },
      calls: {
        total: usage.localCalls + usage.stdCalls + usage.isdCalls + usage.mobileCalls,
        local: usage.localCalls,
        std: usage.stdCalls,
        isd: usage.isdCalls,
        mobile: usage.mobileCalls,
      },
    };
  }

  /**
   * Get usage history for a subscription
   */
  async getUsageHistory(subscriptionId, userId, page = 1, limit = 10) {
    // Verify subscription belongs to user
    const subscription = await Subscription.findOne({
      where: { id: subscriptionId },
      include: [
        {
          model: Customer,
          as: 'customer',
          where: { userId },
          attributes: ['id'],
        },
      ],
    });

    if (!subscription) {
      throw new ResourceNotFoundError('Subscription not found or access denied');
    }

    const offset = (page - 1) * limit;

    const { count, rows: usageRecords } = await SubscriptionUsage.findAndCountAll({
      where: { subscriptionId },
      order: [['billingPeriodStart', 'DESC']],
      limit,
      offset,
    });

    const history = usageRecords.map(usage => ({
      period: {
        start: usage.billingPeriodStart,
        end: usage.billingPeriodEnd,
      },
      usage: {
        minutesIncluded: usage.minutesIncluded,
        minutesUsed: usage.minutesUsed,
        minutesOverage: usage.minutesOverage,
        overageCost: parseFloat(usage.overageCost),
      },
      calls: {
        total: usage.localCalls + usage.stdCalls + usage.isdCalls + usage.mobileCalls,
        local: usage.localCalls,
        std: usage.stdCalls,
        isd: usage.isdCalls,
        mobile: usage.mobileCalls,
      },
    }));

    return {
      history,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(count / limit),
        totalRecords: count,
        limit,
      },
    };
  }

  /**
   * Get usage summary (aggregated statistics)
   */
  async getUsageSummary(subscriptionId, userId) {
    // Verify subscription belongs to user
    const subscription = await Subscription.findOne({
      where: { id: subscriptionId },
      include: [
        {
          model: Customer,
          as: 'customer',
          where: { userId },
          attributes: ['id'],
        },
      ],
    });

    if (!subscription) {
      throw new ResourceNotFoundError('Subscription not found or access denied');
    }

    // Get all finalized usage records
    const usageRecords = await SubscriptionUsage.findAll({
      where: {
        subscriptionId,
      },
      attributes: [
        [sequelize.fn('SUM', sequelize.col('minutesUsed')), 'totalMinutes'],
        [sequelize.fn('SUM', sequelize.col('minutesOverage')), 'totalOverageMinutes'],
        [sequelize.fn('SUM', sequelize.col('overageCost')), 'totalOverageCost'],
        [sequelize.fn('SUM', sequelize.col('localCalls')), 'totalLocalCalls'],
        [sequelize.fn('SUM', sequelize.col('stdCalls')), 'totalStdCalls'],
        [sequelize.fn('SUM', sequelize.col('isdCalls')), 'totalIsdCalls'],
        [sequelize.fn('SUM', sequelize.col('mobileCalls')), 'totalMobileCalls'],
        [sequelize.fn('AVG', sequelize.col('minutesUsed')), 'avgMonthlyMinutes'],
      ],
      raw: true,
    });

    const summary = usageRecords[0] || {};
    const totalCalls = (parseInt(summary.totalLocalCalls) || 0) + 
                      (parseInt(summary.totalStdCalls) || 0) + 
                      (parseInt(summary.totalIsdCalls) || 0) + 
                      (parseInt(summary.totalMobileCalls) || 0);

    return {
      lifetime: {
        totalMinutes: parseInt(summary.totalMinutes) || 0,
        totalOverageMinutes: parseInt(summary.totalOverageMinutes) || 0,
        totalOverageCost: parseFloat(summary.totalOverageCost) || 0,
        totalCalls: totalCalls,
        avgMonthlyMinutes: parseFloat(summary.avgMonthlyMinutes) || 0,
      },
    };
  }

  /**
   * Add minutes used from CDR processing
   * @param {string} subscriptionId - Subscription ID
   * @param {number} minutes - Billable minutes from the call
   * @param {string} callType - Type of call (local, std, isd, mobile)
   */
  async addMinutesUsed(subscriptionId, minutes, callType = 'local') {
    const transaction = await sequelize.transaction();

    try {
      // Find subscription with plan details
      const subscription = await Subscription.findByPk(subscriptionId, {
        include: [
          {
            model: RatePlan,
            as: 'plan',
            attributes: ['id', 'planName', 'features', 'limits'],
          },
        ],
        transaction,
      });

      if (!subscription) {
        throw new ResourceNotFoundError('Subscription not found');
      }

      // Get current period usage
      const now = new Date();
      let usage = await SubscriptionUsage.findOne({
        where: {
          subscriptionId,
          billingPeriodStart: { [Op.lte]: now },
          billingPeriodEnd: { [Op.gte]: now },
        },
        transaction,
      });

      // If no usage record exists for current period, create one
      if (!usage) {
        const planFeatures = subscription.plan?.features || {};
        const planLimits = subscription.plan?.limits || {};

        usage = await SubscriptionUsage.create(
          {
            subscriptionId,
            billingPeriodStart: subscription.currentPeriodStart,
            billingPeriodEnd: subscription.currentPeriodEnd,
            minutesIncluded: planLimits.monthlyMinuteAllowance || planFeatures.freeMinutes || 0,
            minutesUsed: 0,
            minutesOverage: 0,
            overageCost: 0.0,
            localCalls: 0,
            stdCalls: 0,
            isdCalls: 0,
            mobileCalls: 0,
            metadata: {
              perMinuteRate: planFeatures.perMinuteCharge || 1.99,
              billingCycle: subscription.billingCycle,
              planName: subscription.plan?.planName,
            },
          },
          { transaction }
        );
      }

      // Update minutes used
      const newMinutesUsed = usage.minutesUsed + Math.ceil(minutes);
      const minutesIncluded = usage.minutesIncluded || 0;

      // Calculate overage
      let minutesOverage = 0;
      let overageCost = 0;

      if (newMinutesUsed > minutesIncluded) {
        minutesOverage = newMinutesUsed - minutesIncluded;
        const perMinuteRate = usage.metadata?.perMinuteRate || 1.99;
        overageCost = minutesOverage * perMinuteRate;
      }

      // Update call type counter
      const callTypeField = `${callType}Calls`;
      const currentCallCount = usage[callTypeField] || 0;

      // Update usage record
      await usage.update(
        {
          minutesUsed: newMinutesUsed,
          minutesOverage,
          overageCost,
          [callTypeField]: currentCallCount + 1,
        },
        { transaction }
      );

      await transaction.commit();

      logger.info('Usage updated successfully', {
        subscriptionId,
        minutes,
        callType,
        newMinutesUsed,
        minutesOverage,
        overageCost,
      });

      return {
        minutesUsed: newMinutesUsed,
        minutesIncluded,
        minutesOverage,
        overageCost,
        remainingMinutes: Math.max(0, minutesIncluded - newMinutesUsed),
        percentageUsed: minutesIncluded > 0 ? (newMinutesUsed / minutesIncluded) * 100 : 0,
      };
    } catch (error) {
      await transaction.rollback();
      logger.error('Failed to update usage', {
        subscriptionId,
        minutes,
        error: error.message,
      });
      throw error;
    }
  }
}

module.exports = new UsageService();
