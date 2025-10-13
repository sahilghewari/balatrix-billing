/**
 * CDR Processor Service
 * Process Call Detail Records from FreeSWITCH
 */

const { sequelize } = require('../config/database');
const { CDR, Account, Subscription, RatePlan, DID } = require('../models');
const { NotFoundError, CDRError } = require('../utils/errors');
const logger = require('../utils/logger');
const { CDR_STATUS, CDR_DIRECTION } = require('../utils/constants');
const { addJob } = require('../config/queue');
const { Op } = require('sequelize');

class CDRProcessorService {
  /**
   * Process a single CDR
   */
  async processCDR(cdrData) {
    const transaction = await sequelize.transaction();

    try {
      const {
        uuid,
        callingNumber,
        calledNumber,
        callStartTime,
        callAnswerTime,
        callEndTime,
        duration,
        billsec,
        hangupCause,
        direction,
        accountId,
        didId,
      } = cdrData;

      // Check if CDR already exists
      const existingCDR = await CDR.findOne({ where: { uuid }, transaction });

      if (existingCDR) {
        logger.warn('CDR already exists', { uuid });
        throw new CDRError('CDR with this UUID already exists');
      }

      // Validate account
      const account = await Account.findByPk(accountId, {
        include: [
          {
            model: Subscription,
            as: 'subscriptions',
            where: { status: 'active' },
            include: [{ model: RatePlan, as: 'plan' }],
            required: false,
          },
        ],
        transaction,
      });

      if (!account) {
        throw new NotFoundError('Account not found');
      }

      // Validate DID if provided
      let did = null;
      if (didId) {
        did = await DID.findByPk(didId, { transaction });
        if (!did) {
          logger.warn('DID not found', { didId });
        }
      }

      // Create CDR record
      const cdr = await CDR.create(
        {
          uuid,
          accountId,
          didId: did?.id || null,
          callingNumber,
          calledNumber,
          callStartTime: new Date(callStartTime),
          callAnswerTime: callAnswerTime ? new Date(callAnswerTime) : null,
          callEndTime: new Date(callEndTime),
          duration,
          billsec,
          hangupCause,
          direction,
          processingStatus: CDR_STATUS.PENDING,
        },
        { transaction }
      );

      // Calculate cost
      await this.calculateCDRCost(cdr, account, transaction);

      // Mark as processed
      await cdr.markProcessed(transaction);

      // Deduct from account balance if prepaid
      if (account.accountType === 'prepaid' && cdr.calculatedCost > 0) {
        const hasBalance = await account.hasSufficientBalance(cdr.calculatedCost);

        if (!hasBalance) {
          logger.error('Insufficient balance for CDR', {
            accountId: account.id,
            balance: account.balance,
            cost: cdr.calculatedCost,
          });

          // Mark account as low balance
          account.lowBalanceAlert = true;
          await account.save({ transaction });

          // TODO: Send low balance notification
        } else {
          await account.deductBalance(cdr.calculatedCost, transaction);
          cdr.charged = true;
          await cdr.save({ transaction });
        }
      }

      await transaction.commit();

      logger.info('CDR processed successfully', {
        cdrId: cdr.id,
        uuid: cdr.uuid,
        cost: cdr.calculatedCost,
        accountId: account.id,
      });

      // Update subscription usage asynchronously
      if (account.subscriptions && account.subscriptions.length > 0) {
        const callType = this.determineCallType(calledNumber);
        await addJob('cdrProcessing', 'updateSubscriptionUsage', {
          subscriptionId: account.subscriptions[0].id,
          minutes: cdr.calculateBillableMinutes(),
          callType,
        });
      }

      return cdr;
    } catch (error) {
      await transaction.rollback();
      logger.error('CDR processing failed', {
        uuid: cdrData.uuid,
        error: error.message,
      });

      // Create failed CDR record for tracking
      try {
        await CDR.create({
          ...cdrData,
          callStartTime: new Date(cdrData.callStartTime),
          callAnswerTime: cdrData.callAnswerTime
            ? new Date(cdrData.callAnswerTime)
            : null,
          callEndTime: new Date(cdrData.callEndTime),
          processingStatus: CDR_STATUS.FAILED,
          processingError: error.message,
        });
      } catch (err) {
        logger.error('Failed to create failed CDR record', { error: err.message });
      }

      throw error;
    }
  }

  /**
   * Calculate CDR cost based on rate plan
   */
  async calculateCDRCost(cdr, account, transaction) {
    try {
      // Get active subscription with rate plan
      const subscription = account.subscriptions?.[0];

      if (!subscription || !subscription.ratePlan) {
        // No active subscription, use default rates
        const billableMinutes = cdr.calculateBillableMinutes();
        const defaultRatePerMinute = 0.5; // ₹0.50 per minute
        cdr.calculatedCost = billableMinutes * defaultRatePerMinute;
        await cdr.save({ transaction });
        return;
      }

      const ratePlan = subscription.ratePlan;

      // Calculate cost using rate plan's overage rate
      const billableMinutes = cdr.calculateBillableMinutes();
      cdr.calculatedCost = await cdr.calculateCost(ratePlan, transaction);
      await cdr.save({ transaction });

      logger.info('CDR cost calculated', {
        cdrId: cdr.id,
        billableMinutes,
        cost: cdr.calculatedCost,
        ratePlanId: ratePlan.id,
      });
    } catch (error) {
      logger.error('Failed to calculate CDR cost', {
        cdrId: cdr.id,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Process CDR batch
   */
  async processCDRBatch(cdrDataArray) {
    const results = {
      success: [],
      failed: [],
    };

    for (const cdrData of cdrDataArray) {
      try {
        const cdr = await this.processCDR(cdrData);
        results.success.push({ uuid: cdrData.uuid, cdrId: cdr.id });
      } catch (error) {
        results.failed.push({
          uuid: cdrData.uuid,
          error: error.message,
        });
      }
    }

    logger.info('CDR batch processed', {
      total: cdrDataArray.length,
      success: results.success.length,
      failed: results.failed.length,
    });

    return results;
  }

  /**
   * Get CDR by ID
   */
  async getCDRById(cdrId) {
    const cdr = await CDR.findByPk(cdrId, {
      include: [
        { model: Account, as: 'account' },
        { model: DID, as: 'did' },
      ],
    });

    if (!cdr) {
      throw new NotFoundError('CDR not found');
    }

    return cdr;
  }

  /**
   * Get CDRs with pagination and filtering
   */
  async getCDRs(options = {}) {
    const {
      page = 1,
      limit = 50,
      accountId,
      startDate,
      endDate,
      direction,
      processingStatus,
      sortBy = 'callStartTime',
      sortOrder = 'DESC',
    } = options;

    const offset = (page - 1) * limit;
    const where = {};

    if (accountId) {
      where.accountId = accountId;
    }

    if (startDate && endDate) {
      where.callStartTime = {
        [Op.between]: [startDate, endDate],
      };
    }

    if (direction) {
      where.direction = direction;
    }

    if (processingStatus) {
      where.processingStatus = processingStatus;
    }

    const { count, rows: cdrs } = await CDR.findAndCountAll({
      where,
      include: [
        {
          model: Account,
          as: 'account',
          attributes: ['id', 'accountType', 'balance'],
        },
        {
          model: DID,
          as: 'did',
          attributes: ['id', 'phoneNumber'],
        },
      ],
      limit,
      offset,
      order: [[sortBy, sortOrder]],
    });

    return {
      cdrs,
      pagination: {
        total: count,
        page,
        limit,
        totalPages: Math.ceil(count / limit),
      },
    };
  }

  /**
   * Get CDR statistics
   */
  async getCDRStatistics(options = {}) {
    const { accountId, startDate, endDate } = options;

    const where = {};

    if (accountId) {
      where.accountId = accountId;
    }

    if (startDate && endDate) {
      where.callStartTime = {
        [Op.between]: [startDate, endDate],
      };
    }

    const stats = await CDR.findAll({
      where,
      attributes: [
        [sequelize.fn('COUNT', sequelize.col('id')), 'totalCalls'],
        [sequelize.fn('SUM', sequelize.col('duration')), 'totalDuration'],
        [sequelize.fn('SUM', sequelize.col('billsec')), 'totalBillsec'],
        [sequelize.fn('SUM', sequelize.col('calculatedCost')), 'totalCost'],
        [
          sequelize.fn(
            'COUNT',
            sequelize.literal("CASE WHEN direction = 'inbound' THEN 1 END")
          ),
          'inboundCalls',
        ],
        [
          sequelize.fn(
            'COUNT',
            sequelize.literal("CASE WHEN direction = 'outbound' THEN 1 END")
          ),
          'outboundCalls',
        ],
        [
          sequelize.fn(
            'COUNT',
            sequelize.literal(
              "CASE WHEN hangup_cause = 'NORMAL_CLEARING' THEN 1 END"
            )
          ),
          'successfulCalls',
        ],
        [
          sequelize.fn('AVG', sequelize.col('duration')),
          'averageDuration',
        ],
      ],
      raw: true,
    });

    return stats[0] || {};
  }

  /**
   * Retry failed CDR processing
   */
  async retryFailedCDR(cdrId) {
    const cdr = await CDR.findByPk(cdrId);

    if (!cdr) {
      throw new NotFoundError('CDR not found');
    }

    if (cdr.processingStatus !== CDR_STATUS.FAILED) {
      throw new CDRError('CDR is not in failed status');
    }

    // Reset processing status
    cdr.processingStatus = CDR_STATUS.PENDING;
    cdr.processingError = null;
    await cdr.save();

    // Reprocess
    const cdrData = {
      uuid: cdr.uuid,
      callingNumber: cdr.callingNumber,
      calledNumber: cdr.calledNumber,
      callStartTime: cdr.callStartTime,
      callAnswerTime: cdr.callAnswerTime,
      callEndTime: cdr.callEndTime,
      duration: cdr.duration,
      billsec: cdr.billsec,
      hangupCause: cdr.hangupCause,
      direction: cdr.direction,
      accountId: cdr.accountId,
      didId: cdr.didId,
    };

    // Delete old CDR and create new one
    await cdr.destroy();

    return await this.processCDR(cdrData);
  }

  /**
   * Get failed CDRs for retry
   */
  async getFailedCDRs(limit = 100) {
    const cdrs = await CDR.findAll({
      where: {
        processingStatus: CDR_STATUS.FAILED,
      },
      limit,
      order: [['createdAt', 'ASC']],
    });

    return cdrs;
  }

  /**
   * Export CDRs to CSV
   */
  async exportCDRs(options = {}) {
    const { accountId, startDate, endDate } = options;

    const where = {};

    if (accountId) {
      where.accountId = accountId;
    }

    if (startDate && endDate) {
      where.callStartTime = {
        [Op.between]: [startDate, endDate],
      };
    }

    const cdrs = await CDR.findAll({
      where,
      include: [
        {
          model: Account,
          as: 'account',
          attributes: ['id'],
        },
      ],
      order: [['callStartTime', 'DESC']],
    });

    // Convert to CSV format
    const headers = [
      'UUID',
      'Account ID',
      'Calling Number',
      'Called Number',
      'Call Start Time',
      'Call Answer Time',
      'Call End Time',
      'Duration',
      'Billable Seconds',
      'Hangup Cause',
      'Direction',
      'Cost',
      'Status',
    ];

    const rows = cdrs.map((cdr) => [
      cdr.uuid,
      cdr.accountId,
      cdr.callingNumber,
      cdr.calledNumber,
      cdr.callStartTime,
      cdr.callAnswerTime || '',
      cdr.callEndTime,
      cdr.duration,
      cdr.billsec,
      cdr.hangupCause,
      cdr.direction,
      cdr.calculatedCost || 0,
      cdr.processingStatus,
    ]);

    const csv = [headers, ...rows].map((row) => row.join(',')).join('\n');

    return csv;
  }

  /**
   * Get call analytics
   */
  async getCallAnalytics(options = {}) {
    const { accountId, startDate, endDate, groupBy = 'day' } = options;

    const where = {};

    if (accountId) {
      where.accountId = accountId;
    }

    if (startDate && endDate) {
      where.callStartTime = {
        [Op.between]: [startDate, endDate],
      };
    }

    let dateFormat;
    switch (groupBy) {
      case 'hour':
        dateFormat = '%Y-%m-%d %H:00:00';
        break;
      case 'day':
        dateFormat = '%Y-%m-%d';
        break;
      case 'month':
        dateFormat = '%Y-%m';
        break;
      default:
        dateFormat = '%Y-%m-%d';
    }

    const analytics = await CDR.findAll({
      where,
      attributes: [
        [
          sequelize.fn('DATE_TRUNC', groupBy, sequelize.col('call_start_time')),
          'period',
        ],
        [sequelize.fn('COUNT', sequelize.col('id')), 'totalCalls'],
        [sequelize.fn('SUM', sequelize.col('billsec')), 'totalMinutes'],
        [sequelize.fn('SUM', sequelize.col('calculatedCost')), 'totalCost'],
        [sequelize.literal('direction'), 'direction'],
      ],
      group: ['period', 'direction'],
      order: [[sequelize.col('period'), 'ASC']],
      raw: true,
    });

    return analytics;
  }

  /**
   * Get top destinations
   */
  async getTopDestinations(options = {}) {
    const { accountId, startDate, endDate, limit = 10 } = options;

    const where = { direction: CDR_DIRECTION.OUTBOUND };

    if (accountId) {
      where.accountId = accountId;
    }

    if (startDate && endDate) {
      where.callStartTime = {
        [Op.between]: [startDate, endDate],
      };
    }

    const destinations = await CDR.findAll({
      where,
      attributes: [
        'calledNumber',
        [sequelize.fn('COUNT', sequelize.col('id')), 'callCount'],
        [sequelize.fn('SUM', sequelize.col('billsec')), 'totalMinutes'],
        [sequelize.fn('SUM', sequelize.col('calculatedCost')), 'totalCost'],
      ],
      group: ['calledNumber'],
      order: [[sequelize.fn('COUNT', sequelize.col('id')), 'DESC']],
      limit,
      raw: true,
    });

    return destinations;
  }

  /**
   * Determine call type based on called number
   * @param {string} calledNumber - Called number in E.164 format
   * @returns {string} - Call type: local, std, isd, or mobile
   */
  determineCallType(calledNumber) {
    // Remove country code prefix if present
    const number = calledNumber.replace(/^\+91/, '').replace(/^\+/, '');

    // Mobile numbers in India start with 6, 7, 8, 9 and are 10 digits
    if (/^[6-9]\d{9}$/.test(number)) {
      return 'mobile';
    }

    // International numbers (not India)
    if (calledNumber.startsWith('+') && !calledNumber.startsWith('+91')) {
      return 'isd';
    }

    // STD codes are typically 2-5 digits followed by 6-8 digits
    // For simplicity, numbers with STD code patterns
    if (/^0[1-9]\d{8,10}$/.test(number)) {
      return 'std';
    }

    // Default to local
    return 'local';
  }
}

module.exports = new CDRProcessorService();
