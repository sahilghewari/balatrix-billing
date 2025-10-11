/**
 * Subscription Service
 * API calls for subscription operations
 */

import { api } from './api';
import { API_ENDPOINTS } from '@config/api';

export const subscriptionService = {
  /**
   * Get all subscriptions
   */
  getSubscriptions: async (params = {}) => {
    const response = await api.get(API_ENDPOINTS.subscriptions.list, { params });
    return response.data.data;
  },

  /**
   * Get subscription by ID
   */
  getSubscription: async (subscriptionId) => {
    const response = await api.get(API_ENDPOINTS.subscriptions.getById(subscriptionId));
    return response.data.data;
  },

  /**
   * Create new subscription
   */
  createSubscription: async (subscriptionData) => {
    const response = await api.post(API_ENDPOINTS.subscriptions.create, subscriptionData);
    return response.data.data;
  },

  /**
   * Update subscription
   */
  updateSubscription: async (subscriptionId, updateData) => {
    const response = await api.put(API_ENDPOINTS.subscriptions.update(subscriptionId), updateData);
    return response.data.data;
  },

  /**
   * Change subscription plan
   */
  changePlan: async (subscriptionId, planData) => {
    const response = await api.post(API_ENDPOINTS.subscriptions.changePlan(subscriptionId), planData);
    return response.data.data;
  },

  /**
   * Cancel subscription
   */
  cancelSubscription: async (subscriptionId, cancelData = {}) => {
    const response = await api.post(API_ENDPOINTS.subscriptions.cancel(subscriptionId), cancelData);
    return response.data.data;
  },

  /**
   * Suspend subscription
   */
  suspendSubscription: async (subscriptionId) => {
    const response = await api.post(API_ENDPOINTS.subscriptions.suspend(subscriptionId));
    return response.data.data;
  },

  /**
   * Activate subscription
   */
  activateSubscription: async (subscriptionId) => {
    const response = await api.post(API_ENDPOINTS.subscriptions.activate(subscriptionId));
    return response.data.data;
  },

  /**
   * Get subscription usage
   */
  getUsage: async (subscriptionId) => {
    const response = await api.get(API_ENDPOINTS.subscriptions.usage(subscriptionId));
    return response.data.data;
  },

  /**
   * Update subscription usage
   */
  updateUsage: async (subscriptionId, usageData) => {
    const response = await api.post(API_ENDPOINTS.subscriptions.updateUsage(subscriptionId), usageData);
    return response.data.data;
  },

  /**
   * Renew subscription
   */
  renewSubscription: async (subscriptionId) => {
    const response = await api.post(API_ENDPOINTS.subscriptions.renew(subscriptionId));
    return response.data.data;
  },
};

export default subscriptionService;
