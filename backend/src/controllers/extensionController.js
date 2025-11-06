/**
 * Extension Controller
 * Handles extension management and Kamailio synchronization
 */

const { Extension, Tenant } = require('../models');
const { Op } = require('sequelize');
const kamailioService = require('../services/kamailioService');
const freeswitchService = require('../services/freeswitchService');
const { successResponse, errorResponse, validationErrorResponse } = require('../utils/responseHandler');
const logger = require('../utils/logger');

/**
 * Get all extensions for a tenant
 */
const getExtensions = async (req, res) => {
  try {
    const { tenantId } = req.params;
    const { page = 1, limit = 20, search, isActive } = req.query;

    // Verify tenant access
    const tenant = await Tenant.findByPk(tenantId);
    if (!tenant) {
      return errorResponse(res, 'Tenant not found', 404);
    }

    // Build where clause
    const whereClause = { tenantId };
    if (search) {
      whereClause[Op.or] = [
        { extension: { [Op.iLike]: `%${search}%` } },
        { displayName: { [Op.iLike]: `%${search}%` } },
      ];
    }
    if (isActive !== undefined) {
      whereClause.isActive = isActive === 'true';
    }

    const offset = (page - 1) * limit;
    const { count, rows: extensions } = await Extension.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: Tenant,
          as: 'tenant',
          attributes: ['id', 'name', 'domain'],
        },
      ],
      limit: parseInt(limit),
      offset,
      order: [['createdAt', 'DESC']],
    });

    const totalPages = Math.ceil(count / limit);

    const pagination = {
      total: count,
      page: parseInt(page),
      limit: parseInt(limit),
      pages: totalPages,
    };

    // Transform extensions to frontend format
    const transformedExtensions = extensions.map(ext => ({
      ...ext.toJSON(),
      extensionNumber: ext.extension,
      description: ext.displayName,
    }));

    successResponse(res, { extensions: transformedExtensions, pagination }, 'Extensions retrieved successfully');
  } catch (error) {
    logger.error('Error getting extensions:', error);
    errorResponse(res, 'Failed to retrieve extensions');
  }
};

/**
 * Get all extensions (admin view)
 */
const getAllExtensions = async (req, res) => {
  try {
    const { page = 1, limit = 20, search, tenantId, isActive } = req.query;

    // Build where clause
    const whereClause = {};
    if (search) {
      whereClause[Op.or] = [
        { extension: { [Op.iLike]: `%${search}%` } },
        { displayName: { [Op.iLike]: `%${search}%` } },
      ];
    }
    if (tenantId) {
      whereClause.tenantId = tenantId;
    }
    if (isActive !== undefined) {
      whereClause.isActive = isActive === 'true';
    }

    const offset = (page - 1) * limit;
    const { count, rows: extensions } = await Extension.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: Tenant,
          as: 'tenant',
          attributes: ['id', 'name', 'domain'],
        },
      ],
      limit: parseInt(limit),
      offset,
      order: [['createdAt', 'DESC']],
    });

    const pagination = {
      page: parseInt(page),
      limit: parseInt(limit),
      pages: Math.ceil(count / limit),
      total: count,
    };

    // Transform extensions to frontend format
    const transformedExtensions = extensions.map(ext => ({
      ...ext.toJSON(),
      extensionNumber: ext.extension,
      description: ext.displayName,
    }));

    successResponse(res, { extensions: transformedExtensions, pagination }, 'Extensions retrieved successfully');
  } catch (error) {
    logger.error('Error getting all extensions:', error);
    errorResponse(res, 'Failed to retrieve extensions');
  }
};

/**
 * Get extension by ID
 */
const getExtension = async (req, res) => {
  try {
    const { id } = req.params;

    const extension = await Extension.findByPk(id, {
      include: [
        {
          model: Tenant,
          as: 'tenant',
          attributes: ['id', 'name', 'domain'],
        },
      ],
    });

    if (!extension) {
      return errorResponse(res, 'Extension not found', 404);
    }

    // Transform to frontend format
    const extensionData = {
      ...extension.toJSON(),
      extensionNumber: extension.extension,
      description: extension.displayName,
    };

    successResponse(res, { extension: extensionData }, 'Extension retrieved successfully');
  } catch (error) {
    logger.error('Error getting extension:', error);
    errorResponse(res, 'Failed to retrieve extension');
  }
};

/**
 * Create new extension
 */
const createExtension = async (req, res) => {
  try {
    const { tenantId, extensionNumber, password, description, isActive, config } = req.body;

    // Validate required fields
    if (!tenantId || !extensionNumber || !password) {
      return validationErrorResponse(res, 'Tenant ID, extension number, and password are required');
    }

    // Verify tenant exists
    const tenant = await Tenant.findByPk(tenantId);
    if (!tenant) {
      return errorResponse(res, 'Tenant not found', 404);
    }

    // Check if extension already exists
    const existingExtension = await Extension.findByExtension(extensionNumber);
    if (existingExtension) {
      return validationErrorResponse(res, 'Extension number already exists');
    }

    // Create extension in main database
    const newExtension = await Extension.create({
      tenantId,
      extension: extensionNumber,
      password,
      displayName: description || extensionNumber,
      isActive: isActive !== undefined ? isActive : true,
      config: config || {},
    });

    // Sync to Kamailio
    try {
      await kamailioService.syncExtensionToKamailio(newExtension);
      logger.info(`Extension ${extensionNumber} synced to Kamailio successfully`);
    } catch (syncError) {
      logger.error(`Failed to sync extension ${extensionNumber} to Kamailio:`, syncError);
      // Don't fail the request, but log the error
    }

    // Fetch with tenant info
    const extensionWithTenant = await Extension.findByPk(newExtension.id, {
      include: [
        {
          model: Tenant,
          as: 'tenant',
          attributes: ['id', 'name', 'domain'],
        },
      ],
    });

    // Transform to frontend format
    const extensionData = {
      ...extensionWithTenant.toJSON(),
      extensionNumber: extensionWithTenant.extension,
      description: extensionWithTenant.displayName,
    };

    successResponse(res, { extension: extensionData }, 'Extension created successfully', 201);
  } catch (error) {
    logger.error('Error creating extension:', error);
    logger.error('Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
    });
    errorResponse(res, `Failed to create extension: ${error.message}`);
  }
};

/**
 * Update extension
 */
const updateExtension = async (req, res) => {
  try {
    const { id } = req.params;
    const { extensionNumber, password, description, isActive, config } = req.body;

    const extensionRecord = await Extension.findByPk(id);
    if (!extensionRecord) {
      return errorResponse(res, 'Extension not found', 404);
    }

    // Check if extension number conflicts (if changing)
    if (extensionNumber && extensionNumber !== extensionRecord.extension) {
      const existingExtension = await Extension.findByExtension(extensionNumber);
      if (existingExtension) {
        return validationErrorResponse(res, 'Extension number already exists');
      }
    }

    // Update extension
    await extensionRecord.update({
      extension: extensionNumber || extensionRecord.extension,
      password: password || extensionRecord.password,
      displayName: description || extensionRecord.displayName,
      isActive: isActive !== undefined ? isActive : extensionRecord.isActive,
      config: config || extensionRecord.config,
    });

    // Sync to Kamailio
    try {
      await kamailioService.syncExtensionToKamailio(extensionRecord);
      logger.info(`Extension ${extensionRecord.extension} updated in Kamailio successfully`);
    } catch (syncError) {
      logger.error(`Failed to sync extension ${extensionRecord.extension} to Kamailio:`, syncError);
    }

    // Fetch updated extension with tenant info
    const updatedExtension = await Extension.findByPk(id, {
      include: [
        {
          model: Tenant,
          as: 'tenant',
          attributes: ['id', 'name', 'domain'],
        },
      ],
    });

    // Transform to frontend format
    const extensionData = {
      ...updatedExtension.toJSON(),
      extensionNumber: updatedExtension.extension,
      description: updatedExtension.displayName,
    };

    successResponse(res, { extension: extensionData }, 'Extension updated successfully');
  } catch (error) {
    logger.error('Error updating extension:', error);
    errorResponse(res, 'Failed to update extension');
  }
};

/**
 * Delete extension
 */
const deleteExtension = async (req, res) => {
  try {
    const { id } = req.params;

    const extension = await Extension.findByPk(id);
    if (!extension) {
      return errorResponse(res, 'Extension not found', 404);
    }

    // Remove from Kamailio first
    try {
      await kamailioService.removeExtensionFromKamailio(id);
      logger.info(`Extension ${extension.extension} removed from Kamailio successfully`);
    } catch (syncError) {
      logger.error(`Failed to remove extension ${extension.extension} from Kamailio:`, syncError);
      // Continue with deletion even if Kamailio sync fails
    }

    // Delete from main database
    await extension.destroy();

    successResponse(res, 'Extension deleted successfully');
  } catch (error) {
    logger.error('Error deleting extension:', error);
    errorResponse(res, 'Failed to delete extension');
  }
};

/**
 * Get extension registration status
 */
const getExtensionRegistrationStatus = async (req, res) => {
  try {
    const { id } = req.params;

    const extension = await Extension.findByPk(id);
    if (!extension) {
      return errorResponse(res, 'Extension not found', 404);
    }

    const status = await kamailioService.getExtensionRegistrationStatus(id);

    successResponse(res, { status }, 'Registration status retrieved successfully');
  } catch (error) {
    logger.error('Error getting extension registration status:', error);
    errorResponse(res, 'Failed to retrieve registration status');
  }
};

/**
 * Get extension active calls
 */
const getExtensionActiveCalls = async (req, res) => {
  try {
    const { id } = req.params;

    const extension = await Extension.findByPk(id);
    if (!extension) {
      return errorResponse(res, 'Extension not found', 404);
    }

    // Try Kamailio first; if it fails or is unavailable, fall back to FreeSWITCH
    let activeCalls = [];
    try {
      activeCalls = await kamailioService.getExtensionActiveCalls(id);
    } catch (err) {
      logger.warn(`Kamailio call-status failed for extension ${id}, falling back to FreeSWITCH: ${err && err.message}`);
      try {
        activeCalls = await freeswitchService.getExtensionActiveCalls(id);
      } catch (fsErr) {
        logger.error(`FreeSWITCH call-status failed for extension ${id}:`, fsErr);
        return errorResponse(res, 'Failed to retrieve active calls');
      }
    }

    successResponse(res, { activeCalls }, 'Active calls retrieved successfully');
  } catch (error) {
    logger.error('Error getting extension active calls:', error);
    errorResponse(res, 'Failed to retrieve active calls');
  }
};

/**
 * Reset extension password
 */
const resetExtensionPassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;

    if (!newPassword) {
      return validationErrorResponse(res, 'New password is required');
    }

    const extension = await Extension.findByPk(id);
    if (!extension) {
      return errorResponse(res, 'Extension not found', 404);
    }

    // Update password
    await extension.update({ password: newPassword });

    // Sync to Kamailio
    try {
      await kamailioService.syncExtensionToKamailio(extension);
      logger.info(`Extension ${extension.extension} password reset synced to Kamailio`);
    } catch (syncError) {
      logger.error(`Failed to sync password reset for extension ${extension.extension} to Kamailio:`, syncError);
    }

    successResponse(res, 'Extension password reset successfully');
  } catch (error) {
    logger.error('Error resetting extension password:', error);
    errorResponse(res, 'Failed to reset extension password');
  }
};

/**
 * Sync extension to Kamailio/FreeSWITCH
 */
const syncExtension = async (req, res) => {
  try {
    const { id } = req.params;

    const extension = await Extension.findByPk(id);
    if (!extension) {
      return errorResponse(res, 'Extension not found', 404);
    }

    // Try Kamailio first, then FreeSWITCH as fallback
    let result;
    try {
      result = await kamailioService.syncExtensionToKamailio(extension);
    } catch (kamailioError) {
      logger.warn(`Kamailio sync failed for extension ${extension.extensionNumber}, trying FreeSWITCH:`, kamailioError.message);
      try {
        result = await freeswitchService.syncExtensionToFreeSWITCH(extension);
      } catch (freeswitchError) {
        logger.error(`Both Kamailio and FreeSWITCH sync failed for extension ${extension.extensionNumber}:`, freeswitchError.message);
        return errorResponse(res, 'Failed to sync extension to both Kamailio and FreeSWITCH');
      }
    }

    successResponse(res, { result }, 'Extension synced successfully');
  } catch (error) {
    logger.error('Error syncing extension:', error);
    errorResponse(res, 'Failed to sync extension');
  }
};

/**
 * Sync tenant extensions to Kamailio
 */
const syncTenantExtensions = async (req, res) => {
  try {
    const { tenantId } = req.params;

    // Verify tenant exists
    const tenant = await Tenant.findByPk(tenantId);
    if (!tenant) {
      return errorResponse(res, 'Tenant not found', 404);
    }

    const result = await kamailioService.syncTenantExtensions(tenantId);

    successResponse(res, { result }, 'Tenant extensions synced successfully');
  } catch (error) {
    logger.error('Error syncing tenant extensions:', error);
    errorResponse(res, 'Failed to sync tenant extensions');
  }
};

/**
 * Get current user's extensions
 * GET /api/extensions/my-extensions
 */
const getMyExtensions = async (req, res) => {
  try {
    const userId = req.userId;

    // Get user's customer record
    const { Customer, Subscription } = require('../models');
    const customer = await Customer.findOne({
      where: { userId },
    });

    if (!customer) {
      return successResponse(res, [], 'No customer record found');
    }

    // Get customer's active subscription
    const activeSubscription = await Subscription.findOne({
      where: {
        customerId: customer.id,
        status: 'active',
      },
      order: [['createdAt', 'DESC']], // Get the most recent active subscription
    });

    if (!activeSubscription) {
      return successResponse(res, [], 'No active subscription found');
    }

    // Get extensions using the extension service, filtered by subscription
    const extensionService = require('../services/extensionService');
    const extensions = await extensionService.getCustomerExtensions(customer.id, activeSubscription.id);

    return successResponse(res, extensions, 'Your extensions retrieved successfully');
  } catch (error) {
    logger.error('Error getting user extensions:', error);
    return errorResponse(res, 'Failed to retrieve extensions', 500);
  }
};

/**
 * Reset password for customer's own extension
 * POST /api/extensions/my-extensions/:id/reset-password
 */
const resetMyExtensionPassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;
    const userId = req.userId;

    // Get user's customer record and active subscription
    const { Customer, Subscription } = require('../models');
    const customer = await Customer.findOne({
      where: { userId },
    });

    if (!customer) {
      return errorResponse(res, 'Customer not found', 404);
    }

    const activeSubscription = await Subscription.findOne({
      where: {
        customerId: customer.id,
        status: 'active',
      },
      order: [['createdAt', 'DESC']],
    });

    if (!activeSubscription) {
      return errorResponse(res, 'No active subscription found', 404);
    }

    // Verify extension belongs to customer's active subscription
    const extension = await Extension.findOne({
      where: {
        id,
        config: {
          subscriptionId: activeSubscription.id,
        },
      },
    });

    if (!extension) {
      return errorResponse(res, 'Extension not found or does not belong to your subscription', 404);
    }

    // Use provided password or generate new one
    let passwordToSet = newPassword;
    if (!passwordToSet) {
      const crypto = require('crypto');
      passwordToSet = crypto.randomBytes(8).toString('hex');
    }

    // Validate password length if provided
    if (newPassword && newPassword.length < 6) {
      return validationErrorResponse(res, 'Password must be at least 6 characters long');
    }

    // Update password
    await extension.update({ password: passwordToSet });

    // Sync to Kamailio
    try {
      await kamailioService.syncExtensionToKamailio(extension);
      logger.info(`Extension ${extension.extension} password reset synced to Kamailio`);
    } catch (syncError) {
      logger.error(`Failed to sync password reset for extension ${extension.extension} to Kamailio:`, syncError);
    }

    successResponse(res, {
      extension: extension.extension,
      newPassword: passwordToSet,
    }, 'Extension password reset successfully');
  } catch (error) {
    logger.error('Error resetting customer extension password:', error);
    errorResponse(res, 'Failed to reset extension password');
  }
};

/**
 * Sync customer's own extension
 * POST /api/extensions/my-extensions/:id/sync
 */
const syncMyExtension = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    // Get user's customer record and active subscription
    const { Customer, Subscription } = require('../models');
    const customer = await Customer.findOne({
      where: { userId },
    });

    if (!customer) {
      return errorResponse(res, 'Customer not found', 404);
    }

    const activeSubscription = await Subscription.findOne({
      where: {
        customerId: customer.id,
        status: 'active',
      },
      order: [['createdAt', 'DESC']],
    });

    if (!activeSubscription) {
      return errorResponse(res, 'No active subscription found', 404);
    }

    // Verify extension belongs to customer's active subscription
    const extension = await Extension.findOne({
      where: {
        id,
        config: {
          subscriptionId: activeSubscription.id,
        },
      },
    });

    if (!extension) {
      return errorResponse(res, 'Extension not found or does not belong to your subscription', 404);
    }

    // Try Kamailio first, then FreeSWITCH as fallback
    let result;
    try {
      result = await kamailioService.syncExtensionToKamailio(extension);
    } catch (kamailioError) {
      logger.warn(`Kamailio sync failed for extension ${extension.extension}, trying FreeSWITCH:`, kamailioError.message);
      try {
        result = await freeswitchService.syncExtensionToFreeSWITCH(extension);
      } catch (freeswitchError) {
        logger.error(`Both Kamailio and FreeSWITCH sync failed for extension ${extension.extension}:`, freeswitchError.message);
        return errorResponse(res, 'Failed to sync extension to both Kamailio and FreeSWITCH');
      }
    }

    successResponse(res, result, 'Extension synced successfully');
  } catch (error) {
    logger.error('Error syncing customer extension:', error);
    errorResponse(res, 'Failed to sync extension');
  }
};

/**
 * Get current password for customer's own extension
 * GET /api/extensions/my-extensions/:id/password
 */
const getMyExtensionPassword = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    // Get user's customer record and active subscription
    const { Customer, Subscription } = require('../models');
    const customer = await Customer.findOne({
      where: { userId },
    });

    if (!customer) {
      return errorResponse(res, 'Customer not found', 404);
    }

    const activeSubscription = await Subscription.findOne({
      where: {
        customerId: customer.id,
        status: 'active',
      },
      order: [['createdAt', 'DESC']],
    });

    if (!activeSubscription) {
      return errorResponse(res, 'No active subscription found', 404);
    }

    // Verify extension belongs to customer's active subscription
    const extension = await Extension.findOne({
      where: {
        id,
        config: {
          subscriptionId: activeSubscription.id,
        },
      },
    });

    if (!extension) {
      return errorResponse(res, 'Extension not found or does not belong to your subscription', 404);
    }

    successResponse(res, {
      extension: extension.extension,
      password: extension.password,
    }, 'Extension password retrieved successfully');
  } catch (error) {
    logger.error('Error getting customer extension password:', error);
    errorResponse(res, 'Failed to retrieve extension password');
  }
};

/**
 * Update password for customer's own extension
 * PUT /api/extensions/my-extensions/:id/password
 */
const updateMyExtensionPassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;
    const userId = req.userId;

    if (!newPassword || newPassword.length < 6) {
      return validationErrorResponse(res, 'Password must be at least 6 characters long');
    }

    // Get user's customer record and active subscription
    const { Customer, Subscription } = require('../models');
    const customer = await Customer.findOne({
      where: { userId },
    });

    if (!customer) {
      return errorResponse(res, 'Customer not found', 404);
    }

    const activeSubscription = await Subscription.findOne({
      where: {
        customerId: customer.id,
        status: 'active',
      },
      order: [['createdAt', 'DESC']],
    });

    if (!activeSubscription) {
      return errorResponse(res, 'No active subscription found', 404);
    }

    // Verify extension belongs to customer's active subscription
    const extension = await Extension.findOne({
      where: {
        id,
        config: {
          subscriptionId: activeSubscription.id,
        },
      },
    });

    if (!extension) {
      return errorResponse(res, 'Extension not found or does not belong to your subscription', 404);
    }

    // Update password
    await extension.update({ password: newPassword });

    // Sync to Kamailio
    try {
      await kamailioService.syncExtensionToKamailio(extension);
      logger.info(`Extension ${extension.extension} password update synced to Kamailio`);
    } catch (syncError) {
      logger.error(`Failed to sync password update for extension ${extension.extension} to Kamailio:`, syncError);
    }

    successResponse(res, {
      extension: extension.extension,
      message: 'Password updated successfully',
    }, 'Extension password updated successfully');
  } catch (error) {
    logger.error('Error updating customer extension password:', error);
    errorResponse(res, 'Failed to update extension password');
  }
};

module.exports = {
  getExtensions,
  getAllExtensions,
  getExtension,
  createExtension,
  updateExtension,
  deleteExtension,
  getExtensionRegistrationStatus,
  getExtensionActiveCalls,
  resetExtensionPassword,
  syncExtension,
  syncTenantExtensions,
  getMyExtensions,
  resetMyExtensionPassword,
  syncMyExtension,
  getMyExtensionPassword,
  updateMyExtensionPassword,
};