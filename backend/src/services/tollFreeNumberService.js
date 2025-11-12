/**
 * TollFreeNumber Service
 * Simplified business logic for toll-free number management
 */

const { sequelize } = require('../config/database');
const { TollFreeNumber, Tenant, Customer, Subscription, RatePlan } = require('../models');
const { NotFoundError, ValidationError, BusinessLogicError } = require('../utils/errors');
const logger = require('../utils/logger');

class TollFreeNumberService {
  /**
   * Get available toll-free numbers
   */
  async getAvailableNumbers(options = {}) {
    try {
      const { limit = 20, offset = 0, search } = options;

      const whereClause = { status: 'active' };

      if (search) {
        whereClause.number = {
          [require('sequelize').Op.iLike]: `%${search}%`
        };
      }

      const numbers = await TollFreeNumber.findAll({
        where: whereClause,
        limit,
        offset,
        order: [['number', 'ASC']],
        attributes: ['id', 'number', 'monthlyCost', 'setupCost', 'perMinuteCost'],
      });

      const total = await TollFreeNumber.count({ where: whereClause });

      return {
        numbers,
        pagination: {
          total,
          limit,
          offset,
          hasMore: offset + limit < total,
        },
      };
    } catch (error) {
      logger.error('Error getting available toll-free numbers:', error);
      throw error;
    }
  }

  /**
   * Assign toll-free number to customer
   */
  async assignNumberToCustomer(customerId, numberId, subscriptionId = null, transaction = null) {
    const useTransaction = transaction || await sequelize.transaction();
    const shouldCommit = !transaction;

    try {
      // Get customer with tenant
      const customer = await Customer.findByPk(customerId, {
        include: [{ model: Tenant, as: 'tenant' }],
        transaction: useTransaction,
      });
      if (!customer) {
        throw new NotFoundError('Customer not found');
      }

      // Get toll-free number
      const tollFreeNumber = await TollFreeNumber.findByPk(numberId, { transaction: useTransaction });
      if (!tollFreeNumber) {
        throw new NotFoundError('Toll-free number not found');
      }

      if (tollFreeNumber.status !== 'active') {
        throw new BusinessLogicError('Toll-free number is not available');
      }

      // Check customer's toll-free number limit for this subscription
      const assignedCount = await TollFreeNumber.count({
        where: {
          tenantId: customer.tenantId,
          status: 'inactive',
          config: {
            subscriptionId: subscriptionId
          }
        },
        transaction: useTransaction,
      });

      // Get customer's active subscription and plan limits
      const subscription = await Subscription.findOne({
        where: { 
          customerId, 
          status: { [require('sequelize').Op.in]: ['active', 'pending'] }
        },
        include: [{ model: RatePlan, as: 'plan' }],
        transaction: useTransaction,
      });

      if (!subscription) {
        throw new BusinessLogicError('No active subscription found');
      }

      const maxNumbers = subscription.plan?.limits?.maxTollFreeNumbers || 0;
      if (assignedCount >= maxNumbers) {
        throw new BusinessLogicError(`Maximum toll-free numbers limit reached (${maxNumbers})`);
      }

      // Assign number to tenant
      await tollFreeNumber.assignToTenant(customer.tenantId);

      // Store subscriptionId in config if provided
      if (subscriptionId) {
        tollFreeNumber.config = { subscriptionId };
        await tollFreeNumber.save({ transaction: useTransaction });
      }

      if (shouldCommit) {
        await useTransaction.commit();
      }

      logger.info('Toll-free number assigned', {
        numberId: tollFreeNumber.id,
        number: tollFreeNumber.number,
        customerId,
        tenantId: customer.tenantId,
      });

      return tollFreeNumber;
    } catch (error) {
      if (shouldCommit) {
        await useTransaction.rollback();
      }
      logger.error('Error assigning toll-free number:', error);
      throw error;
    }
  }

  /**
   * Get customer's assigned toll-free numbers
   */
  async getCustomerNumbers(customerId) {
    try {
      const customer = await Customer.findByPk(customerId);
      if (!customer) {
        throw new NotFoundError('Customer not found');
      }

      // Get customer's subscriptions
      const Subscription = require('../models').Subscription;
      const subscriptions = await Subscription.findAll({
        where: { customerId },
        attributes: ['id'],
      });
      const subscriptionIds = subscriptions.map(sub => sub.id);

      const numbers = await TollFreeNumber.findAll({
        where: { 
          tenantId: customer.tenantId, 
          status: 'inactive',
          config: {
            subscriptionId: { [require('sequelize').Op.in]: subscriptionIds }
          }
        },
        order: [['number', 'ASC']],
        attributes: ['id', 'number', 'monthlyCost', 'perMinuteCost', 'assignedAt'],
      });

      return numbers;
    } catch (error) {
      logger.error('Error getting customer toll-free numbers:', error);
      throw error;
    }
  }

  /**
   * Unassign toll-free number from customer
   */
  async unassignNumber(numberId) {
    const transaction = await sequelize.transaction();

    try {
      const tollFreeNumber = await TollFreeNumber.findByPk(numberId, { transaction });
      if (!tollFreeNumber) {
        throw new NotFoundError('Toll-free number not found');
      }

      if (tollFreeNumber.status !== 'inactive') {
        throw new BusinessLogicError('Toll-free number is not assigned');
      }

      await tollFreeNumber.unassign();

      await transaction.commit();

      logger.info('Toll-free number unassigned', {
        numberId: tollFreeNumber.id,
        number: tollFreeNumber.number,
      });

      return tollFreeNumber;
    } catch (error) {
      await transaction.rollback();
      logger.error('Error unassigning toll-free number:', error);
      throw error;
    }
  }

  /**
   * Get toll-free numbers by tenant
   */
  async getTenantNumbers(tenantId) {
    try {
      const numbers = await TollFreeNumber.findAll({
        where: { tenantId, status: 'inactive' },
        order: [['number', 'ASC']],
      });

      return numbers;
    } catch (error) {
      logger.error('Error getting tenant toll-free numbers:', error);
      throw error;
    }
  }
}

module.exports = new TollFreeNumberService();
