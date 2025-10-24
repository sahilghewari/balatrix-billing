/**
 * Tenant API Service
 * Handles tenant management operations
 */

import axios from './axios';

const tenantService = {
  // Get all tenants (admin only)
  getTenants: async (params = {}) => {
    const response = await axios.get('/tenants', { params });
    return response.data;
  },

  // Get tenant by ID
  getTenant: async (tenantId) => {
    const response = await axios.get(`/tenants/${tenantId}`);
    return response.data;
  },

  // Create new tenant (admin only)
  createTenant: async (tenantData) => {
    const response = await axios.post('/tenants', tenantData);
    return response.data;
  },

  // Update tenant (admin only)
  updateTenant: async (tenantId, tenantData) => {
    const response = await axios.put(`/tenants/${tenantId}`, tenantData);
    return response.data;
  },

  // Delete tenant (admin only)
  deleteTenant: async (tenantId) => {
    const response = await axios.delete(`/tenants/${tenantId}`);
    return response.data;
  },

  // Get tenant extensions
  getTenantExtensions: async (tenantId, params = {}) => {
    const response = await axios.get(`/extensions/tenant/${tenantId}`, { params });
    return response.data;
  },

  // Sync tenant extensions
  syncTenantExtensions: async (tenantId) => {
    const response = await axios.post(`/extensions/tenant/${tenantId}/sync`);
    return response.data;
  },
};

export default tenantService;