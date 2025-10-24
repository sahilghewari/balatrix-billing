/**
 * Kamailio Service
 * Handles synchronization of extensions between main database and Kamailio SIP server
 */

const { kamailioSequelize } = require('../config/database');
const { Extension, KamailioExtension } = require('../models');
const logger = require('../utils/logger');
const crypto = require('crypto');

class KamailioService {
  /**
   * Sync extension to Kamailio database
   * @param {Object} extension - Extension instance from main database
   * @returns {Promise<Object>} Sync result
   */
  async syncExtensionToKamailio(extension) {
    try {
      // Check if Kamailio database is available
      const isConnected = await this.validateConnection();
      if (!isConnected) {
        logger.warn(`Kamailio database not available, skipping sync for extension ${extension.extension}`);
        return {
          success: false,
          skipped: true,
          reason: 'Kamailio database not available',
        };
      }

      logger.info(`Syncing extension ${extension.extension} to Kamailio`);

      // Calculate HA1 and HA1B hashes for Kamailio authentication
      const ha1 = crypto.createHash('md5')
        .update(`${extension.extension}:${extension.domain}:${extension.password}`)
        .digest('hex');

      const ha1b = crypto.createHash('md5')
        .update(`${extension.extension}@${extension.domain}:sip.balatrix.com:${extension.password}`)
        .digest('hex');

      const subscriberData = {
        username: extension.extension,
        domain: extension.domain,
        password: extension.password,
        ha1: ha1,
        ha1b: ha1b,
      };

      // Upsert to Kamailio subscriber table
      const [subscriber, created] = await KamailioExtension.upsert(
        subscriberData,
        {
          returning: true,
        }
      );

      logger.info(`Extension ${extension.extension} ${created ? 'created' : 'updated'} in Kamailio subscriber table`);
      return {
        success: true,
        subscriber: subscriber,
        created,
      };
    } catch (error) {
      logger.error(`Failed to sync extension ${extension.extension} to Kamailio:`, error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Remove extension from Kamailio database
   * @param {string} extensionId - Extension ID
   * @returns {Promise<Object>} Removal result
   */
  async removeExtensionFromKamailio(extensionId) {
    try {
      // Check if Kamailio database is available
      const isConnected = await this.validateConnection();
      if (!isConnected) {
        logger.warn(`Kamailio database not available, skipping removal for extension ${extensionId}`);
        return { success: false, skipped: true, reason: 'Kamailio database not available' };
      }

      logger.info(`Removing extension ${extensionId} from Kamailio`);

      const deletedCount = await KamailioExtension.destroy({
        where: { id: extensionId },
      });

      if (deletedCount > 0) {
        logger.info(`Extension ${extensionId} removed from Kamailio database`);
        return { success: true, deleted: true };
      } else {
        logger.warn(`Extension ${extensionId} not found in Kamailio database`);
        return { success: true, deleted: false };
      }
    } catch (error) {
      logger.error(`Failed to remove extension ${extensionId} from Kamailio:`, error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Sync all active extensions for a tenant
   * @param {string} tenantId - Tenant ID
   * @returns {Promise<Object>} Sync result
   */
  async syncTenantExtensions(tenantId) {
    try {
      // Check if Kamailio database is available
      const isConnected = await this.validateConnection();
      if (!isConnected) {
        logger.warn(`Kamailio database not available, skipping tenant sync for ${tenantId}`);
        return {
          success: false,
          skipped: true,
          reason: 'Kamailio database not available',
          total: 0,
          successful: 0,
          failed: 0,
          results: [],
        };
      }

      logger.info(`Syncing all extensions for tenant ${tenantId} to Kamailio`);

      // Get all active extensions for the tenant
      const extensions = await Extension.findActiveByTenant(tenantId);

      const results = [];
      for (const extension of extensions) {
        try {
          const result = await this.syncExtensionToKamailio(extension);
          results.push({
            extensionId: extension.id,
            extension: extension.extension,
            success: result.success,
            created: result.created,
            skipped: result.skipped,
            error: result.error,
          });
        } catch (error) {
          logger.error(`Failed to sync extension ${extension.extension}:`, error);
          results.push({
            extensionId: extension.id,
            extension: extension.extension,
            success: false,
            error: error.message,
          });
        }
      }

      const successCount = results.filter(r => r.success).length;
      logger.info(`Synced ${successCount}/${extensions.length} extensions for tenant ${tenantId}`);

      return {
        success: true,
        total: extensions.length,
        successful: successCount,
        failed: extensions.length - successCount,
        results,
      };
    } catch (error) {
      logger.error(`Failed to sync tenant extensions ${tenantId}:`, error);
      throw error;
    }
  }

  /**
   * Get extension registration status from Kamailio
   * @param {string} extensionId - Extension ID
   * @returns {Promise<Object>} Registration status
   */
  async getExtensionRegistrationStatus(extensionId) {
    try {
      // This would typically query Kamailio's location table
      // For now, we'll return a mock status
      const extension = await Extension.findByPk(extensionId);
      if (!extension) {
        throw new Error('Extension not found');
      }

      // Mock registration status - in real implementation, this would query Kamailio
      const isRegistered = Math.random() > 0.3; // 70% chance of being registered
      const lastSeen = isRegistered ? new Date() : new Date(Date.now() - 3600000); // 1 hour ago

      return {
        extensionId,
        extension: extension.extension,
        domain: extension.domain,
        isRegistered,
        lastSeen,
        userAgent: isRegistered ? 'Zoiper/3.0.1' : null,
        contactUri: isRegistered ? `sip:${extension.extension}@${extension.domain}:5060` : null,
      };
    } catch (error) {
      logger.error(`Failed to get registration status for extension ${extensionId}:`, error);
      throw error;
    }
  }

  /**
   * Get active calls for an extension
   * @param {string} extensionId - Extension ID
   * @returns {Promise<Array>} Active calls
   */
  async getExtensionActiveCalls(extensionId) {
    try {
      // This would query Kamailio's dialog table or similar
      // For now, return mock data
      const extension = await Extension.findByPk(extensionId);
      if (!extension) {
        throw new Error('Extension not found');
      }

      // Mock active calls - in real implementation, this would query Kamailio
      const activeCalls = Math.random() > 0.7 ? [{
        callId: `call_${Date.now()}`,
        direction: 'inbound',
        remoteNumber: '+919876543210',
        startTime: new Date(Date.now() - 300000), // 5 minutes ago
        duration: 300,
        status: 'connected',
      }] : [];

      return activeCalls;
    } catch (error) {
      logger.error(`Failed to get active calls for extension ${extensionId}:`, error);
      throw error;
    }
  }

  /**
   * Validate Kamailio database connection
   * @returns {Promise<boolean>} Connection status
   */
  async validateConnection() {
    try {
      await kamailioSequelize.authenticate();
      logger.info('Kamailio database connection validated');
      return true;
    } catch (error) {
      logger.error('Kamailio database connection failed:', error);
      return false;
    }
  }

  /**
   * Initialize Kamailio database tables if they don't exist
   * @returns {Promise<Object>} Initialization result
   */
  async initializeTables() {
    try {
      // Check if Kamailio database is available
      const isConnected = await this.validateConnection();
      if (!isConnected) {
        logger.warn('Kamailio database not available, skipping table initialization');
        return { success: false, skipped: true, reason: 'Kamailio database not available' };
      }

      logger.info('Checking Kamailio database tables');

      // Check if Extensions table exists
      const tableExists = await kamailioSequelize.getQueryInterface().showAllTables();
      const extensionsTableExists = tableExists.includes('Extensions');

      if (extensionsTableExists) {
        logger.info('Extensions table exists in Kamailio database');
        return { success: true, tableExists: true };
      } else {
        logger.warn('Extensions table does not exist in Kamailio database - Kamailio sync will be skipped');
        return { success: true, tableExists: false, reason: 'Extensions table not found' };
      }
    } catch (error) {
      logger.error('Failed to check Kamailio tables:', error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = new KamailioService();