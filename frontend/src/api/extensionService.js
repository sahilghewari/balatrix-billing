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

  // Get current user's extensions
  getMyExtensions: async () => {
    const response = await axios.get('/extensions/my-extensions');
    return response;
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

  // Reset extension password (admin only)
  resetExtensionPassword: async (extensionId, newPassword) => {
    const response = await axios.post(`/extensions/${extensionId}/reset-password`, { newPassword });
    return response.data.data;
  },

  // Customer-specific extension management
  resetMyExtensionPassword: async (extensionId, newPassword) => {
    const response = await axios.post(`/extensions/my-extensions/${extensionId}/reset-password`, { newPassword });
    return response.data;
  },

  syncMyExtension: async (extensionId) => {
    const response = await axios.post(`/extensions/my-extensions/${extensionId}/sync`, {});
    return response.data;
  },

  getMyExtensionPassword: async (extensionId) => {
    const response = await axios.get(`/extensions/my-extensions/${extensionId}/password`);
    return response.data;
  },

  updateMyExtensionPassword: async (extensionId, newPassword) => {
    const response = await axios.put(`/extensions/my-extensions/${extensionId}/password`, { newPassword });
    return response.data;
  },
};

export default extensionService;