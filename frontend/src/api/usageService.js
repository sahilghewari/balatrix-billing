/**
 * Usage API Service
 * Frontend API calls for subscription usage tracking
 */

import api from './axios';

const usageService = {
  /**
   * Get current usage for a subscription
   */
  getCurrentUsage: async (subscriptionId) => {
    const response = await api.get(`/subscriptions/${subscriptionId}/usage`);
    return response.data.data;
  },

  /**
   * Get usage history
   */
  getUsageHistory: async (subscriptionId, page = 1, limit = 10) => {
    const response = await api.get(`/subscriptions/${subscriptionId}/usage/history`, {
      params: { page, limit },
    });
    return response.data.data;
  },

  /**
   * Get usage summary
   */
  getUsageSummary: async (subscriptionId) => {
    const response = await api.get(`/subscriptions/${subscriptionId}/usage/summary`);
    return response.data.data;
  },
};

export default usageService;
