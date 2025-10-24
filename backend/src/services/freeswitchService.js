/**
 * FreeSWITCH Service
 * Lightweight abstraction for querying FreeSWITCH-related state.
 * This is a small, pluggable skeleton — expand with real DB queries or
 * ESL (Event Socket Library) interactions as needed.
 */

const { freeswitchSequelize } = require('../config/database');
const logger = require('../utils/logger');

class FreeSWITCHService {
  async validateConnection() {
    try {
      await freeswitchSequelize.authenticate();
      logger.info('FreeSWITCH database connection validated');
      return true;
    } catch (error) {
      logger.warn('FreeSWITCH DB not available:', error.message);
      return false;
    }
  }

  /**
   * Get active calls for an extension. This is a best-effort fallback used
   * when Kamailio is unavailable. By default returns an empty array. Implement
   * real queries against FreeSWITCH DB or ESL as needed.
   * @param {string} extensionId
   * @returns {Promise<Array>} list of active calls
   */
  async getExtensionActiveCalls(extensionId) {
    // Placeholder implementation: you can query FreeSWITCH DB tables here
    try {
      const connected = await this.validateConnection();
      if (!connected) return [];

      // Example: if a 'calls' table exists we could query it. For now return empty.
      return [];
    } catch (error) {
      logger.error('Error fetching FreeSWITCH active calls:', error);
      throw error;
    }
  }
}

module.exports = new FreeSWITCHService();
