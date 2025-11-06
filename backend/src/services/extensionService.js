/**
 * Extension Service
 * Business logic for extension management with auto-assignment
 */

const { sequelize } = require('../config/database');
const { Extension, Tenant, Customer, Subscription, RatePlan } = require('../models');
const { NotFoundError, ValidationError, BusinessLogicError } = require('../utils/errors');
const logger = require('../utils/logger');
const crypto = require('crypto');

class ExtensionService {
  /**
   * Generate a unique base extension prefix for a customer
   * Returns a 4-digit number like 1001, 1002, etc.
   */
  async generateUniqueBasePrefix(tenantId, transaction = null) {
    const useTransaction = transaction || await sequelize.transaction();
    const shouldCommit = !transaction;

    try {
      // Find the highest existing base prefix for this tenant
      const existingExtensions = await Extension.findAll({
        where: { tenantId },
        attributes: ['extension'],
        transaction: useTransaction,
      });

      // Extract base prefixes (first 4 digits) from existing extensions
      const existingPrefixes = existingExtensions
        .map(ext => ext.extension.substring(0, 4))
        .filter(prefix => /^\d{4}$/.test(prefix)) // Only numeric 4-digit prefixes
        .map(prefix => parseInt(prefix))
        .filter(prefix => prefix >= 1000 && prefix <= 9999); // Valid range

      // Start from 1001 if no existing prefixes
      let nextPrefix = 1001;

      if (existingPrefixes.length > 0) {
        const maxPrefix = Math.max(...existingPrefixes);
        nextPrefix = maxPrefix + 1;

        // Ensure we don't exceed 9999
        if (nextPrefix > 9999) {
          throw new BusinessLogicError('Maximum extension prefixes reached for this tenant');
        }
      }

      if (shouldCommit) {
        await useTransaction.commit();
      }

      return nextPrefix.toString();
    } catch (error) {
      if (shouldCommit) {
        await useTransaction.rollback();
      }
      logger.error('Error generating unique base prefix:', error);
      throw error;
    }
  }

  /**
   * Generate extension numbers for a base prefix
   * For basePrefix 1001 and count 2, returns ['100101', '100102']
   */
  generateExtensionNumbers(basePrefix, count) {
    const extensions = [];
    for (let i = 1; i <= count; i++) {
      extensions.push(`${basePrefix}${i.toString().padStart(2, '0')}`);
    }
    return extensions;
  }

  /**
   * Auto-assign extensions to customer based on plan
   */
  async autoAssignExtensionsToCustomer(customerId, subscriptionId, transaction = null) {
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

      // Get subscription with plan
      const subscription = await Subscription.findByPk(subscriptionId, {
        include: [{ model: RatePlan, as: 'plan' }],
        transaction: useTransaction,
      });
      if (!subscription) {
        throw new NotFoundError('Subscription not found');
      }

      // Get plan features for extensions
      const planFeatures = subscription.plan?.features || {};
      const planLimits = subscription.plan?.limits || {};
      const includedExtensions = planFeatures.extensions || planLimits.maxExtensions || 0;

      if (includedExtensions <= 0) {
        logger.info('No extensions to assign for this plan', { subscriptionId, planType: subscription.plan?.planType });
        if (shouldCommit) {
          await useTransaction.commit();
        }
        return { assignedExtensions: [], basePrefix: null };
      }

      // Generate unique base prefix for this customer
      const basePrefix = await this.generateUniqueBasePrefix(customer.tenantId, useTransaction);

      // Generate extension numbers
      const extensionNumbers = this.generateExtensionNumbers(basePrefix, includedExtensions);

      // Create extensions in database
      const assignedExtensions = [];
      for (const extensionNumber of extensionNumbers) {
        // Generate a secure password
        const password = crypto.randomBytes(8).toString('hex');

        const extension = await Extension.create({
          tenantId: customer.tenantId,
          extension: extensionNumber,
          password: password,
          domain: 'sip.balatrix.com',
          displayName: `Extension ${extensionNumber}`,
          isActive: true,
          config: {
            subscriptionId: subscriptionId,
            basePrefix: basePrefix,
            extensionIndex: parseInt(extensionNumber.substring(4)),
            assignedAt: new Date(),
            customerId: customerId,
          },
        }, { transaction: useTransaction });

        assignedExtensions.push({
          id: extension.id,
          extension: extension.extension,
          password: password,
          displayName: extension.displayName,
        });
      }

      if (shouldCommit) {
        await useTransaction.commit();
      }

      logger.info('Extensions auto-assigned to customer', {
        customerId,
        subscriptionId,
        basePrefix,
        assignedCount: assignedExtensions.length,
        extensions: extensionNumbers,
      });

      return {
        assignedExtensions,
        basePrefix,
        totalAssigned: assignedExtensions.length,
      };
    } catch (error) {
      if (shouldCommit) {
        await useTransaction.rollback();
      }
      logger.error('Error auto-assigning extensions:', error);
      throw error;
    }
  }

  /**
   * Get customer's assigned extensions
   */
  async getCustomerExtensions(customerId, subscriptionId = null) {
    try {
      // Get customer with tenant
      const customer = await Customer.findByPk(customerId, {
        include: [{ model: Tenant, as: 'tenant' }],
      });
      if (!customer) {
        throw new NotFoundError('Customer not found');
      }

      const whereClause = {
        tenantId: customer.tenantId,
        isActive: true,
      };

      // If subscriptionId provided, filter by subscription
      if (subscriptionId) {
        whereClause.config = {
          subscriptionId: subscriptionId,
        };
      }

      const extensions = await Extension.findAll({
        where: whereClause,
        attributes: ['id', 'extension', 'displayName', 'config', 'createdAt'],
        order: [['extension', 'ASC']],
      });

      return extensions.map(ext => ({
        id: ext.id,
        extension: ext.extension,
        displayName: ext.displayName,
        basePrefix: ext.config?.basePrefix,
        extensionIndex: ext.config?.extensionIndex,
        subscriptionId: ext.config?.subscriptionId,
        assignedAt: ext.config?.assignedAt,
        createdAt: ext.createdAt,
      }));
    } catch (error) {
      logger.error('Error getting customer extensions:', error);
      throw error;
    }
  }

  /**
   * Get extension by number
   */
  async getExtensionByNumber(extensionNumber, domain = 'sip.balatrix.com') {
    try {
      const extension = await Extension.findByExtension(extensionNumber, domain);
      return extension;
    } catch (error) {
      logger.error('Error getting extension by number:', error);
      throw error;
    }
  }
}

module.exports = new ExtensionService();