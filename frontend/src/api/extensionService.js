/**
 * Extension API Service
 * Handles extension management operations
 */

import axios from './axios';

const extensionService = {
  // Get all extensions (admin only)
  getExtensions: async (params = {}) => {
    const response = await axios.get('/extensions', { params });
    return response.data;
  },

  // Get all extensions for a tenant
  getTenantExtensions: async (tenantId, params = {}) => {
    const response = await axios.get(`/extensions/tenant/${tenantId}`, { params });
    return response.data;
  },

  // Get extension by ID
  getExtension: async (extensionId) => {
    const response = await axios.get(`/extensions/${extensionId}`);
    return response.data;
  },

  // Create new extension
  createExtension: async (extensionData) => {
    const response = await axios.post('/extensions', extensionData);
    return response.data;
  },

  // Update extension
  updateExtension: async (extensionId, extensionData) => {
    const response = await axios.put(`/extensions/${extensionId}`, extensionData);
    return response.data;
  },

  // Delete extension
  deleteExtension: async (extensionId) => {
    const response = await axios.delete(`/extensions/${extensionId}`);
    return response.data;
  },

  // Get extension registration status
  getExtensionRegistrationStatus: async (extensionId) => {
    const response = await axios.get(`/extensions/${extensionId}/register-status`);
    return response.data.data;
  },

  // Sync extension with Kamailio/FreeSWITCH
  syncExtension: async (extensionId) => {
    const response = await axios.post(`/extensions/${extensionId}/sync`);
    return response.data;
  },

  // Reset extension password
  resetExtensionPassword: async (extensionId, newPassword) => {
    const response = await axios.post(`/extensions/${extensionId}/reset-password`, { newPassword });
    return response.data.data;
  },
};

export default extensionService;