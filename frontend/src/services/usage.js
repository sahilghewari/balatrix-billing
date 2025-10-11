/**
 * Usage Service (CDR)
 * API calls for call detail records and analytics
 */

import { api } from './api';
import { API_ENDPOINTS } from '@config/api';

export const usageService = {
  /**
   * Submit single CDR
   */
  submitCDR: async (cdrData) => {
    const response = await api.post(API_ENDPOINTS.cdrs.submit, cdrData);
    return response.data.data;
  },

  /**
   * Submit batch CDRs
   */
  submitBatchCDRs: async (cdrsData) => {
    const response = await api.post(API_ENDPOINTS.cdrs.batch, cdrsData);
    return response.data.data;
  },

  /**
   * Get call detail records (CDRs)
   */
  getCDRs: async (params = {}) => {
    const response = await api.get(API_ENDPOINTS.cdrs.list, { params });
    return response.data.data;
  },

  /**
   * Get single CDR by ID
   */
  getCDR: async (cdrId) => {
    const response = await api.get(API_ENDPOINTS.cdrs.getById(cdrId));
    return response.data.data;
  },

  /**
   * Get CDR statistics
   */
  getStatistics: async (params = {}) => {
    const response = await api.get(API_ENDPOINTS.cdrs.statistics, { params });
    return response.data.data;
  },

  /**
   * Get CDR analytics
   */
  getAnalytics: async (params = {}) => {
    const response = await api.get(API_ENDPOINTS.cdrs.analytics, { params });
    return response.data.data;
  },

  /**
   * Get top destinations
   */
  getTopDestinations: async (params = {}) => {
    const response = await api.get(API_ENDPOINTS.cdrs.topDestinations, { params });
    return response.data.data;
  },

  /**
   * Export CDRs to CSV
   */
  exportCDRs: async (params = {}) => {
    const response = await api.get(API_ENDPOINTS.cdrs.export, {
      params,
      responseType: 'blob',
    });
    return response.data;
  },

  /**
   * Retry failed CDR
   */
  retryCDR: async (cdrId) => {
    const response = await api.post(API_ENDPOINTS.cdrs.retry(cdrId));
    return response.data.data;
  },
};

export default usageService;
