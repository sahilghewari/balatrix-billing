/**
 * Customer Service
 * API calls for customer management
 */

import { api } from './api';
import { API_ENDPOINTS } from '@config/api';

export const customerService = {
  /**
   * Get all customers (admin only)
   */
  getCustomers: async (params = {}) => {
    const response = await api.get(API_ENDPOINTS.customers.list, { params });
    return response.data.data;
  },

  /**
   * Search customers
   */
  searchCustomers: async (params = {}) => {
    const response = await api.get(API_ENDPOINTS.customers.search, { params });
    return response.data.data;
  },

  /**
   * Get current customer (me)
   */
  getMyProfile: async () => {
    const response = await api.get(API_ENDPOINTS.customers.me);
    return response.data.data;
  },

  /**
   * Get customer by ID
   */
  getCustomer: async (customerId) => {
    const response = await api.get(API_ENDPOINTS.customers.getById(customerId));
    return response.data.data;
  },

  /**
   * Create customer
   */
  createCustomer: async (customerData) => {
    const response = await api.post(API_ENDPOINTS.customers.create, customerData);
    return response.data.data;
  },

  /**
   * Update customer
   */
  updateCustomer: async (customerId, updateData) => {
    const response = await api.put(API_ENDPOINTS.customers.update(customerId), updateData);
    return response.data.data;
  },

  /**
   * Delete customer
   */
  deleteCustomer: async (customerId) => {
    const response = await api.delete(API_ENDPOINTS.customers.delete(customerId));
    return response.data.data;
  },

  /**
   * Suspend customer
   */
  suspendCustomer: async (customerId, reason) => {
    const response = await api.post(API_ENDPOINTS.customers.suspend(customerId), { reason });
    return response.data.data;
  },

  /**
   * Activate customer
   */
  activateCustomer: async (customerId) => {
    const response = await api.post(API_ENDPOINTS.customers.activate(customerId));
    return response.data.data;
  },

  /**
   * Get customer statistics
   */
  getStatistics: async (customerId) => {
    const response = await api.get(API_ENDPOINTS.customers.statistics(customerId));
    return response.data.data;
  },

  /**
   * Get customer accounts
   */
  getAccounts: async (customerId) => {
    const response = await api.get(API_ENDPOINTS.customers.accounts(customerId));
    return response.data.data;
  },

  /**
   * Create customer account
   */
  createAccount: async (customerId, accountData) => {
    const response = await api.post(API_ENDPOINTS.customers.createAccount(customerId), accountData);
    return response.data.data;
  },
};

export default customerService;
