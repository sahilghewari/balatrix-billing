/**
 * Tenant Service
 * Business logic for multi-tenant management
 */

const { sequelize, kamailioSequelize } = require('../config/database');
const {
  Tenant,
  Extension,
  TollFreeNumber,
  RoutingRule,
  User,
} = require('../models');
const {
  NotFoundError,
  ValidationError,
  BusinessLogicError,
} = require('../utils/errors');
const logger = require('../utils/logger');
const { Op } = require('sequelize');

class TenantService {
  /**
   * Create a new tenant
   */
  async createTenant(tenantData, userId = null) {
    const transaction = await sequelize.transaction();

    try {
      // Validate tenant data
      if (!tenantData.name || !tenantData.name.trim()) {
        throw new ValidationError('Tenant name is required');
      }

      // Check if tenant name already exists
      const existingTenant = await Tenant.findOne({
        where: { name: tenantData.name.trim() },
        transaction,
      });

      if (existingTenant) {
        throw new BusinessLogicError('Tenant with this name already exists');
      }

      // Create tenant
      const tenant = await Tenant.create(
        {
          ...tenantData,
          name: tenantData.name.trim(),
          createdBy: userId || '876f5988-8f5b-46ab-8c95-ace011d36e39', // Use existing admin user if no user
        },
        { transaction }
      );

      await transaction.commit();
      logger.info(`Tenant created: ${tenant.name} by user ${userId}`);
      return tenant;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Get all tenants
   */
  async getAllTenants(options = {}) {
    const {
      page = 1,
      limit = 20,
      status,
      search,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
    } = options;

    const offset = (page - 1) * limit;
    const where = {};

    if (status) {
      where.isActive = status === 'active';
    }

    if (search) {
      where[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { description: { [Op.iLike]: `%${search}%` } },
        { domain: { [Op.iLike]: `%${search}%` } },
      ];
    }

    const { count, rows } = await Tenant.findAndCountAll({
      where,
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'username', 'email', 'firstName', 'lastName'],
        },
      ],
      limit,
      offset,
      order: [[sortBy, sortOrder]],
    });

    return {
      tenants: rows,
      pagination: {
        total: count,
        page,
        limit,
        pages: Math.ceil(count / limit),
      },
    };
  }

  /**
   * Get tenant by ID
   */
  async getTenantById(tenantId) {
    const tenant = await Tenant.findByPk(tenantId, {
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'username', 'email', 'firstName', 'lastName'],
        },
        // Temporarily commented out due to missing TollFreeNumbers table
        // {
        //   model: TollFreeNumber,
        //   as: 'tollFreeNumbers',
        //   where: { status: 'active' },
        //   required: false,
        // },
      ],
    });

    if (!tenant) {
      throw new NotFoundError('Tenant not found');
    }

    return tenant;
  }

  /**
   * Update tenant
   */
  async updateTenant(tenantId, updateData, userId) {
    const transaction = await sequelize.transaction();

    try {
      const tenant = await Tenant.findByPk(tenantId, { transaction });

      if (!tenant) {
        throw new NotFoundError('Tenant not found');
      }

      // Check if name is being updated and if it conflicts
      if (updateData.name && updateData.name !== tenant.name) {
        const existingTenant = await Tenant.findOne({
          where: { name: updateData.name, id: { [Op.ne]: tenantId } },
          transaction,
        });

        if (existingTenant) {
          throw new BusinessLogicError('Tenant with this name already exists');
        }
      }

      await tenant.update(updateData, { transaction });
      await transaction.commit();

      logger.info(`Tenant updated: ${tenant.name} by user ${userId}`);
      return tenant;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Create extension for tenant
   */
  async createExtension(tenantId, extensionData) {
    const transaction = await sequelize.transaction();

    try {
      // Verify tenant exists
      const tenant = await Tenant.findByPk(tenantId, { transaction });
      if (!tenant) {
        throw new NotFoundError('Tenant not found');
      }

      // Check if extension already exists
      const existingExtension = await Extension.findOne({
        where: {
          extension: extensionData.extension,
          domain: extensionData.domain || 'sip.balatrix.com',
        },
        transaction,
      });

      if (existingExtension) {
        throw new BusinessLogicError('Extension already exists');
      }

      // Create extension
      const extension = await Extension.create(
        {
          tenantId,
          extension: extensionData.extension,
          password: extensionData.password,
          domain: extensionData.domain || 'sip.balatrix.com',
          displayName: extensionData.displayName,
          config: extensionData.config || {},
        },
        { transaction }
      );

      await transaction.commit();

      logger.info(`Extension created: ${extension.extension} for tenant ${tenantId}`);
      return extension;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Get extensions for tenant
   */
  async getTenantExtensions(tenantId) {
    return await Extension.findActiveByTenant(tenantId);
  }

  /**
   * Assign toll-free number to tenant
   */
  async assignTollFreeNumber(tenantId, numberData) {
    const transaction = await sequelize.transaction();

    try {
      // Verify tenant exists
      const tenant = await Tenant.findByPk(tenantId, { transaction });
      if (!tenant) {
        throw new NotFoundError('Tenant not found');
      }

      // Check if number already exists
      const existingNumber = await TollFreeNumber.findByNumber(numberData.number);
      if (existingNumber) {
        throw new BusinessLogicError('Toll-free number already exists');
      }

      // Create toll-free number
      const tollFreeNumber = await TollFreeNumber.create(
        {
          tenantId,
          number: numberData.number,
          provider: numberData.provider || 'balatrix',
          monthlyCost: numberData.monthlyCost || 0,
          perMinuteCost: numberData.perMinuteCost || 0,
          config: numberData.config || {},
          assignedAt: new Date(),
        },
        { transaction }
      );

      await transaction.commit();

      logger.info(`Toll-free number assigned: ${tollFreeNumber.number} to tenant ${tenantId}`);
      return tollFreeNumber;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Create routing rule
   */
  async createRoutingRule(tenantId, ruleData) {
    const transaction = await sequelize.transaction();

    try {
      // Verify tenant exists
      const tenant = await Tenant.findByPk(tenantId, { transaction });
      if (!tenant) {
        throw new NotFoundError('Tenant not found');
      }

      // Verify toll-free number belongs to tenant
      const tollFreeNumber = await TollFreeNumber.findOne({
        where: { id: ruleData.tollFreeNumberId, tenantId },
        transaction,
      });

      if (!tollFreeNumber) {
        throw new NotFoundError('Toll-free number not found or does not belong to this tenant');
      }

      // Create routing rule
      const routingRule = await RoutingRule.create(
        {
          tollFreeNumberId: ruleData.tollFreeNumberId,
          tenantId,
          ruleType: ruleData.ruleType || 'extension',
          priority: ruleData.priority || 1,
          conditions: ruleData.conditions || {},
          actions: ruleData.actions || {},
          description: ruleData.description,
        },
        { transaction }
      );

      await transaction.commit();

      logger.info(`Routing rule created for tenant ${tenantId}, number ${tollFreeNumber.number}`);
      return routingRule;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Get routing rules for tenant
   */
  async getTenantRoutingRules(tenantId) {
    return await RoutingRule.findByTenant(tenantId);
  }
}

module.exports = new TenantService();